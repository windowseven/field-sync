import { NextResponse } from "next/server";

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export async function proxyToBackend(
  request: Request,
  backendPath: string
): Promise<NextResponse> {
  const url = `${BACKEND_BASE_URL}${backendPath}`;
  const method = request.method;
  const contentType = request.headers.get("content-type");
  const hasBody = method !== "GET" && method !== "HEAD";
  const rawBody = hasBody ? await request.text() : undefined;

  const response = await fetch(url, {
    method,
    headers: {
      ...(contentType ? { "Content-Type": contentType } : {}),
      Accept: "application/json",
    },
    body: rawBody,
    cache: "no-store",
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
