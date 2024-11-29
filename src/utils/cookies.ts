export const clearAuthCookies = () => {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict';
};

export const setAuthCookie = (token: string) => {
  // document.cookie = `accessToken=${token}; path=/; secure; samesite=strict`;
  document.cookie = `accessToken=${token}; path=/; secure; samesite=strict; max-age=86400`;
};
  
export const getAuthToken = (): string | null => {
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1].trim();
};

export const removeAuthCookie = () => {
  document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}; 