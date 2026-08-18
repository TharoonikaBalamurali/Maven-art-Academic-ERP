/**
 * Sign-in hints for the mock API.
 *
 * Rendered only when `VITE_API_MODE=mock`, so it disappears the moment the
 * real backend is connected. These are fixture accounts, not credentials.
 */
const ACCOUNTS = [
  ['Admin', 'admin@mavenart.test'],
  ['Accounts', 'accounts@mavenart.test'],
  ['Faculty', 'faculty@mavenart.test'],
  ['Student', 'student@mavenart.test'],
  ['Parent', 'parent@mavenart.test'],
] as const;

export function DemoCredentials() {
  return (
    <aside className="surface-card mt-4 rounded-lg p-3 text-xs">
      <p className="font-medium">Mock API is active</p>
      <p className="mt-1 text-[var(--text-muted)]">
        Sign in with any account below. Password: <code className="font-mono">password</code>
      </p>
      <ul className="mt-2 grid gap-1">
        {ACCOUNTS.map(([label, email]) => (
          <li key={email} className="flex justify-between gap-2">
            <span className="text-[var(--text-muted)]">{label}</span>
            <code className="font-mono">{email}</code>
          </li>
        ))}
      </ul>
    </aside>
  );
}
