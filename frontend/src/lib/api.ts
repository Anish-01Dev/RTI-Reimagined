import type {
  Appeal,
  AppealDraft,
  Application,
  ApplicationDoctorOutput,
  ApplicationEvent,
  Certificate,
  Deadline,
  DecomposedItem,
  InformationItem,
} from "@/types";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let code = "UNKNOWN";
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
    } catch {
      // response body wasn't JSON — fall back to the generic message above
    }
    throw new ApiError(response.status, code, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export interface CreateApplicationInput {
  user_id: string;
  authority_id: string;
  subject: string;
  original_request: string;
  refined_request?: string | null;
  items?: DecomposedItem[] | null;
}

export const api = {
  applications: {
    create: (input: CreateApplicationInput) =>
      request<Application>("/applications", {
        method: "POST",
        body: JSON.stringify(input),
      }),

    decompose: (raw_text: string, jurisdiction_hint?: string | null) =>
      request<ApplicationDoctorOutput>("/applications/decompose", {
        method: "POST",
        body: JSON.stringify({
          raw_text,
          jurisdiction_hint: jurisdiction_hint ?? null,
        }),
      }),

    get: (id: string) => request<Application>(`/applications/${id}`),

    listEvents: (id: string) =>
      request<ApplicationEvent[]>(`/applications/${id}/events`),

    createEvent: (
      id: string,
      event_type: string,
      actor_id?: string | null,
      metadata?: unknown,
    ) =>
      request<ApplicationEvent>(`/applications/${id}/events`, {
        method: "POST",
        body: JSON.stringify({
          event_type,
          actor_id: actor_id ?? null,
          metadata: metadata ?? null,
        }),
      }),

    listDeadlines: (id: string) =>
      request<Deadline[]>(`/applications/${id}/deadlines`),

    listItems: (id: string) =>
      request<InformationItem[]>(`/applications/${id}/items`),

    getCertificate: (id: string) =>
      request<Certificate>(`/applications/${id}/certificate`),

    submitResponse: (
      id: string,
      response_text: string,
      actor_id?: string | null,
    ) =>
      request<InformationItem[]>(`/applications/${id}/response`, {
        method: "POST",
        body: JSON.stringify({ response_text, actor_id: actor_id ?? null }),
      }),

    getAppealDraft: (id: string) =>
      request<AppealDraft>(`/applications/${id}/appeal`),

    fileAppeal: (id: string, reason: string, actor_id?: string | null) =>
      request<Appeal>(`/applications/${id}/appeal/file`, {
        method: "POST",
        body: JSON.stringify({ reason, actor_id: actor_id ?? null }),
      }),
  },

  evidence: {
    verify: (certificate: Certificate) =>
      request<{ valid: boolean; reason: string | null }>("/evidence/verify", {
        method: "POST",
        body: JSON.stringify(certificate),
      }),
  },

  // Demo-only — see backend/app/api/v1/dev_tools.py. Never mounted when
  // ENVIRONMENT=production (see backend/app/main.py).
  devTools: {
    simulateDeadlineMiss: (applicationId: string) =>
      request<{ transitioned: number; status: string }>(
        `/dev/applications/${applicationId}/simulate-deadline-miss`,
        { method: "POST" },
      ),
  },
};
