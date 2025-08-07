
import { db } from '../db';
import { partiesTable, disputesTable } from '../db/schema';
import { type CreatePartyInput, type Party } from '../schema';
import { eq } from 'drizzle-orm';

export const createParty = async (input: CreatePartyInput): Promise<Party> => {
  try {
    // Verify that the referenced dispute exists
    const existingDispute = await db.select()
      .from(disputesTable)
      .where(eq(disputesTable.id, input.dispute_id))
      .execute();

    if (existingDispute.length === 0) {
      throw new Error(`Dispute with id ${input.dispute_id} not found`);
    }

    // Insert party record
    const result = await db.insert(partiesTable)
      .values({
        name: input.name,
        party_type: input.party_type,
        address: input.address,
        phone: input.phone,
        email: input.email,
        role: input.role,
        dispute_id: input.dispute_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Party creation failed:', error);
    throw error;
  }
};
