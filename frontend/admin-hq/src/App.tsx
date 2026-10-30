import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from './api';
import { ToastProvider } from './components/ui';
import { AppShell } from './components/layout/AppShell';
import type { Page } from './components/layout/Sidebar';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BranchesPage = lazy(() => import('./pages/BranchesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const InventoryLedger = lazy(() => import('./pages/InventoryLedger'));
const CostManagement = lazy(() => import('./pages/CostManagement'));
const FinanceLedger = lazy(() => import('./pages/FinanceLedger'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage'));
const SalesChannelsPage = lazy(() => import('./pages/SalesChannelsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AcademyAdminPage = lazy(() => import('./pages/AcademyAdminPage'));
const PlantationsAdminPage = lazy(() => import('./pages/PlantationsAdminPage'));

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
  'academy',
  'plantations',
];

function readPageFromHash(): Page {
  const hashWithoutPrefix = window.location.hash.replace(/^#\/?/, '');
  const raw = hashWithoutPrefix.split('?')[0].replace(/\/+$/, '') as Page;
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

  // Check URL query/hash for token or demo (supports seamless cross-domain session transfer)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashParams = hash.includes('?')
      ? new URLSearchParams(hash.split('?')[1])
      : hash.includes('token=') || hash.includes('demo=')
      ? new URLSearchParams(hash.replace(/^#\/?/, ''))
      : null;

    const isDemo = urlParams.get('demo') === 'true' || hashParams?.get('demo') === 'true';
    if (isDemo) {
      auth.setToken('demo-admin-token');
      setAuthed(true);
      const target = readPageFromHash();
      setPageState(target);
      return;
    }

    const token = urlParams.get('token') || hashParams?.get('token');
    if (token) {
      auth.setToken(token);
      setAuthed(true);
      const targetPage = readPageFromHash();
      const targetHash = targetPage !== 'overview' ? `#/${targetPage}` : '#/overview';
      const cleanUrl = window.location.pathname + targetHash;
      window.history.replaceState({}, document.title, cleanUrl);
      setPageState(targetPage !== 'overview' ? targetPage : 'orders');
    }
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-base-900"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
          <LoginPage onLoginSuccess={() => setAuthed(true)} />
        </Suspense>
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
        <Suspense fallback={<div className="p-16 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>}>
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
          {page === 'academy' && <AcademyAdminPage />}
          {page === 'plantations' && <PlantationsAdminPage />}
          {page === 'profile' && (
            <ProfilePage theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
          )}
        </Suspense>
      </AppShell>
    </ToastProvider>
  );
}
