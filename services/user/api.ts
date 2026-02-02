import { API_URL } from "../apiConfig";

export interface PortfolioItem {
  id: string;
  userId: string;
  tokenId: string;
  iroId: string | null;
  totalAmount: number;
  unlockedAmount: number;
  claimedAmount: number;
  isClaimable: boolean;
  token: {
    id: string;
    name: string;
    symbol: string;
    logoUrl: string | null;
    mintAddress: string | null;
    user: {
      profilePicUrl: string | null;
      creatorProfile: {
        displayName: string;
      } | null;
    };
  };
  currentPrice: number;
  currentValue: number;
}

export const getUserPortfolioFn = async (
  token: string,
): Promise<PortfolioItem[]> => {
  const response = await fetch(`${API_URL}/v1/user/portfolio`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch portfolio");
  }

  const json = await response.json();
  if (!json.ok) throw new Error(json.message || "Failed to fetch portfolio");
  return json.data;
};
