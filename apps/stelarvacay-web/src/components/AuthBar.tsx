type AuthBarProps = {
  token: string | null;
  onTokenChange: (token: string | null) => void;
  onAuthError: (message: string) => void;
};

export function AuthBar({ token, onTokenChange, onAuthError }: AuthBarProps) {
  // Decode display email from JWT payload if available (no signature check needed here)
  let displayEmail: string | null = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      displayEmail = payload.email ?? payload.sub ?? "Signed in";
    } catch {
      displayEmail = "Signed in";
    }
  }

  return (
    <div className="auth-bar" role="navigation" aria-label="Account">
      {token ? (
        <div className="auth-bar-inner">
          <span className="auth-bar-email" title={displayEmail ?? undefined}>
            {displayEmail}
          </span>
          <button
            type="button"
            className="auth-bar-button"
            onClick={() => {
              try {
                onTokenChange(null);
              } catch (err) {
                onAuthError(err instanceof Error ? err.message : "Sign out failed.");
              }
            }}
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="auth-bar-button auth-bar-button-primary"
          onClick={() => {
            // Prompt for JWT token — in production this would redirect to your auth provider
            const jwt = window.prompt("Enter your StelarVacay token:");
            if (jwt && jwt.trim()) {
              try {
                onTokenChange(jwt.trim());
              } catch (err) {
                onAuthError(err instanceof Error ? err.message : "Sign in failed.");
              }
            }
          }}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
