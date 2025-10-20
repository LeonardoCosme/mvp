'use client';
import { useState } from 'react';
import { apiFetch } from '@/utils/api';

type Props = Readonly<{
  agendamentoId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}>;

export default function AvaliacaoModal({ agendamentoId, open, onClose, onSuccess }: Props) {
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!open) return null;

  async function handleSubmit() {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await apiFetch('/avaliacoes', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ agendamentoId, nota, comentario }),
      });
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao enviar avaliação.';
      setErrorMsg(msg);
      console.error('AvaliacaoModal submit error:', e);
    } finally {
      setSubmitting(false);
    }
  }

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold mb-3">Avaliar atendimento</h2>

        <div className="flex gap-2 mb-4">
          {stars.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNota(s)}
              className={`px-3 py-1 rounded ${nota >= s ? 'bg-yellow-400' : 'bg-gray-200'}`}
              aria-pressed={nota >= s}
            >
              ★
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-600">{nota}/5</span>
        </div>

        <textarea
          className="w-full border rounded-lg p-3 text-sm mb-2"
          rows={4}
          placeholder="Deixe um comentário (opcional)"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        {errorMsg && (
          <p className="text-sm text-red-600 mb-2" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded bg-gray-200" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded bg-[#8F1D14] text-white disabled:opacity-70"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
