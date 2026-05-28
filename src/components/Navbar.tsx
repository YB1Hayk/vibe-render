import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogIn, LogOut, User } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ConnectWalletButton } from './ConnectWalletButton';
import { useAuth } from '../context/AuthContext';

const NAV_BASE = [
  { to: '/', key: 'nav.home' },
  { to: '/profile', key: 'nav.profile' },
] as const;

export function Navbar() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleLinks = user
    ? [
        { to: '/designers', key: 'nav.designers' },
        { to: '/operators', key: 'nav.operators' },
      ]
    : [];

  const NAV = [...NAV_BASE.slice(0, 1), ...roleLinks, NAV_BASE[1]];

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-40 border-b border-border/10 bg-bg/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <NavLink to="/" className="flex shrink-0 items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">V</span>
          VibeRender
        </NavLink>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-border/10 text-fg' : 'text-muted hover:text-fg'
                  }`
                }
              >
                {t(item.key)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <div className="hidden sm:block">
            <ConnectWalletButton />
          </div>

          {/* Auth button — renders immediately; updates when session resolves */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="grid h-9 w-9 place-items-center rounded-full bg-accent/20 font-display text-sm font-bold text-accent transition-colors hover:bg-accent/30"
                title={profile?.username ?? user.email ?? ''}
              >
                {initials}
              </button>
              {userMenuOpen && (
                <div className="absolute end-0 top-11 z-50 min-w-[10rem] rounded-xl glass border border-border/10 p-1 shadow-xl">
                  <NavLink
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-border/10"
                  >
                    <User size={14} />
                    {t('nav.profile')}
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => { signOut(); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-border/10"
                  >
                    <LogOut size={14} />
                    {t('auth.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 rounded-lg glass px-3 py-2 text-sm transition-colors hover:border-accent/40"
            >
              <LogIn size={14} />
              {t('auth.signIn')}
            </button>
          )}

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg glass lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/10 px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2.5 text-sm ${
                      isActive ? 'bg-border/10 text-fg' : 'text-muted'
                    }`
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2">
            <div className="sm:hidden">
              <ConnectWalletButton />
            </div>
            {!user && (
              <button
                type="button"
                onClick={() => { navigate('/login'); setOpen(false); }}
                className="flex items-center gap-2 rounded-lg glass px-3 py-2.5 text-sm"
              >
                <LogIn size={14} />
                {t('auth.signIn')}
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={() => { signOut(); setOpen(false); }}
                className="flex items-center gap-2 rounded-lg glass px-3 py-2.5 text-sm text-danger"
              >
                <LogOut size={14} />
                {t('auth.signOut')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
