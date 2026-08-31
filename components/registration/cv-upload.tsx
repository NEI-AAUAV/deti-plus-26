'use client'

import * as React from 'react'
import { CheckCircle2, Download, Eye, FileText, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { fetchCv, fetchStatus, uploadCv, type StatusResult } from '@/lib/registration/api'
import { base64ToPdfUrl, fileToBase64 } from '@/lib/registration/file'
import { ALLOWED_CV_MIME, formatBytes, validateCvFile } from '@/lib/registration/validation'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'ready'; status: StatusResult }

type UploadState =
  | { kind: 'idle' }
  | { kind: 'uploading' }
  | { kind: 'error'; message: string }
  | { kind: 'done' }

type DocumentState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; url: string; filename: string }
  | { kind: 'error'; message: string }

export function CvUpload({ token }: { token: string }) {
  const [load, setLoad] = React.useState<LoadState>({ kind: 'loading' })
  const [upload, setUpload] = React.useState<UploadState>({ kind: 'idle' })
  const [file, setFile] = React.useState<File | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [document, setDocument] = React.useState<DocumentState>({ kind: 'idle' })
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    let cancelled = false

    if (!token) {
      setLoad({ kind: 'invalid', message: 'This link is missing its access code.' })
      return
    }

    fetchStatus(token).then((result) => {
      if (cancelled) return
      setLoad(
        result.ok
          ? { kind: 'ready', status: result }
          : { kind: 'invalid', message: result.message },
      )
    })

    return () => {
      cancelled = true
    }
  }, [token])

  React.useEffect(() => () => {
    if (document.kind === 'ready') URL.revokeObjectURL(document.url)
  }, [document])

  async function loadDocument() {
    if (document.kind === 'ready') return document
    setDocument({ kind: 'loading' })
    const result = await fetchCv(token)
    if (!result.ok) {
      setDocument({ kind: 'error', message: result.message })
      return null
    }
    const url = base64ToPdfUrl(result.data)
    const next = { kind: 'ready' as const, url, filename: result.filename }
    setDocument(next)
    return next
  }

  async function downloadDocument() {
    const current = await loadDocument()
    if (!current) return
    const anchor = window.document.createElement('a')
    anchor.href = current.url
    anchor.download = current.filename
    anchor.click()
  }

  function selectFile(candidate: File | null) {
    if (!candidate) return

    const problem = validateCvFile(candidate)
    if (problem) {
      setFile(null)
      setUpload({ kind: 'error', message: problem })
      return
    }

    setFile(candidate)
    setUpload({ kind: 'idle' })
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!file || upload.kind === 'uploading') return

    setUpload({ kind: 'uploading' })

    let data: string
    try {
      data = await fileToBase64(file)
    } catch {
      setUpload({ kind: 'error', message: 'The file could not be read. Try again.' })
      return
    }

    const result = await uploadCv({
      token,
      filename: file.name,
      mime: file.type,
      data,
    })

    if (!result.ok) {
      setUpload({ kind: 'error', message: result.message })
      return
    }

    setUpload({ kind: 'done' })
    setFile(null)
    setDocument({ kind: 'idle' })
    // Refresh so the panel shows the CV that is now on record.
    setLoad((prev) =>
      prev.kind === 'ready'
        ? {
          kind: 'ready',
          status: {
            ...prev.status,
            hasCv: true,
                cvName: result.cvName,
                cvUpdatedAt: result.cvUpdatedAt,
          },
        }
        : prev,
    )
  }

  if (load.kind === 'loading') {
    return (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Checking your link…
      </p>
    )
  }

  if (load.kind === 'invalid') {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-6"
      >
        <h2 className="text-lg font-semibold text-destructive">Link not valid</h2>
        <p className="text-sm">{load.message}</p>
        <p className="text-sm text-muted-foreground">
          Open the most recent link we emailed you, or register again to receive a new one.
        </p>
      </div>
    )
  }

  const { status } = load
  const uploading = upload.kind === 'uploading'

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="font-medium">{status.name}</p>
        <p className="text-sm text-muted-foreground">{status.email}</p>
      </div>

      {status.hasCv ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">CV on record</p>
            <p className="break-all text-sm text-muted-foreground">{status.cvName}</p>
            {status.cvUpdatedAt ? (
              <p className="text-sm text-muted-foreground">
                Submitted on {formatDate(status.cvUpdatedAt)}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              Uploading a new file replaces this one.
            </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={loadDocument} disabled={document.kind === 'loading'}>
              {document.kind === 'loading' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Eye aria-hidden="true" />}
              Preview CV
            </Button>
            <Button type="button" variant="outline" onClick={downloadDocument} disabled={document.kind === 'loading'}>
              <Download aria-hidden="true" /> Download CV
            </Button>
          </div>
          {document.kind === 'error' ? <p role="alert" className="text-sm text-destructive">{document.message}</p> : null}
          {document.kind === 'ready' ? <iframe title="CV preview" src={document.url} className="h-[min(72vh,760px)] w-full border border-border bg-white" /> : null}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            selectFile(e.dataTransfer.files[0] ?? null)
          }}
          className={[
            'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragging ? 'border-primary bg-primary/5' : 'border-border',
          ].join(' ')}
        >
          <Upload className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            Drag your CV here, or
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            Choose file
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">PDF only, up to 5 MB.</p>

          <input
            ref={inputRef}
            id="cv"
            type="file"
            accept={ALLOWED_CV_MIME}
            className="sr-only"
            onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>

        {file ? (
          <p className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="break-all font-medium">{file.name}</span>
            <span className="text-muted-foreground">({formatBytes(file.size)})</span>
          </p>
        ) : null}

        <div aria-live="polite">
          {upload.kind === 'error' ? (
            <p role="alert" className="text-sm text-destructive">
              {upload.message}
            </p>
          ) : null}
          {upload.kind === 'done' ? (
            <p className="text-sm text-primary">
              CV received. We sent you a confirmation email.
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={!file || uploading}>
          {uploading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : status.hasCv ? (
            'Replace CV'
          ) : (
            'Submit CV'
          )}
        </Button>
      </form>
    </div>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
