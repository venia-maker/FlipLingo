import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

import { updateTaskByZohoTicketId } from '@/db/queries/tasks'

// Zoho sends a GET request to validate the webhook URL
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

function extractTicketData(obj: Record<string, unknown>): { id: string; status: string } | null {
  // Zoho Desk webhooks may send data in different shapes:
  // 1. Flat: { id: "123", status: "Escalated" }
  // 2. Flat with ticketId: { ticketId: "123", status: "Escalated" }
  // 3. Wrapped: { payload: { id: "123", status: "Escalated" } }
  // 4. Nested ticket: { ticket: { id: "123", status: "Escalated" } }

  const candidate =
    (obj.payload as Record<string, unknown>) ??
    (obj.ticket as Record<string, unknown>) ??
    obj

  const id = candidate.id ?? candidate.ticketId ?? obj.ticketId
  const status = candidate.status ?? candidate.statusType ?? obj.status ?? obj.statusType

  if (!id || !status) return null
  return { id: String(id), status: String(status) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    console.log('Zoho webhook raw body:', body)

    const parsed: unknown = JSON.parse(body)
    const events: Record<string, unknown>[] = Array.isArray(parsed) ? parsed : [parsed as Record<string, unknown>]

    let updated = 0

    for (const event of events) {
      const data = extractTicketData(event)
      if (!data) {
        console.log('Zoho webhook: could not extract ticket data from event:', JSON.stringify(event))
        continue
      }

      console.log(`Zoho webhook: updating ticket ${data.id} to status "${data.status}"`)

      await updateTaskByZohoTicketId(data.id, {
        status: data.status.toLowerCase(),
      })
      updated++
    }

    if (updated > 0) {
      revalidatePath('/tasks')
      revalidatePath('/deck')
    }

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('Zoho webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
