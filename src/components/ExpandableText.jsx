import React, { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Compact long user supplied copy while keeping the full text available on demand. */
export default function ExpandableText({
  children,
  lines = 3,
  className = "",
  containerClassName = "",
  buttonClassName = "",
  moreLabel = "View more",
  lessLabel = "View less",
  preserveWhitespace = false,
}) {
  const text = children == null ? "" : String(children);
  const paragraphRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  const measure = useCallback(() => {
    const node = paragraphRef.current;
    if (!node || expanded) return;
    setClamped(node.scrollHeight > node.clientHeight + 1);
  }, [expanded]);

  useLayoutEffect(() => {
    measure();
    const node = paragraphRef.current;
    if (!node) return undefined;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, text, lines]);

  if (!text) return null;

  return (
    <div className={`min-w-0 ${containerClassName}`}>
      <p
        ref={paragraphRef}
        className={`${preserveWhitespace ? "whitespace-pre-wrap" : ""} [overflow-wrap:anywhere] ${className}`}
        style={expanded ? undefined : {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lines,
          overflow: "hidden",
        }}
      >
        {text}
      </p>
      {clamped && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={`mt-1 inline-flex min-h-8 items-center rounded-md text-xs font-semibold text-sky-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600 dark:text-sky-300 ${buttonClassName}`}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
