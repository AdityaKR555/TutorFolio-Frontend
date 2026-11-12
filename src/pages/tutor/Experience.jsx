import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, Plus, Pencil, Trash2, CalendarDays, Search, Globe, CheckCircle2 } from "lucide-react";
import ExperienceArt from "./ExperienceArt";
import { experienceDuration } from "../../utils/experienceDuration";
import api from "../../api/axios";
import { getStoredUser } from "../../utils/auth";
import ExpandableText from "../../components/ExpandableText";

const empty = { title: "", description: "", startDate: "", endDate: "", isCurrent: false, visibleOnWebsite: true };
const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-tf-line bg-tf-surface px-4 py-2.5 text-sm font-medium text-tf-copy hover:bg-tf-surface-soft disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--tf-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
const field = "mt-2 w-full rounded-xl border border-tf-line bg-tf-surface px-3 py-2.5 text-sm text-tf-ink focus:outline-2 focus:outline-[var(--tf-blue)]";
const today = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`; };
const dateLabel = value => value ? new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString(undefined, {month: "short", year: "numeric"}) : "Not specified";
const errorMessage = err => { const detail = err.response?.data?.detail; return Array.isArray(detail) ? detail.map(item => item.msg).join(". ") : detail || err.message || "Please try again."; };
const checked = data => { if (![200,201].includes(data?.status)) throw new Error(data?.message || "Request failed"); return data; };
export default function Experience() {
  const user = getStoredUser();
  const userId = user?.user_id ?? user?.userId ?? user?.id;
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const formDialog = useRef(null);
  const deleteDialog = useRef(null);
  useEffect(() => {
    let active = true;
    if (!userId) return;
    api.get(`/experience/getAll/${userId}`).then(({data}) => { checked(data); if(active) setRecords(data.data || data.details || []); }).catch(err => { if(active) setError(errorMessage(err)); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);
  useEffect(() => { if(editing) formDialog.current?.showModal(); }, [editing]);
  useEffect(() => { if(deleting) deleteDialog.current?.showModal(); }, [deleting]);
  async function refresh() {
    const {data} = await api.get(`/experience/getAll/${userId}`);
    setRecords(checked(data).data || data.details || []);
  }
  const otherCurrent = records.find(item => item.isCurrent && item.experienceId !== editing?.experienceId);
  function open(item) {
    setForm(item ? { ...empty, ...item, description: item.description || "", startDate: item.startDate?.slice(0,10) || "", endDate: item.endDate?.slice(0,10) || "" } : {...empty});
    setFormError(""); setEditing(item || {});
  }
  async function save(event) {
    event.preventDefault(); setFormError("");
    if (!form.title.trim()) { setFormError("Enter a job title."); return; }
    if (!form.startDate || form.startDate > today()) { setFormError("Choose a start date on or before today."); return; }
    if (!form.isCurrent && (!form.endDate || form.endDate < form.startDate || form.endDate > today())) { setFormError("A closed job needs an end date between its start date and today."); return; }
    if (form.isCurrent && otherCurrent) { setFormError("Close your existing current job first."); return; }
    setBusy(true);
    const payload = { title: form.title.trim(), description: form.description.trim(), startDate: form.startDate, endDate: form.isCurrent ? null : form.endDate, isCurrent: form.isCurrent, visibleOnWebsite: form.visibleOnWebsite };
    try {
      const response = editing.experienceId ? await api.put(`/experience/${editing.experienceId}`, payload) : await api.post("/experience/new", {...payload, userId: Number(userId)});
      checked(response.data); await refresh(); setEditing(null); setNotice("Experience saved."); setError("");
    } catch(err) { setFormError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try { checked((await api.delete(`/experience/${deleting.experienceId}`)).data); setRecords(items => items.filter(item => item.experienceId !== deleting.experienceId)); setDeleting(null); setNotice("Experience deleted."); }
    catch(err) { setError(errorMessage(err)); setDeleting(null); }
    finally { setBusy(false); }
  }
  async function visibility(item) {
    setBusy(true); setError("");
    try { checked((await api.patch(`/experience/visibility/${item.experienceId}`, {visibleOnWebsite: !item.visibleOnWebsite})).data); setRecords(items => items.map(record => record.experienceId === item.experienceId ? {...record, visibleOnWebsite: !item.visibleOnWebsite} : record)); }
    catch(err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  const shown = records.filter(item => (item.title || "").toLowerCase().includes(query.trim().toLowerCase()) && (filter === "all" || (filter === "current" ? item.isCurrent : !item.isCurrent))).sort((a,b) => sort === "title" ? a.title.localeCompare(b.title) : sort === "date_asc" ? (a.startDate || "").localeCompare(b.startDate || "") : (b.startDate || "").localeCompare(a.startDate || ""));
  return <div className="mx-auto max-w-7xl p-5 text-tf-ink sm:p-8">
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Experience</h1><p className="mt-2 text-sm text-tf-copy">Build your professional story and choose what appears on your website.</p></div><button disabled={loading || !userId} className={primary} onClick={() => open(null)}><Plus size={18}/>Add experience</button></header>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}<div role="status">{notice && <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900"><CheckCircle2 size={18}/>{notice}</p>}</div>
    <section aria-label="Experience summary" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Total roles",records.length,"roles","#8b5cf6"],["Currently working",records.filter(item => item.isCurrent).length,"current","#10b981"],["Visible on website",records.filter(item => item.visibleOnWebsite).length,"visible","#06b6d4"],["Total experience",experienceDuration(records),"duration","#f59e0b"]].map(([label,value,type,color]) => <div key={label} style={{borderColor:`${color}40`, color}} className="relative min-h-40 overflow-hidden rounded-2xl border bg-tf-surface p-5 shadow-[0_4px_15px_-10px_rgb(15_23_42_/_15%)]"><p className="relative z-10 text-sm font-medium text-tf-ink">{label}</p><p title={type === "duration" ? "Completed months across all roles; overlapping periods counted once" : undefined} className={`relative z-10 mt-3 font-bold tracking-tight text-tf-ink ${type === "duration" ? "text-3xl" : "text-4xl"}`}>{loading ? "—" : value}</p><ExperienceArt type={type}/></div>)}</section>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-xl border border-tf-line bg-tf-surface-soft p-1">{["all","current","closed"].map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-lg px-4 py-2 text-sm capitalize ${filter === value ? "bg-tf-sky text-tf-blue shadow-sm" : "text-tf-copy"}`}>{value === "all" ? <>All roles <span className="ml-1.5 rounded-full bg-tf-sky px-2 py-0.5 text-xs text-tf-blue">{records.length}</span></> : value}</button>)}</div><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2 rounded-xl border border-tf-line bg-tf-surface px-3"><Search size={16}/><input aria-label="Search experience" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search job titles" className="w-40 bg-transparent py-2.5 text-sm outline-none"/></label><select aria-label="Sort experience" value={sort} onChange={event => setSort(event.target.value)} className={button}><option value="date_desc">Newest first</option><option value="date_asc">Oldest first</option><option value="title">Title A–Z</option></select></div></div>
    {loading ? <p role="status" className="py-12 text-center text-tf-copy">Loading experience…</p> : shown.length ? <div className="space-y-4">{shown.map(item => <article key={item.experienceId} className="relative isolate overflow-hidden rounded-2xl border border-tf-line bg-tf-surface p-5 shadow-[0_5px_18px_-12px_rgb(15_23_42_/_20%)] sm:p-6">
      <svg aria-hidden="true" viewBox="0 0 500 65" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 right-0 -z-10 h-12 w-2/5 text-cyan-400 opacity-[.08]"><path d="M0 65q70-40 130-20T260 26T390 20T500 30v35Z" fill="currentColor"/><path d="M60 65q90-35 170-20T350 20T500 30v35Z" fill="#0ea5e9"/></svg>
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-tf-sky to-tf-surface-soft text-tf-blue sm:h-16 sm:w-16"><BriefcaseBusiness size={30} strokeWidth={1.6}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-4 gap-y-2"><h2 className="break-words text-xl font-bold sm:text-2xl">{item.title}</h2><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isCurrent ? "bg-emerald-100 text-emerald-800" : "bg-tf-surface-soft text-tf-copy"}`}>{item.isCurrent ? "Currently working" : "Closed"}</span></div><p className="mt-2 flex items-center gap-2 text-sm text-tf-copy"><CalendarDays size={17} className="shrink-0"/>{dateLabel(item.startDate)} – {item.isCurrent ? "Present" : dateLabel(item.endDate)}</p>{item.description && <ExpandableText lines={3} preserveWhitespace className="mt-2 text-sm leading-6 text-tf-copy">{item.description}</ExpandableText>}</div></div><div className="flex gap-2"><button disabled={busy} className={button} onClick={() => open(item)}><Pencil size={17}/>Edit</button><button disabled={busy} aria-label={`Delete ${item.title}`} title="Delete experience" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50/60 text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400" onClick={() => setDeleting(item)}><Trash2 size={18}/></button></div></div>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-tf-line pt-4"><span className="inline-flex items-center gap-3 text-sm text-tf-copy"><Globe size={20}/>{item.visibleOnWebsite ? "Visible on website" : "Hidden from website"}</span><button type="button" role="switch" aria-checked={item.visibleOnWebsite} aria-label={`Visible on website: ${item.title}`} disabled={busy} onClick={() => visibility(item)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--tf-blue)] disabled:opacity-50 ${item.visibleOnWebsite ? "bg-[var(--tf-blue)]" : "bg-slate-300 dark:bg-slate-600"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${item.visibleOnWebsite ? "translate-x-5" : "translate-x-0"}`}/></button></div>
    </article>)}</div> : <div className="rounded-2xl border border-dashed border-tf-line bg-tf-surface px-5 py-14 text-center"><BriefcaseBusiness size={36} className="mx-auto text-tf-muted"/><h2 className="mt-4 text-lg font-semibold">{records.length ? "No matching roles" : "Your teaching journey starts here"}</h2><p className="mt-2 text-sm text-tf-copy">{records.length ? "Try another search or filter." : "Add your current position or a previous role."}</p></div>}
    {editing && <dialog ref={formDialog} aria-labelledby="experience-form-title" onCancel={event => { if(busy) event.preventDefault(); else setEditing(null); }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-2xl border border-tf-line bg-tf-surface p-6 text-tf-ink shadow-xl backdrop:bg-black/40"><form onSubmit={save}><div className="flex items-center justify-between"><h2 id="experience-form-title" className="text-xl font-semibold">{editing.experienceId ? "Edit experience" : "Add experience"}</h2><button type="button" disabled={busy} aria-label="Close form" onClick={() => setEditing(null)} className="px-3 py-1 text-2xl">×</button></div><p className="mt-2 text-sm text-tf-copy">Only one job can be marked as currently working.</p>{formError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{formError}</p>}<fieldset disabled={busy} className="mt-5 space-y-4"><label className="block text-sm font-medium">Job title <span className="text-red-600">*</span><input autoFocus required maxLength={255} value={form.title} onChange={event => setForm({...form,title:event.target.value})} placeholder="e.g. Senior Mathematics Teacher" className={field}/></label><label className="block text-sm font-medium">Responsibilities and highlights<textarea maxLength={5000} rows={4} value={form.description} onChange={event => setForm({...form,description:event.target.value})} className={field}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Start date *<input type="date" required max={today()} value={form.startDate} onChange={event => setForm({...form,startDate:event.target.value})} className={field}/></label><label className="text-sm font-medium">End date {!form.isCurrent && "*"}<input type="date" required={!form.isCurrent} disabled={form.isCurrent} min={form.startDate} max={today()} value={form.isCurrent ? "" : form.endDate} onChange={event => setForm({...form,endDate:event.target.value})} className={`${field} disabled:opacity-40`}/></label></div><label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={Boolean(otherCurrent)} checked={form.isCurrent} onChange={event => setForm({...form,isCurrent:event.target.checked,endDate:""})}/>I currently work here</label>{otherCurrent && <p className="rounded-xl bg-tf-sky p-3 text-xs leading-5 text-tf-copy">“{otherCurrent.title}” is your current job. Edit that record and enter its end date before marking another job current.</p>}<label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.visibleOnWebsite} onChange={event => setForm({...form,visibleOnWebsite:event.target.checked})}/>Show on my public website</label></fieldset><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} className={button} onClick={() => setEditing(null)}>Cancel</button><button disabled={busy} type="submit" className={primary}>{busy ? "Saving…" : "Save experience"}</button></div></form></dialog>}
    {deleting && <dialog ref={deleteDialog} aria-labelledby="experience-delete-title" onCancel={event => { if(busy) event.preventDefault(); else setDeleting(null); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-tf-line bg-tf-surface p-6 text-tf-ink shadow-xl backdrop:bg-black/40"><h2 id="experience-delete-title" className="text-xl font-semibold">Delete experience?</h2><p className="mt-3 break-words text-sm text-tf-copy">“{deleting.title}” will be removed from your experience list and public website.</p><div className="mt-6 flex justify-end gap-3"><button disabled={busy} className={button} onClick={() => setDeleting(null)}>Cancel</button><button disabled={busy} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white" onClick={remove}>{busy ? "Deleting…" : "Delete"}</button></div></dialog>}
  </div>;
}
