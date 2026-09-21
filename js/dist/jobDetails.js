(() => {
  // js/service/apiConfig.js
  var API_BASE_URL = "http://localhost:3000";
  var api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json"
    },
    timeout: 1e4
  });

  // exception/apiException.js
  var ApiException = class extends Error {
    constructor(message, status = 0, originalError = null) {
      super(message);
      this.name = "ApiException";
      this.status = status;
      this.originalError = originalError;
    }
  };
  function handleApiError(error, fallbackMessage = "Something went wrong. Please try again.") {
    if (error instanceof ApiException) {
      throw error;
    }
    if (error && error.response) {
      const status = error.response.status;
      if (status === 404) {
        throw new ApiException("The requested record was not found.", status, error);
      }
      if (status >= 500) {
        throw new ApiException("The server could not complete this request.", status, error);
      }
      throw new ApiException(fallbackMessage, status, error);
    }
    if (error && (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response)) {
      throw new ApiException(
        "Unable to reach the server. Start JSON Server on port 3000 and try again.",
        0,
        error
      );
    }
    throw new ApiException(fallbackMessage, 0, error);
  }
  async function withApiHandler(requestFn, fallbackMessage) {
    try {
      return await requestFn();
    } catch (error) {
      handleApiError(error, fallbackMessage);
    }
  }

  // js/service/applicationService.js
  function getApplicationsByUserAndJob(userId, jobId) {
    return withApiHandler(
      () => api.get("/applications", { params: { userId, jobId } }).then((response) => response.data),
      "Unable to check existing applications."
    );
  }
  function createApplication(application) {
    return withApiHandler(
      () => api.post("/applications", application).then((response) => response.data),
      "Unable to submit the application."
    );
  }

  // js/service/jobService.js
  function getJobById(id) {
    return withApiHandler(
      () => api.get(`/jobs/${id}`).then((response) => response.data),
      "Unable to load this job."
    );
  }

  // js/auth.js
  var STORAGE_KEY = "hirepulse_session";
  function getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }
  function logout() {
    clearSession();
    window.location.href = "./login.html";
  }

  // js/main.js
  function navLink(href, label, currentPage) {
    const page = href.replace("./", "").replace(".html", "");
    const isActive = currentPage === page || currentPage === "index" && page === "index";
    return `<a href="${href}" class="${isActive ? "active" : ""}">${label}</a>`;
  }
  function buildNavLinks(user, currentPage) {
    if (!user) {
      return `
      ${navLink("./index.html", "Home", currentPage)}
      ${navLink("./jobs.html", "Jobs", currentPage)}
      ${navLink("./login.html", "Login", currentPage)}
      ${navLink("./register.html", "Register", currentPage)}
    `;
    }
    if (user.role === "candidate") {
      return `
      ${navLink("./index.html", "Home", currentPage)}
      ${navLink("./jobs.html", "Jobs", currentPage)}
      ${navLink("./candidate-dashboard.html", "Dashboard", currentPage)}
      ${navLink("./my-applications.html", "My Applications", currentPage)}
    `;
    }
    return `
    ${navLink("./index.html", "Home", currentPage)}
    ${navLink("./recruiter-dashboard.html", "Dashboard", currentPage)}
    ${navLink("./create-job.html", "Post a Job", currentPage)}
  `;
  }
  function renderHeader() {
    const header = document.getElementById("site-header");
    if (!header) {
      return;
    }
    const user = getCurrentUser();
    const currentPage = document.body.dataset.page || "";
    const authAction = user ? `<button class="btn btn-ghost" id="logout-btn" type="button">Logout</button>` : `<a class="btn btn-primary" href="./login.html">Sign in</a>`;
    const userBadge = user ? `<div class="nav-user">
        <span class="nav-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="nav-user-name">${user.name}</span>
        <span class="nav-user-role">${user.role === "recruiter" ? "Recruiter" : "Candidate"}</span>
      </div>` : "";
    header.innerHTML = `
    <div class="nav-bar">
      <a class="brand" href="./index.html">
        <img src="../assets/logo.svg" alt="" width="32" height="32">
        <span>HirePulse</span>
      </a>
      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
      <nav class="nav-links" id="nav-links">
        ${buildNavLinks(user, currentPage)}
        ${userBadge}
        ${authAction}
      </nav>
    </div>
  `;
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    toggle?.addEventListener("click", () => {
      links.classList.toggle("open");
    });
    document.getElementById("logout-btn")?.addEventListener("click", () => {
      logout();
    });
  }
  function renderFooter() {
    const footer = document.getElementById("site-footer");
    if (!footer) {
      return;
    }
    footer.innerHTML = `
    <p>&copy; 2026 HirePulse &middot; Advanced Career &amp; Recruitment Management Portal.</p>
  `;
  }
  function guardPageAccess() {
    const access = document.body.dataset.access || "public";
    const user = getCurrentUser();
    if (access === "public") {
      return user;
    }
    if (access === "guest") {
      if (user) {
        window.location.href = user.role === "recruiter" ? "./recruiter-dashboard.html" : "./candidate-dashboard.html";
        return null;
      }
      return null;
    }
    if (!user) {
      window.location.href = "./login.html";
      return null;
    }
    if (access === "candidate" && user.role !== "candidate") {
      window.location.href = "./recruiter-dashboard.html";
      return null;
    }
    if (access === "recruiter" && user.role !== "recruiter") {
      window.location.href = "./candidate-dashboard.html";
      return null;
    }
    return user;
  }
  function initLayout() {
    renderHeader();
    renderFooter();
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link || !link.href) return;
      try {
        const url = new URL(link.href, window.location.origin);
        for (const [key, value] of url.searchParams.entries()) {
          sessionStorage.setItem("param_" + key, value);
        }
      } catch (_) {
      }
    });
    return guardPageAccess();
  }

  // exception/validationException.js
  var ValidationException = class extends Error {
    constructor(message, fieldErrors = {}) {
      super(message);
      this.name = "ValidationException";
      this.fieldErrors = fieldErrors;
    }
  };
  function validateApplication(data) {
    const fieldErrors = {};
    if (!data.jobId) {
      fieldErrors.job = "This job is not available.";
    }
    if (!data.userId) {
      fieldErrors.user = "You must be logged in as a candidate to apply.";
    }
    if (!data.resumeData || !data.resumeFileName) {
      fieldErrors.resumeFile = "Please upload your resume in PDF format.";
    } else if (!data.resumeFileName.toLowerCase().endsWith(".pdf")) {
      fieldErrors.resumeFile = "Only PDF format (.pdf) is supported.";
    } else if (data.resumeFileSize && data.resumeFileSize > 10 * 1024 * 1024) {
      fieldErrors.resumeFile = "File size exceeds 10MB limit. Please upload a smaller PDF.";
    }
    if (Object.keys(fieldErrors).length) {
      throw new ValidationException("Please complete your application.", fieldErrors);
    }
  }
  function assertDuplicateApplication(existing) {
    if (existing && existing.length > 0) {
      throw new ValidationException("You have already applied to this job.", {
        resume: "A duplicate application is not allowed for the same job."
      });
    }
  }

  // js/utils.js
  function formatSalary(value) {
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
  function formatDate(value) {
    if (!value) {
      return "\u2014";
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
  function todayIsoDate() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function parseSkills(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  }
  function getQueryParam(name) {
    const urlParam = new URLSearchParams(window.location.search).get(name);
    if (urlParam) {
      try {
        sessionStorage.setItem("param_" + name, urlParam);
      } catch (_) {
      }
      return urlParam;
    }
    try {
      return sessionStorage.getItem("param_" + name) || null;
    } catch (_) {
      return null;
    }
  }

  // js/ui.js
  function showAlert(container, message, type = "error") {
    if (!container) {
      return;
    }
    container.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
  }
  function clearAlert(container) {
    if (container) {
      container.innerHTML = "";
    }
  }
  function showFieldErrors(form, fieldErrors = {}) {
    form.querySelectorAll(".field-error").forEach((node) => {
      node.textContent = "";
    });
    Object.entries(fieldErrors).forEach(([field, message]) => {
      const errorNode = form.querySelector(`[data-error-for="${field}"]`);
      if (errorNode) {
        errorNode.textContent = message;
      }
    });
  }
  function clearFieldErrors(form) {
    showFieldErrors(form, {});
  }
  function setBusy(button, isBusy, busyText = "Please wait...") {
    if (!button) {
      return;
    }
    if (isBusy) {
      button.dataset.originalText = button.dataset.originalText || button.textContent;
      button.disabled = true;
      button.textContent = busyText;
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }
  function renderLoading(container, message = "Loading...") {
    if (!container) {
      return;
    }
    container.innerHTML = `
    <div class="state-box">
      <div class="spinner" aria-hidden="true"></div>
      <p>${message}</p>
    </div>
  `;
  }
  function renderError(container, message) {
    if (!container) {
      return;
    }
    container.innerHTML = `
    <div class="state-box state-error">
      <h3>Something went wrong</h3>
      <p>${message}</p>
    </div>
  `;
  }
  function getUserFacingError(error, fallback = "Something went wrong. Please try again.") {
    if (error instanceof ValidationException || error instanceof ApiException) {
      return error.message;
    }
    return fallback;
  }
  function handleFormError(error, form, alertBox) {
    if (error instanceof ValidationException) {
      showFieldErrors(form, error.fieldErrors);
      showAlert(alertBox, error.message, "error");
      return;
    }
    showAlert(alertBox, getUserFacingError(error), "error");
  }

  // js/jobDetails.js
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
      const payload = {
        jobId: job.id,
        userId: user.id,
        candidateName: user.name,
        candidateEmail: user.email,
        resumeFileName: selectedPdfName,
        resumeFileSize: selectedPdfSize,
        resumeData: selectedPdfData,
        coverNote: form.coverNote ? form.coverNote.value.trim() : "",
        status: "Applied",
        appliedDate: todayIsoDate()
      };
      try {
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
      const existing = user && user.role === "candidate" ? await getApplicationsByUserAndJob(user.id, job.id) : [];
      renderApplyPanel(job, user, existing);
    } catch (error) {
      renderError(content, getUserFacingError(error, "This job is no longer available."));
      panel.innerHTML = "";
    }
  });
})();
