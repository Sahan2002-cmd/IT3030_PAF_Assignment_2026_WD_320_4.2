const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.reason ||
      `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

export function loginUser(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function signupUser(payload) {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function fetchCurrentUser(token) {
  return apiRequest("/api/auth/me", { token });
}

export function fetchPendingTechnicians(token) {
  return apiRequest("/api/admin/technicians/pending", { token });
}

export function approveTechnician(technicianId, token) {
  return apiRequest(`/api/admin/technicians/${technicianId}/approve`, {
    method: "PATCH",
    token,
  });
}

export { API_BASE_URL };
