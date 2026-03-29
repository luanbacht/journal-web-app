"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";

type Position = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(min, value), max);
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 7h9" />
      <path d="M5.5 10h9" />
      <path d="M5.5 13h9" />
    </svg>
  );
}

function HomeIcon() {
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
      <path d="M3.5 9.25 10 4l6.5 5.25" />
      <path d="M5.5 8.75v7h9v-7" />
    </svg>
  );
}

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

const HIDDEN_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

export default function HistoryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [position, setPosition] = useState<Position>({ x: 16, y: 16 });
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dock, setDock] = useState<"left" | "right">("left");

  const shouldHide = pathname ? HIDDEN_ROUTES.includes(pathname) : false;

  const setIdle = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      setActive(false);
    }, 1800);
  };

  const wake = () => {
    setActive(true);
    setIdle();
  };

  const snapToEdge = (next: Position) => {
    const width = shellRef.current?.offsetWidth ?? 56;
    const height = shellRef.current?.offsetHeight ?? 56;
    const leftX = 12;
    const rightX = Math.max(12, window.innerWidth - width - 12);
    const centerX = next.x + width / 2;
    const shouldDockRight = centerX > window.innerWidth / 2;

    setDock(shouldDockRight ? "right" : "left");
    setPosition({
      x: shouldDockRight ? rightX : leftX,
      y: clamp(next.y, 12, Math.max(12, window.innerHeight - height - 12)),
    });
  };

  useEffect(() => {
    if (shouldHide) {
      return;
    }

    wake();

    const handleResize = () => {
      const width = shellRef.current?.offsetWidth ?? 56;
      const height = shellRef.current?.offsetHeight ?? 56;

      setPosition((current) => ({
        x: clamp(current.x, 12, Math.max(12, window.innerWidth - width - 12)),
        y: clamp(current.y, 12, Math.max(12, window.innerHeight - height - 12)),
      }));
    };

    const handlePointerDownOutside = (event: PointerEvent) => {
      if (!shellRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointerdown", handlePointerDownOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointerdown", handlePointerDownOutside);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [shouldHide]);

  useEffect(() => {
    if (!dragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const width = shellRef.current?.offsetWidth ?? 56;
      const height = shellRef.current?.offsetHeight ?? 56;

      movedRef.current = true;
      setActive(true);
      setExpanded(false);

      setPosition({
        x: clamp(
          event.clientX - dragOffsetRef.current.x,
          12,
          Math.max(12, window.innerWidth - width - 12),
        ),
        y: clamp(
          event.clientY - dragOffsetRef.current.y,
          12,
          Math.max(12, window.innerHeight - height - 12),
        ),
      });
    };

    const handlePointerUp = () => {
      setDragging(false);
      snapToEdge(position);
      setIdle();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, position]);

  const handleShellPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (target.closest("[data-history-action='true']")) {
      wake();
      return;
    }

    if (!shellRef.current) {
      return;
    }

    const rect = shellRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    movedRef.current = false;
    setDragging(true);
    setActive(true);
    shellRef.current.setPointerCapture(event.pointerId);
  };

  const toggleExpanded = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }

    setExpanded((current) => !current);
    wake();
  };

  const closeMenu = () => {
    setExpanded(false);
    wake();
  };

  if (shouldHide) {
    return null;
  }

  return (
    <div
      ref={shellRef}
      className={`history-nav-shell ${
        active || dragging || expanded ? "history-nav-shell-active" : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onPointerDown={handleShellPointerDown}
      onMouseEnter={wake}
      onFocusCapture={wake}
    >
      <div
        className={`toolbar-pill history-nav-container ${
          expanded ? "history-nav-container-expanded" : ""
        } ${
          dock === "right" ? "history-nav-dock-right" : "history-nav-dock-left"
        }`}
      >
        {expanded ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                router.back();
                closeMenu();
              }}
              aria-label="Lùi"
              title="Lùi"
              className="history-nav-button"
              data-history-action="true"
            >
              <ChevronLeftIcon />
              <span className="sr-only">Lùi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/dashboard");
                closeMenu();
              }}
              aria-label="Về dashboard"
              title="Về dashboard"
              className="history-nav-button"
              data-history-action="true"
            >
              <HomeIcon />
              <span className="sr-only">Về dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => {
                router.forward();
                closeMenu();
              }}
              aria-label="Tiến"
              title="Tiến"
              className="history-nav-button"
              data-history-action="true"
            >
              <ChevronRightIcon />
              <span className="sr-only">Tiến</span>
            </button>
            <div className="mx-0.5 h-7 w-px bg-[rgba(111,133,117,0.14)]" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={expanded ? "Thu gọn điều hướng" : "Mở điều hướng"}
          title={expanded ? "Thu gọn điều hướng" : "Mở điều hướng"}
          className="history-nav-button"
          data-history-action="true"
        >
          <MenuIcon />
          <span className="sr-only">
            {expanded ? "Thu gọn điều hướng" : "Mở điều hướng"}
          </span>
        </button>
      </div>
    </div>
  );
}
