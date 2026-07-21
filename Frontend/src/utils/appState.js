const LANGUAGE_KEY = 'cropcare_language';
const ROLE_KEY = 'cropcare_role';
const AUTH_KEY = 'cropcare_authenticated';

export function setLanguage(language) {
    localStorage.setItem(LANGUAGE_KEY, language);
}

export function getLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || 'English';
}

export function setRole(role) {
    localStorage.setItem(ROLE_KEY, role);
}

export function getRole() {
    return localStorage.getItem(ROLE_KEY) || '';
}

export function setAuthenticated(value) {
    localStorage.setItem(AUTH_KEY, value ? 'true' : 'false');
}

export function isAuthenticated() {
    return localStorage.getItem(AUTH_KEY) === 'true';
}

export function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
}
