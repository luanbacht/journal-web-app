"use client";

import { useMemo, useRef, useState } from "react";
import { createJournal } from "@/app/journals/actions";

type TemplateOption = {
  id: string;
  label: string;
  description: string;
  icon: string;
  group: string;
  keywords: string[];
  content: string;
};

type JournalComposerProps = {
  compact?: boolean;
  darkMode?: boolean;
  minEditorHeight?: string;
  mode?: "focus" | "notebook" | "cards";
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "muon-duoc-lang-nghe",
    label: "Muốn được lắng nghe",
    description:
      "Một mẫu nhẹ nhàng để nhìn lại niềm vui, nỗi buồn và sự biết ơn trong ngày.",
    icon: "heart",
    group: "Tâm sự",
    keywords: ["lang nghe", "tam su", "cam xuc", "buon", "vui", "biet on"],
    content: `1. Hôm nay mình vui vì:
2. Vậy tại sao hôm nay mình lại buồn:
3. Hôm nay mình còn gặp khó khăn nào hông nhỉ:
4. Cách mà mình giải quyết những khó khăn đó là:
5. Dù gì thì, hôm nay mình rất biết ơn vì:`,
  },
  {
    id: "nang-luong-hom-nay",
    label: "Năng lượng hôm nay",
    description:
      "Gợi ý để tự kiểm tra năng lượng, điều làm bạn mệt và điều đang tiếp sức cho bạn.",
    icon: "spark",
    group: "Self-check",
    keywords: ["nang luong", "met", "dong luc", "self check", "can bang"],
    content: `1. Hôm nay năng lượng của mình đang ở mức:
2. Điều gì khiến mình thấy mệt:
3. Điều gì đang tiếp thêm năng lượng cho mình:
4. Một việc nhỏ mình có thể làm để chăm sóc bản thân là:
5. Tối nay mình muốn kết thúc ngày như thế nào:`,
  },
  {
    id: "sap-xep-suy-nghi",
    label: "Sắp xếp suy nghĩ",
    description: "Dùng khi đầu óc đang rối và bạn muốn gỡ từng ý một thật chậm.",
    icon: "list",
    group: "Clarity",
    keywords: ["roi", "suy nghi", "clarity", "sap xep", "qua tai"],
    content: `1. Điều đang khiến mình bận tâm nhất là:
2. Mình đang lo điều gì sẽ xảy ra:
3. Sự thật mình biết chắc ở lúc này là:
4. Việc quan trọng nhất mình cần làm tiếp theo là:
5. Điều mình muốn nhắc bản thân lúc này là:`,
  },
];

const GROUP_ORDER = ["Tâm sự", "Self-check", "Clarity"];

function getIcon(icon: string) {
  if (icon === "heart") return "♡";
  if (icon === "spark") return "✦";
  if (icon === "list") return "≣";
  return "•";
}

export default function JournalComposer({
  compact = false,
  darkMode = false,
  minEditorHeight,
  mode = "focus",
}: JournalComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [reflection, setReflection] = useState("");
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const effectiveContent = useMemo(() => {
    if (mode !== "cards") {
      return content;
    }

    const sections = [
      content.trim() ? `Nội dung chính:\n${content.trim()}` : "",
      gratitude.trim() ? `Mình biết ơn vì:\n${gratitude.trim()}` : "",
      reflection.trim() ? `Lời nhắn cho hôm nay:\n${reflection.trim()}` : "",
    ].filter(Boolean);

    return sections.join("\n\n");
  }, [content, gratitude, reflection, mode]);

  const titleError = hasTriedSubmit && !title.trim();
  const contentError = hasTriedSubmit && !effectiveContent.trim();

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return TEMPLATE_OPTIONS;
    }

    return TEMPLATE_OPTIONS.filter((option) => {
      const haystacks = [
        option.label,
        option.description,
        option.group,
        ...option.keywords,
      ];

      return haystacks.some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [query]);

  const groupedOptions = useMemo(() => {
    return GROUP_ORDER.map((group) => ({
      group,
      items: filteredOptions.filter((option) => option.group === group),
    })).filter((section) => section.items.length > 0);
  }, [filteredOptions]);

  const flatOptions = useMemo(
    () => groupedOptions.flatMap((section) => section.items),
    [groupedOptions],
  );

  const updateTemplateMenu = (value: string, caretPosition: number) => {
    const beforeCaret = value.slice(0, caretPosition);
    const match = beforeCaret.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match) {
      setIsMenuOpen(false);
      setQuery("");
      setHighlightedIndex(0);
      return;
    }

    setQuery(match[1] ?? "");
    setIsMenuOpen(true);
    setHighlightedIndex(0);
  };

  const applyTemplate = (option: TemplateOption) => {
    const textarea = textareaRef.current;
    const caretPosition = textarea?.selectionStart ?? content.length;
    const beforeCaret = content.slice(0, caretPosition);
    const afterCaret = content.slice(caretPosition);
    const updatedBeforeCaret = beforeCaret.replace(
      /@([^\s@]*)$/,
      option.content,
    );
    const nextContent = `${updatedBeforeCaret}${afterCaret}`;

    setContent(nextContent);
    setIsMenuOpen(false);
    setQuery("");
    setHighlightedIndex(0);

    requestAnimationFrame(() => {
      if (!textarea) return;
      const nextCaretPosition = updatedBeforeCaret.length;
      textarea.focus();
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition);
    });
  };

  const fieldBase = darkMode
    ? "border-white/10 bg-[rgba(255,255,255,0.04)] text-[#f4ede3] placeholder:text-neutral-500 focus:border-[#c4d1c7]"
    : "border-[var(--line)] bg-[var(--paper-strong)] text-[#312c27] placeholder:text-[#9a8f84] focus:border-[var(--accent)]";

  const notebookFieldBase = darkMode
    ? "border-transparent bg-transparent text-[#f4ede3] placeholder:text-neutral-500 focus:border-transparent"
    : "border-transparent bg-transparent text-[#312c27] placeholder:text-[#9a8f84] focus:border-transparent";

  const errorBase = "border-rose-300 bg-rose-50 text-[#312c27] focus:border-rose-400";
  const resolvedEditorHeight =
    minEditorHeight ?? (compact ? "340px" : "380px");

  const sharedInputClass = mode === "notebook" ? notebookFieldBase : fieldBase;
  const labelTone =
    darkMode && mode !== "notebook" ? "text-[#f4ede3]" : "text-[#312c27]";
  const helperTone = darkMode ? "text-[#d5cec4]" : "text-[var(--muted)]";
  const cardShell = darkMode
    ? "border border-white/10 bg-[rgba(255,255,255,0.03)] text-[#f4ede3] shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
    : "journal-paper rounded-[24px] p-4 sm:rounded-[28px] sm:p-5";

  return (
    <form
      action={createJournal}
      className={mode === "cards" ? "space-y-6" : "space-y-7"}
      onSubmit={(e) => {
        if (!title.trim() || !effectiveContent.trim()) {
          e.preventDefault();
          setHasTriedSubmit(true);
        }
      }}
    >
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="content" value={effectiveContent} />

      {mode === "cards" ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.45fr] xl:gap-5">
          <section className={cardShell}>
            <p className={`hand-accent text-sm ${darkMode ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>
              Cảm xúc hôm nay
            </p>
            <div className="mt-4 space-y-2">
              <label htmlFor="title-card" className={`block text-lg font-semibold ${labelTone}`}>
                Hôm nay bạn đang thấy thế nào?
              </label>
              <input
                id="title-card"
                type="text"
                placeholder="Cho mình biết cảm xúc rõ nhất của bạn..."
                className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition sm:rounded-[22px] sm:py-4 ${
                  titleError ? errorBase : fieldBase
                }`}
                spellCheck={false}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {titleError ? <ErrorHint text="Nuuu, cho mình biết tâm trạng của bạn đi mà..." /> : null}
            </div>

            <div className="mt-6 space-y-2">
              <label htmlFor="moodScore-card" className={`block text-base font-semibold ${labelTone}`}>
                Mood score (1-10)
              </label>
              <input
                id="moodScore-card"
                name="moodScore"
                type="number"
                min="1"
                max="10"
                placeholder="7"
                className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition sm:rounded-[22px] sm:py-4 ${fieldBase}`}
                spellCheck={false}
              />
            </div>

            <div className={`mt-6 rounded-[22px] px-4 py-4 ${darkMode ? "bg-[rgba(255,255,255,0.04)]" : "bg-[rgba(255,251,245,0.72)]"}`}>
              <p className="text-sm font-semibold">Gợi ý nhẹ</p>
              <p className={`mt-2 text-sm leading-7 ${helperTone}`}>
                Hãy viết như đang tự kể lại cho mình nghe, không cần chỉnh sửa ngay
                từ câu đầu tiên.
              </p>
            </div>
          </section>

          <div className="grid gap-5">
            <section className={cardShell}>
              <label htmlFor="content-card" className={`block text-lg font-semibold ${labelTone}`}>
                Nội dung chính
              </label>
              <p className={`mt-2 text-sm ${helperTone}`}>
                Gõ <span className="font-semibold">@langnghe</span> để gọi template nhanh.
              </p>

              <div className="relative mt-4">
                <textarea
                  ref={textareaRef}
                  id="content-card"
                  rows={8}
                  placeholder="Viết phần tâm sự chính của bạn ở đây..."
                  className={`h-auto w-full resize-none rounded-[26px] border px-5 py-5 outline-none transition ${
                    contentError ? errorBase : fieldBase
                  }`}
                  style={{ height: resolvedEditorHeight }}
                  spellCheck={false}
                  value={content}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    const caretPosition = e.target.selectionStart ?? nextValue.length;
                    setContent(nextValue);
                    updateTemplateMenu(nextValue, caretPosition);
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    const caretPosition = target.selectionStart ?? content.length;
                    updateTemplateMenu(content, caretPosition);
                  }}
                  onKeyDown={(e) => {
                    if (!isMenuOpen || flatOptions.length === 0) return;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedIndex((current) =>
                        current === flatOptions.length - 1 ? 0 : current + 1,
                      );
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIndex((current) =>
                        current === 0 ? flatOptions.length - 1 : current - 1,
                      );
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyTemplate(flatOptions[highlightedIndex]);
                    }
                    if (e.key === "Escape") {
                      setIsMenuOpen(false);
                    }
                  }}
                />

                {isMenuOpen ? (
                  <TemplateMenu
                    flatOptions={flatOptions}
                    groupedOptions={groupedOptions}
                    highlightedIndex={highlightedIndex}
                    applyTemplate={applyTemplate}
                  />
                ) : null}
              </div>

              {contentError ? (
                <div className="mt-2">
                  <ErrorHint text="Nuuu, kể mình nghe thêm một chút nữa nha..." />
                </div>
              ) : null}
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <section className={cardShell}>
                <label htmlFor="gratitude-card" className={`block text-lg font-semibold ${labelTone}`}>
                  Gratitude
                </label>
                <p className={`mt-2 text-sm ${helperTone}`}>
                  Một điều nhỏ khiến hôm nay dịu lại.
                </p>
                <textarea
                  id="gratitude-card"
                  rows={5}
                  placeholder="Hôm nay mình biết ơn vì..."
                  className={`mt-4 h-44 w-full resize-none rounded-[24px] border px-4 py-4 outline-none transition ${fieldBase}`}
                  spellCheck={false}
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </section>

              <section className={cardShell}>
                <label htmlFor="reflection-card" className={`block text-lg font-semibold ${labelTone}`}>
                  Reflection
                </label>
                <p className={`mt-2 text-sm ${helperTone}`}>
                  Một câu nhắn dịu dàng cho chính mình.
                </p>
                <textarea
                  id="reflection-card"
                  rows={5}
                  placeholder="Điều mình muốn nhắc bản thân là..."
                  className={`mt-4 h-44 w-full resize-none rounded-[24px] border px-4 py-4 outline-none transition ${fieldBase}`}
                  spellCheck={false}
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                />
              </section>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor="title" className={`block text-lg font-semibold ${labelTone}`}>
              Hôm nay bạn cảm thấy thế nào?
            </label>
            <input
              id="title"
              type="text"
              placeholder="Cho mình biết tâm trạng của bạn nhé..."
              className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition sm:rounded-[22px] sm:py-4 ${
                titleError ? errorBase : sharedInputClass
              }`}
              spellCheck={false}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {titleError ? <ErrorHint text="Nuuu, cho mình biết tâm trạng của bạn đi mà..." /> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className={`block text-lg font-semibold ${labelTone}`}>
              Hãy tâm sự với mình thêm một chút nhé. Hoặc gõ @ để chọn template có sẵn.
            </label>
            <p className={`${helperTone} text-sm`}>
              Ví dụ: gõ <span className="font-semibold">@langnghe</span> để lọc nhanh template phù hợp.
            </p>

            <div className="relative">
              <textarea
                ref={textareaRef}
                id="content"
                rows={compact ? 8 : 9}
                placeholder="Viết dòng tâm sự của bạn..."
                className={`h-auto w-full resize-none rounded-[22px] border px-4 py-4 outline-none transition sm:rounded-[28px] sm:px-5 sm:py-5 ${
                  contentError ? errorBase : sharedInputClass
                } ${mode === "notebook" ? "shadow-none" : ""}`}
                style={{ height: resolvedEditorHeight }}
                spellCheck={false}
                value={content}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  const caretPosition = e.target.selectionStart ?? nextValue.length;
                  setContent(nextValue);
                  updateTemplateMenu(nextValue, caretPosition);
                }}
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  const caretPosition = target.selectionStart ?? content.length;
                  updateTemplateMenu(content, caretPosition);
                }}
                onKeyDown={(e) => {
                  if (!isMenuOpen || flatOptions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((current) =>
                      current === flatOptions.length - 1 ? 0 : current + 1,
                    );
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((current) =>
                      current === 0 ? flatOptions.length - 1 : current - 1,
                    );
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyTemplate(flatOptions[highlightedIndex]);
                  }
                  if (e.key === "Escape") {
                    setIsMenuOpen(false);
                  }
                }}
              />

              {isMenuOpen ? (
                <TemplateMenu
                  flatOptions={flatOptions}
                  groupedOptions={groupedOptions}
                  highlightedIndex={highlightedIndex}
                  applyTemplate={applyTemplate}
                />
              ) : null}
            </div>

            {contentError ? <ErrorHint text="Nuuu, kể mình nghe thêm một chút nữa nha..." /> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="moodScore" className={`block text-lg font-semibold ${labelTone}`}>
              Mood score (1-10)
            </label>
            <input
              id="moodScore"
              name="moodScore"
              type="number"
              min="1"
              max="10"
              placeholder="7"
              className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition sm:rounded-[22px] sm:py-4 ${sharedInputClass}`}
              spellCheck={false}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="accent-button w-full rounded-full px-6 py-3 text-sm font-medium transition sm:w-auto"
      >
        Save journal
      </button>
    </form>
  );
}

function ErrorHint({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-rose-500">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-xs text-rose-500">
        ♡
      </span>
      <span>{text}</span>
    </p>
  );
}

type TemplateMenuProps = {
  flatOptions: TemplateOption[];
  groupedOptions: { group: string; items: TemplateOption[] }[];
  highlightedIndex: number;
  applyTemplate: (option: TemplateOption) => void;
};

function TemplateMenu({
  flatOptions,
  groupedOptions,
  highlightedIndex,
  applyTemplate,
}: TemplateMenuProps) {
  return (
    <div className="absolute left-2 right-2 top-14 z-10 overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--paper-strong)] shadow-[0_18px_44px_rgba(77,63,46,0.08)] sm:left-4 sm:right-auto sm:top-16 sm:w-[min(300px,calc(100%-2rem))] sm:rounded-[20px]">
      {flatOptions.length > 0 ? (
        <div className="max-h-48 overflow-y-auto p-1.5">
          {groupedOptions.map((section) => (
            <div key={section.group} className="mb-1.5 last:mb-0">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {section.group}
              </div>

              {section.items.map((option) => {
                const optionIndex = flatOptions.findIndex(
                  (item) => item.id === option.id,
                );
                const isActive = optionIndex === highlightedIndex;

                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`mb-1 flex w-full items-start gap-2.5 rounded-[16px] px-2.5 py-2 text-left transition last:mb-0 ${
                      isActive
                        ? "bg-[var(--accent)] text-[#fcfaf6]"
                        : "bg-transparent text-[#2f2924] hover:bg-[#f2ece4]"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyTemplate(option);
                    }}
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                        isActive
                          ? "bg-white/14 text-white"
                          : "bg-[#eee7db] text-[#6a5d4f]"
                      }`}
                    >
                      {getIcon(option.icon)}
                    </span>

                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">
                        {option.label}
                      </span>
                      <span
                        className={`mt-0.5 line-clamp-2 block text-[11px] leading-4 ${
                          isActive ? "text-[#f6efe6]" : "text-[var(--muted)]"
                        }`}
                      >
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-3 py-3 text-xs text-[var(--muted)]">
          Không tìm thấy template phù hợp.
        </div>
      )}
    </div>
  );
}
