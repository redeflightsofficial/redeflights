"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteShell } from "@/components/SiteShell";
import { ArrowLeft, KeyRound, LoaderCircle, Mail, ShieldCheck } from "lucide-react";

const LOGIN_PLANE_IMAGE =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as {
        error?: string;
        message?: string;
        emailPayload?: {
          access_key: string;
          subject: string;
          from_name: string;
          name: string;
          email: string;
          message: string;
          botcheck: string;
        };
      };

      if (!response.ok) {
        setError(result.error || "Failed to send OTP.");
        return false;
      }

      if (result.emailPayload) {
        const { sendOtpEmailFromBrowser } = await import("@/lib/web3forms");
        try {
          await sendOtpEmailFromBrowser(result.emailPayload);
        } catch (sendError) {
          setError(
            sendError instanceof Error
              ? sendError.message
              : "OTP was created but email could not be sent. Please try again.",
          );
          return false;
        }
      }

      setMessage(result.message || "OTP sent to your admin email.");
      setStep("otp");
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp(event: React.FormEvent) {
    event.preventDefault();
    await requestOtp();
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error || "Invalid OTP.");
        return;
      }

      router.push("/dashboard/enquiries");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="bg-[#f8fafc] py-10 md:py-14">
        <div className="mx-auto max-w-[1100px] px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(4,36,72,0.1)]"
          >
            <div className="grid min-h-[520px] lg:grid-cols-2">
              {/* Left — plane image */}
              <div className="relative min-h-[240px] lg:min-h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOGIN_PLANE_IMAGE}
                  alt="Airplane wing view"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#042448]/88 via-[#0b2f57]/72 to-[#042448]/55" />
                <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <BrandLogo variant="hero" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ffb3b8]">
                      Admin Portal
                    </p>
                    <h1 className="mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                      Secure access to your dashboard
                    </h1>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">
                      Sign in with OTP to manage customer enquiries and travel requests.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right — login form */}
              <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff5f6] text-[#e30613]">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e30613]">
                        Admin Login
                      </p>
                      <h2 className="text-xl font-extrabold text-[#0b2f57]">
                        {step === "email" ? "Sign in with Email" : "Enter OTP"}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-2">
                  <span
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                      step === "email" ? "bg-[#fff5f6] text-[#e30613]" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </span>
                  <span className="h-px w-5 bg-slate-200" />
                  <span
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                      step === "otp" ? "bg-[#fff5f6] text-[#e30613]" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    OTP
                  </span>
                </div>

                <p className="mb-5 text-sm text-slate-500">
                  {step === "email"
                    ? "Enter your authorized admin email to receive a one-time password."
                    : `We sent a 6-digit code to ${email}. Check inbox and spam.`}
                </p>

                {step === "email" ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Admin Email
                      </span>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="yesr01164@gmail.com"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-3 pl-11 pr-4 text-sm font-semibold text-[#0b2f57] outline-none transition focus:border-[#e30613] focus:bg-white"
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-premium flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#e30613] text-sm font-semibold text-white hover:bg-[#c40010] disabled:opacity-70"
                    >
                      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                      Send OTP
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        6-Digit OTP
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        autoFocus
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-[#0b2f57] outline-none transition focus:border-[#e30613] focus:bg-white"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="btn-premium flex min-h-[48px] w-full items-center justify-center gap-2 bg-[#e30613] text-sm font-semibold text-white hover:bg-[#c40010] disabled:opacity-70"
                    >
                      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                      Verify & Login
                    </button>

                    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setError(null);
                          setMessage(null);
                        }}
                        className="text-sm font-semibold text-[#0b2f57] transition hover:text-[#e30613]"
                      >
                        Change email
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => requestOtp()}
                        className="text-sm font-semibold text-[#e30613] transition hover:underline disabled:opacity-60"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}

                {message ? (
                  <p className="mt-4 rounded-xl bg-[#ecfdf3] px-4 py-3 text-sm font-medium text-[#166534]">
                    {message}
                  </p>
                ) : null}
                {error ? (
                  <p className="mt-4 rounded-xl bg-[#fff5f6] px-4 py-3 text-sm font-medium text-[#e30613]">
                    {error}
                  </p>
                ) : null}

                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0b2f57] transition hover:text-[#e30613]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to website
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </SiteShell>
  );
}
