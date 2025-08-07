
import { db } from '../db';
import { disputesTable } from '../db/schema';
import { type Dispute } from '../schema';

export const getDisputes = async (): Promise<Dispute[]> => {
  try {
    const results = await db.select()
      .from(disputesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch disputes:', error);
    throw error;
  }
};
