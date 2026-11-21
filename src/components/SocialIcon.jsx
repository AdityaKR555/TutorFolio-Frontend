import React from "react";
import { socialBrandPaths } from "./socialBrandPaths";

// Artwork is shared; callers own the surrounding UI and choose its color/size.
export default function SocialIcon({ platform, className = "h-5 w-5", label, style }) {
  const key = String(platform || "").toLowerCase();
  const brand = key === "twitter" ? "x" : key;
  const paths = socialBrandPaths[brand];
  if (!paths) return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false"><path d="M14 3h7v7m0-7L10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" stroke="none" data-social-brand={brand} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
    {paths.map((path, index) => <path key={index} d={path} />)}
  </svg>;
}
