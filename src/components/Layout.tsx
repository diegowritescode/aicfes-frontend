import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, Shuffle, Timer, Zap } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const isTestPage = location.pathname === '/test';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/registro';
  const isLandingPage = location.pathname === '/';
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/generacion-especializada', label: 'Generación especializada', icon: Zap },
    { to: '/generacion-mixta', label: 'Generación mixta', icon: Shuffle },
    { to: '/contrarreloj', label: 'Contrarreloj', icon: Timer },
  ];

  return (
    <div className="min-h-screen bg-background lg:flex">
      {!isTestPage && !isAuthPage && !isLandingPage && (
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card">
          <div className="px-6 py-6">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">AICFES</h1>
                <p className="text-xs text-muted-foreground">Preparación Saber 11</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  activeClassName="bg-primary/10 text-primary"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="px-4 pb-6">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">Nivel 3 · 240 XP</p>
              <p className="mt-1">Completa una misión para subir.</p>
            </div>
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                Cerrar sesión
              </Button>
            )}
          </div>
        </aside>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {!isTestPage && !isAuthPage && !isLandingPage && (
          <header className="border-b border-border bg-card shadow-sm lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-foreground">AICFES</span>
                </Link>
              </div>
              <nav className="mt-3 flex items-center gap-2 overflow-x-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/40"
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </header>
        )}
        {isLandingPage && (
          <header className="border-b border-border bg-card shadow-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">AICFES</span>
              </Link>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard">
                      <Button size="sm" variant="outline">
                        Ir al dashboard
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                    >
                      Cerrar sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      Iniciar sesión
                    </Link>
                    <Link to="/registro" className="text-sm font-semibold text-primary">
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1">{children}</main>

        {!isTestPage && !isAuthPage && !isLandingPage && (
          <footer className="border-t border-border bg-card py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2024 AICFES - Plataforma de preparación para el examen Saber 11</p>
              <p className="mt-1">Preguntas generadas con inteligencia artificial</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
