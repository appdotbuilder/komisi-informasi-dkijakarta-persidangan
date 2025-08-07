
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { disputesTable, usersTable } from '../db/schema';
import { type UpdateDisputeInput } from '../schema';
import { updateDispute } from '../handlers/update_dispute';
import { eq } from 'drizzle-orm';

describe('updateDispute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testDisputeId: number;

  beforeEach(async () => {
    // Create a test user first (required for created_by foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create a test dispute to update
    const disputeResult = await db.insert(disputesTable)
      .values({
        dispute_number: 'TEST-001',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date('2024-01-01'),
        description: 'Original description',
        status: 'baru',
        created_by: testUserId
      })
      .returning()
      .execute();
    testDisputeId = disputeResult[0].id;
  });

  it('should update dispute status', async () => {
    const input: UpdateDisputeInput = {
      id: testDisputeId,
      status: 'sedang_berjalan'
    };

    const result = await updateDispute(input);

    expect(result.id).toEqual(testDisputeId);
    expect(result.status).toEqual('sedang_berjalan');
    expect(result.dispute_number).toEqual('TEST-001'); // Should remain unchanged
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields simultaneously', async () => {
    const newDate = new Date('2024-02-01');
    const input: UpdateDisputeInput = {
      id: testDisputeId,
      dispute_number: 'UPDATED-001',
      dispute_type: 'keberatan',
      registration_date: newDate,
      description: 'Updated description',
      status: 'selesai'
    };

    const result = await updateDispute(input);

    expect(result.id).toEqual(testDisputeId);
    expect(result.dispute_number).toEqual('UPDATED-001');
    expect(result.dispute_type).toEqual('keberatan');
    expect(result.registration_date).toEqual(newDate);
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('selesai');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update description to null', async () => {
    const input: UpdateDisputeInput = {
      id: testDisputeId,
      description: null
    };

    const result = await updateDispute(input);

    expect(result.id).toEqual(testDisputeId);
    expect(result.description).toBeNull();
    expect(result.dispute_number).toEqual('TEST-001'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateDisputeInput = {
      id: testDisputeId,
      status: 'ditutup',
      description: 'Case closed'
    };

    await updateDispute(input);

    // Verify changes were persisted
    const disputes = await db.select()
      .from(disputesTable)
      .where(eq(disputesTable.id, testDisputeId))
      .execute();

    expect(disputes).toHaveLength(1);
    expect(disputes[0].status).toEqual('ditutup');
    expect(disputes[0].description).toEqual('Case closed');
    expect(disputes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent dispute', async () => {
    const input: UpdateDisputeInput = {
      id: 99999,
      status: 'selesai'
    };

    expect(updateDispute(input)).rejects.toThrow(/not found/i);
  });

  it('should update only specified fields leaving others unchanged', async () => {
    const input: UpdateDisputeInput = {
      id: testDisputeId,
      dispute_number: 'PARTIAL-UPDATE'
    };

    const result = await updateDispute(input);

    expect(result.id).toEqual(testDisputeId);
    expect(result.dispute_number).toEqual('PARTIAL-UPDATE');
    // Other fields should remain unchanged
    expect(result.dispute_type).toEqual('sengketa_informasi');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('baru');
    expect(result.created_by).toEqual(testUserId);
  });
});
