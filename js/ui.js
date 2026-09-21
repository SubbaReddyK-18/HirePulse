import { ApiException } from "../exception/apiException.js";
import { ValidationException } from "../exception/validationException.js";

export function showAlert(container, message, type = "error") {
  if (!container) {
    return;
  }
  container.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
}

export function clearAlert(container) {
  if (container) {
    container.innerHTML = "";
  }
}

export function showFieldErrors(form, fieldErrors = {}) {
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

export function clearFieldErrors(form) {
  showFieldErrors(form, {});
}

export function setBusy(button, isBusy, busyText = "Please wait...") {
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

export function renderLoading(container, message = "Loading...") {
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

export function renderEmpty(container, title, message) {
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

export function renderError(container, message) {
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

export function getUserFacingError(error, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ValidationException || error instanceof ApiException) {
    return error.message;
  }
  return fallback;
}

export function handleFormError(error, form, alertBox) {
  if (error instanceof ValidationException) {
    showFieldErrors(form, error.fieldErrors);
    showAlert(alertBox, error.message, "error");
    return;
  }
  showAlert(alertBox, getUserFacingError(error), "error");
}
