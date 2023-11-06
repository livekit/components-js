/**
 * A simple helper function to generate a random user identity.
 */
export function generateRandomUserId() {
  return `test-identity-${String(Math.random() * 100_000).slice(0, 5)}` as const;
}
