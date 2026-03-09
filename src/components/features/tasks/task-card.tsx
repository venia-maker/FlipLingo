'use client'

import { useEffect, useState, useTransition } from 'react'
import { RefreshCw, Trash2, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteTaskAction, syncTaskStatus, closeTaskAction } from '@/app/actions/tasks'

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

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  closed: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  escalated: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
}

interface TaskCardProps {
  task: Task
  externalStatus?: string
}

export function TaskCard({ task, externalStatus }: TaskCardProps) {
  const [deleted, setDeleted] = useState(false)
  const [status, setStatus] = useState(task.status)

  useEffect(() => {
    if (externalStatus && externalStatus !== status) {
      setStatus(externalStatus)
    }
  }, [externalStatus])
  const [detailOpen, setDetailOpen] = useState(false)
  const [isSyncing, startSync] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [isClosing, startClose] = useTransition()

  if (deleted) return null

  function handleSync() {
    startSync(async () => {
      try {
        const updated = await syncTaskStatus(task.id)
        if (updated) {
          setStatus(updated.status)
          toast.success('Status synced from Zoho Desk')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Sync failed')
      }
    })
  }

  function handleDelete() {
    startDelete(async () => {
      try {
        await deleteTaskAction(task.id)
        setDeleted(true)
        toast.success('Task deleted')
      } catch {
        toast.error('Failed to delete task')
      }
    })
  }

  function handleClose() {
    startClose(async () => {
      try {
        await closeTaskAction(task.id)
        setStatus('closed')
        setDetailOpen(false)
        toast.success('Task closed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to close task')
      }
    })
  }

  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const isClosed = status === 'closed'

  return (
    <>
      <Card
        className="cursor-pointer transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
        onClick={() => setDetailOpen(true)}
      >
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-50">
              {task.subject}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {task.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={statusColors[status] ?? statusColors.open}
              >
                {status}
              </Badge>
              <Badge
                variant="secondary"
                className={priorityColors[task.priority] ?? ''}
              >
                {task.priority}
              </Badge>
              {dueDateStr && (
                <span className="text-xs text-zinc-500">Due {dueDateStr}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {task.zohoTicketId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sync status from Zoho"
              >
                <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete task"
              className="text-red-500 hover:text-red-600"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{task.subject}</DialogTitle>
            <DialogDescription>
              <span className="flex items-center gap-2">
                <Badge variant="secondary" className={statusColors[status] ?? statusColors.open}>
                  {status}
                </Badge>
                <Badge variant="secondary" className={priorityColors[task.priority] ?? ''}>
                  {task.priority} priority
                </Badge>
                {dueDateStr && <span className="text-xs">Due {dueDateStr}</span>}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
            {task.description}
          </div>

          {task.zohoTicketId && (
            <p className="text-xs text-zinc-400">
              Linked to Zoho ticket #{task.zohoTicketId}
            </p>
          )}

          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              <X className="size-4" />
              Close Dialog
            </Button>
            {!isClosed && (
              <Button onClick={handleClose} disabled={isClosing}>
                <CheckCircle2 className="size-4" />
                {isClosing ? 'Closing...' : 'Mark as Completed'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
