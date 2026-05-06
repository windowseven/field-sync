import { proxyToBackend } from "@/lib/api/backend-proxy";

export async function POST(request: Request) {
  return proxyToBackend(request, "/auth/forgot-password");
}
