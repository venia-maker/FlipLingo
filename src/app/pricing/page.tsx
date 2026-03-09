import Link from "next/link";
import { Check } from "lucide-react";
import { Header } from "@/components/features/header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { UpgradeButton } from "@/components/features/pricing/upgrade-button";
import { PricingBackButton } from "@/components/features/pricing/back-button";
import { CheckoutError } from "@/components/features/pricing/checkout-error";
import { getUserSubscriptionStatus } from "@/app/actions/stripe";

const PLANS = [
  {
    name: "Basic",
    price: "Free",
    priceSubtext: "forever",
    description: "Get started with language flashcards at no cost.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "",
    features: [
      "Up to 3 decks",
      "Unlimited cards per deck",
      "Flip card study mode",
      "Progress tracking",
    ],
    cta: "Get started free",
    ctaHref: "/auth/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$20",
    priceSubtext: "/ month",
    description: "Unlock the full potential of your learning with the Pro Plan.",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    features: [
      "Unlimited decks",
      "Unlimited cards per deck",
      "Flip card study mode",
      "Progress tracking",
      "AI flashcard generation",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    ctaHref: "/auth/sign-up",
    highlighted: true,
  },
];

export default async function PricingPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = typeof data?.claims?.email === 'string' ? data.claims.email : null
  const user = email ? { email } : null
  const userId = data?.claims?.sub as string | undefined
  const { isPro } = user ? await getUserSubscriptionStatus(user.email, userId) : { isPro: false }

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute top-0 left-0 z-10 w-full">
        <Header user={user} />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-16">
        <CheckoutError />
        <div className="mb-12 w-full max-w-4xl">
          {user && (
            <div className="mb-6">
              <PricingBackButton />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Simple, transparent pricing
            </h1>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">
              Start for free. Upgrade when you need more.
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative border-zinc-900 shadow-lg dark:border-zinc-100"
                  : ""
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-3 py-0.5 text-xs font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  Most popular
                </span>
              )}

              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                    {plan.price}
                  </span>
                  <span className="mb-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {plan.priceSubtext}
                  </span>
                </div>

                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Check className="size-4 shrink-0 text-zinc-900 dark:text-zinc-50" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.highlighted && user && !isPro ? (
                  <UpgradeButton priceId={plan.priceId} label={plan.cta} />
                ) : (
                  <Button
                    asChild
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    className="w-full"
                    disabled={isPro && plan.highlighted}
                  >
                    <Link href={user ? "/dashboard" : plan.ctaHref}>
                      {isPro
                        ? (plan.highlighted ? "Current plan" : "Free plan")
                        : user
                          ? (plan.highlighted ? plan.cta : "Current plan")
                          : plan.cta}
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
