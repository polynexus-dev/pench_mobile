import { httpClient } from "@services/api/httpClient";
import { buildUrl } from "@services/api/buildUrl";

/** Endpoint that initiates permanent account deletion (not a deactivation). */
export const DELETE_ACCOUNT_PATH = "/api/accounts/delete-account/";

export interface DeleteAccountPayload {
  /** Optional free-text reason captured from the confirmation screen. */
  reason?: string;
}

export interface DeleteAccountResponse {
  detail?: string;
  message?: string;
  /** Present when the backend honours a grace period before erasure. */
  scheduled_deletion_at?: string;
  /** Unpaid balance at the time of deletion — deletion does not clear it. */
  outstanding_balance?: number;
}

export const accountApi = {
  deleteAccount: (
    domainName: string,
    payload: DeleteAccountPayload = {}
  ): Promise<DeleteAccountResponse> =>
    httpClient.post(buildUrl(domainName, DELETE_ACCOUNT_PATH), payload),
};
