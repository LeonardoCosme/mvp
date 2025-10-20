'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/utils/api';

type Props = Readonly<{
  agendamentoId: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** opcional: mostram contexto no cabeçalho do modal */
  prestadorNome?: string | null;
  servicoNome?: string | null;
}>;

export default function AvaliacaoModal({
  agendamentoId,
  open,
  onClose,
  onSuccess,
  prestadorNome,
  servicoNome,
}: Props) {
  const [nota, setNota] = useState<number>(5);
  const [comentario, setComentario] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // fecha com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // resetar estado toda vez que abrir
  useEffect(() => {
    if (open) {
      setNota(5);
      setComentario('');
      setErrorMsg('');
    }
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  async function handleSubmit() {
    if (submitting) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await apiFetch('/avaliacoes', {
        method: 'POST',
        body: JSON.stringify({ agendamentoId, nota, comentario }),
      });
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Falha ao enviar avaliação.';
      setErrorMsg(msg);
      console.error('AvaliacaoModal submit error:', e);
    } finally {
      setSubmitting(false);
    }
  }

  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onMouseDown={handleBackdrop}
      aria-hidden={false}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avaliacao-title"
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="avaliacao-title" className="text-lg font-semibold mb-1">
          Avaliar atendimento
        </h2>

        {(prestadorNome || servicoNome) && (
          <div className="mb-4 text-sm text-gray-700">
            {prestadorNome && (
              <p>
                Prestador: <span className="font-medium">{prestadorNome}</span>
              </p>
            )}
            {servicoNome && (
              <p>
                Serviço: <span className="font-medium">{servicoNome}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {stars.map((s) => {
            const active = nota >= s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setNota(s)}
                className={`px-3 py-1 rounded transition ${
                  active ? 'bg-yellow-400' : 'bg-gray-200'
                }`}
                aria-pressed={active}
                aria-label={`${s} estrela${s > 1 ? 's' : ''}`}
              >
                ★
              </button>
            );
          })}
          <span className="ml-2 text-sm text-gray-600">{nota}/5</span>
        </div>

        <label className="block text-sm text-gray-700 mb-1" htmlFor="avaliacao-comentario">
          Comentário (opcional)
        </label>
        <textarea
          id="avaliacao-comentario"
          className="w-full border rounded-lg p-3 text-sm mb-2"
          rows={4}
          placeholder="Como foi a experiência?"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />

        {errorMsg && (
          <p className="text-sm text-red-600 mb-2" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded bg-gray-200"
            onClick={onClose}
            disabled={submitting}
          >
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
