
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, disputesTable } from '../db/schema';
import { getDisputes } from '../handlers/get_disputes';

describe('getDisputes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no disputes exist', async () => {
    const result = await getDisputes();
    expect(result).toEqual([]);
  });

  it('should fetch all disputes', async () => {
    // Create a test user first (required for foreign key)
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test disputes
    await db.insert(disputesTable)
      .values([
        {
          dispute_number: 'DSP001/2024',
          dispute_type: 'sengketa_informasi',
          registration_date: new Date('2024-01-15'),
          description: 'Test dispute 1',
          status: 'baru',
          created_by: user[0].id
        },
        {
          dispute_number: 'DSP002/2024',
          dispute_type: 'keberatan',
          registration_date: new Date('2024-02-20'),
          description: 'Test dispute 2',
          status: 'sedang_berjalan',
          created_by: user[0].id
        }
      ])
      .execute();

    const result = await getDisputes();

    expect(result).toHaveLength(2);
    
    // Verify first dispute
    expect(result[0].dispute_number).toEqual('DSP001/2024');
    expect(result[0].dispute_type).toEqual('sengketa_informasi');
    expect(result[0].description).toEqual('Test dispute 1');
    expect(result[0].status).toEqual('baru');
    expect(result[0].created_by).toEqual(user[0].id);
    expect(result[0].registration_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second dispute
    expect(result[1].dispute_number).toEqual('DSP002/2024');
    expect(result[1].dispute_type).toEqual('keberatan');
    expect(result[1].description).toEqual('Test dispute 2');
    expect(result[1].status).toEqual('sedang_berjalan');
    expect(result[1].created_by).toEqual(user[0].id);
    expect(result[1].registration_date).toBeInstanceOf(Date);
  });

  it('should handle disputes with nullable fields', async () => {
    // Create a test user
    const user = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'komisioner',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create dispute with null description
    await db.insert(disputesTable)
      .values({
        dispute_number: 'DSP003/2024',
        dispute_type: 'banding',
        registration_date: new Date('2024-03-10'),
        description: null,
        status: 'selesai',
        created_by: user[0].id
      })
      .execute();

    const result = await getDisputes();

    expect(result).toHaveLength(1);
    expect(result[0].dispute_number).toEqual('DSP003/2024');
    expect(result[0].description).toBeNull();
    expect(result[0].status).toEqual('selesai');
    expect(result[0].id).toBeDefined();
  });
});
