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
  function getApplicationsByUser(userId) {
    return withApiHandler(
      () => api.get("/applications", { params: { userId } }).then((response) => response.data),
      "Unable to load your applications."
    );
  }

  // js/service/jobService.js
  function getJobs() {
    return withApiHandler(
      () => api.get("/jobs").then((response) => response.data),
      "Unable to load jobs."
    );
  }

  // js/auth.js
  var STORAGE_KEY = "jobnest_session";
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
    header.innerHTML = `
    <div class="nav-bar">
      <a class="brand" href="./index.html">
        <img src="../assets/logo.svg" alt="" width="32" height="32">
        <span>JobNest</span>
      </a>
      <button class="nav-toggle" id="nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
      <nav class="nav-links" id="nav-links">
        ${buildNavLinks(user, currentPage)}
        ${user ? `<span class="nav-user">${user.name}</span>` : ""}
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
    <p>JobNest is a student job portal built with HTML, CSS, JavaScript, Axios and JSON Server.</p>
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
  function parseSkills(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  }
  function statusClass(status) {
    return String(status || "").toLowerCase().replace(/\s+/g, "-");
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

  // js/myApplications.js
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
      list.innerHTML = ordered.map((application) => {
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
            ${job ? `<dl class="meta-grid">
                    <div><dt>Location</dt><dd>${escapeHtml(job.location)}</dd></div>
                    <div><dt>Salary</dt><dd>${formatSalary(job.salary)}</dd></div>
                    <div><dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd></div>
                    <div><dt>Applied</dt><dd>${escapeHtml(formatDate(application.appliedDate))}</dd></div>
                  </dl>
                  <div class="skill-row">${parseSkills(job.skills).map((skill) => `<span class="chip chip-soft">${escapeHtml(skill)}</span>`).join("")}</div>` : `<p>The related job was deleted, so details are no longer available.</p>`}
            <p class="resume-preview">${escapeHtml(application.resume)}</p>
            ${job ? `<a class="btn btn-secondary" href="./job-details.html?id=${encodeURIComponent(job.id)}">Open job</a>` : ""}
          </article>
        `;
      }).join("");
    } catch (error) {
      renderError(list, getUserFacingError(error));
    }
  });
})();
