import { getUsersByEmail } from "./service/userService.js";
import { initLayout } from "./main.js";
import { setCurrentUser } from "./auth.js";
import { validateLogin, ValidationException } from "../exception/validationException.js";
import { clearAlert, clearFieldErrors, handleFormError, setBusy, showAlert } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initLayout();
  const form = document.getElementById("login-form");
  const alertBox = document.getElementById("form-alert");
  const submitBtn = document.getElementById("login-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert(alertBox);
    clearFieldErrors(form);

    const payload = {
      email: form.email.value.trim(),
      password: form.password.value
    };

    try {
      validateLogin(payload);
      setBusy(submitBtn, true, "Signing in...");
      const matches = await getUsersByEmail(payload.email);
      const user = matches.find((item) => item.password === payload.password);

      if (!user) {
        throw new ValidationException("Invalid email or password.", {
          password: "Check your email and password and try again."
        });
      }

      setCurrentUser(user);
      window.location.href = user.role === "recruiter"
        ? "./recruiter-dashboard.html"
        : "./candidate-dashboard.html";
    } catch (error) {
      handleFormError(error, form, alertBox);
    } finally {
      setBusy(submitBtn, false);
    }
  });
});
