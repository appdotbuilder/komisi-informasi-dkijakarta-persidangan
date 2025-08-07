
import { db } from '../db';
import { disputesTable } from '../db/schema';
import { type CreateDisputeInput, type Dispute } from '../schema';

export const createDispute = async (input: CreateDisputeInput, userId: number): Promise<Dispute> => {
  try {
    // Insert dispute record
    const result = await db.insert(disputesTable)
      .values({
        dispute_number: input.dispute_number,
        dispute_type: input.dispute_type,
        registration_date: input.registration_date,
        description: input.description,
        status: input.status,
        created_by: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Dispute creation failed:', error);
    throw error;
  }
};
