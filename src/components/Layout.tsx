import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isTestPage = location.pathname === '/test';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!isTestPage && (
        <header className="border-b border-border bg-card shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">AICFES</h1>
                <p className="text-xs text-muted-foreground">Preparación Saber 11</p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Generar Preguntas
              </Link>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
      {!isTestPage && (
        <footer className="border-t border-border bg-card py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2024 AICFES - Plataforma de preparación para el examen Saber 11</p>
            <p className="mt-1">Preguntas generadas con inteligencia artificial</p>
          </div>
        </footer>
      )}
    </div>
  );
}
