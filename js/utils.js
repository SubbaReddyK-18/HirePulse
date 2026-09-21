export const APPLICATION_STATUSES = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview",
  "Selected",
  "Rejected"
];

export const EXPERIENCE_OPTIONS = [
  "0-1 years",
  "1-3 years",
  "3-5 years",
  "5+ years"
];

export function sameId(a, b) {
  return String(a) === String(b);
}

export function formatSalary(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "Not specified";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function parseSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getQueryParam(name) {
  const urlParam = new URLSearchParams(window.location.search).get(name);
  if (urlParam) {
    try {
      sessionStorage.setItem("param_" + name, urlParam);
    } catch (_) {}
    return urlParam;
  }
  try {
    return sessionStorage.getItem("param_" + name) || null;
  } catch (_) {
    return null;
  }
}

export function statusClass(status) {
  return String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export function countByStatus(applications) {
  const counts = {};
  APPLICATION_STATUSES.forEach((status) => {
    counts[status] = 0;
  });
  applications.forEach((application) => {
    if (counts[application.status] === undefined) {
      counts[application.status] = 0;
    }
    counts[application.status] += 1;
  });
  return counts;
}

export function sortByDateDesc(items, field) {
  return [...items].sort((a, b) => String(b[field] || "").localeCompare(String(a[field] || "")));
}

export function uniqueValues(items, field) {
  return [...new Set(items.map((item) => item[field]).filter(Boolean))].sort();
}
