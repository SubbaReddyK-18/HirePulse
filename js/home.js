import { getJobs } from "./service/jobService.js";
import { initLayout } from "./main.js";
import { getCurrentUser } from "./auth.js";
import { escapeHtml, formatSalary, sortByDateDesc } from "./utils.js";
import { getUserFacingError, renderError, renderLoading } from "./ui.js";

function renderFeatured(jobs) {
  const featured = sortByDateDesc(jobs, "postedDate").slice(0, 3);
  return featured
    .map(
      (job) => `
        <article class="card job-card">
          <div class="job-card-top">
            <div>
              <h3 style="margin-bottom: 4px;">${escapeHtml(job.title)}</h3>
              <p class="muted">${escapeHtml(job.company)} · ${formatSalary(job.salary)}</p>
            </div>
            <span class="chip">${escapeHtml(job.location)}</span>
          </div>
          <div class="skill-row">
            ${(Array.isArray(job.skills) ? job.skills : (job.skills || "").split(",")).slice(0, 3).map(s => `<span class="chip chip-soft">${escapeHtml(s.trim())}</span>`).join("")}
          </div>
          <p>${escapeHtml(job.description).slice(0, 115)}...</p>
          <a class="btn btn-secondary" href="./job-details.html?id=${encodeURIComponent(job.id)}">View role</a>
        </article>
      `
    )
    .join("");
}

function updateHeroForUser(user) {
  if (!user) return;

  const title = document.getElementById("hero-title");
  const subtitle = document.getElementById("hero-subtitle");
  const actions = document.getElementById("hero-actions");
  const howItWorks = document.getElementById("how-it-works-section");

  if (title) {
    title.textContent = `Welcome back, ${user.name}! 🚀`;
  }

  if (user.role === "candidate") {
    if (subtitle) {
      subtitle.textContent = "Explore verified tech openings, upload your resume, and track applications in real time.";
    }
    if (actions) {
      actions.innerHTML = `
        <a class="btn btn-primary" href="./jobs.html">Explore All Jobs</a>
        <a class="btn btn-secondary" href="./candidate-dashboard.html">My Dashboard</a>
      `;
    }
  } else if (user.role === "recruiter") {
    if (subtitle) {
      subtitle.textContent = "Publish job listings, review applicant resumes, and update hiring statuses.";
    }
    if (actions) {
      actions.innerHTML = `
        <a class="btn btn-primary" href="./create-job.html">Post a New Job</a>
        <a class="btn btn-secondary" href="./recruiter-dashboard.html">Recruiter Dashboard</a>
      `;
    }
  }

  if (howItWorks) {
    howItWorks.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  updateHeroForUser(user || getCurrentUser());

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
