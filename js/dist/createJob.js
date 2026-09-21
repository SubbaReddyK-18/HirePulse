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

  // js/service/jobService.js
  function createJob(job) {
    return withApiHandler(
      () => api.post("/jobs", job).then((response) => response.data),
      "Unable to create the job."
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

  // exception/validationException.js
  var ValidationException = class extends Error {
    constructor(message, fieldErrors = {}) {
      super(message);
      this.name = "ValidationException";
      this.fieldErrors = fieldErrors;
    }
  };
  function validateJob(data) {
    const fieldErrors = {};
    if (!data.title || data.title.trim().length < 3) {
      fieldErrors.title = "Job title must be at least 3 characters.";
    }
    if (!data.company || data.company.trim().length < 2) {
      fieldErrors.company = "Company name is required.";
    }
    if (!data.location || data.location.trim().length < 2) {
      fieldErrors.location = "Location is required.";
    }
    const salary = Number(data.salary);
    if (!Number.isFinite(salary) || salary <= 0) {
      fieldErrors.salary = "Enter a valid salary greater than 0.";
    }
    if (!data.experience) {
      fieldErrors.experience = "Select an experience range.";
    }
    if (!data.skills || data.skills.trim().length < 2) {
      fieldErrors.skills = "Enter at least one skill (comma-separated).";
    }
    if (!data.description || data.description.trim().length < 20) {
      fieldErrors.description = "Description must be at least 20 characters.";
    }
    if (Object.keys(fieldErrors).length) {
      throw new ValidationException("Please complete the job details.", fieldErrors);
    }
  }

  // js/utils.js
  function todayIsoDate() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function parseSkills(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
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

  // js/createJob.js
  document.addEventListener("DOMContentLoaded", () => {
    const user = initLayout();
    if (!user) {
      return;
    }
    const form = document.getElementById("job-form");
    const alertBox = document.getElementById("form-alert");
    const submitBtn = document.getElementById("job-submit");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearAlert(alertBox);
      clearFieldErrors(form);
      const payload = {
        title: form.title.value.trim(),
        company: form.company.value.trim(),
        location: form.location.value.trim(),
        salary: form.salary.value,
        experience: form.experience.value,
        skills: form.skills.value,
        description: form.description.value.trim()
      };
      try {
        validateJob(payload);
        setBusy(submitBtn, true, "Publishing...");
        await createJob({
          title: payload.title,
          company: payload.company,
          location: payload.location,
          salary: Number(payload.salary),
          experience: payload.experience,
          skills: parseSkills(payload.skills),
          description: payload.description,
          postedDate: todayIsoDate(),
          recruiterId: user.id
        });
        showAlert(alertBox, "Job posted successfully.", "success");
        window.location.href = "./recruiter-dashboard.html";
      } catch (error) {
        handleFormError(error, form, alertBox);
      } finally {
        setBusy(submitBtn, false);
      }
    });
  });
})();
