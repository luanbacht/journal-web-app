"use client";

import { useRouter } from "next/navigation";

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.75 4.5 6.25 10l5.5 5.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8.25 4.5 5.5 5.5-5.5 5.5" />
    </svg>
  );
}

export default function HistoryNav() {
  const router = useRouter();

  return (
    <div className="fixed left-4 top-4 z-40 sm:left-6 sm:top-6">
      <div className="toolbar-pill flex items-center overflow-hidden rounded-full p-1.5">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Lùi"
          title="Lùi"
          className="history-nav-button"
        >
          <ChevronLeftIcon />
          <span className="sr-only">Lùi</span>
        </button>
        <div className="h-7 w-px bg-[rgba(111,133,117,0.14)]" />
        <button
          type="button"
          onClick={() => router.forward()}
          aria-label="Tiến"
          title="Tiến"
          className="history-nav-button"
        >
          <ChevronRightIcon />
          <span className="sr-only">Tiến</span>
        </button>
      </div>
    </div>
  );
}
