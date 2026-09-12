export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "EMAIL_UNVERIFIED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "NO_ORGANIZATION"
  | "FORBIDDEN"
  | "NOT_FOUND";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: ApiErrorCode,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiErrorBody = {
  error?: string;
  code?: ApiErrorCode;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });

  const body = (await response.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      typeof body.error === "string" ? body.error : "Request failed.",
      body.code,
    );
  }

  return body as T;
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
