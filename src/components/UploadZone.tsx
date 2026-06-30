import { useCallback, useRef } from 'react'
import { useCartola } from '../store/useCartola'

export function UploadZone({ compact, onParseComplete }: { compact?: boolean; onParseComplete?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const addPdfFiles = useCartola((s) => s.addPdfFiles)
  const isParsing = useCartola((s) => s.isParsing)

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (files && files.length) {
        await addPdfFiles(files)
        onParseComplete?.()
      }
    },
    [addPdfFiles, onParseComplete],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      onFiles(e.dataTransfer.files)
    },
    [onFiles],
  )

  return (
    <div className={compact ? '' : 'w-full max-w-2xl'}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        disabled={isParsing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={
          compact
            ? 'rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-50'
            : 'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-600 bg-slate-900/60 px-8 py-16 text-center transition hover:border-amber-500/50 hover:bg-slate-900'
        }
      >
        {isParsing ? (
          <span>Leyendo PDF…</span>
        ) : compact ? (
          'Subir PDF'
        ) : (
          <>
            <span className="text-lg font-semibold text-amber-400">Arrastra cartolas PDF aquí</span>
            <span className="mt-2 text-sm text-slate-400">o haz clic para elegir archivos (Banco Falabella)</span>
          </>
        )}
      </button>
    </div>
  )
}
