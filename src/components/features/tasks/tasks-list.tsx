'use client'

import { useEffect, useState } from 'react'

import { getTaskStatuses } from '@/app/actions/tasks'
import { TaskCard } from './task-card'

interface Task {
  id: string
  deckId: string | null
  studySessionId: string | null
  zohoTicketId: string | null
  subject: string
  description: string
  status: string
  priority: string
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}

interface TasksListProps {
  tasks: Task[]
}

const POLL_INTERVAL_MS = 30_000

export function TasksList({ tasks }: TasksListProps) {
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})

  const zohoLinkedIds = tasks
    .filter((t) => t.zohoTicketId !== null)
    .map((t) => t.id)

  useEffect(() => {
    if (zohoLinkedIds.length === 0) return

    async function poll() {
      try {
        const statuses = await getTaskStatuses(zohoLinkedIds)
        const map: Record<string, string> = {}
        for (const s of statuses) {
          map[s.id] = s.status
        }
        setStatusMap(map)
      } catch {
        // Silently ignore polling errors
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [zohoLinkedIds.join(',')])

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
        <p className="text-sm text-zinc-500">No tasks yet.</p>
        <p className="mt-1 text-xs text-zinc-400">
          Complete a study session to automatically generate a review task.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          externalStatus={statusMap[task.id]}
        />
      ))}
    </div>
  )
}
