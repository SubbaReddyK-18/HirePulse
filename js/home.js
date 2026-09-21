import { getJobs } from "./service/jobService.js";
import { initLayout } from "./main.js";
import { escapeHtml, formatSalary, sortByDateDesc } from "./utils.js";
import { getUserFacingError, renderError, renderLoading } from "./ui.js";

function renderFeatured(jobs) {
  const featured = sortByDateDesc(jobs, "postedDate").slice(0, 3);
  return featured
    .map(
      (job) => `
        <article class="card job-card">
          <div class="job-card-top">
            <h3>${escapeHtml(job.title)}</h3>
            <span class="chip">${escapeHtml(job.location)}</span>
          </div>
          <p class="muted">${escapeHtml(job.company)} · ${formatSalary(job.salary)}</p>
          <p>${escapeHtml(job.description).slice(0, 110)}...</p>
          <a class="btn btn-secondary" href="./job-details.html?id=${encodeURIComponent(job.id)}">View role</a>
        </article>
      `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  initLayout();
  const list = document.getElementById("featured-jobs");
  if (!list) {
    return;
  }

  renderLoading(list, "Loading featured jobs...");
  try {
    const jobs = await getJobs();
    list.innerHTML = renderFeatured(jobs);
    const count = document.getElementById("open-roles-count");
    if (count) {
      count.textContent = String(jobs.length);
    }
  } catch (error) {
    renderError(list, getUserFacingError(error));
  }
});
