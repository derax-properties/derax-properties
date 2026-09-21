import { NextResponse } from "next/server";
import { getPopulationForZip } from "@/lib/population";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = (searchParams.get("zip") ?? "").trim();

  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Invalid ZIP." }, { status: 400 });
  }

  const result = await getPopulationForZip(zip);
  return NextResponse.json(result);
}
