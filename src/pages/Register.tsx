import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
    if (password !== passwordConfirm) {
      setError({ message: 'Las contraseñas no coinciden.' });
      return;
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota';
    setIsLoading(true);
    const result = await register({ email: email.trim(), password, timezone });
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error || { message: 'No se pudo crear la cuenta.' });
      return;
    }
    navigate(redirectTarget);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background via-background to-blue-500/5">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" variant="secondary">
                Crear cuenta
              </Badge>
              <div className="p-2 rounded-full bg-blue-500/10">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <CardTitle className="mt-4 text-2xl">Empieza tu ruta ICFES</CardTitle>
            <CardDescription>
              Crea tu cuenta y desbloquea tu dashboard personalizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  required
                />
              </div>

              {error && (
                <ErrorAlert
                  title="No pudimos crear tu cuenta"
                  message={error.message}
                  code={error.code}
                />
              )}

              <Button className="w-full gap-2" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Crear cuenta
                  </>
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
