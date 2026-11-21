export function getWebsiteTitle(tuition = {}, profile = {}) {
  const firstValue = (source, keys) => keys.map((key) => String(source[key] ?? "").trim()).find(Boolean);
  return firstValue(tuition, ["tuitionName", "tuitionClassName", "academyName"])
    || [firstValue(profile, ["firstName", "first_name"]), firstValue(profile, ["lastName", "last_name"])].filter(Boolean).join(" ")
    || firstValue(profile, ["fullName", "name", "tutorName", "displayName", "username"])
    || "Tutor";
}
