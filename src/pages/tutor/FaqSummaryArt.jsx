import AchievementSummaryArt from "./AchievementSummaryArt";
export default function FaqSummaryArt({ type }) {
  if (type !== "total") return <AchievementSummaryArt type={type}/>;
  return <svg aria-hidden="true" viewBox="0 0 200 125" className="pointer-events-none absolute bottom-0 right-0 h-28 w-44" fill="none"><path d="M0 125c43-30 70-12 104-38s60-28 96-20v58Z" fill="#38bdf8" opacity=".12"/><path d="M103 28h66v47h-12v15l-19-15h-35V28Z" fill="#bae6fd" stroke="#7dd3fc" strokeWidth="2"/><path d="M48 51h90v48H80l-19 16V99H48V51Z" fill="#38bdf8"/><path d="M82 65a10 10 0 1 1 16 9c-6 3-6 3-6 8" stroke="white" strokeWidth="4" strokeLinecap="round"/><circle cx="92" cy="90" r="2.5" fill="white"/><path d="M119 42h33m-33 9h23" stroke="white" strokeWidth="4" strokeLinecap="round"/><circle cx="168" cy="99" r="13" fill="#14b8a6"/><path d="m162 99 4 4 8-9" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>;
}
