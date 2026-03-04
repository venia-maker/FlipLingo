import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          FlipLingo
        </span>
        <ThemeToggle />
      </header>
      <main className="px-6 py-16">
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome to FlipLingo.
        </p>
      </main>
    </div>
  );
}
