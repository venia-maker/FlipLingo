import { cache } from 'react'
import { eq, and, desc, isNull, count, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { tasks } from '@/db/schema'

export const getTaskCountByUserId = cache(async (userId: string): Promise<number> => {
  const [result] = await db.select({ value: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
  return result?.value ?? 0
})

export const getTaskCountsByDeckIds = cache(async (userId: string, deckIds: string[]): Promise<Record<string, number>> => {
  if (deckIds.length === 0) return {}
  const rows = await db.select({ deckId: tasks.deckId, value: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt), inArray(tasks.deckId, deckIds)))
    .groupBy(tasks.deckId)
  const result: Record<string, number> = {}
  for (const row of rows) {
    if (row.deckId) result[row.deckId] = row.value
  }
  return result
})

export async function insertTask(values: {
  userId: string
  deckId?: string | null
  studySessionId?: string | null
  zohoTicketId?: string | null
  subject: string
  description: string
  status?: string
  priority: string
  dueDate?: Date | null
}) {
  const [task] = await db.insert(tasks)
    .values(values)
    .returning({
      id: tasks.id,
      userId: tasks.userId,
      deckId: tasks.deckId,
      studySessionId: tasks.studySessionId,
      zohoTicketId: tasks.zohoTicketId,
      subject: tasks.subject,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
    })

  return task
}

export const getTasksByUserId = cache(async (
  userId: string,
  limit = 20,
  offset = 0,
) => {
  return db.select({
    id: tasks.id,
    deckId: tasks.deckId,
    studySessionId: tasks.studySessionId,
    zohoTicketId: tasks.zohoTicketId,
    subject: tasks.subject,
    description: tasks.description,
    status: tasks.status,
    priority: tasks.priority,
    dueDate: tasks.dueDate,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
  })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt))
    .limit(limit)
    .offset(offset)
})

export const getTaskById = cache(async (id: string, userId: string) => {
  const [task] = await db.select({
    id: tasks.id,
    userId: tasks.userId,
    deckId: tasks.deckId,
    studySessionId: tasks.studySessionId,
    zohoTicketId: tasks.zohoTicketId,
    subject: tasks.subject,
    description: tasks.description,
    status: tasks.status,
    priority: tasks.priority,
    dueDate: tasks.dueDate,
    createdAt: tasks.createdAt,
    updatedAt: tasks.updatedAt,
  })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId), isNull(tasks.deletedAt)))

  return task ?? null
})

export async function updateTask(
  id: string,
  userId: string,
  values: { status?: string; subject?: string; description?: string; priority?: string; dueDate?: Date | null },
) {
  const [updated] = await db.update(tasks)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id, status: tasks.status })

  return updated ?? null
}

export async function updateTaskByZohoTicketId(
  zohoTicketId: string,
  values: { status?: string },
) {
  const [updated] = await db.update(tasks)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(tasks.zohoTicketId, zohoTicketId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id })

  return updated ?? null
}

export async function getTaskStatusesByIds(userId: string, taskIds: string[]) {
  if (taskIds.length === 0) return []
  return db.select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt), inArray(tasks.id, taskIds)))
}

export async function softDeleteTask(id: string, userId: string) {
  const [deleted] = await db.update(tasks)
    .set({ deletedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId), isNull(tasks.deletedAt)))
    .returning({ id: tasks.id })

  return deleted ?? null
}
