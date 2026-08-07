const devApi = 'http://127.0.0.1:8000';

// In development (vite on :3000) the API runs on a separate origin.
// In production the backend serves the built SPA from the same origin,
// so a relative path avoids hard-coding the host.
export const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? devApi : '');

// How long a signed-in session lasts before the user must log in again.
// After this time the app signs the user out automatically (like most sites).
export const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours
