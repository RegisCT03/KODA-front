'use client';

/**
 * LoginForm.tsx
 * Formulario de inicio de sesión con validación Zod + React Hook Form.
 * Conectado al backend de AWOS para autenticación real.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { CyberInput } from '@/components/ui/CyberInput';
import { CyberButton } from '@/components/ui/CyberButton';
import { login, ApiError } from '@/lib/api';
import { useStore } from '@/lib/store';

// ─── Schema Zod ───────────────────────────────────────────────────────────────

/**
 * Validación del formulario de login.
 * Los mensajes de error se muestran debajo de cada campo en magenta.
 */
const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Componente principal ─────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Llama a la API y guarda token en localStorage
      const response = await login(data);

      // Actualiza el store de Zustand con el usuario autenticado
      // Esto es necesario para que ProtectedRoute y Navbar reflejen la sesión
      useStore.setState({
        user: response.data.user,
        isAuthenticated: true,
      });

      toast.success(`Bienvenido de nuevo, ${response.data.user.name}!`);
      router.push('/dashboard');
    } catch (error) {
      // Manejar errores del backend
      const apiError = error as ApiError;

      if (apiError.details) {
        // Errores de validación (400)
        Object.entries(apiError.details).forEach(([field, messages]) => {
          setError(field as keyof LoginFormValues, {
            message: messages[0],
          });
        });
        toast.error('Por favor corrige los errores');
      } else if (apiError.error === 'Invalid credentials') {
        // Credenciales incorrectas (401)
        setError('email', { message: 'Credenciales incorrectas' });
        setError('password', { message: 'Credenciales incorrectas' });
        toast.error('Credenciales incorrectas');
      } else if (apiError.status === 429 || apiError.error === 'Demasiados intentos. Intenta en 15 minutos.') {
        // Rate limit (429)
        const waitSeconds = apiError.retryAfter ?? 60;
        toast.error(`Demasiados intentos. Intenta en ${waitSeconds}s.`);
      } else {
        // Error genérico
        toast.error('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* ── Campo Email ── */}
      <div className="flex flex-col gap-1">
        <CyberInput
          label="Email"
          type="email"
          autoComplete="email"
          iconLeft={<Mail size={16} />}
          error={errors.email?.message}
          {...register('email')}
        />
        {/* Mensaje de error Zod — magenta, font-mono, 11px */}
        {errors.email && (
          <span
            className="pl-1 font-mono"
            style={{ color: '#ff00ff', fontSize: '11px' }}
            role="alert"
          >
            {errors.email.message}
          </span>
        )}
      </div>

      {/* ── Campo Password con toggle show/hide ── */}
      <div className="flex flex-col gap-1">
        <CyberInput
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={errors.password?.message}
          // Icono derecho: botón de ojo para mostrar/ocultar contraseña
          iconRight={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-[#444444] transition-colors hover:text-[#00ffff] focus-visible:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('password')}
        />
        {/* Mensaje de error Zod */}
        {errors.password && (
          <span
            className="pl-1 font-mono"
            style={{ color: '#ff00ff', fontSize: '11px' }}
            role="alert"
          >
            {errors.password.message}
          </span>
        )}
      </div>

      {/* ── Botón submit ── */}
      <CyberButton
        type="submit"
        variant="primary"
        size="lg"
        loading={isLoading}
        disabled={isLoading}
        className="mt-2 w-full"
      >
        Ingresar →
      </CyberButton>

      {/* Hint de credenciales de prueba */}
      <p
        className="text-center font-mono text-xs"
        style={{ color: '#222222' }}
      >
        demo: test@awos.dev / Test1234!
      </p>
    </form>
  );
}
