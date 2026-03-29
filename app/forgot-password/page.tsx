"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "request" | "verify" | "done";
type MessageTone = "success" | "error" | "info";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<MessageTone>("info");
  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);

  const messageClass =
    messageTone === "success"
      ? "bg-[rgba(111,133,117,0.12)] text-[#587061]"
      : messageTone === "error"
        ? "bg-[rgba(173,95,79,0.12)] text-[#8d5a4e]"
        : "bg-[rgba(183,158,116,0.12)] text-[#7b6550]";

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setMessageTone("error");
        setMessage(error.message);
        return;
      }

      setMessageTone("success");
      setMessage(
        "Mình đã gửi mã xác minh về email của bạn rồi. Hãy nhập mã OTP trong email và đặt lại mật khẩu mới nhé.",
      );
      setStep("verify");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "recovery",
      });

      if (verifyError) {
        setMessageTone("error");
        setMessage("Mã OTP chưa đúng hoặc đã hết hạn. Bạn thử lại giúp mình nhé.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setMessageTone("error");
        setMessage(updateError.message);
        return;
      }

      await supabase.auth.signOut();
      setMessageTone("success");
      setMessage(
        "Mật khẩu mới đã được lưu. Bạn có thể dùng mật khẩu này để đăng nhập lại rồi.",
      );
      setStep("done");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 md:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="journal-paper journal-grain rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <p className="hand-accent text-sm text-[var(--gold-soft)]">
            A gentle way back into your pages
          </p>
          <h1 className="serif-display mt-4 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl md:text-6xl">
            Quên mật khẩu
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Nếu bạn lỡ quên mật khẩu, mình sẽ giúp bạn quay lại bằng một mã xác minh
            ngắn gửi qua email.
          </p>

          <div className="mt-10 rounded-[28px] bg-[rgba(255,251,245,0.72)] px-6 py-6">
            <p className="serif-display text-3xl font-medium text-[#3c342d]">
              “A quiet restart can still feel warm.”
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Chỉ cần một mã nhỏ và một mật khẩu mới, góc journal của bạn sẽ mở ra
              lại như cũ.
            </p>
          </div>
        </section>

        <section className="journal-paper rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Password reset
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              Lấy lại quyền truy cập
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {step === "request"
                ? "Nhập email bạn đã đăng ký. Mình sẽ gửi mã OTP để xác minh."
                : step === "verify"
                  ? "Nhập mã OTP vừa nhận được và chọn mật khẩu mới."
                  : "Mọi thứ đã sẵn sàng. Bạn có thể quay lại màn đăng nhập."}
            </p>

            {step === "request" ? (
              <form onSubmit={handleRequestOtp} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#5f554b]"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="accent-button flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isLoading ? (
                    <>
                      <span className="journal-button-spinner" />
                      <span>Đang gửi OTP...</span>
                    </>
                  ) : (
                    "Gửi OTP về email"
                  )}
                </button>
              </form>
            ) : null}

            {step === "verify" ? (
              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-[#5f554b]"
                  >
                    Mã OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="Nhập mã trong email"
                    className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D+/g, "").slice(0, 12))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-[#5f554b]"
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="Đặt một mật khẩu mới"
                    className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="accent-button flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-80"
                >
                  {isLoading ? (
                    <>
                      <span className="journal-button-spinner" />
                      <span>Đang xác minh...</span>
                    </>
                  ) : (
                    "Xác minh OTP và đổi mật khẩu"
                  )}
                </button>
              </form>
            ) : null}

            {step === "done" ? (
              <div className="mt-8 rounded-[24px] bg-[rgba(111,133,117,0.08)] px-5 py-5">
                <p className="text-sm leading-7 text-[#587061]">
                  Bạn đã có thể dùng mật khẩu mới để đăng nhập lại rồi.
                </p>
              </div>
            ) : null}

            {message ? (
              <p className={`mt-4 rounded-[18px] px-4 py-3 text-sm leading-6 ${messageClass}`}>
                {message}
              </p>
            ) : null}

            <p className="mt-6 text-sm text-[var(--muted)]">
              <Link
                href="/sign-in"
                className="font-medium text-[var(--accent-ink)] underline decoration-[rgba(111,133,117,0.3)] underline-offset-4"
              >
                Quay lại đăng nhập
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
