
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { disputesTable, usersTable } from '../db/schema';
import { type CreateDisputeInput } from '../schema';
import { createDispute } from '../handlers/create_dispute';
import { eq } from 'drizzle-orm';

// Test user for created_by reference
const testUser = {
  username: 'test_user',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staf_komisi' as const,
  phone: '081234567890',
  password_hash: 'hashed_password'
};

// Test input with all required fields
const testInput: CreateDisputeInput = {
  dispute_number: 'DSP/2024/001',
  dispute_type: 'sengketa_informasi',
  registration_date: new Date('2024-01-15'),
  description: 'Test dispute for information access',
  status: 'baru'
};

describe('createDispute', () => {
  let userId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite user for foreign key reference
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a dispute', async () => {
    const result = await createDispute(testInput, userId);

    // Basic field validation
    expect(result.dispute_number).toEqual('DSP/2024/001');
    expect(result.dispute_type).toEqual('sengketa_informasi');
    expect(result.registration_date).toEqual(testInput.registration_date);
    expect(result.description).toEqual('Test dispute for information access');
    expect(result.status).toEqual('baru');
    expect(result.created_by).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save dispute to database', async () => {
    const result = await createDispute(testInput, userId);

    // Query using proper drizzle syntax
    const disputes = await db.select()
      .from(disputesTable)
      .where(eq(disputesTable.id, result.id))
      .execute();

    expect(disputes).toHaveLength(1);
    expect(disputes[0].dispute_number).toEqual('DSP/2024/001');
    expect(disputes[0].dispute_type).toEqual('sengketa_informasi');
    expect(disputes[0].description).toEqual('Test dispute for information access');
    expect(disputes[0].status).toEqual('baru');
    expect(disputes[0].created_by).toEqual(userId);
    expect(disputes[0].created_at).toBeInstanceOf(Date);
    expect(disputes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different dispute types', async () => {
    const keberatanInput: CreateDisputeInput = {
      dispute_number: 'KBR/2024/001',
      dispute_type: 'keberatan',
      registration_date: new Date('2024-01-16'),
      description: 'Test objection case',
      status: 'sedang_berjalan'
    };

    const result = await createDispute(keberatanInput, userId);

    expect(result.dispute_type).toEqual('keberatan');
    expect(result.status).toEqual('sedang_berjalan');
    expect(result.dispute_number).toEqual('KBR/2024/001');
  });

  it('should handle null description', async () => {
    const inputWithNullDescription: CreateDisputeInput = {
      dispute_number: 'DSP/2024/002',
      dispute_type: 'banding',
      registration_date: new Date('2024-01-17'),
      description: null,
      status: 'baru'
    };

    const result = await createDispute(inputWithNullDescription, userId);

    expect(result.description).toBeNull();
    expect(result.dispute_type).toEqual('banding');
  });

  it('should use default status when provided', async () => {
    const inputWithDefaultStatus: CreateDisputeInput = {
      dispute_number: 'DSP/2024/003',
      dispute_type: 'sengketa_informasi',
      registration_date: new Date('2024-01-18'),
      description: 'Test with default status',
      status: 'baru'
    };

    const result = await createDispute(inputWithDefaultStatus, userId);

    expect(result.status).toEqual('baru');
  });
});
