import { LoginInput, LoginResponse, RegisterInput, User } from "../types";

// Standardized backend response shape
interface BackendResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

import { API_URL } from "../../../apiConfig";

/**
 * Default headers for API requests.
 */
const defaultHeaders = {
  "Content-Type": "application/json",
};

// =======================
//     AUTH FUNCTIONS
// =======================

// --- LOGIN ---
/**
 * Authenticates a user with email and password.
 * @param credentials - The user's login credentials.
 * @returns The login response containing the user and session token.
 */
export const loginFn = async (
  credentials: LoginInput,
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(credentials),
    credentials: "include", // Important for cookies
  });

  const json: BackendResponse<LoginResponse> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Login failed");
  }

  return json.data;
};

// --- REGISTER ---
/**
 * Registers a new user.
 * @param data - The registration data.
 * @returns The registered user object.
 */
export const registerFn = async (data: RegisterInput): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(data),
    credentials: "include",
  });

  const json: BackendResponse<User> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Registration failed");
  }

  return json.data;
};

// --- LOGOUT ---
/**
 * Logs out the current user.
 */
export const logoutFn = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  // Logout may return empty response. So attempt JSON but fallback safely.
  try {
    const json: BackendResponse<null> = await response.json();

    if (!response.ok || !json.ok) {
      throw new Error(json.message || "Logout failed");
    }
  } catch {
    // If backend returns empty 200 body
    if (!response.ok) {
      throw new Error("Logout failed");
    }
  }
};

// --- FETCH CURRENT USER ---
export const fetchMeFn = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/v1/user`, {
      method: "GET",
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const json: BackendResponse<User | null> = await response.json();

    if (!json.ok || !json.data) return null;

    return json.data;
  } catch {
    return null;
  }
};

// --- SYNC PRIVY USER ---
export const syncUserFn = async (
  userData: { privyId: string; email?: string; walletAddress?: string },
  token: string,
): Promise<User> => {
  const response = await fetch(`${API_URL}/v1/user`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const json: BackendResponse<User> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Sync failed");
  }

  return json.data;
};

// --- UPDATE USER ---
export const updateUserFn = async (
  userData: Partial<User>,
  token: string,
): Promise<User> => {
  const response = await fetch(`${API_URL}/v1/user`, {
    method: "PATCH",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const json: BackendResponse<User> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Update failed");
  }

  return json.data;
};

// =======================
//   ONBOARDING FUNCTIONS
// =======================

export interface CreateApplicationInput {
  name: string;
  description: string;
  contactNumber: string;
  emailAddress: string;
  socials: { platform: string; url: string }[];
}

export const createApplicationFn = async (
  data: CreateApplicationInput,
  token: string,
) => {
  const response = await fetch(`${API_URL}/v1/creator-onboarding`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json: BackendResponse<unknown> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Application submission failed");
  }

  return json.data;
};
