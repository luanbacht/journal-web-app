"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import JournalComposer, {
  type CardFieldConfig,
  type TemplateOption,
  defaultCardFields,
  defaultTemplates,
} from "@/app/journals/new/journal-composer";

type ThemeMode = "light" | "dark";
type WritingMode = "focus" | "notebook" | "cards";
type Option<T extends string> = { value: T; label: string };
type JournalWorkspaceSettings = {
  themeMode: ThemeMode;
  writingMode: WritingMode;
  backgroundImage: string | null;
  templates: TemplateOption[];
  cardFields: CardFieldConfig[];
};
type LocalWorkspaceSettings = Omit<JournalWorkspaceSettings, "backgroundImage"> & {
  hasBackgroundImage: boolean;
};
type ConfigSheetProps = {
  darkMode: boolean;
  isSaving: boolean;
  saveLabel: string;
  templates: TemplateOption[];
  cardFields: CardFieldConfig[];
  onClose: () => void;
  onSave: () => void;
  onTemplatesChange: (templates: TemplateOption[]) => void;
  onCardFieldsChange: (fields: CardFieldConfig[]) => void;
};
type ToolbarControlsProps = {
  darkMode: boolean;
  themeMode: ThemeMode;
  writingMode: WritingMode;
  isSaving: boolean;
  saveLabel: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onComposeNew: () => void;
  onOpenConfig: () => void;
  onResetBackground: () => void;
  onSaveSettings: () => void;
  onThemeModeChange: (value: ThemeMode) => void;
  onWritingModeChange: (value: WritingMode) => void;
  mobile?: boolean;
};

const STORAGE_KEY = "journal-workspace-settings-v1";
const writingModeOptions: Option<WritingMode>[] = [
  { value: "focus", label: "Tập trung" },
  { value: "notebook", label: "Sổ tay" },
  { value: "cards", label: "Thẻ viết" },
];
const themeOptions: Option<ThemeMode>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

type JournalWorkspaceProps = {
  initialSettings: JournalWorkspaceSettings;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Khong doc duoc anh nen."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Khong doc duoc file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Khong tai duoc anh."));
    image.src = dataUrl;
  });
}

async function optimizeBackgroundImage(file: File) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(rawDataUrl);
  const maxDimension = 1440;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return rawDataUrl;
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/webp", 0.8);
}

function ToolbarSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
  darkMode,
  stacked = false,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  darkMode: boolean;
  stacked?: boolean;
}) {
  return (
    <div
      className={`toolbar-pill flex rounded-full text-sm ${
        stacked ? "w-full flex-col items-start gap-3 rounded-[26px] px-4 py-3" : "items-center gap-3 px-3 py-2"
      } ${darkMode ? "border-white/10 bg-[rgba(24,27,26,0.92)] text-neutral-100" : "text-[#5d554d]"}`}
    >
      <span className={darkMode ? "text-neutral-300" : "text-[var(--muted)]"}>{label}</span>
      <div className={`flex items-center gap-1 ${stacked ? "flex-wrap" : ""}`}>
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
                  ? "text-neutral-100 hover:bg-white/10"
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

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3.5v2.2" /><path d="M10 14.3v2.2" /><path d="m4.9 5.7 1.6 1.6" /><path d="m13.5 14.3 1.6 1.6" />
      <path d="M3.5 10h2.2" /><path d="M14.3 10h2.2" /><path d="m4.9 14.3 1.6-1.6" /><path d="m13.5 5.7 1.6-1.6" />
      <circle cx="10" cy="10" r="2.7" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.25" y="4.25" width="13.5" height="11.5" rx="2.2" /><circle cx="7.4" cy="8" r="1.1" />
      <path d="m6.2 13 2.6-2.6 1.8 1.7 2.7-3 2.5 3.9" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12" /><path d="M4 10h12" /><path d="M4 14h12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 5 10 10" /><path d="M15 5 5 15" />
    </svg>
  );
}

function ToolbarControls({
  darkMode,
  themeMode,
  writingMode,
  isSaving,
  saveLabel,
  fileInputRef,
  onComposeNew,
  onOpenConfig,
  onResetBackground,
  onSaveSettings,
  onThemeModeChange,
  onWritingModeChange,
  mobile = false,
}: ToolbarControlsProps) {
  const secondaryButton = darkMode
    ? "rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] text-[#ece4d9] hover:bg-[rgba(255,255,255,0.08)]"
    : "soft-button rounded-full";
  const primaryButton = darkMode
    ? "rounded-full border border-white/10 bg-[var(--accent-soft)] text-[#324038] hover:bg-[#dfe8dc]"
    : "accent-button rounded-full";

  return (
    <>
      <button type="button" onClick={onComposeNew} className={`px-4 py-2 text-sm font-medium transition ${primaryButton}`}>Viết journal</button>
      <ToolbarSegmented label="Chế độ viết" value={writingMode} options={writingModeOptions} onChange={onWritingModeChange} darkMode={darkMode} stacked={mobile} />
      <div className={`toolbar-pill flex text-sm ${mobile ? "w-full flex-col items-start gap-3 rounded-[26px] px-4 py-3" : "flex-wrap items-center gap-2 rounded-full px-3 py-2"} ${darkMode ? "border-white/10 bg-[rgba(24,27,26,0.92)] text-neutral-100" : "text-[#5d554d]"}`}>
        <span className={darkMode ? "text-neutral-300" : "text-[var(--muted)]"}>Theme</span>
        <div className="flex items-center gap-1">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onThemeModeChange(option.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                option.value === themeMode
                  ? darkMode
                    ? "bg-[var(--accent-soft)] text-[#2f342f]"
                    : "bg-[var(--accent)] text-[#fcfaf6]"
                  : darkMode
                    ? "text-neutral-100 hover:bg-white/10"
                    : "text-[#6e655d] hover:bg-[#f1ebe2]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={`${mobile ? `h-px w-full ${darkMode ? "bg-white/10" : "bg-[var(--line)]"}` : `mx-1 hidden h-6 w-px sm:block ${darkMode ? "bg-white/10" : "bg-[var(--line)]"}`}`} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition ${darkMode ? "text-neutral-100 hover:bg-white/10" : "text-[#6e655d] hover:bg-[#f1ebe2]"}`}>
            <ImageIcon /><span>Ảnh nền</span>
          </button>
          <button type="button" onClick={onResetBackground} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${darkMode ? "text-neutral-300 hover:bg-white/10" : "text-[#6e655d] hover:bg-[#f1ebe2]"}`}>Mặc định</button>
        </div>
      </div>
      <button type="button" onClick={onOpenConfig} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${secondaryButton}`}>
        <SettingsIcon /><span>Cấu hình journal card</span>
      </button>
      <button
        type="button"
        onClick={onSaveSettings}
        disabled={isSaving}
        className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-wait disabled:opacity-75 ${
          darkMode
            ? "border border-white/10 bg-[rgba(255,255,255,0.08)] text-[#f3ede4] hover:bg-[rgba(255,255,255,0.12)]"
            : "border border-[var(--line)] bg-[rgba(255,251,245,0.86)] text-[#5d554d] hover:bg-[#f5eee4]"
        }`}
      >
        {isSaving ? "Đang lưu..." : saveLabel}
      </button>
    </>
  );
}

function ConfigSheet({
  darkMode,
  isSaving,
  saveLabel,
  templates,
  cardFields,
  onClose,
  onSave,
  onTemplatesChange,
  onCardFieldsChange,
}: ConfigSheetProps) {
  const basePanel = darkMode ? "border-white/10 bg-[rgba(20,22,21,0.96)] text-[#f6f0e8]" : "journal-paper text-[#312c27]";
  const fieldClass = darkMode
    ? "border-white/10 bg-[rgba(255,255,255,0.05)] text-[#f6f0e8] placeholder:text-neutral-500"
    : "border-[var(--line)] bg-[var(--paper-strong)] text-[#312c27] placeholder:text-[#9a8f84]";

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-[rgba(28,24,20,0.18)] backdrop-blur-[2px]">
      <div className={`h-full w-full max-w-[32rem] overflow-y-auto border-l px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.12)] ${basePanel}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`hand-accent text-sm ${darkMode ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>Cấu hình journal card</p>
            <h2 className="serif-display mt-3 text-4xl leading-none">Tùy chỉnh trải nghiệm viết</h2>
            <p className={`mt-3 text-sm leading-7 ${darkMode ? "text-[#d5cec4]" : "text-[var(--muted)]"}`}>Bạn có thể thêm template @ của riêng mình và đổi các ô trong chế độ viết thẻ.</p>
          </div>
          <button type="button" onClick={onClose} className={`rounded-full px-3 py-2 text-sm font-medium transition ${darkMode ? "bg-white/6 text-neutral-200 hover:bg-white/10" : "bg-[#f5efe6] text-[#5b5148] hover:bg-[#efe7dc]"}`}>Đóng</button>
        </div>
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Template @</h3>
              <p className={`mt-1 text-sm ${darkMode ? "text-[#d5cec4]" : "text-[var(--muted)]"}`}>Gắn tag ngắn để người dùng gọi nhanh bằng dấu @.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextIndex = templates.length + 1;
                onTemplatesChange([...templates, { id: `custom-template-${Date.now()}`, label: `Template ${nextIndex}`, tag: `mau${nextIndex}`, description: "Một template mới do bạn tạo.", group: "Riêng của bạn", content: "1. Điều mình muốn viết hôm nay:\n2. Điều mình muốn giữ lại:" }]);
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${darkMode ? "bg-[var(--accent-soft)] text-[#324038] hover:bg-[#dbe6d8]" : "bg-[var(--accent)] text-[#fcfaf6] hover:bg-[#647a6a]"}`}
            >
              Thêm template
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {templates.map((template, index) => (
              <div key={template.id} className={`rounded-[24px] border p-4 ${darkMode ? "border-white/10 bg-white/4" : "border-[var(--line)] bg-[rgba(255,251,245,0.74)]"}`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="text" value={template.label} onChange={(e) => { const next = [...templates]; next[index] = { ...template, label: e.target.value }; onTemplatesChange(next); }} placeholder="Tên template" className={`rounded-[18px] border px-4 py-3 outline-none ${fieldClass}`} />
                  <input type="text" value={template.tag} onChange={(e) => { const next = [...templates]; next[index] = { ...template, tag: e.target.value.replace(/\s+/g, "").toLowerCase() }; onTemplatesChange(next); }} placeholder="taggoi" className={`rounded-[18px] border px-4 py-3 outline-none ${fieldClass}`} />
                </div>
                <input type="text" value={template.description} onChange={(e) => { const next = [...templates]; next[index] = { ...template, description: e.target.value }; onTemplatesChange(next); }} placeholder="Mô tả ngắn" className={`mt-3 w-full rounded-[18px] border px-4 py-3 outline-none ${fieldClass}`} />
                <textarea rows={5} value={template.content} onChange={(e) => { const next = [...templates]; next[index] = { ...template, content: e.target.value }; onTemplatesChange(next); }} placeholder="Nội dung template" className={`mt-3 w-full rounded-[22px] border px-4 py-4 outline-none ${fieldClass}`} />
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => onTemplatesChange(templates.filter((item) => item.id !== template.id))} className="rounded-full px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50">Xóa template</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Ô trong chế độ Thẻ viết</h3>
              <p className={`mt-1 text-sm ${darkMode ? "text-[#d5cec4]" : "text-[var(--muted)]"}`}>Tự thêm hoặc đổi các ô xuất hiện trong card mode.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextIndex = cardFields.length + 1;
                onCardFieldsChange([...cardFields, { id: `custom-card-${Date.now()}`, label: `Ô ${nextIndex}`, placeholder: "Bạn muốn viết gì ở đây?" }]);
              }}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${darkMode ? "bg-[var(--accent-soft)] text-[#324038] hover:bg-[#dbe6d8]" : "bg-[var(--accent)] text-[#fcfaf6] hover:bg-[#647a6a]"}`}
            >
              Thêm ô
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {cardFields.map((field, index) => (
              <div key={field.id} className={`rounded-[24px] border p-4 ${darkMode ? "border-white/10 bg-white/4" : "border-[var(--line)] bg-[rgba(255,251,245,0.74)]"}`}>
                <input type="text" value={field.label} onChange={(e) => { const next = [...cardFields]; next[index] = { ...field, label: e.target.value }; onCardFieldsChange(next); }} placeholder="Tên ô" className={`w-full rounded-[18px] border px-4 py-3 outline-none ${fieldClass}`} />
                <textarea rows={3} value={field.placeholder} onChange={(e) => { const next = [...cardFields]; next[index] = { ...field, placeholder: e.target.value }; onCardFieldsChange(next); }} placeholder="Placeholder cho ô" className={`mt-3 w-full rounded-[22px] border px-4 py-4 outline-none ${fieldClass}`} />
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => onCardFieldsChange(cardFields.filter((item) => item.id !== field.id))} className="rounded-full px-3 py-2 text-sm font-medium text-rose-500 transition hover:bg-rose-50">Xóa ô</button>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition disabled:cursor-wait disabled:opacity-75 ${
              darkMode
                ? "border border-white/10 bg-[var(--accent-soft)] text-[#324038] hover:bg-[#dbe6d8]"
                : "bg-[var(--accent)] text-[#fcfaf6] hover:bg-[#647a6a]"
            }`}
          >
            {isSaving ? "Đang lưu..." : saveLabel}
          </button>
          <button
            type="button"
            onClick={() => { onTemplatesChange(defaultTemplates); onCardFieldsChange(defaultCardFields); }}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${darkMode ? "bg-white/6 text-neutral-200 hover:bg-white/10" : "bg-[#f5efe6] text-[#5b5148] hover:bg-[#efe7dc]"}`}
          >
            Khôi phục mặc định
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JournalWorkspace({
  initialSettings,
}: JournalWorkspaceProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedSyncRef = useRef(false);
  const previousBackgroundImageRef = useRef<string | null>(
    initialSettings.backgroundImage,
  );
  const saveRequestIdRef = useRef(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialSettings.themeMode);
  const [writingMode, setWritingMode] = useState<WritingMode>(
    initialSettings.writingMode,
  );
  const [backgroundImage, setBackgroundImage] = useState<string | null>(
    initialSettings.backgroundImage,
  );
  const [templates, setTemplates] = useState<TemplateOption[]>(
    initialSettings.templates,
  );
  const [cardFields, setCardFields] = useState<CardFieldConfig[]>(
    initialSettings.cardFields,
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isMobileToolbarOpen, setIsMobileToolbarOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("saved");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  useEffect(() => {
    setThemeMode(initialSettings.themeMode);
    setWritingMode(initialSettings.writingMode);
    setBackgroundImage(initialSettings.backgroundImage);
    setTemplates(initialSettings.templates);
    setCardFields(initialSettings.cardFields);
    previousBackgroundImageRef.current = initialSettings.backgroundImage;
    setSaveState("saved");
    setSaveErrorMessage("");
  }, [initialSettings]);

  const saveWorkspaceSettings = useCallback(
    async (
      settings: JournalWorkspaceSettings,
      nextState: "saved" | "idle" = "saved",
    ) => {
      const requestId = saveRequestIdRef.current + 1;
      saveRequestIdRef.current = requestId;
      setSaveState("saving");

      try {
        const response = await fetch("/api/journal-workspace-settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            payload?.error ?? "Khong luu duoc cau hinh journal.",
          );
        }

        if (saveRequestIdRef.current === requestId) {
          setSaveErrorMessage("");
          setSaveState(nextState);
        }
      } catch (error) {
        if (saveRequestIdRef.current === requestId) {
          setSaveErrorMessage(
            error instanceof Error
              ? error.message
              : "Khong luu duoc cau hinh journal.",
          );
          setSaveState("error");
        }
      }
    },
    [],
  );

  useEffect(() => {
    const settings = {
      themeMode,
      writingMode,
      backgroundImage,
      templates,
      cardFields,
    } satisfies JournalWorkspaceSettings;
    const localSettings = {
      themeMode,
      writingMode,
      hasBackgroundImage: Boolean(backgroundImage),
      templates,
      cardFields,
    } satisfies LocalWorkspaceSettings;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localSettings));
    } catch {
      // Large images can exceed browser storage quota, so we keep the
      // lightweight preferences in localStorage and rely on DB sync for
      // the full background image payload.
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    const shouldSaveImmediately =
      previousBackgroundImageRef.current !== backgroundImage;
    previousBackgroundImageRef.current = backgroundImage;

    if (!hasMountedSyncRef.current) {
      hasMountedSyncRef.current = true;
      return;
    }

    setSaveState("idle");

    saveTimerRef.current = setTimeout(() => {
      void saveWorkspaceSettings(settings);
    }, shouldSaveImmediately ? 0 : 350);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [themeMode, writingMode, backgroundImage, templates, cardFields, saveWorkspaceSettings]);

  const saveStatusLabel =
    saveState === "saved"
      ? "Đã lưu"
      : saveState === "error"
        ? "Lưu lại"
        : "Lưu cấu hình";

  const handleManualSave = useCallback(() => {
    const settings = {
      themeMode,
      writingMode,
      backgroundImage,
      templates,
      cardFields,
    } satisfies JournalWorkspaceSettings;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    void saveWorkspaceSettings(settings);
  }, [themeMode, writingMode, backgroundImage, templates, cardFields, saveWorkspaceSettings]);

  const shellClasses = useMemo(
    () =>
      themeMode === "dark"
        ? "min-h-screen bg-[linear-gradient(180deg,#121514_0%,#1a1f1d_48%,#111413_100%)] text-[#f6f0e8]"
        : "journal-shell min-h-screen text-[#312c27]",
    [themeMode],
  );

  const shellStyle = backgroundImage
    ? {
        backgroundImage: `${themeMode === "dark" ? "linear-gradient(rgba(12,16,15,0.48), rgba(12,16,15,0.56)), " : "linear-gradient(rgba(250,245,238,0.26), rgba(247,241,232,0.34)), "}url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }
    : undefined;

  const panelClasses =
    themeMode === "dark"
      ? "rounded-[30px] border border-white/10 bg-[rgba(18,20,19,0.88)] text-[#f6f0e8] shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
      : "journal-paper rounded-[30px] text-[#312c27]";
  const mutedClasses = themeMode === "dark" ? "text-[#d5cec4]" : "text-[var(--muted)]";
  const toolbarPanelClass = themeMode === "dark" ? "border-white/10 bg-[rgba(17,20,19,0.96)] text-[#f6f0e8]" : "journal-paper text-[#312c27]";

  return (
    <div className={shellClasses} style={shellStyle}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          optimizeBackgroundImage(file)
            .then((result) => {
              setBackgroundImage(result);
            })
            .catch(() => {
              void readFileAsDataUrl(file).then((result) => {
                setBackgroundImage(result);
              });
            });
        }}
      />

      <div className={`sticky top-0 z-30 hidden border-b px-4 py-3 backdrop-blur-xl md:block ${themeMode === "dark" ? "border-white/8 bg-[rgba(17,20,19,0.74)]" : "border-[var(--line)] bg-[rgba(250,245,238,0.76)]"}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <ToolbarControls
            darkMode={themeMode === "dark"}
            themeMode={themeMode}
            writingMode={writingMode}
            isSaving={saveState === "saving"}
            saveLabel={saveStatusLabel}
            fileInputRef={fileInputRef}
            onComposeNew={() => router.push("/journals/new")}
            onOpenConfig={() => setIsConfigOpen(true)}
            onResetBackground={() => setBackgroundImage(null)}
            onSaveSettings={handleManualSave}
            onThemeModeChange={setThemeMode}
            onWritingModeChange={setWritingMode}
          />
        </div>
      </div>

      <div className="md:hidden">
        <button
          type="button"
          aria-label={isMobileToolbarOpen ? "Đóng thanh công cụ" : "Mở thanh công cụ"}
          onClick={() => setIsMobileToolbarOpen((open) => !open)}
          className={`fixed left-3 top-24 z-40 flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_18px_34px_rgba(77,63,46,0.1)] backdrop-blur-xl transition ${themeMode === "dark" ? "border-white/10 bg-[rgba(20,23,22,0.88)] text-[#f6f0e8]" : "border-[var(--line)] bg-[rgba(255,251,245,0.9)] text-[#5e554d]"}`}
        >
          {isMobileToolbarOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
        <div className={`fixed inset-0 z-30 transition ${isMobileToolbarOpen ? "pointer-events-auto bg-[rgba(25,21,18,0.2)]" : "pointer-events-none bg-transparent"}`} onClick={() => setIsMobileToolbarOpen(false)} />
        <aside className={`fixed inset-y-0 left-0 z-40 w-[18.5rem] border-r px-4 py-20 shadow-[0_22px_80px_rgba(0,0,0,0.14)] transition-transform duration-300 ${isMobileToolbarOpen ? "translate-x-0" : "-translate-x-[105%]"} ${toolbarPanelClass}`}>
          <div className="space-y-3">
            <div>
              <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>Thanh công cụ viết</p>
              <p className={`mt-2 text-sm leading-6 ${mutedClasses}`}>Bạn có thể đóng panel này lại bất cứ lúc nào để giữ không gian viết thật gọn và yên.</p>
            </div>
            <ToolbarControls
              darkMode={themeMode === "dark"}
              themeMode={themeMode}
              writingMode={writingMode}
              isSaving={saveState === "saving"}
              saveLabel={saveStatusLabel}
              fileInputRef={fileInputRef}
              onComposeNew={() => {
                setIsMobileToolbarOpen(false);
                router.push("/journals/new");
              }}
              onOpenConfig={() => {
                setIsMobileToolbarOpen(false);
                setIsConfigOpen(true);
              }}
              onResetBackground={() => setBackgroundImage(null)}
              onSaveSettings={() => {
                setIsMobileToolbarOpen(false);
                handleManualSave();
              }}
              onThemeModeChange={setThemeMode}
              onWritingModeChange={(value) => {
                setWritingMode(value);
                setIsMobileToolbarOpen(false);
              }}
              mobile
            />
          </div>
        </aside>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8 md:pb-24 md:pt-16">
        {saveState === "error" && saveErrorMessage ? (
          <div
            className={`mx-auto mb-6 max-w-5xl rounded-[22px] border px-4 py-3 text-sm ${
              themeMode === "dark"
                ? "border-rose-400/20 bg-rose-950/30 text-rose-100"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            Chưa lưu được cấu hình: {saveErrorMessage}
          </div>
        ) : null}
        {writingMode === "focus" && (
          <section className={`mx-auto max-w-5xl px-5 py-7 md:px-10 md:py-10 ${panelClasses}`}>
            <div className="mx-auto max-w-4xl">
              <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>Focus mode</p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none md:text-6xl">Write a New Journal</h1>
              <p className={`mt-4 max-w-2xl text-base leading-8 ${mutedClasses}`}>Một không gian yên tĩnh để bạn viết liền mạch, ít xao nhãng và đủ ấm áp để ở lại với suy nghĩ của mình lâu hơn một chút.</p>
              <div className="mt-8">
                <JournalComposer mode="focus" darkMode={themeMode === "dark"} minEditorHeight="420px" templates={templates} cardFields={cardFields} />
              </div>
            </div>
          </section>
        )}

        {writingMode === "notebook" && (
          <section className={`mx-auto max-w-6xl overflow-hidden ${panelClasses}`}>
            <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
              <div className={`relative border-b px-8 py-10 lg:border-b-0 lg:border-r lg:px-10 ${themeMode === "dark" ? "border-white/10 bg-[linear-gradient(180deg,rgba(30,31,29,0.96),rgba(20,20,18,0.94))]" : "bg-[linear-gradient(180deg,#f4ead8,#fbf6ee)]"}`}>
                <div className={`absolute inset-y-0 left-8 w-px ${themeMode === "dark" ? "bg-[#c4ae8c]/16" : "bg-[#cba59d]/55"}`} />
                <p className={`hand-accent pl-8 text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>The left page</p>
                <h1 className="serif-display mt-4 pl-8 text-5xl font-semibold leading-none">Sổ tay hôm nay</h1>
                <p className={`mt-5 max-w-md pl-8 text-base leading-8 ${mutedClasses}`}>Có lề giấy, có nhịp thở và có cảm giác như đang mở một cuốn sổ riêng vào buổi sáng yên. Mode này thiên về cảm xúc và sự chậm rãi.</p>
              </div>
              <div className={`px-7 py-10 lg:px-10 ${themeMode === "dark" ? "bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.018)_0px,rgba(255,255,255,0.018)_39px,rgba(255,255,255,0.07)_40px)]" : "bg-[repeating-linear-gradient(180deg,rgba(255,252,247,0.92)_0px,rgba(255,252,247,0.92)_39px,rgba(129,156,185,0.14)_40px)]"}`}>
                <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>The writing page</p>
                <div className="mt-5">
                  <JournalComposer compact mode="notebook" darkMode={themeMode === "dark"} minEditorHeight="420px" templates={templates} cardFields={cardFields} />
                </div>
              </div>
            </div>
          </section>
        )}

        {writingMode === "cards" && (
          <section className={`mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8 ${panelClasses}`}>
            <div className="max-w-5xl">
              <p className={`hand-accent text-sm ${themeMode === "dark" ? "text-[#ccb690]" : "text-[var(--gold-soft)]"}`}>Card mode</p>
              <h1 className="serif-display mt-3 text-4xl font-semibold leading-none md:text-6xl">Guided Journal Flow</h1>
              <p className={`mt-4 max-w-3xl text-base leading-8 ${mutedClasses}`}>Khi bạn không muốn nhìn vào một khối chữ dài ngay từ đầu, mode này chia trải nghiệm viết thành từng card nhỏ để bạn có thể tùy chỉnh theo cách riêng.</p>
            </div>
            <div className="mt-8">
              <JournalComposer mode="cards" darkMode={themeMode === "dark"} minEditorHeight="320px" templates={templates} cardFields={cardFields} />
            </div>
          </section>
        )}
      </main>

      {isConfigOpen && (
        <ConfigSheet
          darkMode={themeMode === "dark"}
          isSaving={saveState === "saving"}
          saveLabel={saveStatusLabel}
          templates={templates}
          cardFields={cardFields}
          onClose={() => setIsConfigOpen(false)}
          onSave={handleManualSave}
          onTemplatesChange={setTemplates}
          onCardFieldsChange={setCardFields}
        />
      )}
    </div>
  );
}
