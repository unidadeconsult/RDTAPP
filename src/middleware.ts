import { NextResponse, type NextRequest } from "next/server";

/**
 * Bloqueia o acesso a todo o site com HTTP Basic Auth.
 * As credenciais vêm de variáveis de ambiente — nunca ficam no código.
 * Sem SITE_AUTH_USER/SITE_AUTH_PASSWORD configuradas, o acesso falha fechado
 * (ninguém entra) em vez de abrir o site por descuido de configuração.
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.SITE_AUTH_USER;
  const expectedPassword = process.env.SITE_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new NextResponse(
      "Acesso não configurado: defina SITE_AUTH_USER e SITE_AUTH_PASSWORD nas variáveis de ambiente.",
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    if (user === expectedUser && password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticação necessária.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Kylian+Movic"' },
  });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
