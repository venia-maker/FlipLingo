import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { cards } from './cards'

export const DIFFICULTIES = ['low', 'medium', 'high', 'mixed'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const difficultyEnum = pgEnum('difficulty', DIFFICULTIES)

export const decks = pgTable('decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // references Supabase auth.users
  title: text('title').notNull(),
  description: text('description'),
  difficulty: difficultyEnum('difficulty').notNull().default('mixed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const decksRelations = relations(decks, ({ many }) => ({
  cards: many(cards),
}))

export type Deck = typeof decks.$inferSelect
export type NewDeck = typeof decks.$inferInsert
