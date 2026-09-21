import { getCurrentUser, logout } from "./auth.js";

function navLink(href, label, currentPage) {
  const page = href.replace("./", "").replace(".html", "");
  const isActive = currentPage === page || (currentPage === "index" && page === "index");
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

export function renderHeader() {
  const header = document.getElementById("site-header");
  if (!header) {
    return;
  }

  const user = getCurrentUser();
  const currentPage = document.body.dataset.page || "";
  const authAction = user
    ? `<button class="btn btn-ghost" id="logout-btn" type="button">Logout</button>`
    : `<a class="btn btn-primary" href="./login.html">Sign in</a>`;

  const userBadge = user
    ? `<div class="nav-user">
        <span class="nav-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </span>
        <span class="nav-user-name">${user.name}</span>
        <span class="nav-user-role">${user.role === "recruiter" ? "Recruiter" : "Candidate"}</span>
      </div>`
    : "";

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

export function renderFooter() {
  const footer = document.getElementById("site-footer");
  if (!footer) {
    return;
  }
  footer.innerHTML = `
    <p>&copy; 2026 HirePulse &middot; Advanced Career &amp; Recruitment Management Portal.</p>
  `;
}

export function guardPageAccess() {
  const access = document.body.dataset.access || "public";
  const user = getCurrentUser();

  if (access === "public") {
    return user;
  }

  if (access === "guest") {
    if (user) {
      window.location.href = user.role === "recruiter"
        ? "./recruiter-dashboard.html"
        : "./candidate-dashboard.html";
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

export function initLayout() {
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
    } catch (_) {}
  });

  return guardPageAccess();
}
