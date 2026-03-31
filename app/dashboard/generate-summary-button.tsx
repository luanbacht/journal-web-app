"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { generateWeeklySummary } from "@/app/dashboard/actions";

const initialState = {
  error: "",
  success: "",
  hint: "",
};

type Props = {
  hasGroqKey: boolean;
  latestSummaryCreatedAt?: string;
};

const CLIENT_COOLDOWN_MS = 90 * 1000;

function formatSeconds(value: number) {
  return `${Math.max(0, value)} giây`;
}

async function actionState(_: typeof initialState, formData: FormData) {
  try {
    const result = await generateWeeklySummary(formData);

    if (result?.provider === "groq") {
      return {
        error: "",
        success: "Tổng hợp tuần đã được tạo xong. Đang dùng Groq.",
        hint: "",
      };
    }

    if (result?.preferredProvider === "groq") {
      return {
        error: "",
        success: "Tổng hợp tuần đã được tạo xong. Đang chuyển sang chế độ miễn phí.",
        hint: result?.fallbackReason ?? "",
      };
    }

    return {
      error: "",
      success: "Tổng hợp tuần đã được tạo xong. Đang dùng chế độ miễn phí.",
      hint: result?.fallbackReason ?? "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo tổng hợp tuần lúc này.";

    return {
      error: message,
      success: "",
      hint: "",
    };
  }
}

export default function GenerateSummaryButton({
  hasGroqKey,
  latestSummaryCreatedAt,
}: Props) {
  const [state, formAction, isPending] = useActionState(actionState, initialState);
  const [provider, setProvider] = useState<"groq" | "rule-based">(
    hasGroqKey ? "groq" : "rule-based",
  );
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(() => {
    if (!latestSummaryCreatedAt) {
      return null;
    }

    const createdAt = new Date(latestSummaryCreatedAt).getTime();
    const nextAvailable = createdAt + CLIENT_COOLDOWN_MS;

    return nextAvailable > Date.now() ? nextAvailable : null;
  });
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) {
      setRemainingSeconds(0);
      return;
    }

    const tick = () => {
      const next = Math.ceil((cooldownUntil - Date.now()) / 1000);

      if (next <= 0) {
        setCooldownUntil(null);
        setRemainingSeconds(0);
        return;
      }

      setRemainingSeconds(next);
    };

    tick();
    const timer = window.setInterval(tick, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  useEffect(() => {
    if (state.success) {
      setCooldownUntil(Date.now() + CLIENT_COOLDOWN_MS);
    }
  }, [state.success]);

  const isCoolingDown = useMemo(
    () => cooldownUntil !== null && remainingSeconds > 0,
    [cooldownUntil, remainingSeconds],
  );

  const isGroqDisabled = !hasGroqKey;

  return (
    <form action={formAction} className="mt-5">
      <div className="rounded-[22px] bg-[rgba(255,251,245,0.74)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Cách tạo tổng hợp tuần
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-[#4f463f]">
            <input
              type="radio"
              name="provider"
              value="rule-based"
              checked={provider === "rule-based"}
              onChange={() => setProvider("rule-based")}
              className="h-4 w-4 accent-[#7a8c73]"
            />
            Dùng miễn phí
          </label>

          <label
            className={`flex items-center gap-2 text-sm ${isGroqDisabled ? "text-[#b1a79a]" : "text-[#4f463f]"}`}
          >
            <input
              type="radio"
              name="provider"
              value="groq"
              checked={provider === "groq"}
              onChange={() => setProvider("groq")}
              disabled={isGroqDisabled}
              className="h-4 w-4 accent-[#7a8c73]"
            />
            Dùng Groq
          </label>
        </div>

        {!hasGroqKey ? (
          <p className="mt-3 text-xs leading-6 text-[#8a5e48]">
            Chưa có GROQ_API_KEY, nên lúc này chỉ dùng được chế độ miễn phí.
          </p>
        ) : null}

        {isCoolingDown ? (
          <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
            Cooldown đang bật. Bạn có thể tạo lại tổng hợp sau {formatSeconds(remainingSeconds)}.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending || isCoolingDown}
        className="accent-button mt-4 rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending
          ? "Đang tạo tổng hợp..."
          : isCoolingDown
            ? `Chờ ${formatSeconds(remainingSeconds)}`
            : "Tạo tổng hợp tuần"}
      </button>

      {state.error ? (
        <p className="mt-3 text-sm leading-6 text-[#8a5e48]">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="mt-3 text-sm leading-6 text-[#61725d]">{state.success}</p>
      ) : null}

      {state.hint ? (
        <p className="mt-2 text-xs leading-6 text-[#8a5e48]">Lý do: {state.hint}</p>
      ) : null}

      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
        Nếu bạn đã thêm <span className="font-medium">GROQ_API_KEY</span>, app sẽ ưu tiên
        dùng Groq để tạo tổng hợp tuần. Nếu chưa có key hoặc Groq tạm lỗi, app vẫn sẽ tự
        chuyển sang chế độ miễn phí theo rule-based.
      </p>
    </form>
  );
}
