/**
 * Proxy API interno para evitar CORS desde el navegador.
 * El frontend llama a /api/* y este handler reenvia al backend real.
 */

const BACKEND_BASE_URL =
  process.env.API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '')

// El prefijo que el backend espera — NO incluir si la API_URL ya lo tiene
const BACKEND_API_PREFIX = '/api/v1'

const BACKEND_TIMEOUT_MS = 15000

function getClientIp(headers: Headers): string | null {
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) return xForwardedFor

  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  const vercelForwardedFor = headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) return vercelForwardedFor

  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  return null
}

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

function normalizePathSegments(pathSegments: string[]): string[] {
  const cleaned = pathSegments
    .map((segment) => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)

  if (cleaned.length >= 2 && cleaned[0] === 'api' && cleaned[1] === 'v1') {
    return cleaned.slice(2)
  }

  if (cleaned.length >= 1 && cleaned[0] === 'api') {
    return cleaned.slice(1)
  }

  return cleaned
}

function buildTargetUrl(pathSegments: string[], request: Request): string {
  const baseUrl = new URL(getBackendBaseUrl())
  const basePath = baseUrl.pathname.replace(/\/+$/, '')
  const normalizedPrefix = BACKEND_API_PREFIX.replace(/\/+$/, '')
  const shouldAppendPrefix = !basePath.endsWith(normalizedPrefix)
  const normalizedSegments = normalizePathSegments(pathSegments)

  const finalPath = [
    basePath,
    shouldAppendPrefix ? normalizedPrefix : '',
    normalizedSegments.join('/'),
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

    const outgoingHeaders = new Headers()

    // Reenviar solo headers relevantes para evitar que el backend procese
    // metadata de navegador (origin/referer/sec-*) en una llamada server-to-server.
    const passthroughHeaders = ['accept', 'content-type', 'authorization']
    passthroughHeaders.forEach((headerName) => {
      const value = request.headers.get(headerName)
      if (value) {
        outgoingHeaders.set(headerName, value)
      }
    })
    // Forzar respuesta sin compresión: el proxy lee el body como texto,
    // si el backend comprime (gzip/br) y reenvía el content-length comprimido
    // el cliente recibe JSON truncado.
    outgoingHeaders.set('accept-encoding', 'identity')

    const clientIp = getClientIp(request.headers)
    if (clientIp) {
      outgoingHeaders.set('x-forwarded-for', clientIp)
      outgoingHeaders.set('x-real-ip', clientIp.split(',')[0].trim())
    }

    const incomingUrl = new URL(request.url)
    outgoingHeaders.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''))

    const method = request.method.toUpperCase()
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), BACKEND_TIMEOUT_MS)

    // Leer el body completo antes de reenviarlo.
    // request.body como ReadableStream puede fallar en Vercel con duplex:half,
    // así que lo consumimos primero y lo pasamos como Buffer.
    let bodyBuffer: ArrayBuffer | undefined
    if (hasBody) {
      try {
        bodyBuffer = await request.arrayBuffer()
      } catch {
        bodyBuffer = undefined
      }
    }

    try {
      const backendResponse = await fetch(targetUrl, {
        method,
        headers: outgoingHeaders,
        body: hasBody && bodyBuffer && bodyBuffer.byteLength > 0
          ? bodyBuffer
          : undefined,
        redirect: 'manual',
        signal: abortController.signal,
      })

      // Construir headers de respuesta limpiando los de encoding
      // para evitar que el cliente intente decodificar Brotli/gzip dos veces
      const responseHeaders = new Headers(backendResponse.headers)
      responseHeaders.delete('content-encoding')
      responseHeaders.delete('transfer-encoding')
      // Eliminar content-length del backend: corresponde al tamaño comprimido.
      // El cliente calculará el tamaño real del body descomprimido.
      responseHeaders.delete('content-length')

      // Leer el body como texto y re-enviarlo para evitar problemas de streaming
      const responseBody = await backendResponse.text()

      return new Response(responseBody, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
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
