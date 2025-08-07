
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, disputesTable, hearingsTable } from '../db/schema';
import { type GetHearingsByDisputeInput } from '../schema';
import { getHearingsByDispute } from '../handlers/get_hearings_by_dispute';

// Test setup data
const testUser = {
  username: 'test_user',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staf_komisi' as const,
  phone: '+1234567890',
  password_hash: 'hashed_password'
};

const testDispute = {
  dispute_number: 'DSP-2024-001',
  dispute_type: 'sengketa_informasi' as const,
  registration_date: new Date('2024-01-01'),
  description: 'Test dispute for hearings',
  status: 'sedang_berjalan' as const
};

const testInput: GetHearingsByDisputeInput = {
  dispute_id: 1
};

describe('getHearingsByDispute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return hearings for a specific dispute ordered by date', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create prerequisite dispute
    const [dispute] = await db.insert(disputesTable)
      .values({
        ...testDispute,
        created_by: user.id
      })
      .returning()
      .execute();

    // Create multiple hearings with different dates
    const hearing1 = {
      dispute_id: dispute.id,
      hearing_date: new Date('2024-02-01T10:00:00'),
      agenda: 'First hearing - opening statements',
      result: 'Preliminary discussion completed',
      decision: null,
      attendees: JSON.stringify(['Judge', 'Plaintiff', 'Defendant']),
      created_by: user.id
    };

    const hearing2 = {
      dispute_id: dispute.id,
      hearing_date: new Date('2024-01-15T14:00:00'),
      agenda: 'Initial hearing session',
      result: null,
      decision: null,
      attendees: JSON.stringify(['Judge', 'Plaintiff']),
      created_by: user.id
    };

    const hearing3 = {
      dispute_id: dispute.id,
      hearing_date: new Date('2024-02-15T09:00:00'),
      agenda: 'Final hearing - verdict',
      result: 'Case concluded',
      decision: 'In favor of plaintiff',
      attendees: JSON.stringify(['Judge', 'Plaintiff', 'Defendant', 'Clerk']),
      created_by: user.id
    };

    // Insert hearings in random order
    await db.insert(hearingsTable)
      .values([hearing2, hearing3, hearing1])
      .execute();

    // Test the handler
    const result = await getHearingsByDispute({ dispute_id: dispute.id });

    // Should return 3 hearings
    expect(result).toHaveLength(3);

    // Should be ordered by hearing_date (chronological)
    expect(result[0].hearing_date).toEqual(new Date('2024-01-15T14:00:00'));
    expect(result[1].hearing_date).toEqual(new Date('2024-02-01T10:00:00'));
    expect(result[2].hearing_date).toEqual(new Date('2024-02-15T09:00:00'));

    // Verify hearing content
    expect(result[0].agenda).toEqual('Initial hearing session');
    expect(result[1].agenda).toEqual('First hearing - opening statements');
    expect(result[2].agenda).toEqual('Final hearing - verdict');
    expect(result[2].decision).toEqual('In favor of plaintiff');

    // Verify all hearings belong to the correct dispute
    result.forEach(hearing => {
      expect(hearing.dispute_id).toEqual(dispute.id);
      expect(hearing.id).toBeDefined();
      expect(hearing.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for dispute with no hearings', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create dispute but no hearings
    const [dispute] = await db.insert(disputesTable)
      .values({
        ...testDispute,
        created_by: user.id
      })
      .returning()
      .execute();

    const result = await getHearingsByDispute({ dispute_id: dispute.id });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return only hearings for the specified dispute', async () => {
    // Create prerequisite user
    const [user] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create two disputes
    const [dispute1] = await db.insert(disputesTable)
      .values({
        ...testDispute,
        dispute_number: 'DSP-2024-001',
        created_by: user.id
      })
      .returning()
      .execute();

    const [dispute2] = await db.insert(disputesTable)
      .values({
        ...testDispute,
        dispute_number: 'DSP-2024-002',
        created_by: user.id
      })
      .returning()
      .execute();

    // Create hearings for both disputes
    await db.insert(hearingsTable)
      .values([
        {
          dispute_id: dispute1.id,
          hearing_date: new Date('2024-01-15T10:00:00'),
          agenda: 'Hearing for dispute 1',
          result: null,
          decision: null,
          attendees: null,
          created_by: user.id
        },
        {
          dispute_id: dispute2.id,
          hearing_date: new Date('2024-01-16T11:00:00'),
          agenda: 'Hearing for dispute 2',
          result: null,
          decision: null,
          attendees: null,
          created_by: user.id
        }
      ])
      .execute();

    // Test for dispute 1
    const result1 = await getHearingsByDispute({ dispute_id: dispute1.id });
    expect(result1).toHaveLength(1);
    expect(result1[0].agenda).toEqual('Hearing for dispute 1');
    expect(result1[0].dispute_id).toEqual(dispute1.id);

    // Test for dispute 2
    const result2 = await getHearingsByDispute({ dispute_id: dispute2.id });
    expect(result2).toHaveLength(1);
    expect(result2[0].agenda).toEqual('Hearing for dispute 2');
    expect(result2[0].dispute_id).toEqual(dispute2.id);
  });

  it('should return empty array for non-existent dispute', async () => {
    const result = await getHearingsByDispute({ dispute_id: 999 });

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
