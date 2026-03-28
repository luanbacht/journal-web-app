"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setMessage("Hãy chọn cho mình một tên hiển thị trước nhé.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Đăng ký thành công. Hãy mở email để xác thực tài khoản của bạn nhé.");
  };

  return (
    <main className="journal-shell min-h-screen px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-6 md:gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="journal-paper journal-grain rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <p className="hand-accent text-sm text-[var(--gold-soft)]">
            Begin your own gentle archive
          </p>
          <h1 className="serif-display mt-4 text-4xl font-semibold leading-none text-[#2f2924] sm:text-5xl md:text-6xl">
            Tạo tài khoản
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Một nơi nhỏ để cất lại tâm trạng, suy nghĩ và những ngày khó gọi tên.
            Tài khoản của bạn sẽ giữ cho góc viết này luôn là của riêng bạn.
          </p>

          <div className="mt-10 rounded-[28px] bg-[rgba(255,251,245,0.72)] px-6 py-6">
            <p className="serif-display text-3xl font-medium text-[#3c342d]">
              “Keep a page for yourself, even on the busiest days.”
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              Chọn một username bạn thấy thân thuộc, rồi bắt đầu viết theo nhịp của riêng mình.
            </p>
          </div>
        </section>

        <section className="journal-paper rounded-[26px] p-5 sm:p-7 md:rounded-[34px] md:p-10">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Sign up
            </p>
            <h2 className="serif-display mt-3 text-4xl font-semibold text-[#2f2924]">
              Tạo góc journal riêng của bạn
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Điền vài thông tin cơ bản để bắt đầu. Bạn có thể dùng email này để quay lại bất cứ lúc nào.
            </p>

            <form onSubmit={handleSignUp} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#5f554b]"
                >
                  Tên hiển thị
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Ví dụ: luanbacht"
                  className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

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
                  placeholder="Tạo một mật khẩu đủ an toàn"
                  className="w-full rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] px-4 py-3.5 text-[#312c27] outline-none transition focus:border-[var(--accent)] sm:rounded-[22px] sm:py-4"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="accent-button w-full rounded-full px-5 py-3 text-sm font-medium transition"
              >
                Tạo tài khoản
              </button>
            </form>

            {message ? (
              <p className="mt-4 rounded-[18px] bg-[rgba(183,158,116,0.12)] px-4 py-3 text-sm leading-6 text-[#7b6550]">
                {message}
              </p>
            ) : null}

            <p className="mt-6 text-sm text-[var(--muted)]">
              Đã có tài khoản?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-[var(--accent-ink)] underline decoration-[rgba(111,133,117,0.3)] underline-offset-4"
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
