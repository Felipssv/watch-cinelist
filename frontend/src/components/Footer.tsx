import { useThemeStore } from '../store/themeStore';

export function Footer() {
  const { isDark } = useThemeStore();

  return (
    <footer className={`border-t py-8 ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-neutral-200 bg-neutral-50'}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-red-600">
              <div className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-neutral-900' : 'bg-white'}`}></div>
            </div>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>CineList</span>
          </div>
          <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
            Gestão de Filmes e Séries
          </p>
          <p className="text-xs text-neutral-500">
            © 2026 CineList. Desenvolvido como trabalho de faculdade.
          </p>
        </div>
      </div>
    </footer>
  );
}