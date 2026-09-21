import { getJobs } from "./service/jobService.js";
import { getApplicationsByUser } from "./service/applicationService.js";
import { initLayout } from "./main.js";
import { countByStatus, escapeHtml, formatDate, sortByDateDesc, statusClass } from "./utils.js";
import { getUserFacingError, renderEmpty, renderError, renderLoading } from "./ui.js";

function renderStatusCards(counts) {
  return Object.entries(counts)
    .map(
      ([status, count]) => `
        <article class="stat-card">
          <p>${escapeHtml(status)}</p>
          <strong>${count}</strong>
        </article>
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  if (!user) {
    return;
  }

  document.getElementById("welcome-name").textContent = user.name;
  const stats = document.getElementById("status-stats");
  const recentBox = document.getElementById("recent-applications");
  renderLoading(stats, "Loading application stats...");
  renderLoading(recentBox, "Loading recent applications...");

  try {
    const [applications, jobs] = await Promise.all([
      getApplicationsByUser(user.id),
      getJobs()
    ]);
    const jobsById = Object.fromEntries(jobs.map((job) => [String(job.id), job]));
    const counts = countByStatus(applications);

    document.getElementById("application-count").textContent = String(applications.length);
    document.getElementById("open-jobs-count").textContent = String(jobs.length);
    stats.innerHTML = renderStatusCards(counts);

    const recent = sortByDateDesc(applications, "appliedDate").slice(0, 4);
    if (!recent.length) {
      renderEmpty(recentBox, "No applications yet", "Browse jobs and apply to see them here.");
      return;
    }

    recentBox.innerHTML = recent
      .map((application) => {
        const job = jobsById[String(application.jobId)];
        return `
          <article class="list-row">
            <div>
              <h3>${escapeHtml(job ? job.title : "Job no longer available")}</h3>
              <p class="muted">${escapeHtml(job ? job.company : "Removed")} · Applied ${escapeHtml(formatDate(application.appliedDate))}</p>
            </div>
            <span class="badge badge-${statusClass(application.status)}">${escapeHtml(application.status)}</span>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    renderError(stats, getUserFacingError(error));
    renderError(recentBox, getUserFacingError(error));
  }
});
