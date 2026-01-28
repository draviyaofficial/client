import { API_URL } from "../apiConfig";

const defaultHeaders = {
  "Content-Type": "application/json",
};

interface BackendResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface TokenApplication {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  description: string;
  logoUrl?: string;
  initialSupply: string;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "MINTED" | "REJECTED";
  mintAddress?: string;
  rejectionReason?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    email?: string;
    createdToken?: {
      id: string;
      name: string;
      symbol: string;
      totalSupply: string;
      mintAddress: string | null;
      iro?: {
        id: string;
        status: "SCHEDULED" | "LIVE" | "COMPLETED" | "FAILED";
        startTime: string;
        endTime: string;
        hardCap: string;
        softCap: string;
        amountRaised: string;
        tokensSold: string;
        tokenPrice: string;
      };
    };
  };
}

export interface ApplyTokenData {
  name: string;
  symbol: string;
  description: string;
  logoUrl?: string;
  initialSupply: number;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
}

interface FetchTokenApplicationsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: "asc" | "desc";
  timeRange?: string;
  search?: string;
}

/**
 * Checks if a token ticker symbol is available.
 * @param symbol - The ticker symbol to check.
 * @returns Object indicating availability and the symbol.
 */
export const checkTickerAvailabilityFn = async (symbol: string) => {
  const response = await fetch(`${API_URL}/v1/token/ticker/${symbol}`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
    },
  });

  const json: BackendResponse<{ available: boolean; symbol: string }> =
    await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to check ticker availability");
  }

  return json.data;
};

/**
 * Submits a new token application.
 * @param token - The user's session token.
 * @param data - The token application data.
 * @returns The created token application.
 */
export const applyTokenFn = async (token: string, data: ApplyTokenData) => {
  const response = await fetch(`${API_URL}/v1/token/apply`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json: BackendResponse<TokenApplication> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to submit token application");
  }

  return json.data;
};

export const fetchTokenApplicationsFn = async (
  token: string,
  params: FetchTokenApplicationsParams = {},
): Promise<{
  data: TokenApplication[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
    ...(params.status ? { status: params.status } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.timeRange ? { timeRange: params.timeRange } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const response = await fetch(`${API_URL}/v1/token?${query}`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<{
    data: TokenApplication[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to fetch token applications");
  }

  return json.data;
};

export const approveTokenApplicationFn = async (
  token: string,
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) => {
  const response = await fetch(`${API_URL}/v1/token/${id}/approve`, {
    method: "PUT", // Matches server route
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, rejectionReason }),
  });

  const json: BackendResponse<TokenApplication> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to approve application");
  }

  return json.data;
};

export const rejectTokenApplicationFn = async (
  token: string,
  id: string,
  rejectionReason: string,
) => {
  const response = await fetch(`${API_URL}/v1/token/${id}/reject`, {
    method: "PUT", // Matches server route
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rejectionReason }),
  });

  const json: BackendResponse<TokenApplication> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to reject application");
  }

  return json.data;
};
