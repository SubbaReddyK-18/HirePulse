import { getJobById } from "./service/jobService.js";
import { getApplicationsByJob, updateApplicationStatus } from "./service/applicationService.js";
import { getUserById } from "./service/userService.js";
import { initLayout } from "./main.js";
import { getCurrentUser } from "./auth.js";
import { APPLICATION_STATUSES, escapeHtml, formatDate, getQueryParam, sameId, statusClass } from "./utils.js";
import { getUserFacingError, renderEmpty, renderError, renderLoading } from "./ui.js";

function statusOptions(current) {
  return APPLICATION_STATUSES.map(
    (status) => `<option value="${escapeHtml(status)}" ${status === current ? "selected" : ""}>${escapeHtml(status)}</option>`
  ).join("");
}

async function renderApplicants(job) {
  const list = document.getElementById("applicants-list");
  renderLoading(list, "Loading applicants...");

  const applications = await getApplicationsByJob(job.id);
  if (!applications.length) {
    renderEmpty(list, "No applicants yet", "When candidates apply, they will appear here.");
    return;
  }

  const rows = await Promise.all(
    applications.map(async (application) => {
      let candidateName = "Unknown candidate";
      let candidateEmail = "";
      try {
        const candidate = await getUserById(application.userId);
        candidateName = candidate.name;
        candidateEmail = candidate.email;
      } catch (error) {
        candidateName = "Candidate record unavailable";
      }

      const localPdf = localStorage.getItem(`hirepulse_resume_${application.userId}_${application.jobId}`);
      const pdfUrl = (localPdf && localPdf.startsWith("data:")) ? localPdf : (application.resumeData && application.resumeData.startsWith("data:") ? application.resumeData : "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA1NQo+PgpzdHJlYW0KQlQKL0YxIDIwIFRmCjEwMCA3MDAgVGROCihDYW5kaWRhdGUgUmVzdW1lIERvY3VtZW50KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDIxNiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDUKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjMyMAolJUVPRg==");

      const resumeButton = `
        <a class="btn-pdf" href="${pdfUrl}" target="_blank" download="${escapeHtml(application.resumeFileName || 'Candidate_Resume.pdf')}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          Download PDF Resume (${escapeHtml(application.resumeFileName || 'Candidate_Resume.pdf')})
        </a>`;

      const coverNoteHtml = application.coverNote
        ? `<p class="muted" style="margin-top: 8px;"><strong>Note:</strong> ${escapeHtml(application.coverNote)}</p>`
        : "";

      return `
        <article class="card application-card">
          <div class="job-card-top">
            <div>
              <h3>${escapeHtml(candidateName)}</h3>
              <p class="muted">${escapeHtml(candidateEmail)}</p>
            </div>
            <span class="badge badge-${statusClass(application.status)}">${escapeHtml(application.status)}</span>
          </div>
          <p class="muted">Applied on ${escapeHtml(formatDate(application.appliedDate))}</p>
          <div style="margin: 12px 0;">
            ${resumeButton}
            ${coverNoteHtml}
          </div>
          <label for="status-${escapeHtml(application.id)}">Update Application Status</label>
          <div class="action-row">
            <select id="status-${escapeHtml(application.id)}" data-status-for="${escapeHtml(application.id)}">
              ${statusOptions(application.status)}
            </select>
            <button class="btn btn-primary" type="button" data-save-status="${escapeHtml(application.id)}">Save Status</button>
          </div>
        </article>
      `;
    })
  );

  list.innerHTML = rows.join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  if (!user) {
    return;
  }

  const jobId = getQueryParam("jobId");
  const heading = document.getElementById("job-heading");
  const list = document.getElementById("applicants-list");

  if (!jobId) {
    renderError(list, "No job was selected.");
    return;
  }

  renderLoading(list, "Loading job...");

  let job;
  try {
    job = await getJobById(jobId);
    if (!sameId(job.recruiterId, user.id)) {
      heading.textContent = "Access denied";
      renderError(list, "You can only view applicants for jobs that you posted.");
      return;
    }
    heading.textContent = `Applicants · ${job.title}`;
    document.getElementById("job-subheading").textContent = `${job.company} · ${job.location}`;
    await renderApplicants(job);
  } catch (error) {
    renderError(list, getUserFacingError(error, "Unable to load applicants."));
    return;
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-save-status]");
    if (!button) {
      return;
    }

    const applicationId = button.getAttribute("data-save-status");
    const select = document.querySelector(`[data-status-for="${applicationId}"]`);
    const status = select.value;
    button.disabled = true;
    button.textContent = "Saving...";

    try {
      await updateApplicationStatus(applicationId, status);
      await renderApplicants(job);
    } catch (error) {
      window.alert(getUserFacingError(error, "Unable to update status."));
      button.disabled = false;
      button.textContent = "Save status";
    }
  });
});
