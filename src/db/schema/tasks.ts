import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { decks } from './decks'
import { studySessions } from './study-sessions'

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  deckId: uuid('deck_id').references(() => decks.id),
  studySessionId: uuid('study_session_id').references(() => studySessions.id),
  zohoTicketId: text('zoho_ticket_id').unique(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('open'),
  priority: text('priority').notNull(), // 'high', 'medium', 'low'
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  index('tasks_user_id_idx').on(table.userId),
  index('tasks_zoho_ticket_id_idx').on(table.zohoTicketId),
  index('tasks_deck_id_idx').on(table.deckId),
])

export const tasksRelations = relations(tasks, ({ one }) => ({
  deck: one(decks, {
    fields: [tasks.deckId],
    references: [decks.id],
  }),
  studySession: one(studySessions, {
    fields: [tasks.studySessionId],
    references: [studySessions.id],
  }),
}))

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
