'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { register } from '@/lib/registration/api'
import {
  EMPTY_REGISTRATION,
  YEARS,
  hasErrors,
  toPayload,
  validateRegistration,
  type FieldErrors,
  type RegistrationFields,
} from '@/lib/registration/validation'

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "done"; alreadyRegistered: boolean };


export function RegistrationForm() {
  const [fields, setFields] = React.useState<RegistrationFields>(EMPTY_REGISTRATION);
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });
  const honeypot = React.useRef(' ');
  const errorSummary = React.useRef<HTMLDivElement>(null);

  function update<K extends keyof RegistrationFields>(key: K, value: RegistrationFields[K]) {
    setFields(prev => ({ ...prev, [key]: value }));

    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = {...prev};
      delete next[key];
      return next;
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status.kind === 'submitting') return

    const found = validateRegistration(fields)
    setErrors(found)
    if (hasErrors(found)) {
      errorSummary.current?.focus()
      return
    }

    setStatus({ kind: 'submitting' })

    const result = await register({ ...toPayload(fields), website: honeypot.current })

    if (result.ok) {
      setStatus({ kind: 'done', alreadyRegistered: result.alreadyRegistered })
      return
    }
    setStatus({ kind: 'error', message: result.message })
  }

  if (status.kind === 'done') {
    return <SuccessPanel email={fields.email} alreadyRegistered={status.alreadyRegistered} />
  }

  const submitting = status.kind === 'submitting'

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div
        ref={errorSummary}
        tabIndex={-1}
        aria-live="polite"
        className="focus-visible:outline-none"
      >
        {status.kind === 'error' ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {status.message}
          </p>
        ) : null}
      </div>

      <Field id="name" label="Full Name" required error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'name-error' : undefined}
          disabled={submitting}
        />
      </Field>

      <Field
        id="email"
        label="Email"
        required
        error={errors.email}
        hint="This is where we'll send the link to submit your CV."
      >
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={fields.email}
          onChange={(e) => update('email', e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          disabled={submitting}
        />
      </Field>

      <Field id="mobileNumber" label="Mobile Number" error={errors.mobileNumber} hint="Optional.">
        <Input
          id="mobileNumber"
          name="mobileNumber"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={fields.mobileNumber}
          onChange={(e) => update('mobileNumber', e.target.value)}
          aria-invalid={Boolean(errors.mobileNumber)}
          aria-describedby={errors.mobileNumber ? 'mobileNumber-error' : 'mobileNumber-hint'}
          disabled={submitting}
        />
      </Field>

      <Field id="curse" label="Course" required error={errors.curse}>
        <Input
          id="curse"
          name="curse"
          autoComplete="organization-title"
          placeholder="Ex.: Computer Engineering"
          value={fields.curse}
          onChange={(e) => update('curse', e.target.value)}
          aria-invalid={Boolean(errors.curse)}
          aria-describedby={errors.curse ? 'curse-error' : undefined}
          disabled={submitting}
        />
      </Field>

      <Field id="year" label="Academic Year" required error={errors.year}>
        <Select
          value={fields.year}
          onValueChange={(value) => update('year', value)}
          disabled={submitting}
        >
          <SelectTrigger
            id="year"
            aria-invalid={Boolean(errors.year)}
            aria-describedby={errors.year ? 'year-error' : undefined}
          >
            <SelectValue placeholder="Select the year" />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <fieldset className="space-y-4 border-t border-border pt-6">
        <legend className="sr-only">Consents</legend>

        <Consent
          id="hasCvConsent"
          checked={fields.hasCvConsent}
          onChange={(value) => update('hasCvConsent', value)}
          disabled={submitting}
        >
          I authorize the sharing of my CV with the partner companies of DETI+.
        </Consent>

        <Consent
          id="hasGdprConsent"
          checked={fields.hasGdprConsent}
          onChange={(value) => update('hasGdprConsent', value)}
          disabled={submitting}
          error={errors.hasGdprConsent}
          required
        >
          I accept that my data will be processed to manage my participation in the event.
        </Consent>
      </fieldset>

      {/* Honeypot: invisible to humans, filled by bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={(e) => {
            honeypot.current = e.target.value
          }}
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Registering…
          </>
        ) : (
          'Confirm registration'
        )}
      </Button>
    </form>
  )
}

function Field({
                 id,
                 label,
                 required,
                 error,
                 hint,
                 children,
               }: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Consent({
                   id,
                   checked,
                   onChange,
                   disabled,
                   error,
                   required,
                   children,
                 }: {
  id: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5"
        />
        <Label htmlFor={id} className="text-sm font-normal leading-relaxed">
          {children}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="pl-7 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function SuccessPanel({
                        email,
                        alreadyRegistered,
                      }: {
  email: string
  alreadyRegistered: boolean
}) {
  return (
    <div role="status" className="space-y-4 rounded-lg border border-border bg-muted/30 p-6">
      <h2 className="text-xl font-semibold">
        {alreadyRegistered ? 'Already Registered' : 'Registration confirmed'}
      </h2>
      <p className="text-muted-foreground">
        We sent an email to <strong className="text-foreground">{email}</strong> with a personal link
        to submit your CV.
      </p>
      <p className="text-sm text-muted-foreground">
        You can do it now or later — the link will remain valid. Save the email. If you don&apos;t find it,
        check the spam folder.
      </p>
    </div>
  )
}
