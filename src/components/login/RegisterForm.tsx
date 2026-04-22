'use client';

/**
 * RegisterForm.tsx
 * Formulario de registro con validación Zod + React Hook Form.
 * Conectado al backend de AWOS para registro real de usuarios.
 * Manejo robusto de errores con mensajes específicos y animaciones.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, Mail, Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { CyberInput } from '@/components/ui/CyberInput';
import { CyberButton } from '@/components/ui/CyberButton';
import { PasswordStrength } from './PasswordStrength';
import { register as registerUser, ApiError } from '@/lib/api';
import { useStore } from '@/lib/store';

// ─── Schema Zod ───────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name:     z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    email:    z.string().email('Email inválido').max(100, 'Máximo 100 caracteres'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'Debe incluir al menos un número'),
    confirm:  z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Helpers de toast ─────────────────────────────────────────────────────────

const toastStyles = {
  error: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,0,255,0.3)',
    boxShadow: '0 0 20px rgba(255,0,255,0.08)',
  },
  success: {
    background: '#0a0a0a',
    border: '1px solid rgba(0,255,255,0.3)',
    boxShadow: '0 0 20px rgba(0,255,255,0.1)',
  },
  warning: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,0,0.3)',
    boxShadow: '0 0 20px rgba(255,255,0,0.08)',
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');

  async function onSubmit(data: RegisterFormValues) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Actualizar store de Zustand
      useStore.setState({
        user: response.data.user,
        isAuthenticated: true,
      });

      toast.success(
        () => (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[#00ffff]" />
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-sm font-bold">¡Cuenta creada!</span>
              <span className="font-mono text-xs text-[#888888]">
                Bienvenido, {response.data.user.name}
              </span>
            </div>
          </div>
        ),
        { duration: 3000, style: toastStyles.success }
      );

      setTimeout(() => router.push('/test'), 500);
    } catch (error) {
      const apiError = error as ApiError;

      // 1. Errores de validación (400)
      if (apiError.status === 400 && apiError.details) {
        Object.entries(apiError.details).forEach(([field, messages]) => {
          setError(field as keyof RegisterFormValues, { message: messages[0] });
        });
        toast.error(
          () => (
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ff00ff]" />
              <span className="font-mono text-sm">Corrige los errores del formulario</span>
            </div>
          ),
          { duration: 4000, style: toastStyles.error }
        );
      }
      // 2. Email ya registrado (409)
      else if (apiError.status === 409 || apiError.error?.includes('already registered')) {
        setError('email', { message: 'Este email ya está registrado' });
        toast.error(
          () => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">Email ya registrado</span>
                <span className="font-mono text-xs text-[#888888]">
                  ¿Ya tienes cuenta? Inicia sesión
                </span>
              </div>
            </div>
          ),
          { duration: 5000, style: toastStyles.error }
        );
      }
      // 3. Rate limit (429)
      else if (apiError.status === 429) {
        const waitMinutes = Math.ceil((apiError.retryAfter ?? 900) / 60);
        toast.error(
          () => (
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[#ffff00]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">Demasiados intentos</span>
                <span className="font-mono text-xs text-[#888888]">
                  Intenta de nuevo en {waitMinutes} minutos
                </span>
              </div>
            </div>
          ),
          { duration: 6000, style: toastStyles.warning }
        );
      }
      // 4. Error de red
      else if (error instanceof TypeError || apiError.error?.includes('fetch')) {
        toast.error(
          () => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">Error de conexión</span>
                <span className="font-mono text-xs text-[#888888]">
                  Verifica tu conexión a internet
                </span>
              </div>
            </div>
          ),
          { duration: 5000, style: toastStyles.error }
        );
      }
      // 5. Error genérico
      else {
        toast.error(
          () => (
            <div className="flex items-center gap-3">
              <XCircle size={20} className="text-[#ff00ff]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-sm font-bold">Error al crear cuenta</span>
                <span className="font-mono text-xs text-[#888888]">
                  {apiError.error || 'Intenta de nuevo en unos momentos'}
                </span>
              </div>
            </div>
          ),
          { duration: 5000, style: toastStyles.error }
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
      {/* ── Campo Nombre ── */}
      <div className="flex flex-col gap-1">
        <CyberInput
          label="Nombre"
          type="text"
          autoComplete="name"
          iconLeft={<User size={16} />}
          error={errors.name?.message}
          {...register('name')}
        />
        {errors.name && (
          <span
            className="pl-1 font-mono animate-in fade-in slide-in-from-top-1 duration-200"
            style={{ color: '#ff00ff', fontSize: '11px' }}
            role="alert"
          >
            {errors.name.message}
          </span>
        )}
      </div>

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

      {/* ── Campo Password con indicador de fuerza ── */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <CyberInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            iconLeft={<Lock size={16} />}
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
        {passwordValue.length > 0 && <PasswordStrength password={passwordValue} />}
      </div>

      {/* ── Campo Confirmar Password ── */}
      <div className="flex flex-col gap-1">
        <CyberInput
          label="Confirmar Password"
          type={showConfirm ? 'text' : 'password'}
          autoComplete="new-password"
          iconLeft={<Lock size={16} />}
          error={errors.confirm?.message}
          iconRight={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
              className="text-[#444444] transition-colors hover:text-[#00ffff] focus-visible:outline-none"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          {...register('confirm')}
        />
        {errors.confirm && (
          <span
            className="pl-1 font-mono animate-in fade-in slide-in-from-top-1 duration-200"
            style={{ color: '#ff00ff', fontSize: '11px' }}
            role="alert"
          >
            {errors.confirm.message}
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
        {isLoading ? 'Creando cuenta...' : 'Crear cuenta →'}
      </CyberButton>
    </form>
  );
}
