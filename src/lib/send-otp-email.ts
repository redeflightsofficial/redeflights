/**
 * OTP email via Web3Forms only.
 * Access key must be created at https://web3forms.com with ADMIN_EMAIL
 * so OTP arrives in that inbox.
 */
export async function sendOtpEmail(to: string, otp: string) {
  const recipient = to.trim().toLowerCase();
  const accessKey = (
    process.env.WEB3FORMS_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
    ""
  ).trim();

  if (!accessKey) {
    throw new Error(
      "WEB3FORMS_ACCESS_KEY missing. Create a key at https://web3forms.com using ADMIN_EMAIL.",
    );
  }

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: "REDE I FLIGHTS Admin Login OTP",
      from_name: "REDE I FLIGHTS",
      name: "Admin Login",
      email: recipient,
      message: `Your admin login OTP is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, ignore this email.`,
      botcheck: "",
    }),
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

  return recipient;
}
