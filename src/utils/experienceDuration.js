// Merge overlapping roles so concurrent employment is counted once.
export function experienceDuration(records, until = new Date()) {
  const cutoff = Date.UTC(until.getFullYear(), until.getMonth(), until.getDate());
  const intervals = records.flatMap(record => {
    const start = Date.parse(record.startDate);
    const end = record.isCurrent ? cutoff : Date.parse(record.endDate);
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? [[start, Math.min(end, cutoff)]] : [];
  }).filter(([start, end]) => end >= start).sort((a,b) => a[0] - b[0]);
  const merged = [];
  for (const interval of intervals) {
    const last = merged.at(-1);
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push([...interval]);
  }
  const months = merged.reduce((sum, [start, end]) => {
    const a = new Date(start), b = new Date(end);
    return sum + Math.max(0, (b.getUTCFullYear()-a.getUTCFullYear())*12 + b.getUTCMonth()-a.getUTCMonth() - (b.getUTCDate() < a.getUTCDate() ? 1 : 0));
  }, 0);
  const years = Math.floor(months / 12), remainder = months % 12;
  return years ? `${years} yr${remainder ? ` ${remainder} mo` : ""}` : months ? `${months} mo` : merged.some(([a,b]) => b > a) ? "<1 mo" : "0 mo";
}
