// src/app/agendamentos/historico/page.tsx
import { redirect } from 'next/navigation';

export default function HistoricoAlias() {
  // sempre que alguém tentar acessar /agendamentos/historico,
  // o Next redireciona imediatamente para /historico
  redirect('/historico');
}
