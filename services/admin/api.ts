const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

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
}

export const fetchApplicationsFn = async (
  token: string,
  params: FetchApplicationsParams = {}
): Promise<{ data: CreatorApplication[]; meta: any }> => {
  const query = new URLSearchParams({
    page: (params.page || 1).toString(),
    limit: (params.limit || 20).toString(),
    ...(params.status ? { status: params.status } : {}),
  });

  const response = await fetch(`${API_URL}/v1/creator-onboarding?${query}`, {
    method: "GET",
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`,
    },
  });

  const json: BackendResponse<any> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to fetch applications");
  }

  return json.data;
};

export const approveApplicationFn = async (
  token: string,
  applicationId: string,
  sector: string
) => {
  const response = await fetch(
    `${API_URL}/v1/creator-onboarding/${applicationId}/approve`,
    {
      method: "POST",
      headers: {
        ...defaultHeaders,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sector }),
    }
  );

  const json: BackendResponse<any> = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json.message || "Failed to approve application");
  }

  return json.data;
};
