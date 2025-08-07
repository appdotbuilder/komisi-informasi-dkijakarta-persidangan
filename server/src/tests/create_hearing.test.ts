
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hearingsTable, disputesTable, usersTable } from '../db/schema';
import { type CreateHearingInput } from '../schema';
import { createHearing } from '../handlers/create_hearing';
import { eq } from 'drizzle-orm';

// Test data setup
const testUser = {
  username: 'test_user',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staf_komisi' as const,
  phone: null,
  password_hash: 'hashed_password'
};

const testDispute = {
  dispute_number: 'DISPUTE-001',
  dispute_type: 'sengketa_informasi' as const,
  registration_date: new Date('2024-01-15'),
  description: 'Test dispute for hearing',
  status: 'sedang_berjalan' as const
};

const testInput: CreateHearingInput = {
  dispute_id: 0, // Will be set after dispute creation
  hearing_date: new Date('2024-02-15T10:00:00Z'),
  agenda: 'Initial hearing session',
  result: null,
  decision: null,
  attendees: JSON.stringify(['pemohon', 'termohon', 'komisioner'])
};

describe('createHearing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let disputeId: number;

  beforeEach(async () => {
    // Create prerequisite user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = users[0].id;

    // Create prerequisite dispute
    const disputes = await db.insert(disputesTable)
      .values({
        ...testDispute,
        created_by: userId
      })
      .returning()
      .execute();
    disputeId = disputes[0].id;

    // Update test input with actual dispute ID
    testInput.dispute_id = disputeId;
  });

  it('should create a hearing', async () => {
    const result = await createHearing(testInput, userId);

    // Basic field validation
    expect(result.dispute_id).toEqual(disputeId);
    expect(result.hearing_date).toEqual(testInput.hearing_date);
    expect(result.agenda).toEqual('Initial hearing session');
    expect(result.result).toBeNull();
    expect(result.decision).toBeNull();
    expect(result.attendees).toEqual(JSON.stringify(['pemohon', 'termohon', 'komisioner']));
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save hearing to database', async () => {
    const result = await createHearing(testInput, userId);

    // Query using proper drizzle syntax
    const hearings = await db.select()
      .from(hearingsTable)
      .where(eq(hearingsTable.id, result.id))
      .execute();

    expect(hearings).toHaveLength(1);
    expect(hearings[0].dispute_id).toEqual(disputeId);
    expect(hearings[0].agenda).toEqual('Initial hearing session');
    expect(hearings[0].created_by).toEqual(userId);
    expect(hearings[0].created_at).toBeInstanceOf(Date);
  });

  it('should create hearing with result and decision', async () => {
    const inputWithResults = {
      ...testInput,
      result: 'Hearing completed successfully',
      decision: 'Motion granted'
    };

    const result = await createHearing(inputWithResults, userId);

    expect(result.result).toEqual('Hearing completed successfully');
    expect(result.decision).toEqual('Motion granted');

    // Verify in database
    const hearings = await db.select()
      .from(hearingsTable)
      .where(eq(hearingsTable.id, result.id))
      .execute();

    expect(hearings[0].result).toEqual('Hearing completed successfully');
    expect(hearings[0].decision).toEqual('Motion granted');
  });

  it('should throw error for non-existent dispute', async () => {
    const invalidInput = {
      ...testInput,
      dispute_id: 99999
    };

    expect(createHearing(invalidInput, userId)).rejects.toThrow(/dispute with id 99999 not found/i);
  });

  it('should handle attendees as JSON string', async () => {
    const attendeesList = ['komisioner_1', 'panitera', 'pemohon_perwakilan'];
    const inputWithAttendees = {
      ...testInput,
      attendees: JSON.stringify(attendeesList)
    };

    const result = await createHearing(inputWithAttendees, userId);

    expect(result.attendees).toEqual(JSON.stringify(attendeesList));

    // Verify parsing works
    const parsedAttendees = JSON.parse(result.attendees!);
    expect(parsedAttendees).toEqual(attendeesList);
  });
});
