import { proxyToBackend } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  return proxyToBackend(request, `/invitations/validate/${params.code}`);
}
