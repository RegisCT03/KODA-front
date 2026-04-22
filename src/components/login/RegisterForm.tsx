'use client';

/**
 * RegisterForm.tsx
 * Formulario de registro con validación Zod + React Hook Form.
 * Conectado al backend de AWOS para registro real de usuarios.
 *
 * Incluye el indicador de fuerza de contraseña (PasswordStrength).
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import { CyberInput } from '@/components/ui/CyberInput';
import { CyberButton } from '@/components/ui/CyberButton';
import { PasswordStrength } from './PasswordStrength';
import { register as registerUser, ApiError } from '@/lib/api';
import { useStore } from '@/lib/store';

// ─── Schema Zod ───────────────────────────────────────────────────────────────

/**
 * Validación del formulario de registro.
 * El refine verifica que password y confirm coincidan.
 * Las reglas de password deben coincidir con el backend.
 */
const registerSchema = z
  .object({
    name:     z.string().min(2, 'Mínimo 2 caracteres'),
    email:    z.string().email('Email inválido'),
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();

  // Estado para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword]  = useState(false);
  const [showConfirm,  setShowConfirm]   = useState(false);

  // Estado de carga durante el submit
  const [isLoading, setIsLoading] = useState(false);

  // Configuración de React Hook Form con resolver Zod
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // Observa el campo password para el indicador de fuerza
  const passwordValue = watch('password', '');

  // ── Handler de submit ──────────────────────────────────────────────────────

  async function onSubmit(data: RegisterFormValues) {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Llamar al backend para registrar usuario
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Registro exitoso — actualizar store y redirigir
      useStore.setState({
        user: response.data.user,
        isAuthenticated: true,
      });

      toast.success(`¡Cuenta creada! Bienvenido ${response.data.user.name} 🚀`);
      router.push('/test');
    } catch (error) {
      // Manejar errores del backend
      const apiError = error as ApiError;

      if (apiError.details) {
        // Errores de validación (400)
        Object.entries(apiError.details).forEach(([field, messages]) => {
          setError(field as keyof RegisterFormValues, {
            message: messages[0],
          });
        });
        toast.error('Por favor corrige los errores');
      } else if (apiError.error === 'Email already registered') {
        // Email duplicado (409)
        setError('email', { message: 'Este email ya está registrado' });
        toast.error('Este email ya está registrado');
      } else if (apiError.status === 429 || apiError.error === 'Demasiados intentos. Intenta en 15 minutos.') {
        // Rate limit (429)
        const waitSeconds = apiError.retryAfter ?? 60;
        toast.error(`Demasiados intentos. Intenta en ${waitSeconds}s.`);
      } else {
        // Error genérico
        toast.error('Error al crear la cuenta. Intenta de nuevo.');
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
        {/* Mensaje de error Zod — magenta, font-mono, 11px */}
        {errors.name && (
          <span
            className="pl-1 font-mono"
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
        {/* Mensaje de error Zod */}
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

      {/* ── Campo Password con indicador de fuerza ── */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <CyberInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            iconLeft={<Lock size={16} />}
            error={errors.password?.message}
            // Botón de ojo para mostrar/ocultar contraseña
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

        {/* Indicador de fuerza — solo visible cuando hay valor en el campo */}
        {passwordValue.length > 0 && (
          <PasswordStrength password={passwordValue} />
        )}
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
        {/* Mensaje de error Zod — incluye el error de refine */}
        {errors.confirm && (
          <span
            className="pl-1 font-mono"
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
        Crear cuenta →
      </CyberButton>
    </form>
  );
}
