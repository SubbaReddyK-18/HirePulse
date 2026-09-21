import { deleteJob, getJobsByRecruiter } from "./service/jobService.js";
import { getApplications } from "./service/applicationService.js";
import { initLayout } from "./main.js";
import { escapeHtml, formatDate, formatSalary, sameId, sortByDateDesc } from "./utils.js";
import { getUserFacingError, renderEmpty, renderError, renderLoading } from "./ui.js";

async function loadDashboard(user) {
  const jobsBox = document.getElementById("jobs-list");
  renderLoading(jobsBox, "Loading your jobs...");

  try {
    const [jobs, applications] = await Promise.all([
      getJobsByRecruiter(user.id),
      getApplications()
    ]);
    const jobIds = new Set(jobs.map((job) => String(job.id)));
    const relatedApplications = applications.filter((application) => jobIds.has(String(application.jobId)));

    document.getElementById("jobs-count").textContent = String(jobs.length);
    document.getElementById("applications-count").textContent = String(relatedApplications.length);

    if (!jobs.length) {
      renderEmpty(jobsBox, "No jobs posted yet", "Create your first job to start receiving applications.");
      return;
    }

    const ordered = sortByDateDesc(jobs, "postedDate");
    jobsBox.innerHTML = ordered
      .map((job) => {
        const applicantCount = relatedApplications.filter((application) => sameId(application.jobId, job.id)).length;
        return `
          <article class="card job-card">
            <div class="job-card-top">
              <div>
                <h3>${escapeHtml(job.title)}</h3>
                <p class="muted">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p>
              </div>
              <span class="chip">${applicantCount} applicant${applicantCount === 1 ? "" : "s"}</span>
            </div>
            <p class="muted">${formatSalary(job.salary)} · ${escapeHtml(job.experience)} · Posted ${escapeHtml(formatDate(job.postedDate))}</p>
            <div class="action-row">
              <a class="btn btn-secondary" href="./edit-job.html?id=${encodeURIComponent(job.id)}">Edit</a>
              <a class="btn btn-secondary" href="./applicants.html?jobId=${encodeURIComponent(job.id)}">View applicants</a>
              <button class="btn btn-danger" type="button" data-delete="${escapeHtml(job.id)}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    renderError(jobsBox, getUserFacingError(error));
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  if (!user) {
    return;
  }

  document.getElementById("welcome-name").textContent = user.name;
  await loadDashboard(user);

  document.getElementById("jobs-list").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete]");
    if (!button) {
      return;
    }

    const confirmed = window.confirm("Delete this job? Related applications will also be removed.");
    if (!confirmed) {
      return;
    }

    button.disabled = true;
    button.textContent = "Deleting...";
    try {
      await deleteJob(button.getAttribute("data-delete"));
      await loadDashboard(user);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Delete";
      window.alert(getUserFacingError(error, "Unable to delete this job."));
    }
  });
});
