import { API_URL } from "../apiConfig";

const defaultHeaders = {
  "Content-Type": "application/json",
};

interface BackendResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface CreatorApplication {
  id: string;
  userId: string;
  name: string;
  description: string;
  contactNumber: string;
  emailAddress: string;
  state: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
  socials: {
    platform: string;
    url: string;
    handle?: string;
  }[];
}

interface FetchApplicationsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: "asc" | "desc";
  timeRange?: string;
}

/**
 * Fetches creator applications.
 * @param token - Admin token.
 * @param params - Query parameters.
 * @returns List of applications.
 */
export const fetchApplicationsFn = async (
  token: string,
  params: FetchApplicationsParams = {},
): Promise<{
  data: CreatorApplication[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
    ...(params.status ? { status: params.status } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.timeRange ? { timeRange: params.timeRange } : {}),
  });

  const response = await fetch(`${API_URL}/v1/creator-onboarding?${query}`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<{
    data: CreatorApplication[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to fetch applications");
  }

  return json.data;
};

/**
 * Updates application state.
 * @param token - Admin token.
 * @param applicationId - ID of application.
 * @param state - New state.
 */
export const updateApplicationStateFn = async (
  token: string,
  applicationId: string,
  state: string,
  sector?: string,
  rejectionReason?: string,
) => {
  const response = await fetch(
    `${API_URL}/v1/creator-onboarding/${applicationId}`,
    {
      method: "PATCH",
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ state, sector, rejectionReason }),
    },
  );

  const json: BackendResponse<CreatorApplication> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to update application state");
  }

  return json.data;
};

export interface EligibleCreator {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  creatorProfile: {
    displayName: string;
    profilePicUrl: string | null;
    sector: string | null;
  } | null;
  createdToken: {
    id: string;
    name: string;
    symbol: string;
    totalSupply: string;
    mintAddress: string;
  } | null;
  tokenApplication: {
    initialSupply: number;
    status: string;
  } | null;
}

/**
 * Gets creators eligible for token launch.
 * @param token - Admin token.
 * @returns List of eligible creators.
 */
export const getEligibleCreatorsFn = async (
  token: string,
): Promise<EligibleCreator[]> => {
  const response = await fetch(`${API_URL}/v1/admin/eligible-creators`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<EligibleCreator[]> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to fetch eligible creators");
  }

  return json.data;
};

export interface CreateIROInput {
  tokenId: string;
  startTime: string;
  endTime: string;
  hardCap: number;
  tokensForSale: number;
  vestingPeriod: number;
  cliffPeriod: number;
}

/**
 * Creates a new Initial Royalty Offering.
 * @param token - Admin token.
 * @param data - IRO creation data.
 * @returns Object containing the created IRO ID.
 */
export const createIROFn = async (token: string, data: CreateIROInput) => {
  const response = await fetch(`${API_URL}/v1/admin/iro/create`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json: BackendResponse<{ id: string }> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to create IRO");
  }

  return json.data;
};
