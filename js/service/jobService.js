import { api } from "./apiConfig.js";
import { withApiHandler } from "../../exception/apiException.js";
import { deleteApplicationsByJobId } from "./applicationService.js";

export function getJobs() {
  return withApiHandler(
    () => api.get("/jobs").then((response) => response.data),
    "Unable to load jobs."
  );
}

export function getJobById(id) {
  return withApiHandler(
    () => api.get(`/jobs/${id}`).then((response) => response.data),
    "Unable to load this job."
  );
}

export function getJobsByRecruiter(recruiterId) {
  return withApiHandler(
    () => api.get("/jobs", { params: { recruiterId } }).then((response) => response.data),
    "Unable to load your posted jobs."
  );
}

export function createJob(job) {
  return withApiHandler(
    () => api.post("/jobs", job).then((response) => response.data),
    "Unable to create the job."
  );
}

export function updateJob(id, job) {
  return withApiHandler(
    () => api.put(`/jobs/${id}`, job).then((response) => response.data),
    "Unable to update the job."
  );
}

export function deleteJob(id) {
  return withApiHandler(async () => {
    await deleteApplicationsByJobId(id);
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  }, "Unable to delete the job.");
}
