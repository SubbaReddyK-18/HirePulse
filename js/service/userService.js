import { api } from "./apiConfig.js";
import { withApiHandler } from "../../exception/apiException.js";

export function getUsers() {
  return withApiHandler(
    () => api.get("/users").then((response) => response.data),
    "Unable to load users."
  );
}

export function getUserById(id) {
  return withApiHandler(
    () => api.get(`/users/${id}`).then((response) => response.data),
    "Unable to load this user."
  );
}

export function getUsersByEmail(email) {
  return withApiHandler(
    () => api.get("/users", { params: { email } }).then((response) => response.data),
    "Unable to look up this email."
  );
}

export function createUser(user) {
  return withApiHandler(
    () => api.post("/users", user).then((response) => response.data),
    "Unable to create the account."
  );
}
