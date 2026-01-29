type InlineNoticeProps = {
  tone?: "error" | "info";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function InlineNotice({
  tone = "info",
  message,
  actionLabel,
  onAction,
}: InlineNoticeProps) {
  const styles =
    tone === "error"
      ? "border-rose-300/50 bg-rose-50 text-rose-900"
      : "border-sky-300/50 bg-sky-50 text-sky-900";

  return (
    <div className={`rounded-2xl border p-3 text-sm ${styles}`} role="status">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">{message}</div>
        {actionLabel && onAction && (
          <button
            type="button"
            className="shrink-0 text-xs font-semibold underline underline-offset-2"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
