
import { db } from '../db';
import { hearingsTable, disputesTable } from '../db/schema';
import { type CreateHearingInput, type Hearing } from '../schema';
import { eq } from 'drizzle-orm';

export const createHearing = async (input: CreateHearingInput, userId: number): Promise<Hearing> => {
  try {
    // Verify that the dispute exists
    const disputes = await db.select()
      .from(disputesTable)
      .where(eq(disputesTable.id, input.dispute_id))
      .execute();

    if (disputes.length === 0) {
      throw new Error(`Dispute with id ${input.dispute_id} not found`);
    }

    // Insert hearing record
    const result = await db.insert(hearingsTable)
      .values({
        dispute_id: input.dispute_id,
        hearing_date: input.hearing_date,
        agenda: input.agenda,
        result: input.result,
        decision: input.decision,
        attendees: input.attendees,
        created_by: userId
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Hearing creation failed:', error);
    throw error;
  }
};
