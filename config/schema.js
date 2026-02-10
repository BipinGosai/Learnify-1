
import { integer, pgTable, varchar, boolean, json, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar('passwordHash', { length: 255 }),
  subscriptionId: varchar('subscriptionId'),
});

export const authSessionsTable = pgTable("auth_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userEmail: varchar('userEmail', { length: 255 }).references(() => usersTable.email).notNull(),
  tokenHash: varchar('tokenHash', { length: 64 }).notNull().unique(),
  expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
});

export const coursesTable = pgTable("courses",{
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cid:varchar().notNull().unique(),
    courseDomain:varchar('courseDomain').notNull(),
    name:varchar(),
    description:varchar(),
    noOfChapters:integer().notNull(),
    includeVideo:boolean().default(false),
    level:varchar().notNull(),
    category:varchar(),
    courseJson:json(),
    bannerImageUrl:varchar().default(''),
    courseContent:json().default({}),
    userEmail:varchar('userEmail').references(()=>usersTable.email).notNull(),

    // Verification workflow
    reviewStatus: varchar('reviewStatus', { length: 32 }).default('draft').notNull(),
    reviewRequestedAt: timestamp('reviewRequestedAt', { withTimezone: true }),
    reviewTokenHash: varchar('reviewTokenHash', { length: 64 }),
    reviewProfessorEmail: varchar('reviewProfessorEmail', { length: 255 }),
    reviewFeedback: varchar('reviewFeedback', { length: 4000 }),
    reviewReviewedAt: timestamp('reviewReviewedAt', { withTimezone: true }),
})

export const professorsTable = pgTable('professors', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
  specializations: varchar({ length: 500 }), // Comma-separated course names/categories
  bio: varchar({ length: 1000 }), // Professor biography
  createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
});

export const enrollCourseTable=pgTable('enrollCourse',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  cid:varchar('cid').references(()=>coursesTable.cid, { onDelete: 'cascade' }),
  userEmail:varchar('userEmail').references(()=>usersTable.email).notNull(),
  completedChapters:json()
})
