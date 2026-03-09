'use server'

import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'
import { getZohoConnectionStatus } from '@/app/actions/zoho'
import { zohoFetch } from '@/lib/zoho/client'
import { getStudySessionById } from '@/db/queries/study-sessions'
import { getDeckById } from '@/db/queries/decks'
import {
  insertTask,
  getTasksByUserId,
  getTaskById,
  getTaskStatusesByIds,
  updateTask,
  softDeleteTask,
} from '@/db/queries/tasks'

const openai = new OpenAI()

async function getAuthenticatedUser(): Promise<{ id: string; email: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    throw new Error('Not authenticated')
  }
  return {
    id: data.claims.sub as string,
    email: typeof data.claims.email === 'string' ? data.claims.email : '',
  }
}

async function getAuthenticatedUserId(): Promise<string> {
  const { id } = await getAuthenticatedUser()
  return id
}

function getPriorityFromScore(scorePercent: number): string {
  if (scorePercent < 40) return 'high'
  if (scorePercent < 70) return 'medium'
  return 'low'
}

function toHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n/g, '<br>')
}

function formatCardResults(cardResults: unknown): string {
  const results = cardResults as Array<{
    front: string
    back: string
    correct: boolean
  }>

  return results
    .map((r, i) => {
      const marker = r.correct ? '[CORRECT]' : '[INCORRECT]'
      return `${i + 1}. ${marker} Q: ${r.front} | A: ${r.back}`
    })
    .join('\n')
}

function formatCardResultsHtml(cardResults: unknown): string {
  const results = cardResults as Array<{
    front: string
    back: string
    correct: boolean
  }>

  return results
    .map((r, i) => {
      const color = r.correct ? 'green' : 'red'
      const marker = r.correct ? '✓' : '✗'
      return `<span style="color:${color}">${marker}</span> ${i + 1}. Q: ${r.front} | A: ${r.back}`
    })
    .join('<br>')
}

export async function createAITask(studySessionId: string) {
  const { id: userId, email } = await getAuthenticatedUser()

  const session = await getStudySessionById(studySessionId, userId)
  if (!session) throw new Error('Not found')

  const deck = await getDeckById(session.deckId, userId)
  if (!deck) throw new Error('Not found')

  const cardResults = session.cardResults as Array<{ front: string; back: string; correct: boolean }>
  const incorrectCards = cardResults.filter((c) => !c.correct)

  const prompt = [
    `A student just completed a study session for the deck "${deck.title}".`,
    `Score: ${session.scorePercent}% (${session.correctCount}/${session.totalCards} correct).`,
    '',
    incorrectCards.length > 0
      ? `They missed these cards:\n${incorrectCards.map((c, i) => `${i + 1}. Q: ${c.front} → A: ${c.back}`).join('\n')}`
      : 'They got every card correct!',
    '',
    'Generate a JSON object with:',
    '- "subject": A short task title (max 80 chars) summarizing what to review',
    '- "description": A detailed, well-formatted review plan using this structure:',
    '',
    '  **Summary**',
    '  A 2-3 sentence overview of how the session went and what needs attention.',
    '',
    '  **Key Takeaways**',
    '  • 2-3 key insights about what the student knows well or patterns in their mistakes.',
    '',
    '  **Action Items**',
    '  • 3-5 specific, actionable study tasks. Each should be a full sentence explaining what to do and why.',
    '',
    '  **Tips**',
    '  • 1-2 study technique suggestions relevant to the material.',
    '',
    '  Use newlines (\\n) to separate sections and bullet points. Use ** for bold section headers. Be encouraging but specific.',
  ].join('\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an expert study coach. Respond only with valid JSON containing "subject" and "description" fields. The description must use \\n for line breaks between sections and bullet points. Use ** for bold section headers. Never use commas to separate distinct points — always use newlines.' },
      { role: 'user', content: prompt },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Failed to generate review task')

  const parsed = JSON.parse(content) as { subject: string; description: string }
  const priority = getPriorityFromScore(session.scorePercent)
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  // Auto-sync to Zoho if user is Pro and has Zoho connected
  let zohoTicketId: string | undefined
  try {
    const { isPro } = await getUserSubscriptionStatus(email, userId)
    if (isPro) {
      const { connected } = await getZohoConnectionStatus()
      if (connected) {
        const departments = await zohoFetch<{ data: { id: string }[] }>(userId, '/departments')
        if (departments.data?.length) {
          const ticket = await zohoFetch<{ id: string }>(userId, '/tickets', {
            method: 'POST',
            body: {
              subject: parsed.subject,
              description: toHtml(parsed.description),
              departmentId: departments.data[0].id,
              contact: { email },
              priority: priority.charAt(0).toUpperCase() + priority.slice(1),
              dueDate: dueDate.toISOString(),
              status: 'Open',
            },
          })
          zohoTicketId = ticket.id
        }
      }
    }
  } catch {
    // Don't fail task creation if Zoho sync fails
  }

  const task = await insertTask({
    userId,
    deckId: session.deckId,
    studySessionId,
    subject: parsed.subject,
    description: parsed.description,
    priority,
    dueDate,
    ...(zohoTicketId ? { zohoTicketId } : {}),
  })

  return task
}

export async function createZohoTask(studySessionId: string) {
  const { id: userId, email } = await getAuthenticatedUser()

  const { isPro } = await getUserSubscriptionStatus(email, userId)
  if (!isPro) {
    throw new Error('Pro subscription required')
  }

  const { connected } = await getZohoConnectionStatus()
  if (!connected) {
    throw new Error('Zoho Desk is not connected')
  }

  const session = await getStudySessionById(studySessionId, userId)
  if (!session) {
    throw new Error('Not found')
  }

  const deck = await getDeckById(session.deckId, userId)
  if (!deck) {
    throw new Error('Not found')
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const subject = `"${deck.title}" Study Review - ${dateStr}`
  const priority = getPriorityFromScore(session.scorePercent)
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 days

  const description = [
    `Study Session Summary for "${deck.title}"`,
    `Date: ${dateStr}`,
    `Score: ${session.scorePercent}%`,
    `Correct: ${session.correctCount}/${session.totalCards}`,
    `Incorrect: ${session.incorrectCount}/${session.totalCards}`,
    '',
    'Card-by-Card Results:',
    formatCardResults(session.cardResults),
  ].join('\n')

  const zohoDescription = [
    `<b>Study Session Summary for "${deck.title}"</b><br>`,
    `<b>Date:</b> ${dateStr}<br>`,
    `<b>Score:</b> ${session.scorePercent}%<br>`,
    `<b>Correct:</b> ${session.correctCount}/${session.totalCards}<br>`,
    `<b>Incorrect:</b> ${session.incorrectCount}/${session.totalCards}<br>`,
    '<br><b>Card-by-Card Results:</b><br>',
    formatCardResultsHtml(session.cardResults),
  ].join('')

  // Zoho Desk requires departmentId and contactId when creating tickets
  const departments = await zohoFetch<{ data: { id: string }[] }>(userId, '/departments')
  if (!departments.data?.length) {
    throw new Error('No Zoho Desk departments found. Please create a department in Zoho Desk first.')
  }
  const departmentId = departments.data[0].id

  const ticket = await zohoFetch<{ id: string }>(userId, '/tickets', {
    method: 'POST',
    body: {
      subject,
      description: zohoDescription,
      departmentId,
      contact: { email },
      priority: priority.charAt(0).toUpperCase() + priority.slice(1),
      dueDate: dueDate.toISOString(),
      status: 'Open',
    },
  })

  const task = await insertTask({
    userId,
    deckId: session.deckId,
    studySessionId,
    zohoTicketId: ticket.id,
    subject,
    description,
    priority,
    dueDate,
  })

  return task
}

export async function getTasksForUser(deckId?: string) {
  const userId = await getAuthenticatedUserId()
  const allTasks = await getTasksByUserId(userId)
  if (deckId) return allTasks.filter((t) => t.deckId === deckId)
  return allTasks
}

export async function closeTaskAction(taskId: string) {
  const userId = await getAuthenticatedUserId()

  const task = await getTaskById(taskId, userId)
  if (!task) throw new Error('Not found')

  // Update locally
  await updateTask(taskId, userId, { status: 'closed' })

  // Also close in Zoho if linked
  if (task.zohoTicketId) {
    try {
      await zohoFetch(userId, `/tickets/${task.zohoTicketId}`, {
        method: 'PATCH',
        body: { status: 'Closed' },
      })
    } catch {
      // Don't fail the local close if Zoho fails
    }
  }

  return { id: taskId }
}

export async function deleteTaskAction(taskId: string) {
  const userId = await getAuthenticatedUserId()
  return softDeleteTask(taskId, userId)
}

export async function syncTaskStatus(taskId: string) {
  const userId = await getAuthenticatedUserId()

  const task = await getTaskById(taskId, userId)
  if (!task || !task.zohoTicketId) {
    throw new Error('Not found')
  }

  const ticket = await zohoFetch<{ status: string }>(
    userId,
    `/tickets/${task.zohoTicketId}`,
  )

  const updated = await updateTask(taskId, userId, {
    status: ticket.status.toLowerCase(),
  })

  return updated
}

export async function getTaskStatuses(taskIds: string[]) {
  const userId = await getAuthenticatedUserId()
  return getTaskStatusesByIds(userId, taskIds)
}
