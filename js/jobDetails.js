import { getJobById } from "./service/jobService.js";
import { createApplication, getApplicationsByUserAndJob } from "./service/applicationService.js";
import { initLayout } from "./main.js";
import { getCurrentUser } from "./auth.js";
import {
  assertDuplicateApplication,
  validateApplication
} from "../exception/validationException.js";
import {
  escapeHtml,
  formatDate,
  formatSalary,
  getQueryParam,
  parseSkills,
  todayIsoDate
} from "./utils.js";
import {
  clearAlert,
  clearFieldErrors,
  getUserFacingError,
  handleFormError,
  renderError,
  renderLoading,
  setBusy,
  showAlert
} from "./ui.js";

function renderJob(job) {
  document.getElementById("job-content").innerHTML = `
    <article class="card detail-card">
      <p class="eyebrow">${escapeHtml(job.company)}</p>
      <h1>${escapeHtml(job.title)}</h1>
      <div class="skill-row">
        <span class="chip">${escapeHtml(job.location)}</span>
        <span class="chip chip-soft">${escapeHtml(job.experience)}</span>
        <span class="chip chip-soft">Posted ${escapeHtml(formatDate(job.postedDate))}</span>
      </div>
      <dl class="meta-grid">
        <div><dt>Salary</dt><dd>${formatSalary(job.salary)}</dd></div>
        <div><dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd></div>
        <div><dt>Location</dt><dd>${escapeHtml(job.location)}</dd></div>
      </dl>
      <h2>Skills</h2>
      <div class="skill-row">
        ${parseSkills(job.skills).map((skill) => `<span class="chip chip-soft">${escapeHtml(skill)}</span>`).join("")}
      </div>
      <h2>About the role</h2>
      <p class="description">${escapeHtml(job.description)}</p>
    </article>
  `;
}

function renderApplyPanel(job, user, existing) {
  const panel = document.getElementById("apply-panel");

  if (!user) {
    panel.innerHTML = `
      <div class="card">
        <h2>Apply for this role</h2>
        <p>Sign in as a candidate to submit an application.</p>
        <a class="btn btn-primary" href="./login.html">Login to apply</a>
      </div>
    `;
    return;
  }

  if (user.role === "recruiter") {
    panel.innerHTML = `
      <div class="card">
        <h2>Recruiter view</h2>
        <p>Recruiters cannot apply to jobs. Use your dashboard to manage postings.</p>
        <a class="btn btn-secondary" href="./recruiter-dashboard.html">Go to dashboard</a>
      </div>
    `;
    return;
  }

  if (existing.length) {
    panel.innerHTML = `
      <div class="card">
        <h2>Application submitted</h2>
        <p>You have already applied for <strong>${escapeHtml(job.title)}</strong>.</p>
        <p>Current status: <span class="badge badge-${existing[0].status.toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(existing[0].status)}</span></p>
        <a class="btn btn-secondary" href="./my-applications.html">View applications</a>
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="card">
      <h2>Apply now</h2>
      <div id="form-alert"></div>
      <form id="apply-form">
        <label for="resume">Resume summary</label>
        <textarea id="resume" name="resume" rows="7" placeholder="Write a short resume summary and why you are a fit."></textarea>
        <p class="field-error" data-error-for="resume"></p>
        <button class="btn btn-primary" id="apply-submit" type="submit">Submit application</button>
      </form>
    </div>
  `;

  const form = document.getElementById("apply-form");
  const alertBox = document.getElementById("form-alert");
  const submitBtn = document.getElementById("apply-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert(alertBox);
    clearFieldErrors(form);

    const payload = {
      jobId: job.id,
      userId: user.id,
      resume: form.resume.value.trim(),
      status: "Applied",
      appliedDate: todayIsoDate()
    };

    try {
      validateApplication(payload);
      setBusy(submitBtn, true, "Submitting...");
      const duplicates = await getApplicationsByUserAndJob(user.id, job.id);
      assertDuplicateApplication(duplicates);
      await createApplication(payload);
      showAlert(alertBox, "Application submitted successfully.", "success");
      window.location.href = "./my-applications.html";
    } catch (error) {
      handleFormError(error, form, alertBox);
    } finally {
      setBusy(submitBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  const jobId = getQueryParam("id");
  const content = document.getElementById("job-content");
  const panel = document.getElementById("apply-panel");

  if (!jobId) {
    renderError(content, "No job was selected.");
    panel.innerHTML = "";
    return;
  }

  renderLoading(content, "Loading job details...");
  renderLoading(panel, "Checking application status...");

  try {
    const job = await getJobById(jobId);
    renderJob(job);
    const existing = user && user.role === "candidate"
      ? await getApplicationsByUserAndJob(user.id, job.id)
      : [];
    renderApplyPanel(job, user, existing);
  } catch (error) {
    renderError(content, getUserFacingError(error, "This job is no longer available."));
    panel.innerHTML = "";
  }
});
