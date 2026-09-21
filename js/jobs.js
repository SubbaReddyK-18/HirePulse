import { getJobs } from "./service/jobService.js";
import { initLayout } from "./main.js";
import { escapeHtml, formatSalary, getQueryParam, parseSkills, uniqueValues, EXPERIENCE_OPTIONS } from "./utils.js";
import { getUserFacingError, renderEmpty, renderError, renderLoading } from "./ui.js";

let allJobs = [];

function matchesFilters(job, { query, location, experience }) {
  const haystack = [
    job.title,
    job.company,
    parseSkills(job.skills).join(" ")
  ]
    .join(" ")
    .toLowerCase();

  const matchesQuery = !query || haystack.includes(query);
  const matchesLocation = !location || job.location === location;
  const matchesExperience = !experience || job.experience === experience;
  return matchesQuery && matchesLocation && matchesExperience;
}

function renderJobs(jobs) {
  const list = document.getElementById("jobs-list");
  if (!jobs.length) {
    renderEmpty(list, "No jobs found", "Try a different search or clear the filters.");
    return;
  }

  list.innerHTML = jobs
    .map(
      (job) => `
        <article class="card job-card">
          <div class="job-card-top">
            <div>
              <h3>${escapeHtml(job.title)}</h3>
              <p class="muted">${escapeHtml(job.company)}</p>
            </div>
            <span class="chip">${escapeHtml(job.location)}</span>
          </div>
          <dl class="meta-grid">
            <div><dt>Salary</dt><dd>${formatSalary(job.salary)}</dd></div>
            <div><dt>Experience</dt><dd>${escapeHtml(job.experience)}</dd></div>
          </dl>
          <div class="skill-row">
            ${parseSkills(job.skills).map((skill) => `<span class="chip chip-soft">${escapeHtml(skill)}</span>`).join("")}
          </div>
          <a class="btn btn-secondary" href="./job-details.html?id=${encodeURIComponent(job.id)}">View details</a>
        </article>
      `
    )
    .join("");
}

function applyFilters() {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const location = document.getElementById("location-filter").value;
  const experience = document.getElementById("experience-filter").value;
  const filtered = allJobs.filter((job) => matchesFilters(job, { query, location, experience }));
  document.getElementById("result-count").textContent = `${filtered.length} role${filtered.length === 1 ? "" : "s"}`;
  renderJobs(filtered);
}

function fillFilterOptions(jobs) {
  const locationSelect = document.getElementById("location-filter");
  uniqueValues(jobs, "location").forEach((location) => {
    const option = document.createElement("option");
    option.value = location;
    option.textContent = location;
    locationSelect.appendChild(option);
  });

  const experienceSelect = document.getElementById("experience-filter");
  EXPERIENCE_OPTIONS.forEach((experience) => {
    const option = document.createElement("option");
    option.value = experience;
    option.textContent = experience;
    experienceSelect.appendChild(option);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initLayout();
  const list = document.getElementById("jobs-list");
  renderLoading(list, "Loading open roles...");

  try {
    allJobs = await getJobs();
    fillFilterOptions(allJobs);

    const initialSearch = getQueryParam("search") || "";
    if (initialSearch) {
      document.getElementById("search-input").value = initialSearch;
    }

    applyFilters();
  } catch (error) {
    renderError(list, getUserFacingError(error));
  }

  ["search-input", "location-filter", "experience-filter"].forEach((id) => {
    document.getElementById(id).addEventListener("input", applyFilters);
    document.getElementById(id).addEventListener("change", applyFilters);
  });

  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    document.getElementById("location-filter").value = "";
    document.getElementById("experience-filter").value = "";
    applyFilters();
  });
});
