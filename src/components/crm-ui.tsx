import { useState } from "react";
import { LOST_REASONS, type Lead } from "@/lib/crm";

export const inputCls = "border border-border bg-background px-3 py-2 text-sm";
const input = inputCls;

export function LostDialog({ lead, onClose, onConfirm }: { lead: Lead; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [other, setOther] = useState("");
  return (
    <Modal title={`Marcar como perdido — ${lead.name || lead.email}`} onClose={onClose}>
      <label className="block text-sm mb-1">Motivo</label>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${input} w-full`}>
        {LOST_REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      {reason === "Outro" && <input value={other} onChange={(e) => setOther(e.target.value)} maxLength={300} placeholder="Qual?" className={`${input} w-full mt-2`} />}
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="border border-border px-4 py-2 text-xs">Cancelar</button>
        <button onClick={() => onConfirm(reason === "Outro" ? other.trim() || "Outro" : reason)} className="bg-foreground text-background px-5 py-2 text-xs">Confirmar</button>
      </div>
    </Modal>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background border border-border w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-2xl mb-5">{title}</div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block"><span className="block text-xs text-muted-foreground mb-1">{label}</span>{children}</label>
);
