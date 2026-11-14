import PlatformLoader from "./PlatformLoader";
/** Shared empty/loading presentation for platform metric cards. */
function EmptyIllustration({ kind = "records" }) {
  return (
    <svg viewBox="0 0 180 100" className="h-16 w-28 shrink-0" aria-hidden="true" focusable="false">
      <ellipse cx="90" cy="91" rx="72" ry="6" fill="var(--tf-blue)" opacity=".1" />
      <path d="M30 70C10 43 35 13 65 19s35-17 62-5 45 41 20 63Z" fill="var(--tf-sky)" />
      <circle cx="141" cy="26" r="7" fill="#fbbf24" opacity=".7" />
      <path d="M151 82V57m0 11c-18-2-19-13-19-13 15 0 19 13 19 13Zm0-4c17-5 17-17 17-17-14 4-17 17-17 17Z" fill="#34b399" />
      <path d="M141 80h21l-4 12h-13Z" fill="#64748b" />
      <rect x="39" y="29" width="91" height="60" rx="8" fill="var(--tf-surface)" stroke="var(--tf-blue)" strokeWidth="1.5" />
      <rect x="39" y="29" width="91" height="12" rx="6" fill="var(--tf-blue)" opacity=".2" />
      <circle cx="47" cy="35" r="1.5" fill="var(--tf-blue)" /><circle cx="53" cy="35" r="1.5" fill="var(--tf-blue)" />
      {kind === "rating" ? <><path d="m84 46 6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2Z" fill="#fbbf24" stroke="#d97706" /><path d="m112 47 2 4 5 1-4 3 1 4-4-2-4 2 1-4-3-3 4-1Z" fill="#fde68a" /></>
        : kind === "people" ? <><circle cx="75" cy="57" r="8" fill="#93c5fd" /><path d="M59 82v-5c0-15 32-15 32 0v5" fill="#60a5fa" /><circle cx="104" cy="60" r="6" fill="#a7f3d0" /><path d="M94 82v-5c0-11 23-11 23 0v5" fill="#34d399" /></>
        : kind === "gallery" ? <><rect x="53" y="47" width="63" height="34" rx="4" fill="#dbeafe" /><circle cx="99" cy="56" r="5" fill="#fbbf24" /><path d="m54 78 18-21 15 17 9-9 20 15H54Z" fill="#60a5fa" /><path d="m58 80 14-13 12 13Z" fill="#34d399" /></>
        : kind === "messages" ? <><path d="M54 48h59v25H83L70 83V73H54Z" fill="#bfdbfe" stroke="#60a5fa" /><path d="M64 56h36M64 63h23" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" /></>
        : <><path d="M56 51q16-6 29 1 13-7 29-1v28q-16-5-29 1-13-6-29-1Z" fill="#bfdbfe" stroke="#60a5fa" /><path d="M85 52v28M63 59l14 1m-14 6 14 1m17-7 12-1m-12 8 12-1" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" /></>}
      <path d="m25 33 3-5 3 5-3 5Z" fill="#a78bfa" /><circle cx="25" cy="76" r="3" fill="#93c5fd" />
    </svg>
  );
}

export default function KpiState({ empty, loading = false, unavailable = false, label, message, kind, children }) {
  if (loading) return <div className="flex min-h-28 items-center justify-center"><PlatformLoader size="small" label={`Loading ${label}…`} /></div>;
  if (!unavailable && !empty) return children;
  return (
    <div className="kpi-empty-state relative z-10 flex min-h-28 w-full flex-col items-center justify-center gap-1.5 text-center" role={loading ? "status" : undefined}>
      <EmptyIllustration kind={kind} />
      <p className="m-0 text-xs font-semibold text-tf-ink">{label}</p>
      <p className="m-0 max-w-[24ch] text-xs leading-relaxed text-tf-copy">{loading ? "Loading your summary…" : unavailable ? "Summary unavailable. Please refresh." : message || "Nothing here yet"}</p>
    </div>
  );
}
