import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/config/endpoints";

export async function proxyToBackend(
  request: Request,
  backendPath: string
): Promise<NextResponse> {
  const url = `${getApiBaseUrl()}${backendPath}`;
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
