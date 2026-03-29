export default function Loading() {
  return (
    <main className="journal-shell journal-loader-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="journal-paper journal-loader-card relative w-full max-w-xl rounded-[32px] px-8 py-10 text-center shadow-[0_24px_80px_rgba(77,63,46,0.08)]">
        <div className="mx-auto flex w-fit items-center justify-center">
          <div className="journal-loader-book">
            <span className="journal-loader-page" />
          </div>
        </div>

        <p className="hand-accent mt-6 text-sm text-[var(--gold-soft)]">
          Journal Day đang mở trang tiếp theo
        </p>
        <h2 className="serif-display mt-3 text-4xl font-medium text-[#2f2924]">
          Chờ mình một chút nhé
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--muted)]">
          Mình đang sắp lại trang giấy, làm dịu giao diện và mang phần nội dung
          tiếp theo đến thật nhẹ nhàng.
        </p>

        <div className="journal-loader-dots mt-6 justify-center">
          <span className="journal-loader-dot" />
          <span className="journal-loader-dot" />
          <span className="journal-loader-dot" />
        </div>
      </section>
    </main>
  );
}
