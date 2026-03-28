"use client";

import { useActionState } from "react";
import { generateWeeklySummary } from "@/app/dashboard/actions";

const initialState = {
  error: "",
  success: "",
};

async function actionState(_: typeof initialState) {
  try {
    await generateWeeklySummary();

    return {
      error: "",
      success: "AI weekly summary đã được tạo xong rồi.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể tạo AI summary lúc này.";

    return {
      error: message,
      success: "",
    };
  }
}

export default function GenerateSummaryButton() {
  const [state, formAction, isPending] = useActionState(actionState, initialState);

  return (
    <form action={formAction} className="mt-5">
      <button
        type="submit"
        disabled={isPending}
        className="accent-button rounded-full px-5 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Đang tạo summary..." : "Tạo weekly summary"}
      </button>

      {state.error ? (
        <p className="mt-3 text-sm leading-6 text-[#8a5e48]">{state.error}</p>
      ) : null}

      {state.success ? (
        <p className="mt-3 text-sm leading-6 text-[#61725d]">{state.success}</p>
      ) : null}

      <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
        Bản này đang dùng summary giả lập theo dữ liệu journal trong tuần, chưa cần API key.
      </p>
    </form>
  );
}
