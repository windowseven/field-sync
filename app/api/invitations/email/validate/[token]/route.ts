import { proxyToBackend } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return proxyToBackend(request, `/invitations/email/validate/${token}`);
}
