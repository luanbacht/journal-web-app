"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  saveJournalFromComposer,
  type JournalComposerActionState,
} from "@/app/journals/actions";

export type TemplateOption = {
  id: string;
  label: string;
  tag: string;
  description: string;
  group: string;
  content: string;
};

export type CardFieldConfig = {
  id: string;
  label: string;
  placeholder: string;
};

type JournalComposerProps = {
  compact?: boolean;
  darkMode?: boolean;
  minEditorHeight?: string;
  mode?: "focus" | "notebook" | "cards";
  templates?: TemplateOption[];
  cardFields?: CardFieldConfig[];
};

export const defaultTemplates: TemplateOption[] = [
  {
    id: "muon-duoc-lang-nghe",
    label: "Muốn được lắng nghe",
    tag: "langnghe",
    description: "Nhìn lại niềm vui, nỗi buồn và sự biết ơn trong ngày.",
    group: "Tâm sự",
    content: `1. Hôm nay mình vui vì:
2. Vậy tại sao hôm nay mình lại buồn:
3. Hôm nay mình còn gặp khó khăn nào hông nhỉ:
4. Cách mà mình giải quyết những khó khăn đó là:
5. Dù gì thì, hôm nay mình rất biết ơn vì:`,
  },
  {
    id: "nang-luong-hom-nay",
    label: "Năng lượng hôm nay",
    tag: "nangluong",
    description: "Tự kiểm tra năng lượng và điều đang tiếp sức cho bạn.",
    group: "Self-check",
    content: `1. Hôm nay năng lượng của mình đang ở mức:
2. Điều gì khiến mình thấy mệt:
3. Điều gì đang tiếp thêm năng lượng cho mình:
4. Một việc nhỏ mình có thể làm để chăm sóc bản thân là:
5. Tối nay mình muốn kết thúc ngày như thế nào:`,
  },
  {
    id: "sap-xep-suy-nghi",
    label: "Sắp xếp suy nghĩ",
    tag: "suynghi",
    description: "Dùng khi đầu óc đang rối và bạn muốn gỡ từng ý một.",
    group: "Clarity",
    content: `1. Điều đang khiến mình bận tâm nhất là:
2. Mình đang lo điều gì sẽ xảy ra:
3. Sự thật mình biết chắc ở lúc này là:
4. Việc quan trọng nhất mình cần làm tiếp theo là:
5. Điều mình muốn nhắc bản thân lúc này là:`,
  },
];

export const defaultCardFields: CardFieldConfig[] = [
  {
    id: "main-content",
    label: "Nội dung chính",
    placeholder: "Viết phần tâm sự chính của bạn ở đây...",
  },
  {
    id: "gratitude",
    label: "Mình biết ơn vì",
    placeholder: "Hôm nay mình biết ơn vì...",
  },
  {
    id: "reflection",
    label: "Lời nhắn cho hôm nay",
    placeholder: "Điều mình muốn nhắc bản thân là...",
  },
];

const groupOrder = ["Tâm sự", "Self-check", "Clarity", "Riêng của bạn"];

function iconForGroup(group: string) {
  if (group === "Tâm sự") return "♡";
  if (group === "Self-check") return "✦";
  if (group === "Clarity") return "≣";
  return "•";
}

const initialComposerState: JournalComposerActionState = {
  status: "idle",
  journalId: null,
  message: "",
};

export default function JournalComposer({
  compact = false,
  darkMode = false,
  minEditorHeight,
  mode = "focus",
  templates = defaultTemplates,
  cardFields = defaultCardFields,
}: JournalComposerProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState("");
  const [cardValues, setCardValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [isSaveLocked, setIsSaveLocked] = useState(false);
  const [isEditingSavedJournal, setIsEditingSavedJournal] = useState(false);
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [actionState, formAction] = useActionState(
    saveJournalFromComposer,
    initialComposerState,
  );

  const effectiveContent = useMemo(() => {
    if (mode !== "cards") {
      return content;
    }

    return cardFields
      .map((field) => {
        const value = cardValues[field.id]?.trim();
        if (!value) return "";
        return `${field.label}:\n${value}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }, [cardFields, cardValues, content, mode]);

  const titleError = hasTriedSubmit && !title.trim();
  const contentError = hasTriedSubmit && !effectiveContent.trim();

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return templates;

    return templates.filter((option) =>
      [option.label, option.description, option.group, option.tag].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query, templates]);

  const groupedOptions = useMemo(() => {
    const orderedGroups = [
      ...groupOrder,
      ...templates
        .map((item) => item.group)
        .filter((group) => !groupOrder.includes(group)),
    ];

    return orderedGroups
      .map((group) => ({
        group,
        items: filteredOptions.filter((option) => option.group === group),
      }))
      .filter((section) => section.items.length > 0);
  }, [filteredOptions, templates]);

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
    const updatedBeforeCaret = beforeCaret.replace(/@([^\s@]*)$/, option.content);
    const nextContent = `${updatedBeforeCaret}${afterCaret}`;

    setContent(nextContent);
    setIsSaveLocked(false);
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
    ? "border-white/10 bg-[rgba(255,255,255,0.05)] text-[#f4ede3] placeholder:text-neutral-500 focus:border-[#c4d1c7]"
    : "border-[var(--line)] bg-[var(--paper-strong)] text-[#312c27] placeholder:text-[#9a8f84] focus:border-[var(--accent)]";

  const notebookFieldBase = darkMode
    ? "rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.05)] text-[#f4ede3] placeholder:text-neutral-500 focus:border-[#c4d1c7]"
    : "rounded-[24px] border border-[var(--line)] bg-[rgba(255,251,245,0.86)] text-[#312c27] placeholder:text-[#9a8f84] focus:border-[var(--accent)]";

  const errorBase =
    "border-rose-300 bg-rose-50 text-[#312c27] focus:border-rose-400";
  const resolvedEditorHeight = minEditorHeight ?? (compact ? "340px" : "380px");

  const sharedInputClass = mode === "notebook" ? notebookFieldBase : fieldBase;
  const labelTone =
    darkMode && mode !== "notebook" ? "text-[#f4ede3]" : "text-[#312c27]";
  const helperTone = darkMode ? "text-[#d5cec4]" : "text-[var(--muted)]";
  const cardShell = darkMode
    ? "rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 text-[#f4ede3] shadow-[0_20px_50px_rgba(0,0,0,0.16)]"
    : "journal-paper rounded-[24px] p-4 sm:rounded-[28px] sm:p-5";
  const isLockedAfterSave = isSaveLocked && !isEditingSavedJournal;
  const fieldsDisabled = Boolean(currentJournalId) && isLockedAfterSave;
  const unlockSave = () => {
    setIsSaveLocked(false);
  };

  useEffect(() => {
    if (actionState.status !== "saved") {
      return;
    }

    setCurrentJournalId(actionState.journalId);
    setIsSaveLocked(true);
    setIsEditingSavedJournal(false);
  }, [actionState]);

  useEffect(() => {
    if (actionState.status !== "error") {
      return;
    }

    if (actionState.journalId) {
      setCurrentJournalId(actionState.journalId);
      setIsEditingSavedJournal(true);
    }

    setIsSaveLocked(false);
  }, [actionState]);

  const beginUpdatingSavedJournal = () => {
    setIsEditingSavedJournal(true);
    setIsSaveLocked(false);
  };

  const submitButtonLabel = currentJournalId ? "Cập nhật journal" : "Lưu journal";

  return (
    <form
      action={formAction}
      className={mode === "cards" ? "space-y-6" : "space-y-7"}
      onSubmit={(e) => {
        if (!title.trim() || !effectiveContent.trim()) {
          e.preventDefault();
          setHasTriedSubmit(true);
          setIsSaveLocked(false);
          return;
        }

        setHasTriedSubmit(true);
        setIsSaveLocked(true);
        setIsEditingSavedJournal(false);
      }}
    >
      <input type="hidden" name="journalId" value={currentJournalId ?? ""} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="content" value={effectiveContent} />
      <input type="hidden" name="moodScore" value={moodScore} />

      {actionState.message ? (
        <div
          className={`rounded-[24px] border px-4 py-4 sm:px-5 ${
            actionState.status === "saved"
              ? darkMode
                ? "border-emerald-300/20 bg-emerald-500/10 text-[#e9f5ec]"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
              : darkMode
                ? "border-rose-300/20 bg-rose-500/10 text-rose-100"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-7 sm:text-[15px]">
              {actionState.message}
            </p>
            {actionState.status === "saved" && currentJournalId && !isEditingSavedJournal ? (
              <button
                type="button"
                onClick={beginUpdatingSavedJournal}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  darkMode
                    ? "border border-white/10 bg-[rgba(255,255,255,0.08)] text-[#f6f0e8] hover:bg-[rgba(255,255,255,0.14)]"
                    : "border border-[var(--line)] bg-[rgba(255,251,245,0.9)] text-[#5d554d] hover:bg-[#f5eee4]"
                }`}
              >
                Cập nhật journal
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "cards" ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.45fr] xl:gap-5">
          <section className={cardShell}>
            <p
              className={`hand-accent text-sm ${
                darkMode ? "text-[#ccb690]" : "text-[var(--gold-soft)]"
              }`}
            >
              Cảm xúc hôm nay
            </p>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="title-card"
                className={`block text-lg font-semibold ${labelTone}`}
              >
                Hôm nay bạn đang thấy thế nào?
              </label>
              <input
                id="title-card"
                type="text"
                placeholder="Cho mình biết cảm xúc rõ nhất của bạn..."
                className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition ${
                  titleError ? errorBase : fieldBase
                }`}
                disabled={fieldsDisabled}
                spellCheck={false}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  unlockSave();
                }}
              />
              {titleError ? (
                <ErrorHint text="Nuuu, cho mình biết tâm trạng của bạn đi mà..." />
              ) : null}
            </div>

            <div className="mt-6 space-y-2">
              <label
                htmlFor="moodScore-card"
                className={`block text-base font-semibold ${labelTone}`}
              >
                Mood score (1-10)
              </label>
              <input
                id="moodScore-card"
                name="moodScore"
                type="number"
                min="1"
                max="10"
                placeholder="7"
                className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition ${fieldBase}`}
                disabled={fieldsDisabled}
                spellCheck={false}
                value={moodScore}
                onChange={(e) => {
                  setMoodScore(e.target.value);
                  unlockSave();
                }}
              />
            </div>
          </section>

          <div className="grid gap-5">
            {cardFields.map((field, index) => (
              <section key={field.id} className={cardShell}>
                <label className={`block text-lg font-semibold ${labelTone}`}>
                  {field.label}
                </label>
                <textarea
                  rows={index === 0 ? 6 : 5}
                  placeholder={field.placeholder}
                  className={`mt-4 h-auto w-full resize-none rounded-[24px] border px-4 py-4 outline-none transition ${fieldBase}`}
                  style={{ height: index === 0 ? resolvedEditorHeight : "12rem" }}
                  disabled={fieldsDisabled}
                  spellCheck={false}
                  value={cardValues[field.id] ?? ""}
                  onChange={(e) => {
                    setCardValues((current) => ({
                      ...current,
                      [field.id]: e.target.value,
                    }));
                    unlockSave();
                  }}
                />
              </section>
            ))}

            {contentError ? (
              <div className="mt-1">
                <ErrorHint text="Nuuu, kể mình nghe thêm một chút nữa nha..." />
              </div>
            ) : null}
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
              className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition ${
                titleError ? errorBase : sharedInputClass
              }`}
              disabled={fieldsDisabled}
              spellCheck={false}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                unlockSave();
              }}
            />
            {titleError ? (
              <ErrorHint text="Nuuu, cho mình biết tâm trạng của bạn đi mà..." />
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className={`block text-lg font-semibold ${labelTone}`}>
              Hãy tâm sự với mình thêm một chút nhé. Hoặc gõ @ để chọn template có sẵn.
            </label>
            <p className={`${helperTone} text-sm`}>
              Ví dụ: gõ <span className="font-semibold">@{templates[0]?.tag ?? "langnghe"}</span>{" "}
              để lọc nhanh template phù hợp.
            </p>

            <div className="relative">
              <textarea
                ref={textareaRef}
                id="content"
                rows={compact ? 8 : 9}
                placeholder="Viết dòng tâm sự của bạn..."
                className={`h-auto w-full resize-none rounded-[22px] border px-4 py-4 outline-none transition sm:rounded-[28px] sm:px-5 sm:py-5 ${
                  contentError ? errorBase : sharedInputClass
                }`}
                style={{ height: resolvedEditorHeight }}
                disabled={fieldsDisabled}
                spellCheck={false}
                value={content}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  const caretPosition = e.target.selectionStart ?? nextValue.length;
                  setContent(nextValue);
                  unlockSave();
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
              <ErrorHint text="Nuuu, kể mình nghe thêm một chút nữa nha..." />
            ) : null}
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
              className={`w-full rounded-[18px] border px-4 py-3.5 outline-none transition ${sharedInputClass}`}
              disabled={fieldsDisabled}
              spellCheck={false}
              value={moodScore}
              onChange={(e) => {
                setMoodScore(e.target.value);
                unlockSave();
              }}
            />
          </div>
        </>
      )}

      <SubmitButton
        isLocked={isLockedAfterSave}
        label={submitButtonLabel}
      />
    </form>
  );
}

function SubmitButton({
  isLocked,
  label,
}: {
  isLocked: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || isLocked;

  return (
    <button
      type="submit"
      disabled={disabled}
      aria-disabled={disabled}
      className={`accent-button w-full rounded-full px-6 py-3 text-sm font-medium transition sm:w-auto ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      {pending ? "Đang lưu..." : isLocked ? "Journal đã lưu, bấm cập nhật để sửa tiếp" : label}
    </button>
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
                      {iconForGroup(option.group)}
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
                        @{option.tag} · {option.description}
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
