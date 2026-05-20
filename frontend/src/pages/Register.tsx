import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useRegister, extractErrorMessage } from '../hooks/useAuth';

export default function Register() {
  const { isDark } = useThemeStore();
  const { mutate: register, isPending, error, isSuccess } = useRegister();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!username.trim()) {
      setValidationError('Nome de usuário é obrigatório.');
      return;
    }
    if (username.trim().length < 3) {
      setValidationError('Nome de usuário deve ter pelo menos 3 caracteres.');
      return;
    }
    if (!email.trim()) {
      setValidationError('E-mail é obrigatório.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.');
      return;
    }

    register({ username: username.trim().toLowerCase(), email: email.trim(), password });
  }

  const apiError = error ? extractErrorMessage(error) : null;
  const displayError = validationError || apiError;

  const inputBase = `w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500 ${
    isDark
      ? 'border-neutral-700 bg-neutral-800 text-white placeholder-neutral-500'
      : 'border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400'
  }`;

  const labelBase = `text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`;

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-4 py-12 ${
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
            Crie sua conta gratuita
          </p>
        </div>

        <div
          className={`rounded-2xl border p-8 ${
            isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-white'
          }`}
        >
          <h1
            className={`mb-6 text-xl font-semibold ${
              isDark ? 'text-white' : 'text-neutral-900'
            }`}
          >
            Criar conta
          </h1>

          {isSuccess && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>Conta criada! Redirecionando para o login...</span>
            </div>
          )}

          {displayError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className={labelBase}>
                Nome de usuário
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seunome"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={labelBase}>
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputBase}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className={labelBase}>
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className={inputBase}
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

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className={labelBase}>
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className={inputBase}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isSuccess}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </button>
          </form>

          <p
            className={`mt-6 text-center text-sm ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}
          >
            Já tem uma conta?{' '}
            <Link
              to="/login"
              className="font-medium text-red-500 transition-colors hover:text-red-400"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
