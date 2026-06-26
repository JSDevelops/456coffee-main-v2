import { useState, type ReactNode } from 'react';
import { Sidebar, type Page } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  active: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: ReactNode;
}

export function AppShell({
  active,
  onNavigate,
  onLogout,
  theme,
  onToggleTheme,
  children,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        active={active}
        onNavigate={(p) => {
          onNavigate(p);
          setSidebarOpen(false);
        }}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          active={active}
          onSidebarOpen={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onProfileClick={() => onNavigate('profile')}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
