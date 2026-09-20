import { pgTable, serial, text, timestamp, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'ORGANIZER' | 'CUSTOMER'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  organizerId: integer('organizer_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  capacity: integer('capacity').notNull(),
  bookedTickets: integer('booked_tickets').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  customerId: integer('customer_id').references(() => users.id).notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull(), // 'ACTIVE' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('unique_booking_idx').on(t.customerId, t.eventId)
]);

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  bookings: many(bookings),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  event: one(events, {
    fields: [bookings.eventId],
    references: [events.id],
  }),
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
}));
