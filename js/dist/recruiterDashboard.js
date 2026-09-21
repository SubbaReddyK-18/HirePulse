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
  function getApplications() {
    return withApiHandler(
      () => api.get("/applications").then((response) => response.data),
      "Unable to load applications."
    );
  }
  function getApplicationsByJob(jobId) {
    return withApiHandler(
      () => api.get("/applications", { params: { jobId } }).then((response) => response.data),
      "Unable to load applicants for this job."
    );
  }
  function deleteApplication(id) {
    return withApiHandler(
      () => api.delete(`/applications/${id}`).then((response) => response.data),
      "Unable to remove the application."
    );
  }
  async function deleteApplicationsByJobId(jobId) {
    const applications = await getApplicationsByJob(jobId);
    await Promise.all(applications.map((application) => deleteApplication(application.id)));
    return applications.length;
  }

  // js/service/jobService.js
  function getJobsByRecruiter(recruiterId) {
    return withApiHandler(
      () => api.get("/jobs", { params: { recruiterId } }).then((response) => response.data),
      "Unable to load your posted jobs."
    );
  }
  function deleteJob(id) {
    return withApiHandler(async () => {
      await deleteApplicationsByJobId(id);
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    }, "Unable to delete the job.");
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
    `;
    }
    if (user.role === "candidate") {
      return `
      ${navLink("./index.html", "Home", currentPage)}
      ${navLink("./jobs.html", "Jobs", currentPage)}
      ${navLink("./candidate-dashboard.html", "Dashboard", currentPage)}
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

  // js/utils.js
  function sameId(a, b) {
    return String(a) === String(b);
  }
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
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function sortByDateDesc(items, field) {
    return [...items].sort((a, b) => String(b[field] || "").localeCompare(String(a[field] || "")));
  }

  // exception/validationException.js
  var ValidationException = class extends Error {
    constructor(message, fieldErrors = {}) {
      super(message);
      this.name = "ValidationException";
      this.fieldErrors = fieldErrors;
    }
  };

  // js/ui.js
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
  function renderEmpty(container, title, message) {
    if (!container) {
      return;
    }
    container.innerHTML = `
    <div class="state-box">
      <h3>${title}</h3>
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

  // js/recruiterDashboard.js
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
      jobsBox.innerHTML = ordered.map((job) => {
        const applicantCount = relatedApplications.filter((application) => sameId(application.jobId, job.id)).length;
        return `
          <article class="card job-card">
            <div class="job-card-top">
              <div>
                <h3>${escapeHtml(job.title)}</h3>
                <p class="muted">${escapeHtml(job.company)} \xB7 ${escapeHtml(job.location)}</p>
              </div>
              <span class="chip">${applicantCount} applicant${applicantCount === 1 ? "" : "s"}</span>
            </div>
            <p class="muted">${formatSalary(job.salary)} \xB7 ${escapeHtml(job.experience)} \xB7 Posted ${escapeHtml(formatDate(job.postedDate))}</p>
            <div class="action-row">
              <a class="btn btn-secondary" href="./edit-job.html?id=${encodeURIComponent(job.id)}">Edit</a>
              <a class="btn btn-secondary" href="./applicants.html?jobId=${encodeURIComponent(job.id)}">View applicants</a>
              <button class="btn btn-danger" type="button" data-delete="${escapeHtml(job.id)}">Delete</button>
            </div>
          </article>
        `;
      }).join("");
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
})();
