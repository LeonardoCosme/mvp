'use client';

import Header from './components/header';
import Footer from './components/footer';
import ClientWatcher from './ClientWatcher';

type PageShellProps = {
  readonly children: React.ReactNode;
};

export default function PageShell({ children }: PageShellProps) {
  return (
    <>
      <ClientWatcher />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}