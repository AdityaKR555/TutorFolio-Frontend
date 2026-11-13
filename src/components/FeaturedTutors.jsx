import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function FeaturedTutors() {
  const [tutors, setTutors] = useState([]);
  const [failedPhotos, setFailedPhotos] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    // Public request deliberately excludes the dashboard's auth/refresh interceptors.
    axios.get(`${(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "")}/search/tutors/featured`, {
      params: { limit: 12 }, timeout: 12000, signal: controller.signal,
    }).then(({data}) => {
      if (controller.signal.aborted) return;
      if (data?.status !== 200 || !Array.isArray(data.data)) throw new Error("Unable to load tutors");
      setTutors(data.data.filter(tutor => typeof tutor.profilePicture === "string" && tutor.profilePicture.trim()));
      setFailedPhotos([]);
      setStatus("ready");
    }).catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [attempt]);

  const visibleTutors = tutors.filter(tutor => !failedPhotos.includes(tutor.username));

  return <section id="meet-tutors" className="border-y border-tf-line bg-tf-surface-soft/60 px-5 py-20 sm:px-8 lg:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div><p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-blue-600">Meet the educators</p><h2 className="tf-d text-3xl font-bold tracking-tight text-tf-ink sm:text-4xl">A teacher for your next chapter.</h2><p className="mt-4 max-w-xl text-base leading-relaxed text-tf-copy">Explore a fresh selection of tutors sharing their knowledge, experience, and classrooms with the world.</p></div>
        <Link to="/signup" className="tf-button-secondary">Join as a tutor <span aria-hidden="true">↗</span></Link>
      </div>
      {status === "loading" ? <div role="status" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="h-64 animate-pulse rounded-2xl border border-tf-line bg-white motion-reduce:animate-none"/>)}<span className="sr-only">Loading tutor profiles…</span></div>
        : status === "error" ? <div role="status" className="rounded-2xl border border-tf-line bg-white p-8 text-center"><p className="text-tf-copy">Tutor profiles are taking a little longer to load.</p><button type="button" className="tf-button-secondary mt-4" onClick={()=>{setStatus("loading");setAttempt(value=>value+1);}}>Try again</button></div>
        : !visibleTutors.length ? <div className="rounded-2xl border border-tf-line bg-white p-8 text-center"><p className="font-semibold text-tf-ink">Great teaching stories are on their way.</p><p className="mt-2 text-sm text-tf-copy">Create your profile and be among the first tutors featured here.</p></div>
        : <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 ${visibleTutors.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>{visibleTutors.map((tutor,index)=> {
          const name = [tutor.firstName,tutor.lastName].filter(Boolean).join(" ") || tutor.username;
          return <Link key={tutor.username} to={`/tutor/${encodeURIComponent(tutor.username)}`} className="featured-tutor group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-tf-line bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 motion-reduce:transform-none" style={{animationDelay:`${Math.min(index,7)*65}ms`}}>
            <div className="aspect-[4/3] overflow-hidden bg-blue-50"><img src={tutor.profilePicture} alt={name} loading="lazy" onError={() => setFailedPhotos(current => current.includes(tutor.username) ? current : [...current, tutor.username])} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
            <div className="flex flex-1 flex-col p-4"><h3 className="truncate text-base font-semibold text-tf-ink">{name}</h3><p className="mt-1 truncate text-xs text-blue-600">{tutor.tuitionName || "Independent tutor"}</p>{tutor.teachingSubjects && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-tf-copy">{tutor.teachingSubjects}</p>}
              <p className="mt-3 truncate text-xs text-tf-muted">{[tutor.city,tutor.state].filter(Boolean).join(", ") || "Explore their teaching profile"}</p><span className="mt-auto pt-4 text-xs font-semibold text-blue-600">View profile <span aria-hidden="true">↗</span></span>
            </div>
          </Link>;
        })}</div>}
    </div>
  </section>;
}
