export type OtpEmailPayload = {
  access_key: string;
  subject: string;
  from_name: string;
  name: string;
  email: string;
  message: string;
  botcheck: string;
};

export function buildOtpEmailPayload(otp: string): OtpEmailPayload {
  const accessKey =
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
    process.env.WEB3FORMS_ACCESS_KEY ||
    "";
  const adminEmail = process.env.ADMIN_EMAIL || "yesr01164@gmail.com";

  if (!accessKey) {
    throw new Error("WEB3FORMS_ACCESS_KEY is not configured.");
  }

  return {
    access_key: accessKey,
    subject: "REDE I FLIGHTS Admin Login OTP",
    from_name: "REDE I FLIGHTS",
    name: "Admin Login",
    email: adminEmail,
    message: `Your admin login OTP is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.`,
    botcheck: "",
  };
}

export async function sendOtpEmailFromBrowser(payload: OtpEmailPayload) {
  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    console.error("Web3Forms non-JSON response:", text.slice(0, 200));
    throw new Error("Email service returned an unexpected response. Please try again.");
  }

  const result = (await response.json()) as { success?: boolean; message?: string };

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to send OTP email.");
  }

  return result;
}
