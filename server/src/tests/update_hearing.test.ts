
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hearingsTable, disputesTable, usersTable } from '../db/schema';
import { type UpdateHearingInput } from '../schema';
import { updateHearing } from '../handlers/update_hearing';
import { eq } from 'drizzle-orm';

describe('updateHearing', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestDispute = async (userId: number) => {
    const result = await db.insert(disputesTable)
      .values({
        dispute_number: 'TEST-001',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date(),
        description: 'Test dispute',
        status: 'baru',
        created_by: userId
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestHearing = async (disputeId: number, userId: number) => {
    const result = await db.insert(hearingsTable)
      .values({
        dispute_id: disputeId,
        hearing_date: new Date('2024-01-15'),
        agenda: 'Initial hearing',
        result: null,
        decision: null,
        attendees: null,
        created_by: userId
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update hearing with all fields', async () => {
    const user = await createTestUser();
    const dispute = await createTestDispute(user.id);
    const hearing = await createTestHearing(dispute.id, user.id);

    const newHearingDate = new Date('2024-01-20');
    const updateInput: UpdateHearingInput = {
      id: hearing.id,
      hearing_date: newHearingDate,
      agenda: 'Updated agenda',
      result: 'Hearing completed successfully',
      decision: 'Decision in favor of petitioner',
      attendees: 'John Doe, Jane Smith'
    };

    const result = await updateHearing(updateInput);

    expect(result.id).toEqual(hearing.id);
    expect(result.dispute_id).toEqual(dispute.id);
    expect(result.hearing_date).toEqual(newHearingDate);
    expect(result.agenda).toEqual('Updated agenda');
    expect(result.result).toEqual('Hearing completed successfully');
    expect(result.decision).toEqual('Decision in favor of petitioner');
    expect(result.attendees).toEqual('John Doe, Jane Smith');
    expect(result.created_by).toEqual(user.id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update hearing with partial fields', async () => {
    const user = await createTestUser();
    const dispute = await createTestDispute(user.id);
    const hearing = await createTestHearing(dispute.id, user.id);

    const updateInput: UpdateHearingInput = {
      id: hearing.id,
      result: 'Partial update result',
      decision: 'Partial decision'
    };

    const result = await updateHearing(updateInput);

    expect(result.id).toEqual(hearing.id);
    expect(result.agenda).toEqual('Initial hearing'); // Unchanged
    expect(result.result).toEqual('Partial update result');
    expect(result.decision).toEqual('Partial decision');
    expect(result.attendees).toBeNull(); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update hearing in database', async () => {
    const user = await createTestUser();
    const dispute = await createTestDispute(user.id);
    const hearing = await createTestHearing(dispute.id, user.id);

    const updateInput: UpdateHearingInput = {
      id: hearing.id,
      result: 'Database test result',
      decision: 'Database test decision'
    };

    await updateHearing(updateInput);

    const updatedHearing = await db.select()
      .from(hearingsTable)
      .where(eq(hearingsTable.id, hearing.id))
      .execute();

    expect(updatedHearing).toHaveLength(1);
    expect(updatedHearing[0].result).toEqual('Database test result');
    expect(updatedHearing[0].decision).toEqual('Database test decision');
    expect(updatedHearing[0].agenda).toEqual('Initial hearing'); // Unchanged
    expect(updatedHearing[0].updated_at).toBeInstanceOf(Date);
  });

  it('should allow setting fields to null', async () => {
    const user = await createTestUser();
    const dispute = await createTestDispute(user.id);
    
    // Create hearing with some initial values
    const hearingWithValues = await db.insert(hearingsTable)
      .values({
        dispute_id: dispute.id,
        hearing_date: new Date('2024-01-15'),
        agenda: 'Test agenda',
        result: 'Initial result',
        decision: 'Initial decision',
        attendees: 'Initial attendees',
        created_by: user.id
      })
      .returning()
      .execute();

    const updateInput: UpdateHearingInput = {
      id: hearingWithValues[0].id,
      result: null,
      decision: null,
      attendees: null
    };

    const result = await updateHearing(updateInput);

    expect(result.result).toBeNull();
    expect(result.decision).toBeNull();
    expect(result.attendees).toBeNull();
    expect(result.agenda).toEqual('Test agenda'); // Unchanged
  });

  it('should throw error for non-existent hearing', async () => {
    const updateInput: UpdateHearingInput = {
      id: 99999,
      result: 'This should fail'
    };

    expect(updateHearing(updateInput)).rejects.toThrow(/hearing with id 99999 not found/i);
  });
});
