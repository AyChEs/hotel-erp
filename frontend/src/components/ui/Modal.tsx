import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

/** Native <dialog>: focus trap, Esc-to-close and backdrop for free. */
export function Modal({ open, title, onClose, children, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // backdrop click
      }}
      className={`m-auto w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-(--radius-tile)
        border-t-2 border-t-gold-500 bg-white p-0 shadow-lg backdrop:bg-teal-950/50`}
    >
      <div className="p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-teal-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-(--radius-tile) px-2 py-1 text-teal-800 transition-colors duration-150 hover:bg-glaze-100"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
