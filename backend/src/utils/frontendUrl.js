export function getFrontendUrl() {
  const configuredUrl = process.env.FRONTEND_URL;
  if (
    configuredUrl &&
    !(process.env.NODE_ENV === 'production' && configuredUrl.includes('localhost'))
  ) {
    return configuredUrl;
  }
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }
  return process.env.NODE_ENV === 'production'
    ? 'https://fieldsync-web.onrender.com'
    : 'http://localhost:3000';
}
