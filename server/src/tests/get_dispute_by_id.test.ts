
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { disputesTable, usersTable } from '../db/schema';
import { type GetDisputeByIdInput } from '../schema';
import { getDisputeById } from '../handlers/get_dispute_by_id';

// Test input
const testInput: GetDisputeByIdInput = {
  id: 1
};

describe('getDisputeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dispute when found', async () => {
    // Create a test user first (required for foreign key)
    await db.insert(usersTable).values({
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'staf_komisi',
      password_hash: 'hashedpassword'
    }).execute();

    // Create a test dispute
    const disputeResult = await db.insert(disputesTable).values({
      dispute_number: 'DISPUTE-001',
      dispute_type: 'sengketa_informasi',
      registration_date: new Date('2024-01-15'),
      description: 'Test dispute case',
      status: 'baru',
      created_by: 1
    }).returning().execute();

    const createdDispute = disputeResult[0];

    const result = await getDisputeById({ id: createdDispute.id });

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdDispute.id);
    expect(result!.dispute_number).toEqual('DISPUTE-001');
    expect(result!.dispute_type).toEqual('sengketa_informasi');
    expect(result!.registration_date).toBeInstanceOf(Date);
    expect(result!.description).toEqual('Test dispute case');
    expect(result!.status).toEqual('baru');
    expect(result!.created_by).toEqual(1);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when dispute not found', async () => {
    const result = await getDisputeById({ id: 999 });

    expect(result).toBeNull();
  });

  it('should retrieve dispute with different status', async () => {
    // Create a test user first
    await db.insert(usersTable).values({
      username: 'testuser2',
      email: 'test2@example.com',
      full_name: 'Test User 2',
      role: 'komisioner',
      password_hash: 'hashedpassword2'
    }).execute();

    // Create dispute with different status
    const disputeResult = await db.insert(disputesTable).values({
      dispute_number: 'DISPUTE-002',
      dispute_type: 'keberatan',
      registration_date: new Date('2024-02-20'),
      description: 'Another test dispute',
      status: 'sedang_berjalan',
      created_by: 1
    }).returning().execute();

    const createdDispute = disputeResult[0];

    const result = await getDisputeById({ id: createdDispute.id });

    expect(result).toBeDefined();
    expect(result!.dispute_type).toEqual('keberatan');
    expect(result!.status).toEqual('sedang_berjalan');
    expect(result!.description).toEqual('Another test dispute');
  });

  it('should retrieve dispute with null description', async () => {
    // Create a test user first
    await db.insert(usersTable).values({
      username: 'testuser3',
      email: 'test3@example.com',
      full_name: 'Test User 3',
      role: 'panitera',
      password_hash: 'hashedpassword3'
    }).execute();

    // Create dispute with null description
    const disputeResult = await db.insert(disputesTable).values({
      dispute_number: 'DISPUTE-003',
      dispute_type: 'banding',
      registration_date: new Date('2024-03-10'),
      description: null,
      status: 'selesai',
      created_by: 1
    }).returning().execute();

    const createdDispute = disputeResult[0];

    const result = await getDisputeById({ id: createdDispute.id });

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.status).toEqual('selesai');
    expect(result!.dispute_type).toEqual('banding');
  });
});
