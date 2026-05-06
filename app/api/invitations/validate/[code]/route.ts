import { proxyToBackend } from "@/lib/api/backend-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return proxyToBackend(request, `/invitations/validate/${code}`);
}
