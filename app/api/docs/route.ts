import { NextResponse } from "next/server";
import { generateOpenApiSpec } from "@/lib/docs/openapi";

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(generateOpenApiSpec());
}

