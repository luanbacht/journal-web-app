"use client";

import { deleteJournal } from "@/app/journals/actions";

export default function DeleteJournalButton({
  journalId,
}: {
  journalId: string;
}) {
  return (
    <form
      action={deleteJournal}
      onSubmit={(e) => {
        const accepted = window.confirm(
          "Bạn có chắc muốn xóa journal này không? Hành động này không thể hoàn tác.",
        );

        if (!accepted) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="journalId" value={journalId} />
      <button
        type="submit"
        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
      >
        Xóa journal
      </button>
    </form>
  );
}
