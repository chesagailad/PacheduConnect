import { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function Layout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      {sidebar}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
} 