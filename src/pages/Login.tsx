import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthFrame } from '@/components/brand/AuthFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const redirectTarget = (location.state as { from?: string } | null)?.from || '/dashboard';

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
    <AuthFrame
      badge="Entrar"
      title="Seguimos donde quedaste."
      subtitle="Tu racha, tu progreso y lo que toca estudiar hoy te están esperando."
      panelTitle="Veinte minutos al día pesan más que seis horas un domingo."
      panelPoints={[
        'Tu plan ya sabe qué área te toca hoy',
        'La racha no se rompe si entras',
        'Cada simulacro que haces afina el plan',
      ]}
      footer={
        <p>
          ¿Todavía no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-brand-bright hover:underline">
            Créala gratis
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <ErrorAlert error={error} /> : null}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[13.5px] font-semibold text-slate-700">
            Correo
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            className="h-12 rounded-xl border-slate-200 bg-slate-50/60 text-[15px] focus-visible:border-brand-bright focus-visible:bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[13.5px] font-semibold text-slate-700">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl border-slate-200 bg-slate-50/60 text-[15px] focus-visible:border-brand-bright focus-visible:bg-white"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-full bg-brand-bright text-[15px] font-bold shadow-[0_8px_24px_-8px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02] hover:bg-brand-bright"
        >
          {isLoading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthFrame>
  );
}
