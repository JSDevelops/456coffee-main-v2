import { useEffect, useState, useCallback } from 'react';
import { auth } from './api';
import { ToastProvider } from './components/ui';
import { AppShell } from './components/layout/AppShell';
import type { Page } from './components/layout/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BranchesPage from './pages/BranchesPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import CustomersPage from './pages/CustomersPage';
import InventoryLedger from './pages/InventoryLedger';
import CostManagement from './pages/CostManagement';
import FinanceLedger from './pages/FinanceLedger';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import PromotionsPage from './pages/PromotionsPage';
import SalesChannelsPage from './pages/SalesChannelsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

const VALID_PAGES: Page[] = [
  'overview',
  'branches',
  'products',
  'orders',
  'customers',
  'inventory',
  'cost',
  'finance',
  'promotions',
  'channels',
  'settings',
  'profile',
  'announcements',
];

function readPageFromHash(): Page {
  const raw = window.location.hash.replace(/^#\/?/, '') as Page;
  return VALID_PAGES.includes(raw) ? raw : 'overview';
}

export default function App() {
  const [authed, setAuthed] = useState<boolean>(auth.isLoggedIn());
  const [page, setPageState] = useState<Page>(readPageFromHash);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync page <-> URL hash so refresh / back button work
  useEffect(() => {
    const onHashChange = () => setPageState(readPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setPage = useCallback((p: Page) => {
    if (window.location.hash !== `#/${p}`) {
      window.location.hash = `/${p}`;
    }
    setPageState(p);
  }, []);

  if (!authed) {
    return (
      <ToastProvider>
        <LoginPage onLoginSuccess={() => setAuthed(true)} />
      </ToastProvider>
    );
  }

  const handleLogout = () => {
    auth.clear();
    setAuthed(false);
  };

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ToastProvider>
      <AppShell
        active={page}
        onNavigate={setPage}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {page === 'overview' && (
          <DashboardPage
            onJumpToOrders={() => setPage('orders')}
            onJumpToProducts={() => setPage('products')}
          />
        )}
        {page === 'branches' && <BranchesPage />}
        {page === 'products' && <ProductsPage />}
        {page === 'orders' && <OrdersPage />}
        {page === 'customers' && <CustomersPage />}
        {page === 'inventory' && <InventoryLedger />}
        {page === 'cost' && <CostManagement />}
        {page === 'finance' && <FinanceLedger />}
        {page === 'promotions' && <PromotionsPage />}
        {page === 'channels'   && <SalesChannelsPage />}
        {page === 'settings'   && <SettingsPage />}
        {page === 'announcements' && <AnnouncementsPage />}
        {page === 'profile' && (
          <ProfilePage theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
        )}
      </AppShell>
    </ToastProvider>
  );
}
