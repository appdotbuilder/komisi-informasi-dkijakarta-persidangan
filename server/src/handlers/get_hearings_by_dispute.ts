
import { db } from '../db';
import { hearingsTable } from '../db/schema';
import { type GetHearingsByDisputeInput, type Hearing } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getHearingsByDispute = async (input: GetHearingsByDisputeInput): Promise<Hearing[]> => {
  try {
    const results = await db.select()
      .from(hearingsTable)
      .where(eq(hearingsTable.dispute_id, input.dispute_id))
      .orderBy(asc(hearingsTable.hearing_date))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch hearings by dispute:', error);
    throw error;
  }
};
