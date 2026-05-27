import { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from './web3/wagmi';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { SelectRole } from './pages/SelectRole';
import { Designers } from './pages/Designers';
import { Operators } from './pages/Operators';
import { Profile } from './pages/Profile';
import { JobDetail } from './pages/JobDetail';

const queryClient = new QueryClient();

/** Перенаправляет на /select-role если пользователь залогинен, но не выбрал роль. */
function RoleGuard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (profile?.role) return;
    // Не мешаем авторизационным страницам
    const skipPaths = ['/select-role', '/auth/callback', '/login'];
    if (skipPaths.some((p) => location.pathname.startsWith(p))) return;
    navigate('/select-role', { replace: true });
  }, [loading, user, profile?.role, location.pathname, navigate]);

  return null;
}

function AppInner() {
  return (
    <BrowserRouter>
      <RoleGuard />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route
            path="/designers"
            element={
              <ProtectedRoute requiredRole="designer">
                <Designers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operators"
            element={
              <ProtectedRoute requiredRole="renderer">
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
    </BrowserRouter>
  );
}

export function App() {
  return (
    <AuthProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={darkTheme({ accentColor: 'hsl(262 83% 64%)' })}>
            <AppInner />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AuthProvider>
  );
}
