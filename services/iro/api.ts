import { API_URL } from "../apiConfig";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export interface IRO {
  id: string;
  tokenId: string;
  startTime: string;
  endTime: string;
  hardCap: string;
  softCap: string;
  tokensForSale: string;
  tokenPrice: string;
  totalRaised: string;
  tokensSold: string;
  vestingPeriod: number;
  cliffPeriod: number;
  minPurchase?: string; // Optional because it might not be in all responses
  maxPurchase?: string; // Optional
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "FAILED";
  token: {
    id: string;
    name: string;
    symbol: string;
    mintAddress: string;
    websiteUrl?: string; // Optional
    twitterUrl?: string; // Optional
    telegramUrl?: string; // Optional
    discordUrl?: string; // Optional
    description?: string; // Optional
    logoUrl?: string; // Optional
    user: {
      profilePicUrl: string | null;
      creatorProfile: {
        displayName: string;
        sector: string | null;
        bio?: string | null;
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

/**
 * Get IRO by ID
 */
export const getIROByIdFn = async (id: string): Promise<IRO> => {
  const response = await fetch(`${API_URL}/v1/iro/${id}`, {
    method: "GET",
    headers: { ...defaultHeaders },
  });

  const json: BackendResponse<IRO> = await response.json();
  if (!json.ok) throw new Error(json.message || "Failed to fetch IRO");
  return json.data;
};

/**
 * Create Buy Intent
 */
export const createBuyIntentFn = async (
  token: string,
  iroId: string,
  amount: number,
): Promise<{
  iroId: string;
  depositAddress: string;
  estimatedTokens: string;
  amountSol: number;
}> => {
  const response = await fetch(`${API_URL}/v1/iro/${iroId}/buy`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  const json = await response.json();
  if (!json.ok) throw new Error(json.message || "Failed to initiate purchase");
  return json.data;
};

/**
 * Confirm Buy
 */
export const confirmBuyFn = async (
  token: string,
  iroId: string,
  signature: string,
  amount: number,
  userWalletAddress: string,
): Promise<{ status: string; tokens: number }> => {
  const response = await fetch(`${API_URL}/v1/iro/${iroId}/confirm`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ signature, amount, userWalletAddress }),
  });

  const json = await response.json();
  if (!json.ok) throw new Error(json.message || "Failed to confirm purchase");
  return json.data;
};

export interface IROParticipant {
  userId: string;
  totalAmountSOL: number;
  totalTokenQuantity: number;
  user: {
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    profilePicUrl: string | null;
    walletAddress: string | null;
  } | null;
}

export const getIROParticipantsFn = async (
  iroId: string,
): Promise<IROParticipant[]> => {
  const response = await fetch(`${API_URL}/v1/iro/${iroId}/participants`, {
    method: "GET",
    headers: { ...defaultHeaders },
  });

  const json: BackendResponse<IROParticipant[]> = await response.json();
  if (!json.ok) throw new Error(json.message || "Failed to fetch participants");
  return json.data;
};

export interface UserInvestment {
  id: string; // Allocation ID
  token: {
    id: string;
    name: string;
    symbol: string;
    logoUrl?: string; // Optional
    mintAddress: string;
  };
  iroId: string;
  totalAmount: string; // Decimal string
  unlockedAmount: string; // Decimal string
  claimedAmount: string; // Decimal string
  claimableAmount: string; // Decimal string
  lockedAmount: string; // Decimal string
  vestingProgress: number; // 0-1
  isFullyVested: boolean;
  nextUnlockTime: number | null;
  vestingEndTime: number;
}

/**
 * Get User Investments
 */
export const getUserInvestmentsFn = async (
  token: string,
): Promise<UserInvestment[]> => {
  const response = await fetch(`${API_URL}/v1/iro/user/investments`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<UserInvestment[]> = await response.json();
  if (!json.ok)
    throw new Error(json.message || "Failed to fetch user investments");
  return json.data;
};

/**
 * Claim Tokens
 */
export const claimTokensFn = async (
  token: string,
  iroId: string,
): Promise<{
  txSignature: string;
  amountClaimed: string;
  remaining: string;
}> => {
  const response = await fetch(`${API_URL}/v1/iro/${iroId}/claim`, {
    method: "POST",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<{
    txSignature: string;
    amountClaimed: string;
    remaining: string;
  }> = await response.json();

  if (!json.ok) throw new Error(json.message || "Failed to claim tokens");
  return json.data;
};
