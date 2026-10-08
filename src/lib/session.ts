const TOKEN_KEY = "heimdall.token";

/** The read token lives in sessionStorage only, so closing the tab signs out. */
export function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage blocked: the token lives in memory for this tab only */
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing stored, nothing to clear */
  }
}
