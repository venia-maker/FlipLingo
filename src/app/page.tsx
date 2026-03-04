import { Header } from "@/components/features/header";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute top-0 left-0 z-10 w-full">
        <Header />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-5xl font-bold text-zinc-900 dark:text-zinc-50">
          FlipLingo
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          Your personal flashcard platform
        </p>
      </div>
    </div>
  );
}
