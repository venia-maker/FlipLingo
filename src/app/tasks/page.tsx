import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getTasksForUser } from '@/app/actions/tasks'
import { Header } from '@/components/features/header'
import { TasksList } from '@/components/features/tasks/tasks-list'
import { Button } from '@/components/ui/button'

interface TasksPageProps {
  searchParams: Promise<{ deck?: string }>
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { deck: deckId } = await searchParams
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/')

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''

  const tasks = await getTasksForUser(deckId)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Header user={{ email }} />
      </div>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated review tasks from your study sessions.
          </p>
          {deckId && (
            <div className="mt-3">
              <Link href="/tasks">
                <Button variant="outline" size="sm">
                  View all tasks
                </Button>
              </Link>
            </div>
          )}
        </div>

        <TasksList tasks={tasks} />
      </main>
    </div>
  )
}
