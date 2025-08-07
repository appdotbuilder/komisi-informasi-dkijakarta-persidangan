
import { db } from '../db';
import { disputesTable } from '../db/schema';
import { type GetDisputeByIdInput, type Dispute } from '../schema';
import { eq } from 'drizzle-orm';

export const getDisputeById = async (input: GetDisputeByIdInput): Promise<Dispute | null> => {
  try {
    const results = await db.select()
      .from(disputesTable)
      .where(eq(disputesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get dispute by ID failed:', error);
    throw error;
  }
};
