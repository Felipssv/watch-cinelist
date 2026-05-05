import { Search, User, Moon, Sun, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

const navLinks = [
  { label: 'Início', active: true },
  { label: 'Filmes', active: false },
  { label: 'Séries', active: false },
  { label: 'Minha Lista', active: false },
];

export function Header({ isDark, toggleTheme }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll to slightly increase navbar opacity when user scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full border-b border-white/10 transition-all duration-300 ${
          scrolled ? 'bg-neutral-900/95 backdrop-blur-md' : 'bg-neutral-900/80 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center gap-12">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tighter text-white">
              <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-red-600">
                <div className="h-2 w-2 rounded-full bg-neutral-900"></div>
              </div>
              CineList
            </h1>

            <nav className="hidden gap-8 text-sm font-medium text-neutral-400 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href="#"
                  className={`transition-colors hover:text-red-400 ${link.active ? 'text-white' : 'hover:text-white'}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="flex items-center gap-6">
            <button className="hidden text-neutral-400 transition-colors hover:text-white md:block">
              <Search size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="hidden text-neutral-400 transition-colors hover:text-white md:block"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden h-5 w-px bg-white/10 md:block"></div>
            <button className="hidden items-center gap-2 text-sm font-medium transition-colors hover:text-neutral-300 md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-800">
                <User size={14} className="text-neutral-400" />
              </div>
            </button>

            {/* Mobile: Search + Hamburger */}
            <button className="text-neutral-400 transition-colors hover:text-white md:hidden">
              <Search size={20} />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="text-neutral-400 transition-colors hover:text-white md:hidden"
              aria-label="Toggle menu"
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
              <a
                key={link.label}
                href="#"
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                  link.active
                    ? 'text-white'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Divider */}
          <div className="mb-4 h-px bg-white/10"></div>

          {/* Bottom row: Theme toggle + User */}
          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
              onClick={() => { toggleTheme(); setMenuOpen(false); }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            <button className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-800/60 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700">
                <User size={12} className="text-neutral-400" />
              </div>
              Perfil
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
