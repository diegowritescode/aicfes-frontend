import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthFrame } from '@/components/brand/AuthFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { ErrorAlert } from '@/components/ErrorAlert';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
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
    <AuthFrame
      badge="Crear cuenta"
      title="Empieza hoy, no el lunes."
      subtitle="Dos campos y ya estás adentro. Sin tarjeta, sin letra chiquita."
      panelTitle="Lo difícil no es el examen. Es sostener el estudio hasta llegar."
      panelPoints={[
        'Un diagnóstico corto te dice dónde estás parado',
        'Simulacros con la estructura real del Saber 11',
        'Cada pregunta se verifica antes de que la veas',
        'Tu progreso en números, no en sensaciones',
      ]}
      footer={
        <p>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-brand-bright hover:underline">
            Entra aquí
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? <ErrorAlert message={error.message} code={error.code} /> : null}

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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="h-12 rounded-xl border-slate-200 bg-slate-50/60 text-[15px] focus-visible:border-brand-bright focus-visible:bg-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passwordConfirm" className="text-[13.5px] font-semibold text-slate-700">
            Repite la contraseña
          </Label>
          <Input
            id="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl border-slate-200 bg-slate-50/60 text-[15px] focus-visible:border-brand-bright focus-visible:bg-white"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-12 w-full rounded-full bg-brand-bright text-[15px] font-bold shadow-[0_8px_24px_-8px_hsl(var(--brand-bright))] transition-transform hover:scale-[1.02] hover:bg-brand-bright"
        >
          {isLoading ? 'Creando tu cuenta…' : 'Crear mi cuenta gratis'}
        </Button>

        <p className="text-center text-[12px] leading-relaxed text-slate-500">
          Al crear la cuenta aceptas que esto es una plataforma de práctica independiente,
          sin relación con el ICFES.
        </p>
      </form>
    </AuthFrame>
  );
}
