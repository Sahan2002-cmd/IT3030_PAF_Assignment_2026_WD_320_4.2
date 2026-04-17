const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

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

export function loginWithGoogle(payload) {
  return apiRequest("/api/auth/google", {
    method: "POST",
    body: payload,
  });
}

export function requestPasswordResetOtp(payload) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export function resetPasswordWithOtp(payload) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: payload,
  });
}

export function fetchCurrentUser(token) {
  return apiRequest("/api/auth/me", { token });
}

export function updateOwnProfile(payload, token) {
  return apiRequest("/api/auth/me", {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function fetchMyNotifications(token) {
  return apiRequest("/api/notifications/me", { token });
}

export function markNotificationsRead(token) {
  return apiRequest("/api/notifications/me/read-all", {
    method: "PATCH",
    token,
  });
}

export function fetchPendingTechnicians(token) {
  return apiRequest("/api/admin/technicians/pending", { token });
}

export function fetchAllUsers(token) {
  return apiRequest("/api/admin/users", { token });
}

export function approveTechnician(technicianId, token) {
  return apiRequest(`/api/admin/technicians/${technicianId}/approve`, {
    method: "PATCH",
    token,
  });
}

export function deleteUser(userId, token) {
  return apiRequest(`/api/admin/users/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function fetchMyTickets(token) {
  return apiRequest("/api/tickets/my", { token });
}

export function createResource(payload, token) {
  return apiRequest("/api/admin/resources", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateResource(resourceId, payload, token) {
  return apiRequest(`/api/admin/resources/${resourceId}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function deleteResource(resourceId, token) {
  return apiRequest(`/api/admin/resources/${resourceId}`, {
    method: "DELETE",
    token,
  });
}

export function fetchResources(filters = {}, token) {
  const searchParams = new URLSearchParams();

  if (filters.type) {
    searchParams.set("type", filters.type);
  }

  if (filters.minCapacity) {
    searchParams.set("minCapacity", String(filters.minCapacity));
  }

  if (filters.location) {
    searchParams.set("location", filters.location);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  const query = searchParams.toString();
  return apiRequest(`/api/resources${query ? `?${query}` : ""}`, { token });
}

export function createBooking(payload, token) {
  return apiRequest("/api/bookings", {
    method: "POST",
    body: payload,
    token,
  });
}

export function fetchMyBookings(token) {
  return apiRequest("/api/bookings/my", { token });
}

export function cancelBooking(bookingId, payload, token) {
  return apiRequest(`/api/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function fetchAllBookings(filters = {}, token) {
  const searchParams = new URLSearchParams();

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.resourceId) {
    searchParams.set("resourceId", String(filters.resourceId));
  }

  if (filters.requester) {
    searchParams.set("requester", filters.requester);
  }

  const query = searchParams.toString();
  return apiRequest(`/api/admin/bookings${query ? `?${query}` : ""}`, { token });
}

export function approveBooking(bookingId, payload, token) {
  return apiRequest(`/api/admin/bookings/${bookingId}/approve`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function rejectBooking(bookingId, payload, token) {
  return apiRequest(`/api/admin/bookings/${bookingId}/reject`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function fetchAssignedTickets(token) {
  return apiRequest("/api/tickets/assigned", { token });
}

export function fetchAllTickets(token) {
  return apiRequest("/api/admin/tickets", { token });
}

export function fetchAssignableTechnicians(token) {
  return apiRequest("/api/admin/tickets/technicians", { token });
}

export function createTicket(payload, token) {
  return apiRequest("/api/tickets", {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateTicketStatus(ticketId, payload, token) {
  return apiRequest(`/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function assignTicket(ticketId, payload, token) {
  return apiRequest(`/api/admin/tickets/${ticketId}/assign`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function rejectTicket(ticketId, payload, token) {
  return apiRequest(`/api/admin/tickets/${ticketId}/reject`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function addTicketComment(ticketId, payload, token) {
  return apiRequest(`/api/tickets/${ticketId}/comments`, {
    method: "POST",
    body: payload,
    token,
  });
}

export function updateTicketComment(commentId, payload, token) {
  return apiRequest(`/api/tickets/comments/${commentId}`, {
    method: "PATCH",
    body: payload,
    token,
  });
}

export function deleteTicketComment(commentId, token) {
  return apiRequest(`/api/tickets/comments/${commentId}`, {
    method: "DELETE",
    token,
  });
}

export { API_BASE_URL };
