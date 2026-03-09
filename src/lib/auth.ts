const AUTH_KEY = 'seo-dashboard-auth';

const VALID_ID = 'admin@quicktravels';
const VALID_PASSWORD = 'jermainelamarcole';

export function login(id: string, password: string): boolean {
  if (id === VALID_ID && password === VALID_PASSWORD) {
    localStorage.setItem(AUTH_KEY, '1');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === '1';
}
