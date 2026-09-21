import { createJob } from "./service/jobService.js";
import { initLayout } from "./main.js";
import { getCurrentUser } from "./auth.js";
import { validateJob } from "../exception/validationException.js";
import { parseSkills, todayIsoDate } from "./utils.js";
import { clearAlert, clearFieldErrors, handleFormError, setBusy, showAlert } from "./ui.js";

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
