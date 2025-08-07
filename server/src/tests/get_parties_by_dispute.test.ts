
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, disputesTable, partiesTable } from '../db/schema';
import { type CreateUserInput, type CreateDisputeInput, type CreatePartyInput } from '../schema';
import { getPartiesByDispute } from '../handlers/get_parties_by_dispute';

// Test data
const testUser: CreateUserInput = {
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'staf_komisi',
  phone: '+62123456789',
  password: 'password123'
};

const testDispute: CreateDisputeInput = {
  dispute_number: 'KIP-001/2024',
  dispute_type: 'sengketa_informasi',
  registration_date: new Date('2024-01-01'),
  description: 'Test dispute case',
  status: 'baru'
};

const testParty1: Omit<CreatePartyInput, 'dispute_id'> = {
  name: 'John Doe',
  party_type: 'individu',
  address: 'Jl. Test No. 123',
  phone: '+62123456789',
  email: 'john@example.com',
  role: 'pemohon'
};

const testParty2: Omit<CreatePartyInput, 'dispute_id'> = {
  name: 'PT Test Company',
  party_type: 'badan_hukum',
  address: 'Jl. Corporate No. 456',
  phone: '+62987654321',
  email: 'contact@testcompany.com',
  role: 'termohon'
};

describe('getPartiesByDispute', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all parties for a specific dispute', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create dispute
    const disputeResult = await db.insert(disputesTable)
      .values({
        ...testDispute,
        created_by: userId
      })
      .returning()
      .execute();
    const disputeId = disputeResult[0].id;

    // Create parties for the dispute
    await db.insert(partiesTable)
      .values([
        { ...testParty1, dispute_id: disputeId },
        { ...testParty2, dispute_id: disputeId }
      ])
      .execute();

    const result = await getPartiesByDispute({ dispute_id: disputeId });

    expect(result).toHaveLength(2);
    
    // Check first party
    const party1 = result.find(p => p.name === 'John Doe');
    expect(party1).toBeDefined();
    expect(party1!.party_type).toEqual('individu');
    expect(party1!.role).toEqual('pemohon');
    expect(party1!.email).toEqual('john@example.com');
    expect(party1!.dispute_id).toEqual(disputeId);

    // Check second party
    const party2 = result.find(p => p.name === 'PT Test Company');
    expect(party2).toBeDefined();
    expect(party2!.party_type).toEqual('badan_hukum');
    expect(party2!.role).toEqual('termohon');
    expect(party2!.email).toEqual('contact@testcompany.com');
    expect(party2!.dispute_id).toEqual(disputeId);
  });

  it('should return empty array when no parties exist for dispute', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create dispute without parties
    const disputeResult = await db.insert(disputesTable)
      .values({
        ...testDispute,
        created_by: userId
      })
      .returning()
      .execute();
    const disputeId = disputeResult[0].id;

    const result = await getPartiesByDispute({ dispute_id: disputeId });

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent dispute', async () => {
    const result = await getPartiesByDispute({ dispute_id: 999 });

    expect(result).toHaveLength(0);
  });

  it('should only return parties for the specified dispute', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        ...testUser,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create two disputes
    const dispute1Result = await db.insert(disputesTable)
      .values({
        ...testDispute,
        dispute_number: 'KIP-001/2024',
        created_by: userId
      })
      .returning()
      .execute();
    const dispute1Id = dispute1Result[0].id;

    const dispute2Result = await db.insert(disputesTable)
      .values({
        ...testDispute,
        dispute_number: 'KIP-002/2024',
        created_by: userId
      })
      .returning()
      .execute();
    const dispute2Id = dispute2Result[0].id;

    // Create parties for both disputes
    await db.insert(partiesTable)
      .values([
        { ...testParty1, dispute_id: dispute1Id },
        { ...testParty2, dispute_id: dispute2Id }
      ])
      .execute();

    // Get parties for first dispute only
    const result = await getPartiesByDispute({ dispute_id: dispute1Id });

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].dispute_id).toEqual(dispute1Id);
  });
});
