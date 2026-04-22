/**
 * api.ts
 * Cliente HTTP para comunicarse con el backend de AWOS.
 *
 * En producción usa el proxy interno de Next.js (/api/*) para evitar CORS.
 * El proxy reenvía las peticiones al backend real configurado en API_URL.
 * En desarrollo apunta directamente al backend local.
 */

// En el navegador siempre usamos el proxy interno de Next.js (/api)
// Esto evita problemas de CORS porque la petición sale del mismo origen
const API_BASE_URL = '/api'

// ─── Tipos de respuesta del backend ───────────────────────────────────────────

export interface ApiError {
  error: string
  details?: Record<string, string[]>
  status?: number
  retryAfter?: number
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
  const url = `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`

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

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  // Si la respuesta no es exitosa, lanzar error con el mensaje del backend
  if (!response.ok) {
    const apiError: ApiError =
      typeof data === 'object' && data !== null && 'error' in data
        ? (data as ApiError)
        : { error: typeof data === 'string' ? data : `Request failed (${response.status})` }

    apiError.status = response.status

    const retryAfter = response.headers.get('retry-after')
    if (retryAfter) {
      const retryAfterSeconds = Number(retryAfter)
      if (!Number.isNaN(retryAfterSeconds)) {
        apiError.retryAfter = retryAfterSeconds
      }
    }

    throw apiError
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
