const BASE = import.meta.env.VITE_API_URL;

export function getToken() {
  return localStorage.getItem("club_token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const clubApi = {
  login:      (email, password) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register:   (body) => apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify({ ...body, role: "club_admin" }) }),
  me:         () => apiFetch("/api/auth/me"),
  myClub:     () => apiFetch("/api/clubs/admin/my-club"),
  listClubs:  () => apiFetch("/api/clubs"),
  createClub: (body) => apiFetch("/api/clubs", { method: "POST", body: JSON.stringify(body) }),

  // Events — uses FormData to support file upload
  createEvent: (formData) => apiFetch("/api/events", { method: "POST", body: formData }),
  updateEvent: (id, formData) => apiFetch(`/api/events/${id}`, { method: "PATCH", body: formData }),
  deleteEvent: (id) => apiFetch(`/api/events/${id}`, { method: "DELETE" }),

  // Eating club status
  submitStatus: (clubId, body) => apiFetch(`/api/clubs/eating/${clubId}/status`, { method: "POST", body: JSON.stringify(body) }),

  // Club admin applications
  applyAsAdmin:       (body) => apiFetch("/api/auth/apply-admin", { method: "POST", body: JSON.stringify(body) }),
  applyToClub:        (body) => apiFetch("/api/clubs/admin/apply", { method: "POST", body: JSON.stringify(body) }),
  myApplications:     () => apiFetch("/api/clubs/admin/applications/mine"),
  listApplications:   (status = "pending") => apiFetch(`/api/clubs/admin/applications?status=${status}`),
  approveApplication: (id) => apiFetch(`/api/clubs/admin/applications/${id}/approve`, { method: "POST" }),
  rejectApplication:  (id) => apiFetch(`/api/clubs/admin/applications/${id}/reject`, { method: "POST" }),
};
