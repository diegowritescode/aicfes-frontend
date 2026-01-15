import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, GraduationCap, LayoutDashboard, ScrollText, Shuffle, Sparkles, Timer, Zap } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { DashboardData, getDashboard } from '@/services/api';

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
  const shouldShowSidebar = !isTestPage && !isAuthPage && !isLandingPage;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/generacion-especializada', label: 'Generación especializada', icon: Zap },
    { to: '/generacion-mixta', label: 'Generación mixta', icon: Shuffle },
    { to: '/contrarreloj', label: 'Contrarreloj', icon: Timer },
  ];
  const exploreItems = [
    { to: '/results', label: 'Resultados', icon: ScrollText },
    { to: '/metricas-personales', label: 'Métricas personales', icon: BarChart3, badge: 'Pronto', disabled: true },
  ];
  const supportItems = [
    { to: '/recursos', label: 'Guía y recursos', icon: BookOpen, badge: 'Pronto', disabled: true },
    { to: '/coach-ia', label: 'Coach IA', icon: Sparkles, badge: 'Pronto', disabled: true },
  ];

  useEffect(() => {
    if (!shouldShowSidebar || !isAuthenticated) return;

    let isMounted = true;
    setIsSidebarLoading(true);
    const load = async () => {
      const result = await getDashboard();
      if (!isMounted) return;
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
      setIsSidebarLoading(false);
    };

    load();
    const interval = window.setInterval(load, 60000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [shouldShowSidebar, isAuthenticated]);

  const weekTimeLabel = useMemo(() => {
    if (!dashboardData) return 'Sin datos';
    const hours = Math.floor(dashboardData.timeStudied.weekMinutes / 60);
    const minutes = dashboardData.timeStudied.weekMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [dashboardData]);

  const xpRemaining = useMemo(() => {
    if (!dashboardData) return null;
    return Math.max(0, dashboardData.level.nextLevelXp - dashboardData.level.currentXp);
  }, [dashboardData]);

  const renderNavItem = (item: { to: string; label: string; icon: typeof GraduationCap; badge?: string; disabled?: boolean }) => {
    const Icon = item.icon;
    if (item.disabled) {
      return (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground"
          aria-disabled="true"
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {item.badge}
            </span>
          )}
        </div>
      );
    }

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
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {shouldShowSidebar && (
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
          <nav className="flex-1 px-4 space-y-6">
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrenar</p>
              <div className="mt-2 space-y-2">{navItems.map(renderNavItem)}</div>
            </div>
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Explorar</p>
              <div className="mt-2 space-y-2">{exploreItems.map(renderNavItem)}</div>
            </div>
            <div>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">IA y recursos</p>
              <div className="mt-2 space-y-2">{supportItems.map(renderNavItem)}</div>
            </div>
          </nav>
          <div className="px-4 pb-6">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              {isSidebarLoading ? (
                <p className="text-sm font-semibold text-foreground">Cargando progreso...</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {dashboardData ? `Nivel ${dashboardData.level.level}` : 'Nivel por definir'} ·{' '}
                    {dashboardData ? `${dashboardData.level.currentXp} XP` : '— XP'}
                  </p>
                  <p className="mt-1">
                    {xpRemaining !== null ? `Te faltan ${xpRemaining} XP para subir.` : 'Completa una misión para subir.'}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="rounded-md bg-background/80 p-2">
                      <p className="text-[10px] uppercase tracking-wide">Racha</p>
                      <p className="text-sm font-semibold text-foreground">
                        {dashboardData ? `${dashboardData.streak.currentDays} días` : '—'}
                      </p>
                    </div>
                    <div className="rounded-md bg-background/80 p-2">
                      <p className="text-[10px] uppercase tracking-wide">Semana</p>
                      <p className="text-sm font-semibold text-foreground">{weekTimeLabel}</p>
                    </div>
                  </div>
                </>
              )}
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
