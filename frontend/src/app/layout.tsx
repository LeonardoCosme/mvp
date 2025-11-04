import type { Metadata } from 'next';
import './globals.css';
import PageShell from './PageShell';

export const metadata: Metadata = {
  title: 'InterServ',
  description: 'Encontre profissionais de confiança',
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}