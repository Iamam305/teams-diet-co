import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/lib/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: ApiErrorCode,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error ? error.message : "Something went wrong.";
  const status =
    message === "You do not have permission to do that." ? 403 : 400;

  return NextResponse.json({ error: message }, { status });
}

export async function handleRoute(fn: () => Promise<unknown>) {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
