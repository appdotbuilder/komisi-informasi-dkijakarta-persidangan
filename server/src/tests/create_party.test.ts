
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { partiesTable, disputesTable, usersTable } from '../db/schema';
import { type CreatePartyInput } from '../schema';
import { createParty } from '../handlers/create_party';
import { eq } from 'drizzle-orm';

// Test input for individual party
const testInputIndividu: CreatePartyInput = {
  name: 'John Doe',
  party_type: 'individu',
  address: 'Jl. Sudirman No. 123, Jakarta',
  phone: '081234567890',
  email: 'john.doe@email.com',
  role: 'pemohon',
  dispute_id: 1
};

// Test input for legal entity party
const testInputBadanHukum: CreatePartyInput = {
  name: 'PT Contoh Perusahaan',
  party_type: 'badan_hukum',
  address: 'Jl. Thamrin No. 456, Jakarta',
  phone: '021-12345678',
  email: 'contact@contohperusahaan.com',
  role: 'termohon',
  dispute_id: 1
};

describe('createParty', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an individual party', async () => {
    // Create prerequisite user and dispute
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@email.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        phone: '081234567890',
        password_hash: 'hashedpassword',
        is_active: true
      })
      .returning()
      .execute();

    await db.insert(disputesTable)
      .values({
        dispute_number: 'DISP-001',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date(),
        description: 'Test dispute',
        status: 'baru',
        created_by: userResult[0].id
      })
      .execute();

    const result = await createParty(testInputIndividu);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.party_type).toEqual('individu');
    expect(result.address).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(result.phone).toEqual('081234567890');
    expect(result.email).toEqual('john.doe@email.com');
    expect(result.role).toEqual('pemohon');
    expect(result.dispute_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a legal entity party', async () => {
    // Create prerequisite user and dispute
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@email.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        phone: '081234567890',
        password_hash: 'hashedpassword',
        is_active: true
      })
      .returning()
      .execute();

    await db.insert(disputesTable)
      .values({
        dispute_number: 'DISP-001',
        dispute_type: 'keberatan',
        registration_date: new Date(),
        description: 'Test dispute',
        status: 'baru',
        created_by: userResult[0].id
      })
      .execute();

    const result = await createParty(testInputBadanHukum);

    // Basic field validation
    expect(result.name).toEqual('PT Contoh Perusahaan');
    expect(result.party_type).toEqual('badan_hukum');
    expect(result.address).toEqual('Jl. Thamrin No. 456, Jakarta');
    expect(result.phone).toEqual('021-12345678');
    expect(result.email).toEqual('contact@contohperusahaan.com');
    expect(result.role).toEqual('termohon');
    expect(result.dispute_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save party to database', async () => {
    // Create prerequisite user and dispute
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@email.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        phone: '081234567890',
        password_hash: 'hashedpassword',
        is_active: true
      })
      .returning()
      .execute();

    await db.insert(disputesTable)
      .values({
        dispute_number: 'DISP-001',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date(),
        description: 'Test dispute',
        status: 'baru',
        created_by: userResult[0].id
      })
      .execute();

    const result = await createParty(testInputIndividu);

    // Query database to verify party was saved
    const parties = await db.select()
      .from(partiesTable)
      .where(eq(partiesTable.id, result.id))
      .execute();

    expect(parties).toHaveLength(1);
    expect(parties[0].name).toEqual('John Doe');
    expect(parties[0].party_type).toEqual('individu');
    expect(parties[0].address).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(parties[0].phone).toEqual('081234567890');
    expect(parties[0].email).toEqual('john.doe@email.com');
    expect(parties[0].role).toEqual('pemohon');
    expect(parties[0].dispute_id).toEqual(1);
    expect(parties[0].created_at).toBeInstanceOf(Date);
    expect(parties[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when dispute does not exist', async () => {
    // Attempt to create party with non-existent dispute_id
    await expect(createParty({
      ...testInputIndividu,
      dispute_id: 999
    })).rejects.toThrow(/dispute with id 999 not found/i);
  });

  it('should create party with nullable fields', async () => {
    // Create prerequisite user and dispute
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@email.com',
        full_name: 'Test User',
        role: 'staf_komisi',
        phone: '081234567890',
        password_hash: 'hashedpassword',
        is_active: true
      })
      .returning()
      .execute();

    await db.insert(disputesTable)
      .values({
        dispute_number: 'DISP-001',
        dispute_type: 'sengketa_informasi',
        registration_date: new Date(),
        description: 'Test dispute',
        status: 'baru',
        created_by: userResult[0].id
      })
      .execute();

    // Test with nullable fields set to null
    const inputWithNulls: CreatePartyInput = {
      name: 'Jane Doe',
      party_type: 'individu',
      address: null,
      phone: null,
      email: null,
      role: 'turut_termohon',
      dispute_id: 1
    };

    const result = await createParty(inputWithNulls);

    expect(result.name).toEqual('Jane Doe');
    expect(result.party_type).toEqual('individu');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.role).toEqual('turut_termohon');
    expect(result.dispute_id).toEqual(1);
  });
});
