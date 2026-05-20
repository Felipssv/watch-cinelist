import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useLogin, extractErrorMessage } from '../hooks/useAuth';

export default function Login() {
  const { isDark } = useThemeStore();
  const { mutate: login, isPending, error } = useLogin();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!identifier.trim()) {
      setValidationError('E-mail ou nome de usuário é obrigatório.');
      return;
    }
    if (!password) {
      setValidationError('Senha é obrigatória.');
      return;
    }

    login({ identifier: identifier.trim(), password });
  }

  const apiError = error ? extractErrorMessage(error) : null;
  const displayError = validationError || apiError;

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 ${
        isDark ? 'bg-neutral-950' : 'bg-neutral-100'
      }`}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-red-600">
              <div className="h-2.5 w-2.5 rounded-full bg-neutral-900" />
            </div>
            <span className="text-3xl font-bold tracking-tighter text-white">CineList</span>
          </div>
          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            Bem-vindo de volta
          </p>
        </div>

        <div
          className={`rounded-2xl border p-8 ${
            isDark
              ? 'border-neutral-800 bg-neutral-900'
              : 'border-neutral-200 bg-white'
          }`}
        >
          <h1
            className={`mb-6 text-xl font-semibold ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            Entrar na sua conta
          </h1>

          {displayError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="identifier"
                className={`text-sm font-medium ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                E-mail ou nome de usuário
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="seu@email.com ou @username"
                className={`rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                  isDark
                    ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                    : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className={`text-sm font-medium ${
                  isDark ? 'text-neutral-300' : 'text-neutral-700'
                }`}
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
                    isDark
                      ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
                      : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p
            className={`mt-6 text-center text-sm ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Não tem uma conta?{' '}
            <Link
              to="/register"
              className="font-medium text-red-500 transition-colors hover:text-red-400"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
