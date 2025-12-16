let cached = false;

export async function login(email: string, password: string) {
  // Placeholder for Cognito hosted UI or SRP implementation.
  if (!email || !password) throw new Error('Missing credentials');
  cached = true;
}

export async function fetchSession() {
  return cached;
}

export async function getIdToken() {
  return cached ? 'mock-token' : undefined;
}
