import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/endpoints";

const PROXY_TIMEOUT_MS = 15000;

export async function proxyToBackend(
  request: Request,
  backendPath: string
): Promise<NextResponse> {
  const url = `${getApiBaseUrl()}${backendPath}`;
  const method = request.method;
  const contentType = request.headers.get("content-type");
  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBody = hasBody ? await request.text() : undefined;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(contentType ? { "Content-Type": contentType } : {}),
        Accept: "application/json",
      },
      body: rawBody,
      cache: "no-store",
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout =
      error instanceof DOMException && error.name === "TimeoutError";

    return NextResponse.json(
      {
        status: "error",
        message: isTimeout
          ? "Backend request timed out. Please try again."
          : "Could not reach the backend service. Please check API configuration.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
