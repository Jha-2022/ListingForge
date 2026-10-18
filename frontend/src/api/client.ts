import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Attach license key header if set in localStorage
api.interceptors.request.use((config) => {
  const licenseKey = localStorage.getItem('listingforge_license_key');
  if (licenseKey) {
    config.headers['x-license-key'] = licenseKey;
  }
  return config;
});

export default api;
