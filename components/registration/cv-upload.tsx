"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  fetchCv,
  fetchStatus,
  uploadCv,
  type StatusResult,
} from "@/lib/registration/api";

import {
  base64ToPdfUrl,
  fileToBase64,
} from "@/lib/registration/file";

import {
  ALLOWED_CV_MIME,
  formatBytes,
  validateCvFile,
} from "@/lib/registration/validation";

type LoadState =
  | {
  kind:
    "loading";
}
  | {
  kind:
    "invalid";

  message:
    string;
}
  | {
  kind:
    "ready";

  status:
    StatusResult;
};

type UploadState =
  | {
  kind:
    "idle";
}
  | {
  kind:
    "uploading";
}
  | {
  kind:
    "error";

  message:
    string;
}
  | {
  kind:
    "done";

  replaced:
    boolean;
};

type DocumentState =
  | {
  kind:
    "idle";
}
  | {
  kind:
    "loading";
}
  | {
  kind:
    "ready";

  url:
    string;

  filename:
    string;
}
  | {
  kind:
    "error";

  message:
    string;
};

type CvUploadProps = {
  token:
    string;
};

export function CvUpload({
                           token,
                         }: CvUploadProps) {
  const [
    load,
    setLoad,
  ] =
    React.useState<LoadState>({
      kind:
        "loading",
    });

  const [
    upload,
    setUpload,
  ] =
    React.useState<UploadState>({
      kind:
        "idle",
    });

  const [
    file,
    setFile,
  ] =
    React.useState<
      File | null
    >(
      null,
    );

  const [
    dragging,
    setDragging,
  ] =
    React.useState(
      false,
    );

  const [
    document,
    setDocument,
  ] =
    React.useState<DocumentState>({
      kind:
        "idle",
    });

  const inputRef =
    React.useRef<
      HTMLInputElement
    >(
      null,
    );

  React.useEffect(
    () => {
      let cancelled =
        false;

      async function loadStatus() {
        if (
          !token
        ) {
          setLoad({
            kind:
              "invalid",

            message:
              "This link is missing its access code.",
          });

          return;
        }

        const result =
          await fetchStatus(
            token,
          );

        if (
          cancelled
        ) {
          return;
        }

        if (
          !result.ok
        ) {
          setLoad({
            kind:
              "invalid",

            message:
            result.message,
          });

          return;
        }

        setLoad({
          kind:
            "ready",

          status:
          result,
        });
      }

      void loadStatus();

      return () => {
        cancelled =
          true;
      };
    },
    [
      token,
    ],
  );

  React.useEffect(
    () => {
      return () => {
        if (
          document.kind ===
          "ready"
        ) {
          URL.revokeObjectURL(
            document.url,
          );
        }
      };
    },
    [
      document,
    ],
  );

  function clearSelectedFile() {
    setFile(
      null,
    );

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  function clearDocument() {
    setDocument(
      (
        previous,
      ) => {
        if (
          previous.kind ===
          "ready"
        ) {
          URL.revokeObjectURL(
            previous.url,
          );
        }

        return {
          kind:
            "idle",
        };
      },
    );
  }

  async function loadDocument() {
    if (
      document.kind ===
      "ready"
    ) {
      return document;
    }

    setDocument({
      kind:
        "loading",
    });

    const result =
      await fetchCv(
        token,
      );

    if (
      !result.ok
    ) {
      setDocument({
        kind:
          "error",

        message:
        result.message,
      });

      return null;
    }

    const url =
      base64ToPdfUrl(
        result.data,
      );

    const next = {
      kind:
        "ready" as const,

      url,

      filename:
      result.filename,
    };

    setDocument(
      next,
    );

    return next;
  }

  async function downloadDocument() {
    const current =
      await loadDocument();

    if (
      !current
    ) {
      return;
    }

    const anchor =
      window.document
        .createElement(
          "a",
        );

    anchor.href =
      current.url;

    anchor.download =
      current.filename;

    anchor.click();
  }

  function selectFile(
    candidate:
      File | null,
  ) {
    if (
      !candidate
    ) {
      return;
    }

    const problem =
      validateCvFile(
        candidate,
      );

    if (
      problem
    ) {
      clearSelectedFile();

      setUpload({
        kind:
          "error",

        message:
        problem,
      });

      return;
    }

    setFile(
      candidate,
    );

    setUpload({
      kind:
        "idle",
    });
  }

  async function onSubmit(
    event:
    React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !file ||
      upload.kind ===
      "uploading"
    ) {
      return;
    }

    if (
      load.kind !==
      "ready"
    ) {
      return;
    }

    const previousStatus =
      load.status;

    if (
      previousStatus
        .registrationStatus ===
      "cancelled"
    ) {
      setUpload({
        kind:
          "error",

        message:
          "This registration is cancelled.",
      });

      return;
    }

    if (
      !previousStatus
        .cvUploadsOpen
    ) {
      setUpload({
        kind:
          "error",

        message:
          "CV submissions are closed.",
      });

      return;
    }

    const replacing =
      previousStatus.hasCv;

    setUpload({
      kind:
        "uploading",
    });

    let data:
      string;

    try {
      data =
        await fileToBase64(
          file,
        );
    } catch {
      setUpload({
        kind:
          "error",

        message:
          "The file could not be read. Try again.",
      });

      return;
    }

    const result =
      await uploadCv({
        token,

        filename:
        file.name,

        mime:
        file.type,

        data,
      });

    if (
      !result.ok
    ) {
      setUpload({
        kind:
          "error",

        message:
          result.error ===
          "cv_closed"
            ? "CV submissions are closed."
            : result.message,
      });

      if (
        result.error ===
        "cv_closed"
      ) {
        setLoad(
          (
            previous,
          ) =>
            previous.kind ===
            "ready"
              ? {
                kind:
                  "ready",

                status: {
                  ...previous.status,

                  cvUploadsOpen:
                    false,
                },
              }
              : previous,
        );
      }

      return;
    }

    clearSelectedFile();
    clearDocument();

    setUpload({
      kind:
        "done",

      replaced:
      replacing,
    });

    setLoad(
      (
        previous,
      ) => {
        if (
          previous.kind !==
          "ready"
        ) {
          return previous;
        }

        return {
          kind:
            "ready",

          status: {
            ...previous.status,

            hasCv:
              true,

            cvStatus:
            result.cvStatus,

            cvName:
            result.cvName,

            cvSubmittedAt:
              result.cvSubmittedAt ||
              previous.status
                .cvSubmittedAt,

            cvUpdatedAt:
            result.cvUpdatedAt,
          },
        };
      },
    );
  }

  if (
    load.kind ===
    "loading"
  ) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 border border-border bg-card/40 p-6 text-sm text-muted-foreground"
      >
        <Loader2
          className="h-4 w-4 animate-spin text-accent"
          aria-hidden="true"
        />

        Checking your personal link…
      </div>
    );
  }

  if (
    load.kind ===
    "invalid"
  ) {
    return (
      <div
        role="alert"
        className="space-y-3 border border-destructive/40 bg-destructive/10 p-6"
      >
        <p className="font-display text-xs uppercase tracking-[0.18em] text-destructive">
          Access denied
        </p>

        <h2 className="font-display text-2xl lowercase text-primary">
          link not valid
        </h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {
            load.message
          }
        </p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Open the most recent link we emailed you or contact the DETI+ team.
        </p>
      </div>
    );
  }

  const {
    status,
  } =
    load;

  const uploading =
    upload.kind ===
    "uploading";

  const cancelled =
    status
      .registrationStatus ===
    "cancelled";

  const waitlisted =
    status
      .registrationStatus ===
    "waitlisted";

  const checkedIn =
    status
      .registrationStatus ===
    "checked_in";

  const uploadClosed =
    cancelled ||
    !status
      .cvUploadsOpen;

  const existingCvLabel =
    status.cvStatus ===
    "updated"
      ? "CV updated"
      : "CV submitted";

  return (
    <div className="animate-enter-up space-y-6">
      <section className="relative overflow-hidden border border-border bg-card/30 p-5 sm:p-6">
        <div
          aria-hidden="true"
          className="absolute left-[-1px] top-[-1px] h-5 w-5 border-l-2 border-t-2 border-accent"
        />

        <div
          aria-hidden="true"
          className="absolute bottom-[-1px] right-[-1px] h-5 w-5 border-b-2 border-r-2 border-accent"
        />

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-accent">
              Participant
            </p>

            <p className="mt-3 font-display text-2xl lowercase text-primary">
              {
                status.name
              }
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              {
                status.email
              }
            </p>

            {status.registrationId ? (
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                {
                  status.registrationId
                }
              </p>
            ) : null}
          </div>

          <RegistrationBadge
            cancelled={
              cancelled
            }
            waitlisted={
              waitlisted
            }
            checkedIn={
              checkedIn
            }
          />
        </div>
      </section>

      {status.hasCv ? (
        <section className="animate-enter-up space-y-5 border border-accent/25 bg-accent/[0.025] p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-accent/30 bg-accent/[0.04]">
              <FileCheck2
                className="h-5 w-5 text-accent"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-[10px] uppercase tracking-[0.18em] text-accent">
                {
                  existingCvLabel
                }
              </p>

              <p className="mt-3 break-all font-medium text-primary">
                {
                  status.cvName
                }
              </p>

              {status.cvSubmittedAt ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  First submitted{" "}
                  <strong className="font-normal text-primary">
                    {formatDateTime(
                      status.cvSubmittedAt,
                    )}
                  </strong>
                </p>
              ) : null}

              {status.cvUpdatedAt &&
              status.cvUpdatedAt !==
              status.cvSubmittedAt ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Last updated{" "}
                  <strong className="font-normal text-primary">
                    {formatDateTime(
                      status.cvUpdatedAt,
                    )}
                  </strong>
                </p>
              ) : null}

              {!uploadClosed ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You can replace this file before the CV submission deadline.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void loadDocument();
              }}
              disabled={
                document.kind ===
                "loading"
              }
            >
              {document.kind ===
              "loading" ? (
                <Loader2
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Eye
                  aria-hidden="true"
                />
              )}

              Preview CV
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void downloadDocument();
              }}
              disabled={
                document.kind ===
                "loading"
              }
            >
              <Download
                aria-hidden="true"
              />

              Download CV
            </Button>

            {document.kind ===
            "ready" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={
                  clearDocument
                }
              >
                <X
                  aria-hidden="true"
                />

                Close preview
              </Button>
            ) : null}
          </div>

          {document.kind ===
          "error" ? (
            <p
              role="alert"
              className="text-sm text-destructive"
            >
              {
                document.message
              }
            </p>
          ) : null}

          {document.kind ===
          "ready" ? (
            <iframe
              title="CV preview"
              src={
                document.url
              }
              className="h-[min(72vh,760px)] w-full border border-border bg-white"
            />
          ) : null}
        </section>
      ) : (
        <section className="border border-border bg-card/20 p-5">
          <p className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CV status
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            No CV has been submitted yet.
          </p>
        </section>
      )}

      {uploadClosed ? (
        <ClosedPanel
          cancelled={
            cancelled
          }
          deadline={
            status.cvDeadline
          }
          hasCv={
            status.hasCv
          }
        />
      ) : (
        <form
          onSubmit={
            onSubmit
          }
          className="space-y-4"
        >
          <div
            onDragOver={(
              event,
            ) => {
              event.preventDefault();

              setDragging(
                true,
              );
            }}
            onDragLeave={(
              event,
            ) => {
              event.preventDefault();

              setDragging(
                false,
              );
            }}
            onDrop={(
              event,
            ) => {
              event.preventDefault();

              setDragging(
                false,
              );

              selectFile(
                event
                  .dataTransfer
                  .files[0] ??
                null,
              );
            }}
            className={[
              "group relative border-2 border-dashed p-8 text-center transition-[border-color,background-color] duration-200 sm:p-10",

              dragging
                ? "border-accent bg-accent/[0.05]"
                : "border-border hover:border-accent/40 hover:bg-card/40",
            ].join(
              " ",
            )}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-border bg-card transition-colors group-hover:border-accent/30">
              <Upload
                className="h-6 w-6 text-accent"
                aria-hidden="true"
              />
            </div>

            <p className="mt-6 font-display text-lg lowercase text-primary">
              {status.hasCv
                ? "replace your CV"
                : "upload your CV"}
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              Drag a PDF here or choose one from your device.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 border-accent/40 px-6 uppercase tracking-widest hover:border-accent"
              onClick={() =>
                inputRef
                  .current
                  ?.click()
              }
              disabled={
                uploading
              }
            >
              Choose PDF
            </Button>

            <p className="mt-5 text-xs uppercase tracking-[0.15em] text-muted-foreground">
              PDF only · up to 5 MB
            </p>

            <input
              ref={
                inputRef
              }
              id="cv"
              name="cv"
              type="file"
              accept={
                ALLOWED_CV_MIME
              }
              className="sr-only"
              onChange={(
                event,
              ) =>
                selectFile(
                  event
                    .target
                    .files?.[0] ??
                  null,
                )
              }
              disabled={
                uploading
              }
            />
          </div>

          {file ? (
            <div className="animate-enter-up flex items-center justify-between gap-4 border border-border bg-background p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText
                  className="h-5 w-5 shrink-0 text-accent"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-primary">
                    {
                      file.name
                    }
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatBytes(
                      file.size,
                    )}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={
                  clearSelectedFile
                }
                disabled={
                  uploading
                }
              >
                <X
                  aria-hidden="true"
                />

                Remove
              </Button>
            </div>
          ) : null}

          <div
            aria-live="polite"
            className="space-y-3"
          >
            {upload.kind ===
            "error" ? (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {
                  upload.message
                }
              </p>
            ) : null}

            {upload.kind ===
            "done" ? (
              <div className="animate-enter-up border border-accent/30 bg-accent/[0.04] p-6">
                <div className="flex gap-3">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0 text-accent"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="font-display text-xs uppercase tracking-[0.2em] text-accent">
                      Step 02 complete
                    </p>

                    <h2 className="mt-2 font-display text-2xl lowercase text-primary">
                      {upload.replaced
                        ? "CV updated"
                        : "CV received"}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {upload.replaced
                        ? "Your new CV has replaced the previous version."
                        : "Your CV is now linked to your DETI+ registration."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={
              !file ||
              uploading
            }
            className="group h-14 w-full justify-between border-2 border-accent bg-accent px-5 font-display uppercase tracking-[0.15em] text-background hover:bg-transparent hover:text-accent"
          >
            {uploading ? (
              <>
                <Loader2
                  className="animate-spin"
                  aria-hidden="true"
                />

                Uploading…
              </>
            ) : (
              <>
                <span>
                  {status.hasCv
                    ? "Replace CV"
                    : "Submit CV"}
                </span>

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </>
            )}
          </Button>

          {status.cvDeadline ? (
            <p className="text-center text-xs text-muted-foreground">
              CV submission deadline:{" "}
              {formatDateTime(
                status.cvDeadline,
              )}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

function RegistrationBadge({
                             cancelled,
                             waitlisted,
                             checkedIn,
                           }: {
  cancelled:
    boolean;

  waitlisted:
    boolean;

  checkedIn:
    boolean;
}) {
  if (
    cancelled
  ) {
    return (
      <span className="w-fit border border-destructive/30 bg-destructive/10 px-3 py-2 font-display text-[10px] uppercase tracking-[0.16em] text-destructive">
        Cancelled
      </span>
    );
  }

  if (
    waitlisted
  ) {
    return (
      <span className="w-fit border border-accent/30 bg-accent/[0.04] px-3 py-2 font-display text-[10px] uppercase tracking-[0.16em] text-accent">
        Waiting list
      </span>
    );
  }

  if (
    checkedIn
  ) {
    return (
      <span className="w-fit border border-accent/30 bg-accent/[0.04] px-3 py-2 font-display text-[10px] uppercase tracking-[0.16em] text-accent">
        Checked in
      </span>
    );
  }

  return (
    <span className="w-fit border border-border bg-background px-3 py-2 font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
      Confirmed
    </span>
  );
}

function ClosedPanel({
                       cancelled,
                       deadline,
                       hasCv,
                     }: {
  cancelled:
    boolean;

  deadline:
    string | null;

  hasCv:
    boolean;
}) {
  return (
    <div className="border border-border bg-card/40 p-6">
      <p className="font-display text-xs uppercase tracking-[0.18em] text-accent">
        CV submissions
      </p>

      <h2 className="mt-2 font-display text-2xl lowercase text-primary">
        {cancelled
          ? "registration cancelled"
          : "CV submissions are closed"}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {cancelled
          ? "This registration is no longer active. Contact the DETI+ team if you believe this is a mistake."
          : hasCv
            ? "Your existing CV remains available above, but it can no longer be replaced."
            : "The deadline for submitting a CV has passed."}
      </p>

      {!cancelled &&
      deadline ? (
        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          Deadline:{" "}
          {formatDateTime(
            deadline,
          )}
        </p>
      ) : null}
    </div>
  );
}

function formatDateTime(
  iso:
  string,
): string {
  const date =
    new Date(
      iso,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return iso;
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
