import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("camp_sessions", {
  id: text("id").primaryKey(), name: text("name").notNull(), color: text("color").notNull(),
  avatar: text("avatar"), discordId: text("discord_id"), expires: integer("expires").notNull(),
});
export const rooms = sqliteTable("camp_rooms", {
  code: text("code").primaryKey(), host: text("host").notNull(), created: integer("created").notNull(),
  title: text("title").notNull().default("우리의 모닥불"), visibility: text("visibility").notNull().default("unlisted"),
  epoch: integer("epoch").notNull().default(1), leaseUntil: integer("lease_until").notNull().default(0),
  recoveryEpoch: integer("recovery_epoch").notNull().default(0), recoverySeq: integer("recovery_seq").notNull().default(-1),
  recoveryTime: integer("recovery_time").notNull().default(0), cleanupAfter: integer("cleanup_after").notNull().default(0), handoffs: integer("handoffs").notNull().default(0),
});
export const members = sqliteTable("camp_members", {
  id: text("id").primaryKey(), room: text("room").notNull().references(() => rooms.code, { onDelete: "cascade" }),
  session: text("session").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(), color: text("color").notNull(), avatar: text("avatar"),
  seen: integer("seen").notNull(), joined: integer("joined").notNull(),
  ready: integer("ready").notNull().default(0),
  snapshotEpoch: integer("snapshot_epoch").notNull().default(0), snapshotSeq: integer("snapshot_seq").notNull().default(-1),
  snapshotTime: integer("snapshot_time").notNull().default(0), signalAfter: integer("signal_after").notNull().default(0),
}, t => [index("camp_members_room_idx").on(t.room)]);
export const signals = sqliteTable("camp_signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  room: text("room").notNull().references(() => rooms.code, { onDelete: "cascade" }),
  sender: text("sender").notNull().references(() => members.id, { onDelete: "cascade" }),
  recipient: text("recipient").notNull().references(() => members.id, { onDelete: "cascade" }),
  payload: text("payload").notNull(), created: integer("created").notNull(),
}, t => [index("camp_signals_recipient_idx").on(t.recipient, t.id)]);
export const oauthStates = sqliteTable("camp_oauth_states", {
  id: text("id").primaryKey(), session: text("session").notNull(), expires: integer("expires").notNull(),
});
export const limits = sqliteTable("camp_limits", {
  id: text("id").primaryKey(), window: integer("window").notNull(), count: integer("count").notNull(),
});
