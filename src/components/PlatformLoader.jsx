import "./platform-loader.css";

/** Shared branded progress indicator. The label is announced to assistive technology. */
export default function PlatformLoader({ label = "Loading…", size = "normal", showLabel = true }) {
  return (
    <span className={`platform-loader platform-loader--${size}`} role="status" aria-label={label}>
      <span className="platform-loader__graphic" aria-hidden="true">
        <span className="platform-loader__ring platform-loader__ring--outer" />
        <span className="platform-loader__ring platform-loader__ring--middle" />
        <span className="platform-loader__ring platform-loader__ring--inner" />
        <img src="/tf-logo.png" alt="" />
      </span>
      {showLabel && <span className="platform-loader__label">{label}</span>}
    </span>
  );
}
