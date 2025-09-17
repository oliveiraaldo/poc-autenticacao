import { NextResponse } from "next/server";

export async function GET() {
  const CAS_BASE_URL = process.env.CAS_BASE_URL!;
  const SERVICE_URL = process.env.SERVICE_URL!;
  const url = `${CAS_BASE_URL}/login?service=${encodeURIComponent(SERVICE_URL)}`;
  return NextResponse.redirect(url);
}
