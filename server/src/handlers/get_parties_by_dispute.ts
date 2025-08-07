
import { db } from '../db';
import { partiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetPartiesByDisputeInput, type Party } from '../schema';

export const getPartiesByDispute = async (input: GetPartiesByDisputeInput): Promise<Party[]> => {
  try {
    const results = await db.select()
      .from(partiesTable)
      .where(eq(partiesTable.dispute_id, input.dispute_id))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get parties by dispute:', error);
    throw error;
  }
};
