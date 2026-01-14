import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  const redirectTarget =
    (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTarget);
    }
  }, [isAuthenticated, navigate, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await login(email.trim(), password);
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error || { message: 'No se pudo iniciar sesión.' });
      return;
    }
    navigate(redirectTarget);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-primary/5">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20" variant="secondary">
                Iniciar sesión
              </Badge>
              <div className="p-2 rounded-full bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
            <CardTitle className="mt-4 text-2xl">Bienvenido de nuevo</CardTitle>
            <CardDescription>
              Accede a tu progreso y continúa tu preparación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && (
                <ErrorAlert
                  title="No pudimos iniciar sesión"
                  message={error.message}
                  code={error.code}
                />
              )}

              <Button className="w-full gap-2" type="submit" disabled={isLoading}>
                <Lock className="h-4 w-4" />
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-primary hover:underline">
                Crear cuenta
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
