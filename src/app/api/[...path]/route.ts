/**
 * Proxy API interno para evitar CORS desde el navegador.
 * El frontend llama a /api/* y este handler reenvia al backend real.
 */

const BACKEND_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

const BACKEND_API_PREFIX = '/api/v1'

const BACKEND_TIMEOUT_MS = 15000

function getBackendBaseUrl(): string {
  const baseUrl = BACKEND_BASE_URL.trim()

  if (!baseUrl) {
    throw new Error('Backend URL no configurada para este entorno')
  }

  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    throw new Error('Backend URL invalida para produccion')
  }

  return baseUrl
}

function buildTargetUrl(pathSegments: string[], request: Request): string {
  const baseUrl = new URL(getBackendBaseUrl())
  const basePath = baseUrl.pathname.replace(/\/+$/, '')
  const normalizedPrefix = BACKEND_API_PREFIX.replace(/\/+$/, '')
  const shouldAppendPrefix = !basePath.endsWith(normalizedPrefix)

  const finalPath = [
    basePath,
    shouldAppendPrefix ? normalizedPrefix : '',
    pathSegments.join('/'),
  ]
    .filter(Boolean)
    .join('/')
    .replace(/\/+/g, '/')

  baseUrl.pathname = finalPath.startsWith('/') ? finalPath : `/${finalPath}`
  const target = baseUrl
  const incomingUrl = new URL(request.url)

  // Conserva query params (?a=1&b=2)
  target.search = incomingUrl.search
  return target.toString()
}

async function proxyRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  let targetUrl = ''

  try {
    const { path } = await context.params
    targetUrl = buildTargetUrl(path, request)

    const outgoingHeaders = new Headers(request.headers)
    outgoingHeaders.delete('host')
    outgoingHeaders.delete('content-length')

    const method = request.method.toUpperCase()
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), BACKEND_TIMEOUT_MS)

    try {
      const backendResponse = await fetch(targetUrl, {
        method,
        headers: outgoingHeaders,
        body: hasBody ? request.body : undefined,
        redirect: 'manual',
        duplex: hasBody ? 'half' : undefined,
        signal: abortController.signal,
      } as RequestInit & { duplex?: 'half' })

      return new Response(backendResponse.body, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: backendResponse.headers,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    let status = 502
    let message = 'No se pudo conectar con el backend'
    let code: string | undefined

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        status = 504
        message = 'El backend no respondió a tiempo'
      } else if (
        error.message.includes('Backend URL no configurada') ||
        error.message.includes('Backend URL invalida para produccion')
      ) {
        status = 500
        message = error.message
      }

      const cause = (error as Error & { cause?: { code?: string } }).cause
      if (cause?.code) {
        code = cause.code
      }
    }

    return Response.json(
      {
        error: message,
        code,
        target: targetUrl || undefined,
      },
      { status }
    )
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  return proxyRequest(request, context)
}
