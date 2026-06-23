/**
 * Health Check
 * GET /api/health
 *
 * Used by the Docker HEALTHCHECK and Fly.io's HTTP health checks. Returns
 * immediately with no upstream Mojaz dependency, so it reflects whether
 * this app itself is up - not whether the upstream API is reachable.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
