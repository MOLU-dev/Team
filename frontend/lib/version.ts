// Independent versioning for Frontend
export const APP_VERSION = '0.1.0';
export const BUILD_DATE = new Date().toISOString().split('T')[0];
export const ENV = process.env.NODE_ENV;

export const getVersionInfo = () => ({
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  env: ENV,
  platform: 'User Frontend',
});
