import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  bpm: int("bpm").default(120),
  mediaBinPage: int("mediaBinPage").default(0),
  vdmxPreset: varchar("vdmxPreset", { length: 255 }),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const programSlots = mysqlTable("program_slots", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId").references(() => songs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "her scene"
  oscAddress: varchar("oscAddress", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default("trigger"), // trigger, toggle, fader
  createdAt: timestamp("createdAt").defaultNow(),
});

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;
export type ProgramSlot = typeof programSlots.$inferSelect;
export type InsertProgramSlot = typeof programSlots.$inferInsert;