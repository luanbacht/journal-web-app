"use client";

import { useRouter } from "next/navigation";

export default function HistoryNav() {
  const router = useRouter();

  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2 sm:left-6 sm:top-6">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Lùi"
        title="Lùi"
        className="toolbar-pill flex h-11 w-11 items-center justify-center rounded-full text-lg font-medium text-[#5a5148] transition hover:-translate-y-0.5 hover:bg-[rgba(255,251,245,0.96)]"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => router.forward()}
        aria-label="Tiến"
        title="Tiến"
        className="toolbar-pill flex h-11 w-11 items-center justify-center rounded-full text-lg font-medium text-[#5a5148] transition hover:-translate-y-0.5 hover:bg-[rgba(255,251,245,0.96)]"
      >
        →
      </button>
    </div>
  );
}
