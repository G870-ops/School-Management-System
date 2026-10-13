import { getApiBaseUrl } from '../config/apiConfig';
const apiBaseUrl = getApiBaseUrl();

export const getProfilePhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';
  try {
    return new URL(photoUrl, apiBaseUrl).toString();
  } catch {
    return photoUrl;
  }
};