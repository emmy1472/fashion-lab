import axios from 'axios'

/**
 * General purpose client for a REST API, uses Axios
 *
 * @param {string} api - The API root URL
 * @param {object} onError - A default error handler
 * @param {object} options - Any optional Axios options to apply to all requests
 * @return {object] client - The REST client
 */
export function restClient(api, onError, options = {}) {
  /*
   * Merge default and custom options
   */
  const defaultOptions = {
    baseURL: api,
    method: 'GET',
    headers: {},
    data: undefined,
    timeout: 1500,
    ...options,
  }
  if (api.toLowerCase().slice(0, 6) === 'https:') {
    // Needed for certificate issues
    defaultOptions.httpsAgent = new https.Agent({ rejectUnauthorized: false })
  }
  const mergeOptions = (custom) => ({
    ...defaultOptions,
    ...custom,
    headers: {
      ...defaultOptions.headers,
      ...(custom.headers || {}),
    },
  })

  return {
    get: async (url, options = {}) => http(mergeOptions({ ...options, url }), onError),
    post: async (url, data, options = {}) =>
      http(mergeOptions({ ...options, method: 'POST', data, url }), onError),
    put: async (url, data, options = {}) =>
      http(mergeOptions({ ...options, method: 'PUT', data, url }), onError),
  }
}
