import { proxyToBackend } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  return proxyToBackend(request, `/invitations/email/validate/${params.token}`);
}
