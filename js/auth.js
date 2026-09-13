const TOKEN_KEY = "boxservice.jwt";
const USER_KEY = "boxservice.user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
  } catch {
    return null;
  }
}

export function saveSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: data.username,
    role: data.role,
  }));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasRole(...roles) {
  return roles.includes(getCurrentUser()?.role);
}

export function logout() {
  clearSession();
  window.location.href = `${window.location.pathname.includes("/pages/") ? ".." : "."}/login.html`;
}

export function requireSession() {
  if (!getToken()) {
    window.location.href = `${window.location.pathname.includes("/pages/") ? ".." : "."}/login.html`;
    return false;
  }
  return true;
}
