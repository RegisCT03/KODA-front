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
  const backendBaseUrl = getBackendBaseUrl().replace(/\/$/, '')
  const target = new URL(`${BACKEND_API_PREFIX.replace(/^\//, '')}/${pathSegments.join('/')}`, `${backendBaseUrl}/`)
  const incomingUrl = new URL(request.url)

  // Conserva query params (?a=1&b=2)
  target.search = incomingUrl.search
  return target.toString()
}

async function proxyRequest(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  try {
    const { path } = await context.params
    const targetUrl = buildTargetUrl(path, request)

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
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'El backend no respondió a tiempo'
      : 'Backend no configurado o inaccesible'

    return Response.json(
      {
        error: message,
      },
      { status: 504 }
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
