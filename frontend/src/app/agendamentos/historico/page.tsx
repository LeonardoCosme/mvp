// frontend/src/app/agendamentos/historico/page.tsx
import { redirect } from 'next/navigation';

export default function AgendamentosHistoricoRedirect() {
  // sempre que alguém tentar acessar /agendamentos/historico,
  // manda direto para /historico
  redirect('/historico');
}
