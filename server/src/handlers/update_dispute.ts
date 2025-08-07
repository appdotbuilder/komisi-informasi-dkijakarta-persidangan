
import { db } from '../db';
import { disputesTable } from '../db/schema';
import { type UpdateDisputeInput, type Dispute } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDispute = async (input: UpdateDisputeInput): Promise<Dispute> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.dispute_number !== undefined) {
      updateData.dispute_number = input.dispute_number;
    }
    if (input.dispute_type !== undefined) {
      updateData.dispute_type = input.dispute_type;
    }
    if (input.registration_date !== undefined) {
      updateData.registration_date = input.registration_date;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Update dispute record
    const result = await db.update(disputesTable)
      .set(updateData)
      .where(eq(disputesTable.id, input.id))
      .returning()
      .execute();

    // Check if dispute was found and updated
    if (result.length === 0) {
      throw new Error(`Dispute with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Dispute update failed:', error);
    throw error;
  }
};
