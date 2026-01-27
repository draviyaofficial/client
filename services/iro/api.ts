import { API_URL } from "../apiConfig";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export interface IRO {
  id: string;
  tokenId: string;
  startTime: string;
  endTime: string;
  hardCap: number;
  tokensForSale: number;
  vestingPeriod: number;
  cliffPeriod: number;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "FAILED";
  token: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    user: {
      creatorProfile: {
        displayName: string;
        profilePicUrl: string | null;
        sector: string | null;
      } | null;
    };
  };
}

interface FetchIROsParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface BackendResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

/**
 * Lists Initial Royalty Offerings.
 * @param params - Query parameters.
 * @returns List of IROs.
 */
export const listIROsFn = async (
  params: FetchIROsParams = {},
): Promise<{
  data: IRO[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
    ...(params.status ? { status: params.status } : {}),
  });

  const response = await fetch(`${API_URL}/v1/iro/list?${query}`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
    },
  });

  const json: BackendResponse<{
    data: IRO[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to fetch IROs");
  }

  return json.data;
};
