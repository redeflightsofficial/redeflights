import { CONTACT_PHONE, WHATSAPP_URL } from "@/lib/contact";
import type { ContactFormPayload } from "@/types/enquiry";

export function buildEnquiryWhatsAppMessage(payload: ContactFormPayload) {
  return [
    "New Contact Enquiry - REDE I FLIGHTS",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Service: ${payload.service}`,
    `Message: ${payload.message || "N/A"}`,
  ].join("\n");
}

export function buildEnquiryWhatsAppUrl(payload: ContactFormPayload) {
  const text = encodeURIComponent(buildEnquiryWhatsAppMessage(payload));
  return `${WHATSAPP_URL}?text=${text}`;
}

export function normalizeContactPayload(body: Partial<ContactFormPayload>) {
  const name = body.name?.trim() || "";
  const phone = body.phone?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";
  const service = body.service?.trim() || "General";
  const message = body.message?.trim() || "";

  if (!name || !phone || !email) {
    return { error: "Name, phone and email are required." as const };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { error: "Please enter a valid email address." as const };
  }

  return {
    data: { name, phone, email, service, message } satisfies ContactFormPayload,
  };
}

export { CONTACT_PHONE };
