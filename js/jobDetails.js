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
      <h2>Apply for this role</h2>
      <p class="muted">Upload your updated resume to submit your application.</p>
      <div id="form-alert"></div>
      <form id="apply-form">
        <label>Resume (PDF only, max 10MB)</label>
        <div class="file-upload-box" id="upload-zone">
          <input type="file" id="resume-file" name="resumeFile" accept=".pdf,application/pdf">
          <p id="upload-prompt" style="margin: 0;"><strong>Click or drag &amp; drop your resume (PDF)</strong><br><span class="muted" style="font-size: 0.82rem;">Maximum file size: 10MB</span></p>
        </div>
        <div id="file-selected-info" class="file-info" style="display: none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#991b1b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span id="selected-filename">resume.pdf</span>
          <small id="selected-filesize" class="muted" style="margin-left: auto;"></small>
        </div>
        <p class="field-error" data-error-for="resumeFile"></p>

        <label for="cover-note">Cover Note / Remarks (Optional)</label>
        <textarea id="cover-note" name="coverNote" rows="3" placeholder="Brief note to the hiring team..."></textarea>

        <button class="btn btn-primary" id="apply-submit" type="submit" style="width: 100%; margin-top: 10px;">Submit Application</button>
      </form>
    </div>
  `;

  const form = document.getElementById("apply-form");
  const alertBox = document.getElementById("form-alert");
  const submitBtn = document.getElementById("apply-submit");
  const fileInput = document.getElementById("resume-file");
  const uploadZone = document.getElementById("upload-zone");
  const fileInfo = document.getElementById("file-selected-info");
  const fileNameEl = document.getElementById("selected-filename");
  const fileSizeEl = document.getElementById("selected-filesize");

  let selectedPdfData = null;
  let selectedPdfName = "";
  let selectedPdfSize = 0;

  uploadZone.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      window.alert("Please select a valid PDF file.");
      fileInput.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      window.alert("File size exceeds 10MB limit. Please upload a smaller file.");
      fileInput.value = "";
      return;
    }

    selectedPdfName = file.name;
    selectedPdfSize = file.size;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
    fileInfo.style.display = "flex";

    const reader = new FileReader();
    reader.onload = (e) => {
      selectedPdfData = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert(alertBox);
    clearFieldErrors(form);

    try {
      if (selectedPdfData) {
        try {
          localStorage.setItem(`hirepulse_resume_${user.id}_${job.id}`, selectedPdfData);
        } catch (_) {}
      }

      const payload = {
        jobId: job.id,
        userId: user.id,
        candidateName: user.name,
        candidateEmail: user.email,
        resumeFileName: selectedPdfName,
        resumeFileSize: selectedPdfSize,
        resumeData: "stored_locally",
        coverNote: form.coverNote ? form.coverNote.value.trim() : "",
        status: "Applied",
        appliedDate: todayIsoDate()
      };

      validateApplication(payload);
      setBusy(submitBtn, true, "Submitting application...");
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
