/**
 * api.ts
 * Cliente HTTP para comunicarse con el backend de AWOS.
 * Maneja autenticación, headers y errores de forma centralizada.
 */

// URL base del backend — cambiar según el entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// ─── Tipos de respuesta del backend ───────────────────────────────────────────

export interface ApiError {
  error: string
  details?: Record<string, string[]>
}

export interface RegisterResponse {
  message: string
  data: {
    user: {
      id: string
      name: string
      email: string
      createdAt: string
    }
    token: string
  }
}

export interface LoginResponse {
  data: {
    token: string
    user: {
      id: string
      name: string
      email: string
    }
  }
}

// ─── Helper para hacer requests ───────────────────────────────────────────────

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  // Obtener token del localStorage si existe
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  // Agregar Authorization header si hay token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json()

  // Si la respuesta no es exitosa, lanzar error con el mensaje del backend
  if (!response.ok) {
    throw data as ApiError
  }

  return data as T
}

// ─── Funciones de autenticación ───────────────────────────────────────────────

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

/**
 * Registra un nuevo usuario en el sistema
 */
export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const response = await fetchAPI<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  // Guardar token en localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }

  return response
}

/**
 * Inicia sesión con credenciales existentes
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  const response = await fetchAPI<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  // Guardar token en localStorage
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }

  return response
}

/**
 * Cierra sesión eliminando el token del localStorage
 */
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

/**
 * Obtiene el usuario actual del localStorage
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null

  const userStr = localStorage.getItem('user')
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('token')
}
