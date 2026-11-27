import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={"dlg" + (wide ? " wide" : "")} onClose={onClose} onCancel={e => { e.preventDefault(); onClose(); }} aria-label={title}>
      {open && <>
        <div className="dlg-head"><h2>{title}</h2><button type="button" className="dlg-x" aria-label="Close" onClick={onClose}>×</button></div>
        <div className="dlg-body">{children}</div>
      </>}
    </dialog>
  );
}
