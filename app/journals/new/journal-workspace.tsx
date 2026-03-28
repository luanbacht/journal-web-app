"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import JournalComposer from "@/app/journals/new/journal-composer";

type ThemeMode = "light" | "dark";
type WritingMode = "focus" | "notebook" | "cards";

type Option<T extends string> = {
  value: T;
  label: string;
};

const writingModeOptions: Option<WritingMode>[] = [
  { value: "focus", label: "Tập trung" },
  { value: "notebook", label: "Sổ tay" },
  { value: "cards", label: "Thẻ viết" },
];

const themeOptions: Option<ThemeMode>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  darkMode: boolean;
};

function ToolbarSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  darkMode,
}: SegmentedProps<T>) {
  return (
    <div
      className={`toolbar-pill flex items-center gap-3 rounded-full px-3 py-2 text-sm ${
        darkMode
          ? "border-white/10 bg-[rgba(26,28,27,0.72)] text-neutral-100"
          : "text-[#5d554d]"
      }`}
    >
      <span className={darkMode ? "text-neutral-400" : "text-[var(--muted)]"}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              option.value === value
                ? darkMode
                  ? "bg-[var(--accent-soft)] text-[#2f342f]"
                  : "bg-[var(--accent)] text-[#fcfaf6]"
                : darkMode
                  ? "text-neutral-300 hover:bg-white/8"
                  : "text-[#6e655d] hover:bg-[#f1ebe2]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function JournalWorkspace() {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [writingMode, setWritingMode] = useState<WritingMode>("focus");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [cardWidth, setCardWidth] = useState(82);
  const [cardHeight, setCardHeight] = useState(86);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const shellClasses = useMemo(() => {
    if (themeMode === "dark") {
      return "min-h-screen bg-[linear-gradient(180deg,#121514_0%,#1a1f1d_48%,#111413_100%)] text-[#f6f0e8]";
    }

    return "journal-shell min-h-screen text-[#312c27]";
  }, [themeMode]);

  const shellStyle = backgroundImage
    ? {
        backgroundImage: `${
          themeMode === "dark"
            ? "linear-gradient(rgba(12,16,15,0.52), rgba(12,16,15,0.58)), "
            : "linear-gradient(rgba(250,245,238,0.42), rgba(247,241,232,0.52)), "
        }url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : undefined;

  const panelClasses =
    themeMode === "dark"
      ? "border-white/10 bg-[rgba(22,24,23,0.78)] text-[#f6f0e8] shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      : "journal-paper text-[#312c27]";

  const mutedClasses =
    themeMode === "dark" ? "text-[#d5cec4]" : "text-[var(--muted)]";

  const primaryButton =
    themeMode === "dark"
      ? "border border-white/10 bg-[var(--accent-soft)] text-[#324038] hover:bg-[#dfe8dc]"
      : "accent-button";

  const secondaryButton =
    themeMode === "dark"
      ? "border border-white/10 bg-[rgba(255,255,255,0.04)] text-[#ece4d9] hover:bg-[rgba(255,255,255,0.08)]"
      : "soft-button";

  const focusCardStyle = {
    width: "100%",
    maxWidth: "72rem",
    minHeight: `${cardHeight}vh`,
  };

  const sliderTrackClasses = themeMode === "dark" ? "accent-[#dfe8dc]" : "accent-[var(--accent)]";

  return (
    <div className={shellClasses} style={shellStyle}>
      <div
        className={`sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-xl ${
          themeMode === "dark"
            ? "border-white/8 bg-[rgba(17,20,19,0.72)]"
            : "border-[var(--line)] bg-[rgba(250,245,238,0.76)]"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-stretch gap-3 pb-1 md:flex-nowrap md:items-center md:overflow-x-auto md:whitespace-nowrap">
          <button
            type="button"
            onClick={() => router.push("/journals/new")}
            className={`w-full rounded-full px-4 py-2 text-sm font-medium transition sm:w-auto ${primaryButton}`}
          >
            Viết journal
          </button>

          <ToolbarSegmented
            label="Chế độ viết"
            value={writingMode}
            options={writingModeOptions}
            onChange={setWritingMode}
            darkMode={themeMode === "dark"}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBackgroundImage(URL.createObjectURL(file));
            }}
          />

          <div
            className={`toolbar-pill flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
              themeMode === "dark"
                ? "border-white/10 bg-[rgba(26,28,27,0.72)] text-neutral-100"
                : "text-[#5d554d]"
            }`}
          >
            <span className={themeMode === "dark" ? "text-neutral-400" : "text-[var(--muted)]"}>
              Theme
            </span>

            <div className="flex items-center gap-1">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setThemeMode(option.value)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    option.value === themeMode
                      ? themeMode === "dark"
                        ? "bg-[var(--accent-soft)] text-[#324038]"
                        : "bg-[var(--accent)] text-[#fcfaf6]"
                      : themeMode === "dark"
                        ? "text-neutral-300 hover:bg-white/8"
                        : "text-[#6e655d] hover:bg-[#f1ebe2]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={`mx-1 hidden h-6 w-px sm:block ${themeMode === "dark" ? "bg-white/10" : "bg-[var(--line)]"}`} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                themeMode === "dark"
                  ? "text-neutral-300 hover:bg-white/8"
                  : "text-[#6e655d] hover:bg-[#f1ebe2]"
              }`}
            >
              <span className="text-base leading-none">✦</span>
              <span>Ảnh nền</span>
            </button>
          </div>

          <div
            className={`toolbar-pill flex w-full flex-col items-stretch gap-3 rounded-[24px] px-4 py-3 text-sm sm:w-auto sm:min-w-[23rem] sm:flex-row sm:items-center sm:rounded-full sm:py-2 ${
              themeMode === "dark"
                ? "border-white/10 bg-[rgba(26,28,27,0.72)] text-neutral-100"
                : "text-[#5d554d]"
            }`}
          >
            <span className={themeMode === "dark" ? "text-neutral-400" : "text-[var(--muted)]"}>
              Kích thước
            </span>

            <div className="flex items-center gap-2">
              <span className={themeMode === "dark" ? "text-neutral-500" : "text-[var(--muted)]"}>
                Rộng
              </span>
              <input
                type="range"
                min="68"
                max="112"
                step="2"
                value={cardWidth}
                onChange={(e) => setCardWidth(Number(e.target.value))}
                className={`min-w-0 flex-1 sm:w-20 ${sliderTrackClasses}`}
              />
              <span className={themeMode === "dark" ? "text-neutral-300" : "text-[#5b5148]"}>
                {cardWidth}%
              </span>
            </div>

            <div className={`h-6 w-px ${themeMode === "dark" ? "bg-white/10" : "bg-[var(--line)]"}`} />

            <div className="flex items-center gap-2">
              <span className={themeMode === "dark" ? "text-neutral-500" : "text-[var(--muted)]"}>
                Cao
              </span>
              <input
                type="range"
                min="68"
                max="120"
                step="2"
                value={cardHeight}
                onChange={(e) => setCardHeight(Number(e.target.value))}
                className={`min-w-0 flex-1 sm:w-20 ${sliderTrackClasses}`}
              />
              <span className={themeMode === "dark" ? "text-neutral-300" : "text-[#5b5148]"}>
                {cardHeight}vh
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8 md:pb-24 md:pt-16">
        {writingMode === "focus" ? (
          <section
            className={`mx-auto rounded-[28px] px-5 py-7 md:rounded-[34px] md:px-10 md:py-10 ${panelClasses}`}
            style={focusCardStyle}
          >
            <div className="mx-auto max-w-4xl">
              <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>
                Focus mode
              </p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none md:text-6xl">
                Write a New Journal
              </h1>
              <p className={`mt-4 max-w-2xl text-base leading-8 ${mutedClasses}`}>
                Một không gian yên tĩnh để bạn viết liền mạch, ít xao nhãng và đủ
                ấm áp để ở lại với suy nghĩ của mình lâu hơn một chút.
              </p>

              <div className="mt-8">
                <JournalComposer
                  mode="focus"
                  darkMode={themeMode === "dark"}
                  minEditorHeight={`${Math.max(340, cardHeight * 5)}px`}
                />
              </div>
            </div>
          </section>
        ) : null}

        {writingMode === "notebook" ? (
          <section
            className={`mx-auto overflow-hidden rounded-[38px] ${panelClasses}`}
            style={{
              width: "100%",
              maxWidth: "76rem",
              minHeight: `${Math.max(72, cardHeight)}vh`,
            }}
          >
            <div className="grid min-h-[70vh] gap-0 lg:grid-cols-[0.82fr_1.18fr]">
              <div
                className={`relative border-b px-8 py-10 lg:border-b-0 lg:border-r lg:px-10 ${
                  themeMode === "dark"
                    ? "border-white/10 bg-[linear-gradient(180deg,rgba(30,31,29,0.96),rgba(20,20,18,0.94))]"
                    : "bg-[linear-gradient(180deg,#f4ead8,#fbf6ee)]"
                }`}
              >
                <div className={`absolute inset-y-0 left-8 w-px ${themeMode === "dark" ? "bg-[#c4ae8c]/16" : "bg-[#cba59d]/55"}`} />
                <p className={`hand-accent pl-8 text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>
                  The left page
                </p>
                <h1 className="serif-display mt-4 pl-8 text-5xl font-semibold leading-none text-[#2f2924] dark:text-[#f4ede3]">
                  Sổ tay hôm nay
                </h1>
                <p className={`mt-5 max-w-md pl-8 text-base leading-8 ${mutedClasses}`}>
                  Có lề giấy, có nhịp thở và có cảm giác như đang mở một cuốn sổ
                  riêng vào buổi sáng yên. Mode này thiên về cảm xúc và sự chậm rãi.
                </p>

                <div
                  className={`mt-10 ml-8 rounded-[26px] px-5 py-5 ${
                    themeMode === "dark"
                      ? "bg-[rgba(255,255,255,0.04)]"
                      : "bg-[rgba(255,251,245,0.66)]"
                  }`}
                >
                  <p className="text-sm font-semibold">Nhắc nhẹ</p>
                  <ul className={`mt-3 space-y-3 text-sm leading-7 ${mutedClasses}`}>
                    <li>Bắt đầu bằng một cảm giác, không cần bằng một câu hoàn hảo.</li>
                    <li>Giữ nhịp viết chậm và để khoảng trắng cho mình thở.</li>
                    <li>Nếu bí ý, hãy gọi một template bằng dấu @.</li>
                  </ul>
                </div>
              </div>

              <div
                className={`px-7 py-10 lg:px-10 ${
                  themeMode === "dark"
                    ? "bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.018)_0px,rgba(255,255,255,0.018)_39px,rgba(255,255,255,0.07)_40px)]"
                    : "bg-[repeating-linear-gradient(180deg,rgba(255,252,247,0.92)_0px,rgba(255,252,247,0.92)_39px,rgba(129,156,185,0.14)_40px)]"
                }`}
              >
                <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>
                  The writing page
                </p>
                <div className="mt-5">
                  <JournalComposer
                    compact
                    mode="notebook"
                    darkMode={themeMode === "dark"}
                    minEditorHeight={`${Math.max(340, cardHeight * 4.6)}px`}
                  />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {writingMode === "cards" ? (
          <section
            className={`mx-auto rounded-[28px] px-4 py-6 sm:px-6 md:rounded-[38px] md:px-8 md:py-8 ${panelClasses}`}
            style={{
              width: "100%",
              maxWidth: "78rem",
              minHeight: `${Math.max(72, cardHeight)}vh`,
            }}
          >
            <div className="max-w-5xl">
              <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>
                Card mode
              </p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none md:text-6xl">
                Guided Journal Flow
              </h1>
              <p className={`mt-4 max-w-3xl text-base leading-8 ${mutedClasses}`}>
                Khi bạn không muốn nhìn vào một khối chữ dài ngay từ đầu, mode này
                chia trải nghiệm viết thành từng card nhỏ: cảm xúc, nội dung chính,
                lòng biết ơn và lời nhắn dịu dàng cho mình.
              </p>
            </div>

            <div className="mt-8">
              <JournalComposer
                mode="cards"
                darkMode={themeMode === "dark"}
                minEditorHeight={`${Math.max(300, cardHeight * 3.5)}px`}
              />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
