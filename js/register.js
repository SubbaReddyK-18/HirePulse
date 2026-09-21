import { createUser, getUsersByEmail } from "./service/userService.js";
import { initLayout } from "./main.js";
import { setCurrentUser } from "./auth.js";
import { validateRegistration, ValidationException } from "../exception/validationException.js";
import { clearAlert, clearFieldErrors, handleFormError, setBusy } from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initLayout();
  const form = document.getElementById("register-form");
  const alertBox = document.getElementById("form-alert");
  const submitBtn = document.getElementById("register-submit");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAlert(alertBox);
    clearFieldErrors(form);

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      password: form.password.value,
      role: form.role.value
    };

    try {
      validateRegistration(payload);
      setBusy(submitBtn, true, "Creating account...");
      const existing = await getUsersByEmail(payload.email);
      if (existing.length) {
        throw new ValidationException("An account with this email already exists.", {
          email: "Try logging in or use a different email."
        });
      }

      const user = await createUser(payload);
      setCurrentUser(user);
      window.location.href = "./index.html";
    } catch (error) {
      handleFormError(error, form, alertBox);
    } finally {
      setBusy(submitBtn, false);
    }
  });
});
