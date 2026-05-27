import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const REDIRECT_URL = 'https://vibe-render.vercel.app/auth/callback';

const OAUTH_PROVIDERS = [
  {
    id: 'google' as const,
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'discord' as const,
    label: 'Discord',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.079.079 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
] as const;

type Step = 'choose' | 'email-input' | 'email-sent';

export function Login() {
  const { user, profile, loading, signInWith } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('choose');
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [oauthError, setOauthError] = useState('');

  // Редирект если уже залогинен
  useEffect(() => {
    if (!loading && user) {
      if (profile?.role === 'designer') navigate('/designers', { replace: true });
      else if (profile?.role === 'renderer') navigate('/operators', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleSendMagicLink = async () => {
    if (!email.trim()) return;
    setEmailError('');
    setEmailSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: REDIRECT_URL,
      },
    });
    setEmailSending(false);
    if (error) { setEmailError(error.message); return; }
    setStep('email-sent');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Лого */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-2 font-display text-2xl font-bold text-white shadow-lg shadow-accent/30">
            V
          </div>
          <h1 className="font-display text-2xl font-bold">Войти в VibeRender</h1>
          <p className="text-sm text-muted">
            {step === 'email-sent'
              ? `Письмо отправлено на ${email}`
              : 'Выберите удобный способ входа'}
          </p>
        </div>

        {/* ШАГ 1: Выбор провайдера */}
        {step === 'choose' && (
          <div className="flex flex-col gap-3">
            {OAUTH_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={async () => {
                  setOauthError('');
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: p.id,
                      options: { redirectTo: REDIRECT_URL },
                    });
                    if (error) setOauthError(`${p.label}: ${error.message}`);
                  } catch (e: unknown) {
                    setOauthError(e instanceof Error ? e.message : 'Ошибка подключения');
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-fg transition-all hover:bg-white/10 hover:border-white/25"
              >
                {p.icon}
                Продолжить через {p.label}
              </button>
            ))}
            {oauthError && (
              <p className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger">{oauthError}</p>
            )}

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border/15" />
              <span className="text-xs text-muted">или</span>
              <div className="flex-1 h-px bg-border/15" />
            </div>

            <button
              type="button"
              onClick={() => setStep('email-input')}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-fg transition-all hover:bg-white/10 hover:border-white/25"
            >
              <Mail size={20} className="text-muted" />
              Продолжить через Email
            </button>
          </div>
        )}

        {/* ШАГ 2: Ввод email */}
        {step === 'email-input' && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted">Ваш email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMagicLink()}
                placeholder="you@example.com"
                autoFocus
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors"
              />
            </label>
            {emailError && <p className="text-xs text-danger">{emailError}</p>}
            <button
              type="button"
              disabled={!email.trim() || emailSending}
              onClick={handleSendMagicLink}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {emailSending ? 'Отправляем…' : 'Отправить ссылку для входа'}
            </button>
            <button type="button" onClick={() => setStep('choose')} className="flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors mx-auto">
              <ArrowLeft size={12} /> Назад
            </button>
          </div>
        )}

        {/* ШАГ 3: Письмо отправлено */}
        {step === 'email-sent' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 size={48} className="text-success" />
            <div>
              <p className="font-medium">Проверь почту!</p>
              <p className="mt-1 text-sm text-muted">
                Мы отправили ссылку на <strong>{email}</strong>.
                <br />Нажми на неё — и ты войдёшь на сайт.
              </p>
            </div>
            <p className="text-xs text-muted/60">Письмо могло попасть в Спам</p>
            <button
              type="button"
              onClick={() => { setStep('email-input'); }}
              className="text-xs text-muted hover:text-fg transition-colors"
            >
              Отправить ещё раз
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted/50">
          Входя, вы соглашаетесь с условиями использования VibeRender
        </p>
        <div className="mt-3 text-center">
          <button type="button" onClick={() => navigate('/')} className="text-xs text-muted hover:text-fg transition-colors">
            ← На главную
          </button>
        </div>
      </div>
    </div>
  );
}
