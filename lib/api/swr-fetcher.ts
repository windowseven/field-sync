import { http } from './httpClient';

/**
 * Global fetcher for SWR that uses our authenticated httpClient.
 * It automatically extracts the data from our standard API response format.
 * 
 * Usage: const { data } = useSWR('/projects', fetcher)
 */
export const fetcher = async (url: string) => {
  const response = await http.get<any>(url);
  
  // Handle different response structures gracefully
  // Our API returns { status: 'success', data: { ... } } or { status: 'success', results: n, data: { ... } }
  if (response?.data?.data) {
    return response.data.data;
  }
  
  if (response?.data) {
    return response.data;
  }

  return response;
};

/**
 * Mutation fetcher for SWR mutation hook (useSWRMutation)
 */
export const sendRequest = async (url: string, { arg }: { arg: any }) => {
  return http.post(url, arg);
};
