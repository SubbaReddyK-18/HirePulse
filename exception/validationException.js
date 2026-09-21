export class ValidationException extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = "ValidationException";
    this.fieldErrors = fieldErrors;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(data) {
  const fieldErrors = {};

  if (!data.name || data.name.trim().length < 2) {
    fieldErrors.name = "Enter your full name (at least 2 characters).";
  }

  if (!data.email || !EMAIL_PATTERN.test(data.email.trim())) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!data.password || data.password.length < 6) {
    fieldErrors.password = "Password must be at least 6 characters.";
  }

  if (data.role !== "candidate" && data.role !== "recruiter") {
    fieldErrors.role = "Choose a role: Candidate or Recruiter.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new ValidationException("Please correct the highlighted fields.", fieldErrors);
  }
}

export function validateLogin(data) {
  const fieldErrors = {};

  if (!data.email || !EMAIL_PATTERN.test(data.email.trim())) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!data.password) {
    fieldErrors.password = "Password is required.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new ValidationException("Please enter your login details.", fieldErrors);
  }
}

export function validateJob(data) {
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

export function validateApplication(data) {
  const fieldErrors = {};

  if (!data.jobId) {
    fieldErrors.job = "This job is not available.";
  }

  if (!data.userId) {
    fieldErrors.user = "You must be logged in as a candidate to apply.";
  }

  if (!data.resume || data.resume.trim().length < 30) {
    fieldErrors.resume = "Add a resume summary of at least 30 characters.";
  }

  if (Object.keys(fieldErrors).length) {
    throw new ValidationException("Please complete your application.", fieldErrors);
  }
}

export function assertDuplicateApplication(existing) {
  if (existing && existing.length > 0) {
    throw new ValidationException("You have already applied to this job.", {
      resume: "A duplicate application is not allowed for the same job."
    });
  }
}
