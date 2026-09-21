import { getJobById, updateJob } from "./service/jobService.js";
import { initLayout } from "./main.js";
import { getCurrentUser } from "./auth.js";
import { validateJob } from "../exception/validationException.js";
import { getQueryParam, parseSkills, sameId } from "./utils.js";
import {
  clearAlert,
  clearFieldErrors,
  getUserFacingError,
  handleFormError,
  renderError,
  setBusy,
  showAlert
} from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = initLayout();
  if (!user) {
    return;
  }

  const jobId = getQueryParam("id");
  const form = document.getElementById("job-form");
  const alertBox = document.getElementById("form-alert");
  const submitBtn = document.getElementById("job-submit");

  if (!jobId) {
    renderError(alertBox, "No job was selected to edit.");
    form.hidden = true;
    return;
  }

  try {
    const job = await getJobById(jobId);
    if (!sameId(job.recruiterId, user.id)) {
      showAlert(alertBox, "You can only edit jobs that you posted.", "error");
      form.hidden = true;
      return;
    }

    form.title.value = job.title;
    form.company.value = job.company;
    form.location.value = job.location;
    form.salary.value = job.salary;
    form.experience.value = job.experience;
    form.skills.value = parseSkills(job.skills).join(", ");
    form.description.value = job.description;
    form.dataset.postedDate = job.postedDate;
    form.dataset.recruiterId = job.recruiterId;
  } catch (error) {
    showAlert(alertBox, getUserFacingError(error, "This job could not be loaded."), "error");
    form.hidden = true;
    return;
  }

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
      setBusy(submitBtn, true, "Saving...");
      await updateJob(jobId, {
        title: payload.title,
        company: payload.company,
        location: payload.location,
        salary: Number(payload.salary),
        experience: payload.experience,
        skills: parseSkills(payload.skills),
        description: payload.description,
        postedDate: form.dataset.postedDate,
        recruiterId: form.dataset.recruiterId
      });
      showAlert(alertBox, "Job updated successfully.", "success");
      window.location.href = "./recruiter-dashboard.html";
    } catch (error) {
      handleFormError(error, form, alertBox);
    } finally {
      setBusy(submitBtn, false);
    }
  });
});
