import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTPayload } from "./auth";

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookie = req.cookies.get("token");
  return cookie?.value ?? null;
}

export function requireAuth(req: NextRequest): JWTPayload {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }
  try {
    return verifyToken(token);
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

export function requireAdmin(req: NextRequest): JWTPayload {
  const payload = requireAuth(req);
  if (payload.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return payload;
}

export function requireVoter(req: NextRequest): JWTPayload {
  const payload = requireAuth(req);
  if (payload.role !== "voter") {
    throw new Error("FORBIDDEN");
  }
  return payload;
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof Error) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}