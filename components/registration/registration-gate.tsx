"use client";

import * as React from "react";
import {
  Loader2,
  RefreshCcw,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  fetchRegistrationStatus,
  type RegistrationAvailability,
} from "@/lib/registration/api";

import {
  RegistrationForm,
} from "./registration-form";

type GateState =
  | {
  kind:
    "loading";
}
  | {
  kind:
    "error";

  message:
    string;
}
  | {
  kind:
    "ready";

  availability:
    RegistrationAvailability;
};

function formatDate(
  value:
  string,
) {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "long",

      timeStyle:
        "short",

      timeZone:
        "Europe/Lisbon",
    },
  ).format(
    date,
  );
}

function isValidAvailability(
  value:
  RegistrationAvailability,
): boolean {
  return (
    typeof value.state ===
    "string" &&
    typeof value.capacity ===
    "number" &&
    typeof value.registered ===
    "number" &&
    typeof value.waitlisted ===
    "number" &&
    typeof value.waitlistEnabled ===
    "boolean"
  );
}

function Panel({
                 eyebrow = "Step 01",
                 title,
                 children,
               }: {
  eyebrow?:
    string;

  title:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="registration-heading"
      className="relative border border-border bg-card/50 p-6 sm:p-8 lg:p-10"
    >
      <div
        aria-hidden="true"
        className="absolute left-[-1px] top-[-1px] h-5 w-5 border-l-2 border-t-2 border-accent"
      />

      <div
        aria-hidden="true"
        className="absolute bottom-[-1px] right-[-1px] h-5 w-5 border-b-2 border-r-2 border-accent"
      />

      <div className="border-b border-border pb-6">
        <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
          {
            eyebrow
          }
        </p>

        <h2
          id="registration-heading"
          className="mt-2 font-display text-3xl lowercase text-primary"
        >
          {
            title
          }
        </h2>

        {
          children
        }
      </div>
    </section>
  );
}

export function RegistrationGate() {
  const [
    gate,
    setGate,
  ] =
    React.useState<GateState>({
      kind:
        "loading",
    });

  const load =
    React.useCallback(
      async () => {
        setGate({
          kind:
            "loading",
        });

        const result =
          await fetchRegistrationStatus();

        if (
          !result.ok
        ) {
          setGate({
            kind:
              "error",

            message:
            result.message,
          });

          return;
        }

        if (
          !isValidAvailability(
            result,
          )
        ) {
          setGate({
            kind:
              "error",

            message:
              "The registration service returned an invalid response.",
          });

          return;
        }

        setGate({
          kind:
            "ready",

          availability:
          result,
        });
      },
      [],
    );

  React.useEffect(
    () => {
      void load();
    },
    [
      load,
    ],
  );

  if (
    gate.kind ===
    "loading"
  ) {
    return (
      <Panel title="checking availability">
        <div
          role="status"
          className="flex items-center gap-3 pt-6 text-sm text-muted-foreground"
        >
          <Loader2
            className="h-4 w-4 animate-spin text-accent"
            aria-hidden="true"
          />

          Checking event availability…
        </div>
      </Panel>
    );
  }

  if (
    gate.kind ===
    "error"
  ) {
    return (
      <Panel title="unable to check availability">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {
            gate.message
          }
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void load();
          }}
          className="mt-6 border-accent/40 uppercase tracking-widest hover:border-accent"
        >
          <RefreshCcw
            aria-hidden="true"
          />

          Try again
        </Button>
      </Panel>
    );
  }

  const {
    availability,
  } =
    gate;

  const {
    state,
  } =
    availability;

  if (
    state ===
    "disabled"
  ) {
    return (
      <Panel title="registrations are temporarily unavailable">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Registration has been temporarily disabled by the DETI+ team. Please check back later.
        </p>
      </Panel>
    );
  }

  if (
    state ===
    "not_started"
  ) {
    return (
      <Panel title="registrations are not open yet">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {availability.opensAt ? (
            <>
              Registrations open on{" "}
              <strong className="font-medium text-primary">
                {formatDate(
                  availability.opensAt,
                )}
              </strong>
              .
            </>
          ) : (
            "Please check back soon."
          )}
        </p>
      </Panel>
    );
  }

  if (
    state ===
    "closed"
  ) {
    return (
      <Panel title="registrations are closed">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {availability.closesAt ? (
            <>
              Registrations closed on{" "}
              <strong className="font-medium text-primary">
                {formatDate(
                  availability.closesAt,
                )}
              </strong>
              .
            </>
          ) : (
            "Thank you for your interest in DETI+."
          )}
        </p>
      </Panel>
    );
  }

  if (
    state ===
    "full"
  ) {
    return (
      <Panel title="registrations are full">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          All currently available places for DETI+ have been filled.
        </p>

        {availability.capacity >
        0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Metric
              label="Registered"
              value={
                availability.registered
              }
            />

            <Metric
              label="Capacity"
              value={
                availability.capacity
              }
            />
          </div>
        ) : null}
      </Panel>
    );
  }

  if (
    state !==
    "open" &&
    state !==
    "almost_full" &&
    state !==
    "waitlist"
  ) {
    return (
      <Panel title="unable to check availability">
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The registration service returned an unknown state.
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void load();
          }}
          className="mt-6 border-accent/40 uppercase tracking-widest hover:border-accent"
        >
          <RefreshCcw
            aria-hidden="true"
          />

          Try again
        </Button>
      </Panel>
    );
  }

  const waitingList =
    state ===
    "waitlist";

  return (
    <Panel
      title={
        waitingList
          ? "join the waiting list"
          : "your details"
      }
    >
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {waitingList
          ? "The current event capacity has been reached, but the waiting list is still open. Being on the waiting list does not guarantee a place."
          : "Secure your place at DETI+. You can submit your CV during registration or use the personal link sent to your email later."}
      </p>

      {state ===
      "almost_full" &&
      availability.remaining !==
      null ? (
        <div className="mt-5 border-l-2 border-accent bg-accent/[0.025] px-4 py-3">
          <p className="font-display text-xs uppercase tracking-[0.15em] text-accent">
            Almost full
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Only{" "}
            <strong className="font-medium text-primary">
              {
                availability.remaining
              }
            </strong>{" "}
            {availability.remaining ===
            1
              ? "place remains"
              : "places remain"}
            .
          </p>
        </div>
      ) : null}

      {waitingList ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Metric
            label="Confirmed"
            value={
              availability.registered
            }
          />

          <Metric
            label="Waiting list"
            value={
              availability.waitlisted
            }
          />
        </div>
      ) : null}

      <div className="mt-8">
        <RegistrationForm
          mode={
            waitingList
              ? "waitlist"
              : "registration"
          }
        />
      </div>
    </Panel>
  );
}

function Metric({
                  label,
                  value,
                }: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="border border-border bg-background px-4 py-3">
      <p className="font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-1 font-display text-xl text-primary">
        {
          value
        }
      </p>
    </div>
  );
}
