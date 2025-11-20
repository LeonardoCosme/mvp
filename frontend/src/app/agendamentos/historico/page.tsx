// frontend/src/app/agendamentos/historico/page.tsx
import { redirect } from 'next/navigation';

export default function AgendamentosHistoricoRedirectPage() {
  // Sempre que alguém acessar /agendamentos/historico,
  // será enviado para /historico
  redirect('/historico');
}
