import { NextResponse } from 'next/server';

/**
 * CSP report-only violations are POSTed here by the browser. Swallow them —
 * the policy is deliberately non-blocking during rollout.
 */
export async function POST() {
  return new NextResponse(null, { status: 204 });
}
