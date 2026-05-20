import { Search, User, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';

interface HeaderProps {
  currentPage?: 'home' | 'movies' | 'watchlist' | 'trending';
}

const navLinks = [
  { label: 'Início', path: '/' },
  { label: 'Filmes', path: '/filmes' },
  { label: 'Em Alta', path: '/trending' },
  { label: 'Minha Lista', path: '/minha-lista' },
];

export function Header({ currentPage }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { isDark, toggleTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [userMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full border-b border-white/10 transition-all duration-300 ${
          scrolled ? 'bg-neutral-900/95 backdrop-blur-md' : 'bg-neutral-900/80 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-red-600">
              <div className="h-2 w-2 rounded-full bg-neutral-900"></div>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">CineList</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden gap-8 text-sm font-medium text-neutral-400 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`transition-colors ${
                  isActive(link.path)
                    ? 'text-white'
                    : 'hover:text-red-400 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-6">
            <button className="hidden text-neutral-400 transition-colors hover:text-white md:block">
              <Search size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="hidden text-neutral-400 transition-colors hover:text-white md:block"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden h-5 w-px bg-white/10 md:block"></div>

            {/* User menu */}
            <div className="relative hidden md:block" data-user-menu>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-neutral-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800">
                  <User size={14} className="text-neutral-400" />
                </div>
                {user && (
                  <span className="max-w-[100px] truncate text-neutral-300">{user.username}</span>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-neutral-700 bg-neutral-900 py-2 shadow-xl">
                  {user && (
                    <div className="border-b border-neutral-800 px-4 pb-2 mb-1">
                      <p className="text-xs font-medium text-neutral-300 truncate">{user.username}</p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  >
                    <LogOut size={14} />
                    Sair
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: Search + Hamburger */}
            <button className="text-neutral-400 transition-colors hover:text-white md:hidden">
              <Search size={20} />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-neutral-400 transition-colors hover:text-white md:hidden"
              aria-label="Abrir menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Down Menu */}
      <div
        className={`fixed left-0 right-0 top-20 z-40 overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-b border-white/10 bg-neutral-900/97 px-6 pb-6 pt-4 backdrop-blur-md">
          {/* Nav Links */}
          <nav className="mb-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  navigate(link.path);
                  setMenuOpen(false);
                }}
                className={`rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-white'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="mb-4 h-px bg-white/10"></div>

          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
