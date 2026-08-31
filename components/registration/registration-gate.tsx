'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { fetchRegistrationStatus, type RegistrationAvailability } from '@/lib/registration/api'
import { RegistrationForm } from './registration-form'

type GateState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; availability: RegistrationAvailability }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Lisbon',
  }).format(new Date(value))
}

function Panel({ eyebrow = 'Step 01', title, children }: { eyebrow?: string; title: string; children: React.ReactNode }) {
  return <section aria-labelledby="registration-heading" className="relative border border-border bg-card/50 p-6 sm:p-8 lg:p-10"><div aria-hidden="true" className="absolute left-[-1px] top-[-1px] h-5 w-5 border-l-2 border-t-2 border-accent" /><div aria-hidden="true" className="absolute bottom-[-1px] right-[-1px] h-5 w-5 border-b-2 border-r-2 border-accent" /><div className="border-b border-border pb-6"><p className="font-display text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</p><h2 id="registration-heading" className="mt-2 font-display text-3xl lowercase text-primary">{title}</h2>{children}</div></section>
}

export function RegistrationGate() {
  const [gate, setGate] = React.useState<GateState>({ kind: 'loading' })

  const load = React.useCallback(async () => {
    setGate({ kind: 'loading' })
    const result = await fetchRegistrationStatus()
    setGate(result.ok ? { kind: 'ready', availability: result } : { kind: 'error' })
  }, [])

  React.useEffect(() => { void load() }, [load])

  if (gate.kind === 'loading') return <Panel title="checking availability"><div className="flex items-center gap-3 pt-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />Checking availability…</div></Panel>
  if (gate.kind === 'error') return <Panel title="unable to check availability"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Please check your connection and try again.</p><Button type="button" variant="outline" onClick={() => void load()} className="mt-6 border-accent/40 uppercase tracking-widest hover:border-accent">Try again</Button></Panel>

  const { availability } = gate
  const { state } = availability
  if (state === 'not_started') return <Panel title="registrations are not open yet"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{availability.opensAt ? <>Registrations open on {formatDate(availability.opensAt)}.</> : 'Please check back soon.'}</p></Panel>
  if (state === 'full') return <Panel title="registrations are full"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">All available places for DETI+ have been filled.</p>{availability.capacity > 0 ? <div className="mt-6 flex gap-8 text-sm text-muted-foreground"><span>Registered: {availability.registered}</span><span>Capacity: {availability.capacity}</span></div> : null}</Panel>
  if (state === 'closed') return <Panel title="registrations are closed"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{availability.closesAt ? <>Registrations closed on {formatDate(availability.closesAt)}.</> : 'Thank you for your interest in DETI+.'}</p></Panel>
  if (state === 'disabled') return <Panel title="registrations are temporarily unavailable"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Please check back later.</p></Panel>

  const waitingList = state === 'waitlist'
  return <Panel title={waitingList ? 'join the waiting list' : 'your details'}><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{waitingList ? 'The current event capacity has been reached, but you can still join the waiting list. Being on the waiting list does not guarantee a place.' : 'Secure your place at DETI+. You can submit your CV right after signing up, or later — we will email you a personal link that stays valid.'}</p>{state === 'almost_full' && availability.remaining !== null ? <p className="mt-5 border-l-2 border-accent pl-3 text-sm text-muted-foreground">Only {availability.remaining} {availability.remaining === 1 ? 'place' : 'places'} remain.</p> : null}<div className="mt-8"><RegistrationForm mode={waitingList ? 'waitlist' : 'registration'} /></div></Panel>
}
