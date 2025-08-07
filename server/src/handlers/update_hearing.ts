
import { db } from '../db';
import { hearingsTable, usersTable, disputesTable } from '../db/schema';
import { type UpdateHearingInput, type Hearing } from '../schema';
import { eq } from 'drizzle-orm';

export const updateHearing = async (input: UpdateHearingInput): Promise<Hearing> => {
  try {
    // Build update data object with only provided fields
    const updateData: Partial<typeof hearingsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.hearing_date !== undefined) {
      updateData.hearing_date = input.hearing_date;
    }

    if (input.agenda !== undefined) {
      updateData.agenda = input.agenda;
    }

    if (input.result !== undefined) {
      updateData.result = input.result;
    }

    if (input.decision !== undefined) {
      updateData.decision = input.decision;
    }

    if (input.attendees !== undefined) {
      updateData.attendees = input.attendees;
    }

    // Update the hearing record
    const result = await db.update(hearingsTable)
      .set(updateData)
      .where(eq(hearingsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Hearing with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Hearing update failed:', error);
    throw error;
  }
};
