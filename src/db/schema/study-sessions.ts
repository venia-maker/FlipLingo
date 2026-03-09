import { pgTable, uuid, integer, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { decks } from './decks'

export const studySessions = pgTable('study_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  deckId: uuid('deck_id').notNull().references(() => decks.id),
  totalCards: integer('total_cards').notNull(),
  correctCount: integer('correct_count').notNull(),
  incorrectCount: integer('incorrect_count').notNull(),
  scorePercent: integer('score_percent').notNull(),
  cardResults: jsonb('card_results').notNull(), // Array of {cardId, front, back, correct}
  completedAt: timestamp('completed_at').defaultNow().notNull(),
}, (table) => [
  index('study_sessions_user_id_idx').on(table.userId),
  index('study_sessions_deck_id_idx').on(table.deckId),
])

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  deck: one(decks, {
    fields: [studySessions.deckId],
    references: [decks.id],
  }),
}))

export type StudySession = typeof studySessions.$inferSelect
export type NewStudySession = typeof studySessions.$inferInsert

export type CardResult = {
  cardId: string
  front: string
  back: string
  correct: boolean
}
