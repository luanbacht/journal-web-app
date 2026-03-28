"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 md:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="journal-paper journal-grain rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <p className="hand-accent text-sm text-[var(--gold-soft)]">
            Welcome back to your quiet corner
          </p>
          <h1 className="serif-display mt-4 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl md:text-6xl">
            Đăng nhập
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Mở lại không gian riêng của bạn, nơi những dòng chữ được giữ ấm và ở yên
            cho đến khi bạn sẵn sàng viết tiếp.
          </p>

          <div className="mt-10 rounded-[28px] bg-[rgba(255,251,245,0.72)] px-6 py-6">
            <p className="serif-display text-3xl font-medium text-[#3c342d]">
              “Write gently, even when your thoughts arrive in a rush.”
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Chỉ cần vài phút thật lòng với chính mình cũng đủ để một ngày dịu lại.
            </p>
          </div>
        </section>

        <section className="journal-paper rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Sign in
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              Tiếp tục hành trình viết của bạn
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Dùng email và mật khẩu bạn đã đăng ký để quay lại với journal của mình.
            </p>

            <form onSubmit={handleSignIn} className="mt-8 space-y-5">
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

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#5f554b]"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="accent-button w-full rounded-full px-5 py-3 text-sm font-medium transition"
              >
                Đăng nhập
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-[18px] bg-[rgba(183,158,116,0.12)] px-4 py-3 text-sm leading-6 text-[#7b6550]">
                {message}
              </p>
            ) : null}

            <p className="mt-6 text-sm text-[var(--muted)]">
              Chưa có tài khoản?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-[var(--accent-ink)] underline decoration-[rgba(111,133,117,0.3)] underline-offset-4"
              >
                Tạo tài khoản mới
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
