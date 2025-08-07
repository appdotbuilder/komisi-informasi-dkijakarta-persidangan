
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const disputeStatusEnum = pgEnum('dispute_status', ['baru', 'sedang_berjalan', 'selesai', 'ditutup']);
export const disputeTypeEnum = pgEnum('dispute_type', ['sengketa_informasi', 'keberatan', 'banding']);
export const partyTypeEnum = pgEnum('party_type', ['individu', 'badan_hukum']);
export const partyRoleEnum = pgEnum('party_role', ['pemohon', 'termohon', 'turut_termohon']);
export const userRoleEnum = pgEnum('user_role', ['staf_komisi', 'komisioner', 'panitera', 'pemohon', 'badan_publik']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  password_hash: text('password_hash').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Disputes table
export const disputesTable = pgTable('disputes', {
  id: serial('id').primaryKey(),
  dispute_number: text('dispute_number').notNull().unique(),
  dispute_type: disputeTypeEnum('dispute_type').notNull(),
  registration_date: timestamp('registration_date').notNull(),
  description: text('description'),
  status: disputeStatusEnum('status').notNull().default('baru'),
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Parties table
export const partiesTable = pgTable('parties', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  party_type: partyTypeEnum('party_type').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  role: partyRoleEnum('role').notNull(),
  dispute_id: integer('dispute_id').notNull().references(() => disputesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Hearings table
export const hearingsTable = pgTable('hearings', {
  id: serial('id').primaryKey(),
  dispute_id: integer('dispute_id').notNull().references(() => disputesTable.id),
  hearing_date: timestamp('hearing_date').notNull(),
  agenda: text('agenda').notNull(),
  result: text('result'),
  decision: text('decision'),
  attendees: text('attendees'), // JSON string of attendee list
  created_by: integer('created_by').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  createdDisputes: many(disputesTable),
  createdHearings: many(hearingsTable),
}));

export const disputesRelations = relations(disputesTable, ({ one, many }) => ({
  createdBy: one(usersTable, {
    fields: [disputesTable.created_by],
    references: [usersTable.id],
  }),
  parties: many(partiesTable),
  hearings: many(hearingsTable),
}));

export const partiesRelations = relations(partiesTable, ({ one }) => ({
  dispute: one(disputesTable, {
    fields: [partiesTable.dispute_id],
    references: [disputesTable.id],
  }),
}));

export const hearingsRelations = relations(hearingsTable, ({ one }) => ({
  dispute: one(disputesTable, {
    fields: [hearingsTable.dispute_id],
    references: [disputesTable.id],
  }),
  createdBy: one(usersTable, {
    fields: [hearingsTable.created_by],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Dispute = typeof disputesTable.$inferSelect;
export type NewDispute = typeof disputesTable.$inferInsert;
export type Party = typeof partiesTable.$inferSelect;
export type NewParty = typeof partiesTable.$inferInsert;
export type Hearing = typeof hearingsTable.$inferSelect;
export type NewHearing = typeof hearingsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  disputes: disputesTable,
  parties: partiesTable,
  hearings: hearingsTable,
};
