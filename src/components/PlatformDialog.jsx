import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const queue = [];
let notify = () => {};
function requestDialog(message, confirm) {
  return new Promise((resolve) => { queue.push({ message: String(message), confirm, resolve }); notify(); });
}
export const confirmAction = (message) => requestDialog(message, true);
export const showMessage = (message) => requestDialog(message, false);

export default function PlatformDialog() {
  const [current, setCurrent] = useState(null);
  const dialog = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    const next = () => setCurrent((existing) => existing || queue[0] || null);
    notify = next;
    next();
    return () => { notify = () => {}; };
  }, []);
  useEffect(() => {
    if (!current || !dialog.current) return;
    previousFocus.current = document.activeElement;
    dialog.current.showModal();
    dialog.current.querySelector("button")?.focus();
  }, [current]);
  const close = (answer) => {
    dialog.current?.close();
    const finished = queue.shift();
    finished?.resolve(answer);
    setCurrent(queue[0] || null);
    if (!queue.length) previousFocus.current?.focus();
  };
  if (!current) return null;
  return createPortal(<dialog ref={dialog} aria-labelledby="platform-dialog-title" aria-describedby="platform-dialog-message" onCancel={(event) => { event.preventDefault(); close(false); }} className="platform-confirm m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-tf-line bg-tf-surface p-6 text-tf-ink shadow-xl backdrop:bg-black/60">
    <h2 id="platform-dialog-title" className="text-lg font-bold">{current.confirm ? "Please confirm" : "Notice"}</h2>
    <p id="platform-dialog-message" className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-tf-copy">{current.message}</p>
    <div className="mt-6 flex justify-end gap-3">
      {current.confirm && <button type="button" onClick={() => close(false)} className="rounded-xl border border-tf-line bg-tf-surface px-4 py-2 text-sm font-semibold text-tf-copy hover:bg-tf-surface-soft">Cancel</button>}
      <button type="button" onClick={() => close(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${current.confirm ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}>{current.confirm ? "Confirm" : "OK"}</button>
    </div>
  </dialog>, document.body);
}
