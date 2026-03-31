"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const HIDDEN_ROUTES = ["/sign-in", "/sign-up", "/forgot-password"];

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  journals: "Nhật ký",
  new: "Viết mới",
  edit: "Chỉnh sửa",
  auth: "Xác thực",
};

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M11.75 4.75L6.5 10L11.75 15.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.75 8.5L10 4.25L15.25 8.5V14.25C15.25 14.6642 14.9142 15 14.5 15H11.75V11.75H8.25V15H5.5C5.08579 15 4.75 14.6642 4.75 14.25V8.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M8.25 4.75L13.5 10L8.25 15.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function prettifySegment(segment: string) {
  if (SEGMENT_LABELS[segment]) {
    return SEGMENT_LABELS[segment];
  }

  if (/^[0-9a-f-]{8,}$/i.test(segment)) {
    return "Chi tiết";
  }

  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function BreadcrumbNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (!pathname || HIDDEN_ROUTES.includes(pathname)) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const pathItems = segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: prettifySegment(segment),
  }));

  const items =
    pathname === "/dashboard"
      ? [{ href: "/dashboard", label: "Dashboard", isLast: true }]
      : [
          { href: "/dashboard", label: "Dashboard", isLast: false },
          ...pathItems.map((item, index) => ({
            ...item,
            isLast: index === pathItems.length - 1,
          })),
        ];

  return (
    <div className="breadcrumb-rail">
      <div className="breadcrumb-shell">
        <div className="breadcrumb-toolbar">
          <div className="breadcrumb-controls" aria-label="Điều hướng nhanh">
            <button
              type="button"
              className="breadcrumb-control"
              aria-label="Quay lại"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon />
            </button>
            <Link href="/dashboard" className="breadcrumb-control" aria-label="Về dashboard">
              <HomeIcon />
            </Link>
            <button
              type="button"
              className="breadcrumb-control"
              aria-label="Tiến tới"
              onClick={() => router.forward()}
            >
              <ArrowRightIcon />
            </button>
          </div>

          <nav className="breadcrumb-nav" aria-label="Điều hướng trang">
            <div className="breadcrumb-trail">
              {items.map((item, index) => (
                <div key={item.href} className="breadcrumb-item">
                  {index > 0 ? <span className="breadcrumb-separator">/</span> : null}
                  {item.isLast ? (
                    <span className="breadcrumb-pill breadcrumb-pill-active">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="breadcrumb-pill">
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
