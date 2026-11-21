import React, { useState } from "react";

export default function TuitionLogo({ tuition = {}, name = "Tuition", className = "h-9 w-9", fallback }) {
  const src = tuition.logo || tuition.logoUrl || tuition.logo_url || tuition.tuitionLogo || tuition.tuition_logo;
  const [failed, setFailed] = useState("");
  if (!src || failed === src) return fallback !== undefined ? fallback : <span aria-hidden="true" className={`${className} inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700`}>{name.trim().charAt(0).toUpperCase() || "T"}</span>;
  return <img src={src} alt={`${name} logo`} onError={() => setFailed(src)} className={`${className} shrink-0 rounded-lg bg-white object-contain p-0.5`} />;
}
