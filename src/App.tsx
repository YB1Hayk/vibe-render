import { useCallback, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from './web3/wagmi';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Designers } from './pages/Designers';
import { Operators } from './pages/Operators';
import { Profile } from './pages/Profile';
import { JobDetail } from './pages/JobDetail';
import { supabase } from './lib/supabase';
import type { Role } from './types/database';

const queryClient = new QueryClient();

// ─── Full-screen splash shown while auth is initialising ─────────────────────
function SplashScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg z-50">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="text-sm text-muted">Загрузка…</p>
    </div>
  );
}

// ─── Inline role-selection screen ────────────────────────────────────────────
function RoleSelectionScreen() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(async (role: Role) => {
    if (!user || saving) return;
    setSaving(true);
    setError(null);

    const { error: dbErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role }, { onConflict: 'id' });

    if (dbErr) {
      setError('Не удалось сохранить роль. Попробуйте ещё раз.');
      setSaving(false);
      return;
    }

    // Update context — this changes the condition and the normal app renders
    updateProfile({ role });
    // setSaving stays true; the component unmounts as soon as profile.role is set
  }, [user, saving, updateProfile]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8 bg-bg z-50 px-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Кто вы на платформе?</h1>
        <p className="text-muted text-sm">Выберите роль — её можно изменить позже в профиле</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          type="button"
          disabled={saving}
          onClick={() => choose('designer')}
          className="flex-1 rounded-2xl glass border border-border/20 px-6 py-8 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">🎨</div>
          <div className="font-display font-bold mb-1">Дизайнер</div>
          <div className="text-xs text-muted">Заказываю рендеры и 3D-визуализации</div>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => choose('operator')}
          className="flex-1 rounded-2xl glass border border-border/20 px-6 py-8 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-2">⚡</div>
          <div className="font-display font-bold mb-1">Рендерер</div>
          <div className="text-xs text-muted">Предоставляю вычислительные мощности</div>
        </button>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Сохраняем…
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}

// ─── App shell — rendered INSIDE AuthProvider and BrowserRouter ───────────────
function AppShell() {
  const { isInitializing, user, profile } = useAuth();

  // PHASE 1 — auth not yet resolved: show only the splash, nothing else
  if (isInitializing) {
    return <SplashScreen />;
  }

  // PHASE 2 — logged in but no role yet: force role selection
  if (user && !profile?.role) {
    return <RoleSelectionScreen />;
  }

  // PHASE 3 — normal app
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/designers"
            element={
              <ProtectedRoute>
                <Designers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operators"
            element={
              <ProtectedRoute>
                <Operators />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute>
                <JobDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: 'hsl(262 83% 64%)' })}>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AuthProvider>
  );
}
