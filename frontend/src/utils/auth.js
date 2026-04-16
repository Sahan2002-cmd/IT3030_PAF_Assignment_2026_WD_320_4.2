const TOKEN_KEY = "token";
const USER_KEY = "user";

export function routeForRole(role) {
  switch (role) {
    case "ADMIN":
      return "/admin-dashboard";
    case "STUDENT":
      return "/student-dashboard";
    case "TECHNICIAN":
      return "/technician-dashboard";
    default:
      return "/login";
  }
}

export function storeSession(authResponse) {
  if (!authResponse?.token) {
    return {
      token: null,
      user: null,
    };
  }

  const user = {
    id: authResponse.id,
    name: authResponse.name,
    email: authResponse.email,
    mobileNumber: authResponse.mobileNumber,
    role: authResponse.role,
    approved: authResponse.approved,
  };

  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return {
    token: authResponse.token,
    user,
  };
}

export function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!token) {
    return { token: null, user: null };
  }

  try {
    return {
      token,
      user: rawUser ? JSON.parse(rawUser) : null,
    };
  } catch {
    clearSession();
    return { token: null, user: null };
  }
}

export function updateStoredUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
