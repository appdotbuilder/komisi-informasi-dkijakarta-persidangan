
import { z } from 'zod';

// Enums for various status and types
export const disputeStatusEnum = z.enum(['baru', 'sedang_berjalan', 'selesai', 'ditutup']);
export const disputeTypeEnum = z.enum(['sengketa_informasi', 'keberatan', 'banding']);
export const partyTypeEnum = z.enum(['individu', 'badan_hukum']);
export const partyRoleEnum = z.enum(['pemohon', 'termohon', 'turut_termohon']);
export const userRoleEnum = z.enum(['staf_komisi', 'komisioner', 'panitera', 'pemohon', 'badan_publik']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  full_name: z.string(),
  role: userRoleEnum,
  phone: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Dispute schema
export const disputeSchema = z.object({
  id: z.number(),
  dispute_number: z.string(),
  dispute_type: disputeTypeEnum,
  registration_date: z.coerce.date(),
  description: z.string().nullable(),
  status: disputeStatusEnum,
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Dispute = z.infer<typeof disputeSchema>;

// Party schema
export const partySchema = z.object({
  id: z.number(),
  name: z.string(),
  party_type: partyTypeEnum,
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  role: partyRoleEnum,
  dispute_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Party = z.infer<typeof partySchema>;

// Hearing schema
export const hearingSchema = z.object({
  id: z.number(),
  dispute_id: z.number(),
  hearing_date: z.coerce.date(),
  agenda: z.string(),
  result: z.string().nullable(),
  decision: z.string().nullable(),
  attendees: z.string().nullable(), // JSON string of attendee list
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Hearing = z.infer<typeof hearingSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  full_name: z.string().min(1),
  role: userRoleEnum,
  phone: z.string().nullable(),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createDisputeInputSchema = z.object({
  dispute_number: z.string().min(1),
  dispute_type: disputeTypeEnum,
  registration_date: z.coerce.date(),
  description: z.string().nullable(),
  status: disputeStatusEnum.default('baru')
});

export type CreateDisputeInput = z.infer<typeof createDisputeInputSchema>;

export const createPartyInputSchema = z.object({
  name: z.string().min(1),
  party_type: partyTypeEnum,
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  role: partyRoleEnum,
  dispute_id: z.number()
});

export type CreatePartyInput = z.infer<typeof createPartyInputSchema>;

export const createHearingInputSchema = z.object({
  dispute_id: z.number(),
  hearing_date: z.coerce.date(),
  agenda: z.string().min(1),
  result: z.string().nullable(),
  decision: z.string().nullable(),
  attendees: z.string().nullable()
});

export type CreateHearingInput = z.infer<typeof createHearingInputSchema>;

// Update schemas
export const updateDisputeInputSchema = z.object({
  id: z.number(),
  dispute_number: z.string().min(1).optional(),
  dispute_type: disputeTypeEnum.optional(),
  registration_date: z.coerce.date().optional(),
  description: z.string().nullable().optional(),
  status: disputeStatusEnum.optional()
});

export type UpdateDisputeInput = z.infer<typeof updateDisputeInputSchema>;

export const updateHearingInputSchema = z.object({
  id: z.number(),
  hearing_date: z.coerce.date().optional(),
  agenda: z.string().min(1).optional(),
  result: z.string().nullable().optional(),
  decision: z.string().nullable().optional(),
  attendees: z.string().nullable().optional()
});

export type UpdateHearingInput = z.infer<typeof updateHearingInputSchema>;

// Query schemas
export const getDisputeByIdInputSchema = z.object({
  id: z.number()
});

export type GetDisputeByIdInput = z.infer<typeof getDisputeByIdInputSchema>;

export const getHearingsByDisputeInputSchema = z.object({
  dispute_id: z.number()
});

export type GetHearingsByDisputeInput = z.infer<typeof getHearingsByDisputeInputSchema>;

export const getPartiesByDisputeInputSchema = z.object({
  dispute_id: z.number()
});

export type GetPartiesByDisputeInput = z.infer<typeof getPartiesByDisputeInputSchema>;
