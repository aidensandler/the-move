const BASE = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("tiger_token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export const api = {
  // Auth
  login:    (email, password) => apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body) => apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  me:       () => apiFetch("/api/auth/me"),

  // Events
  events:          (params = {}) => apiFetch("/api/events?" + new URLSearchParams(params)),
  event:           (id) => apiFetch(`/api/events/${id}`),
  recommendations: () => apiFetch("/api/social/recommendations"),

  // RSVPs
  toggleRsvp: (eventId) => apiFetch(`/api/social/rsvp/${eventId}`, { method: "POST" }),
  myRsvps:    () => apiFetch("/api/social/my-rsvps"),

  // Tickets
  purchaseTicket: (body) => apiFetch("/api/social/tickets", { method: "POST", body: JSON.stringify(body) }),
  myTickets:      () => apiFetch("/api/social/tickets"),

  // Social
  friends:         () => apiFetch("/api/social/friends"),
  friendsActivity: () => apiFetch("/api/social/friends-activity"),
  toggleFollow:    (userId) => apiFetch(`/api/social/follow/${userId}`, { method: "POST" }),
  searchUsers:     (q = "") => apiFetch("/api/social/users?" + new URLSearchParams({ q })),

  // Clubs & eating
  clubs:           () => apiFetch("/api/clubs"),
  eatingStatus:    () => apiFetch("/api/clubs/eating/status"),
  submitEcStatus:  (clubId, body) => apiFetch(`/api/clubs/eating/${clubId}/status`, { method: "POST", body: JSON.stringify(body) }),
};
