'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check } from 'lucide-react'
import { Header } from '@/components/features/header'
import { AuthDialog } from '@/components/features/auth/auth-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const SAMPLE_CARDS = [
  { front: 'What is photosynthesis?', back: 'The process by which plants convert sunlight, water, and CO\u2082 into glucose and oxygen.' },
  { front: 'What is the capital of Japan?', back: 'Tokyo \u2014 the most populous metropolitan area in the world.' },
  { front: '\u00bfC\u00f3mo se dice "hello" en espa\u00f1ol?', back: '\u00abHola\u00bb \u2014 used as an informal greeting.' },
  { front: 'What is the Pythagorean theorem?', back: 'a\u00b2 + b\u00b2 = c\u00b2 \u2014 relates the sides of a right triangle.' },
  { front: 'What does DNA stand for?', back: 'Deoxyribonucleic acid \u2014 the molecule that carries genetic instructions.' },
  { front: 'Who wrote "1984"?', back: 'George Orwell \u2014 published in 1949 as a dystopian novel.' },
  { front: 'What is Newton\u2019s First Law?', back: 'An object at rest stays at rest, and an object in motion stays in motion, unless acted on by an external force.' },
  { front: 'What is the speed of light?', back: 'Approximately 299,792,458 meters per second in a vacuum.' },
  { front: 'Translate "thank you" to French', back: '\u00abMerci\u00bb \u2014 or \u00abmerci beaucoup\u00bb for "thank you very much."' },
  { front: 'What is the powerhouse of the cell?', back: 'The mitochondria \u2014 responsible for producing ATP through cellular respiration.' },
  { front: 'What year did World War II end?', back: '1945 \u2014 with the surrender of Germany in May and Japan in September.' },
  { front: 'What is the chemical formula for water?', back: 'H\u2082O \u2014 two hydrogen atoms bonded to one oxygen atom.' },
]

const CYCLE_INTERVAL_MS = 5_000

const PLANS = [
  {
    name: 'Basic',
    price: 'Free',
    priceSubtext: 'forever',
    description: 'Get started with flashcards at no cost.',
    features: [
      'Up to 3 decks',
      'Unlimited cards per deck',
      'Flip card study mode',
      'Progress tracking',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$20',
    priceSubtext: '/ month',
    description: 'Unlock the full potential of your learning.',
    features: [
      'Unlimited decks',
      'Unlimited cards per deck',
      'Flip card study mode',
      'Progress tracking',
      'AI flashcard generation',
      'Priority support',
    ],
    highlighted: true,
  },
]

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('signup')
  const [pricingOpen, setPricingOpen] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [cardIndex, setCardIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const cycleToNextCard = useCallback(() => {
    setIsTransitioning(true)
    // If card is flipped, flip it back first, then change card
    setFlipped(false)
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % SAMPLE_CARDS.length)
      setIsTransitioning(false)
    }, 300)
  }, [])

  useEffect(() => {
    const interval = setInterval(cycleToNextCard, CYCLE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [cycleToNextCard])

  const currentCard = SAMPLE_CARDS[cardIndex]

  const openSignUp = () => {
    setAuthView('signup')
    setAuthOpen(true)
  }

  const openSignIn = () => {
    setAuthView('login')
    setAuthOpen(true)
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute top-0 left-0 z-10 w-full">
        <Header />
      </div>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 pt-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Free to get started
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl leading-tight font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
          Master anything,{' '}
          <span className="text-emerald-600 dark:text-emerald-400">one flip at a time</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Create flashcard decks for any subject — languages, science, history, or
          anything you want to learn. Study smarter with spaced repetition and
          track your progress.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={openSignUp}
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Start learning for free
          </button>
          <button
            onClick={() => setPricingOpen(true)}
            className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            View pricing
          </button>
        </div>

        {/* Flippable card preview */}
        <div className="mt-16 mb-12 w-full max-w-md [perspective:1000px]">
          <button
            onClick={() => setFlipped((f) => !f)}
            className={`relative mx-auto h-56 w-full cursor-pointer [transform-style:preserve-3d] transition-transform duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 500ms, opacity 300ms, scale 300ms',
            }}
            aria-label={flipped ? 'Show question' : 'Show answer'}
          >
            {/* Front */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 shadow-xl [backface-visibility:hidden] dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium tracking-wide text-zinc-400 uppercase">Front</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                {currentCard.front}
              </p>
              <span className="absolute -right-3 -bottom-3 rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-xs text-zinc-500 shadow dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                Tap to flip
              </span>
            </div>
            {/* Back */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-emerald-800 dark:bg-emerald-950">
              <p className="text-sm font-medium tracking-wide text-emerald-500 uppercase">Back</p>
              <p className="mt-3 text-center text-lg font-medium text-zinc-800 dark:text-zinc-100">
                {currentCard.back}
              </p>
              <span className="absolute -right-3 -bottom-3 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-xs text-emerald-600 shadow dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-400">
                Tap to flip back
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white px-6 py-20 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Everything you need to learn effectively
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon="+"
              title="Create decks instantly"
              description="Build custom flashcard decks for any topic. Add questions and answers in seconds."
            />
            <FeatureCard
              icon="↻"
              title="Smart study sessions"
              description="Flip through cards, track what you know, and focus on what needs more practice."
            />
            <FeatureCard
              icon="↗"
              title="Track your progress"
              description="See your mastery grow over time with stats on every deck and card."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Ready to start learning?
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Join FlipLingo and create your first deck in under a minute.
        </p>
        <button
          onClick={openSignUp}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Get started free
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>FlipLingo</span>
          <div className="flex gap-6">
            <button onClick={() => setPricingOpen(true)} className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Pricing
            </button>
            <button onClick={openSignIn} className="hover:text-zinc-900 dark:hover:text-zinc-200">
              Dashboard
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultView={authView} />

      {/* Pricing Modal */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simple, transparent pricing</DialogTitle>
            <DialogDescription>Start for free. Upgrade when you need more.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-5 ${
                  plan.highlighted
                    ? 'border-zinc-900 shadow-md dark:border-zinc-100'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{plan.price}</span>
                  <span className="mb-0.5 text-sm text-zinc-500 dark:text-zinc-400">{plan.priceSubtext}</span>
                </div>
                <ul className="mt-4 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => {
                    setPricingOpen(false)
                    openSignUp()
                  }}
                >
                  {plan.highlighted ? 'Get Pro' : 'Get started free'}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}
