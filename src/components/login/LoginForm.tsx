'use client';

/**
 * LoginForm.tsx
 * Formulario de inicio de sesión con validación Zod + React Hook Form.
 * Conectado al backend de AWOS para autenticación real.
 * Manejo robusto de errores con mensajes específicos y animaciones.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { CyberInput } from '@/components/ui/CyberInput';
import { CyberButton } from '@/components/ui/CyberButton';
import { login, ApiError } from '@/lib/api';
import { useStore } from '@/lib/store';

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
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
      const response = await login(data);

      // Actualizar store de Zustand
      useStore.setState({
        user: response.data.user,
        isAuthenticated: true,
      });

      // Toast de éxito con animación personalizada
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[#00ffff]" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm font-bold">
                ¡Bienvenido de nuevo!
              </span>
              <span className="font-mono text-xs text-[#888888]">
                {response.data.user.name}
              </span>
            </div>
          </div>
        ),
        {
          duration: 3000,
          style: {
            background: '#0a0a0a',
            border: '1px solid rgba(0,255,255,0.3)',
            boxShadow: '0 0 20px rgba(0,255,255,0.1)',
          },
        }
      );

      // Pequeño delay para que el usuario vea el toast antes de redirigir
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (error) {
      // Manejo robusto de todos los tipos de error posibles
      const apiError = error as ApiError;

      // 1. Errores de validación (400)
      if (apiError.status === 400 && apiError.details) {
        Object.entries(apiError.details).forEach(([field, messages]) => {
          setError(field as keyof LoginFormValues, {
            message: messages[0],
          });
        });
        toast.error(
          (t) => (
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ff00ff]" />
              <span className="font-mono text-sm">
                Por favor corrige los errores
              </span>
            </div>
          ),
          {
            duration: 4000,
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,0,255,0.3)',
            },
          }
        );
      }
      // 2. Credenciales incorrectas (401)
      else if (apiError.status === 401 || apiError.error?.includes('credentials')) {
        setError('email', { message: 'Credenciales incorrectas' });
        setError('password', { message: 'Credenciales incorrectas' });
        toast.error(
          (t) => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">
                  Credenciales incorrectas
                </span>
                <span className="font-mono text-xs text-[#888888]">
                  Verifica tu email y contraseña
                </span>
              </div>
            </div>
          ),
          {
            duration: 4000,
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,0,255,0.3)',
            },
          }
        );
      }
      // 3. Rate limit (429)
      else if (apiError.status === 429) {
        const waitMinutes = Math.ceil((apiError.retryAfter ?? 900) / 60);
        toast.error(
          (t) => (
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ffff00]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">
                  Demasiados intentos
                </span>
                <span className="font-mono text-xs text-[#888888]">
                  Intenta de nuevo en {waitMinutes} minutos
                </span>
              </div>
            </div>
          ),
          {
            duration: 6000,
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,255,0,0.3)',
            },
          }
        );
      }
      // 4. Error de red o timeout
      else if (
        error instanceof TypeError ||
        apiError.error?.includes('fetch') ||
        apiError.error?.includes('network')
      ) {
        toast.error(
          (t) => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">
                  Error de conexión
                </span>
                <span className="font-mono text-xs text-[#888888]">
                  Verifica tu conexión a internet
                </span>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,0,255,0.3)',
            },
          }
        );
      }
      // 5. Error genérico (500, otros)
      else {
        toast.error(
          (t) => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">
                  Error al iniciar sesión
                </span>
                <span className="font-mono text-xs text-[#888888]">
                  {apiError.error || 'Intenta de nuevo en unos momentos'}
                </span>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              background: '#0a0a0a',
              border: '1px solid rgba(255,0,255,0.3)',
            },
          }
        );
      }

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
        {errors.email && (
          <span
            className="pl-1 font-mono animate-in fade-in slide-in-from-top-1 duration-200"
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
        {errors.password && (
          <span
            className="pl-1 font-mono animate-in fade-in slide-in-from-top-1 duration-200"
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
        {isLoading ? 'Verificando...' : 'Ingresar →'}
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
