import { getApiBaseUrl } from "@/lib/config/endpoints";

const BASE_URL = getApiBaseUrl();

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactForm(data: ContactFormData) {
  const response = await fetch(`${BASE_URL}/contact/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to send message" }));
    throw new Error(error.message || "Failed to send message");
  }

  return response.json();
}
