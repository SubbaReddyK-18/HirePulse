const STORAGE_KEY = "jobnest_session";

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setCurrentUser(user) {
  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn() {
  return Boolean(getCurrentUser());
}

export function hasRole(role) {
  const user = getCurrentUser();
  return Boolean(user && user.role === role);
}

export function logout() {
  clearSession();
  window.location.href = "./login.html";
}
