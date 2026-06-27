import { NextResponse } from "next/server";
import { ApiError } from "./errors";

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const label = error instanceof Error ? error.name : typeof error;
  console.error(`[API Error] ${label}`);
  return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
}

