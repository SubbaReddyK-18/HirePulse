import { getJobs } from "./service/jobService.js";
import { getApplicationsByUser } from "./service/applicationService.js";
import { initLayout } from "./main.js";
import { escapeHtml, formatDate, formatSalary, parseSkills, sortByDateDesc, statusClass } from "./utils.js";
import { getUserFacingError, renderEmpty, renderError, renderLoading } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  if (!user) {
    return;
  }

  const list = document.getElementById("applications-list");
  renderLoading(list, "Loading your applications...");

  try {
    const [applications, jobs] = await Promise.all([
      getApplicationsByUser(user.id),
      getJobs()
    ]);
    const jobsById = Object.fromEntries(jobs.map((job) => [String(job.id), job]));
    const ordered = sortByDateDesc(applications, "appliedDate");

    if (!ordered.length) {
      renderEmpty(list, "No applications yet", "When you apply, your status updates will appear here.");
      return;
    }

    list.innerHTML = ordered
      .map((application) => {
        const job = jobsById[String(application.jobId)];
        return `
          <article class="card application-card">
            <div class="job-card-top">
              <div>
                <h3>${escapeHtml(job ? job.title : "Job no longer available")}</h3>
                <p class="muted">${escapeHtml(job ? job.company : "This posting was removed")}</p>
              </div>
              <span class="badge badge-${statusClass(application.status)}">${escapeHtml(application.status)}</span>
            </div>
            ${
              job
                ? `<dl class="meta-grid">
                    <div><dt>Location</dt><dd>${escapeHtml(job.location)}</dd></div>
                    <div><dt>Salary</dt><dd>${formatSalary(job.salary)}</dd></div>
                    <div><dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd></div>
                    <div><dt>Applied</dt><dd>${escapeHtml(formatDate(application.appliedDate))}</dd></div>
                  </dl>
                  <div class="skill-row">${parseSkills(job.skills).map((skill) => `<span class="chip chip-soft">${escapeHtml(skill)}</span>`).join("")}</div>`
                : `<p>The related job was deleted, so details are no longer available.</p>`
            }
            <p class="resume-preview">${escapeHtml(application.resume)}</p>
            ${job ? `<a class="btn btn-secondary" href="./job-details.html?id=${encodeURIComponent(job.id)}">Open job</a>` : ""}
          </article>
        `;
      })
      .join("");
  } catch (error) {
    renderError(list, getUserFacingError(error));
  }
});
