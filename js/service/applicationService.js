import { api } from "./apiConfig.js";
import { withApiHandler } from "../../exception/apiException.js";

export function getApplications() {
  return withApiHandler(
    () => api.get("/applications").then((response) => response.data),
    "Unable to load applications."
  );
}

export function getApplicationById(id) {
  return withApiHandler(
    () => api.get(`/applications/${id}`).then((response) => response.data),
    "Unable to load this application."
  );
}

export function getApplicationsByUser(userId) {
  return withApiHandler(
    () => api.get("/applications", { params: { userId } }).then((response) => response.data),
    "Unable to load your applications."
  );
}

export function getApplicationsByJob(jobId) {
  return withApiHandler(
    () => api.get("/applications", { params: { jobId } }).then((response) => response.data),
    "Unable to load applicants for this job."
  );
}

export function getApplicationsByUserAndJob(userId, jobId) {
  return withApiHandler(
    () => api.get("/applications", { params: { userId, jobId } }).then((response) => response.data),
    "Unable to check existing applications."
  );
}

export function createApplication(application) {
  return withApiHandler(
    () => api.post("/applications", application).then((response) => response.data),
    "Unable to submit the application."
  );
}

export function updateApplicationStatus(id, status) {
  return withApiHandler(
    () => api.patch(`/applications/${id}`, { status }).then((response) => response.data),
    "Unable to update application status."
  );
}

export function deleteApplication(id) {
  return withApiHandler(
    () => api.delete(`/applications/${id}`).then((response) => response.data),
    "Unable to remove the application."
  );
}

export async function deleteApplicationsByJobId(jobId) {
  const applications = await getApplicationsByJob(jobId);
  await Promise.all(applications.map((application) => deleteApplication(application.id)));
  return applications.length;
}
