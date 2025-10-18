'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scanner } from '@yudiel/react-qr-scanner';
import type { IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { apiFetch } from '@/utils/api';

type ScanPhase = 'idle' | 'processing' | 'done' | 'error';

export default function ScannerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();

  const agendamentoId = useMemo(() => Number(params?.id ?? 0), [params]);

  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [message, setMessage] = useState<string>('');
  const lastTextRef = useRef<string | null>(null);

  const defaultPhase = search?.get('phase'); // opcional: se veio da URL (contratante compartilhou)
  const defaultToken = search?.get('token');

  const title = 'Ler QR Code do Agendamento';
  const help =
    'Aponte a câmera para o QR gerado pelo contratante. Permita o acesso à câmera quando solicitado.';

  // Se a URL já trouxe phase+token (link compartilhado), tenta registrar sem abrir câmera
  const triedURLOnce = useRef(false);
  if (!triedURLOnce.current && defaultPhase && defaultToken) {
    triedURLOnce.current = true;
    (async () => {
      try {
        setPhase('processing');
        setMessage('Processando QR da URL...');
        await apiFetch(`/agendamentos/${agendamentoId}/scan`, {
          method: 'POST',
          body: JSON.stringify({ phase: defaultPhase, token: defaultToken }),
        });
        setPhase('done');
        setMessage('✅ Etapa registrada com sucesso!');
      } catch (err: any) {
        setPhase('error');
        setMessage(err?.message || 'Falha ao processar a URL.');
      }
    })();
  }

  // Lê e valida payload do QR (suporta JSON ou "interserv:acao:id:token")
  function parsePayload(text: string): { id: number; phase: 'checkin' | 'start' | 'end'; token: string } | null {
    try {
      const obj = JSON.parse(text);
      if (obj && typeof obj.id === 'number' && typeof obj.phase === 'string' && typeof obj.token === 'string') {
        if (obj.phase === 'checkin' || obj.phase === 'start' || obj.phase === 'end') {
          return { id: obj.id, phase: obj.phase, token: obj.token };
        }
      }
    } catch {
      /* não é JSON, tenta “namespace” */
    }
    const parts = text.split(':');
    if (parts.length >= 4) {
      const [ns, action, idStr, token] = parts;
      if (ns === 'interserv' && (action === 'checkin' || action === 'start' || action === 'end')) {
        const id = Number(idStr);
        if (id && token) return { id, phase: action, token };
      }
    }
    return null;
  }

  // quando o QR é lido
  const handleScan = useCallback(
    async (codes: IDetectedBarcode[]) => {
      const text = codes?.[0]?.rawValue;
      if (!text) return;

      if (lastTextRef.current === text) return; // evita duplo submit
      lastTextRef.current = text;

      try {
        setPhase('processing');
        setMessage('Processando leitura…');

        const payload = parsePayload(text);
        if (!payload) {
          setPhase('error');
          setMessage('QR inválido. Tente novamente.');
          return;
        }

        if (payload.id !== agendamentoId) {
          setPhase('error');
          setMessage(`Este QR é do agendamento #${payload.id}, mas você abriu o scanner para #${agendamentoId}.`);
          return;
        }

        await apiFetch(`/agendamentos/${agendamentoId}/scan`, {
          method: 'POST',
          body: JSON.stringify({ phase: payload.phase, token: payload.token }),
        });

        setPhase('done');
        setMessage('✅ Etapa registrada com sucesso!');
      } catch (err: any) {
        setPhase('error');
        setMessage(err?.message || 'Falha ao processar o QR.');
      }
    },
    [agendamentoId]
  );

  // erros do scanner/câmera
  const handleError = useCallback((err: unknown) => {
    const msg = err instanceof Error ? err.message : 'Erro de câmera / permissão.';
    setPhase((p) => (p === 'idle' ? 'error' : p));
    setMessage((m) => m || msg);
  }, []);

  // classes do alerta
  let alertClass = 'border-gray-200 bg-gray-50 text-gray-700';
  if (phase === 'error') {
    alertClass = 'border-red-200 bg-red-50 text-red-700';
  } else if (phase === 'done') {
    alertClass = 'border-green-200 bg-green-50 text-green-700';
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F89D13]/30 to-[#8F1D14]/10 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <header className="bg-white/90 rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-[#8F1D14]">{title}</h1>
          <p className="text-gray-700 mt-1">{help}</p>
          <p className="text-sm text-gray-500 mt-1">
            Agendamento: <span className="font-semibold">#{agendamentoId}</span>
          </p>
        </header>

        {/* Scanner */}
        <section className="bg-white rounded-2xl shadow-lg p-4">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-black/5">
            <Scanner
              onScan={handleScan}
              onError={handleError}
              components={{ torch: true, finder: false }}
              styles={{
                container: { width: '100%' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
            />
          </div>

          {/* Mensagem de status */}
          {message && (
            <div className={`mt-4 rounded-lg border p-3 text-sm ${alertClass}`}>
              {message}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Link href="/agendamento" className="text-[#8F1D14] hover:underline">
              ← Voltar aos agendamentos
            </Link>

            {phase === 'done' && (
              <button
                className="px-4 py-2 rounded-lg bg-[#8F1D14] text-white hover:bg-[#a2261b]"
                onClick={() => router.push('/agendamento')}
                type="button"
              >
                Concluir
              </button>
            )}
          </div>
        </section>

        <section className="text-sm text-gray-600">
          <p>
            Problemas com a câmera? Verifique as permissões do navegador (ícone de cadeado na barra de
            endereço) ou tente outro dispositivo.
          </p>
        </section>
      </div>
    </main>
  );
}
