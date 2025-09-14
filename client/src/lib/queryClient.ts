import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getFallbackResponse } from "./api-fallback";

// API base URL - using same port (5000) for both frontend and backend
const API_BASE_URL = '/api';

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Save auth token to localStorage
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

// Remove auth token from localStorage
export function removeAuthToken() {
  localStorage.removeItem('auth_token');
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      // Clear invalid token
      removeAuthToken();
      throw new Error("Unauthorized");
    }
    
    let errorMessage = "Request failed";
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = await res.text() || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  try {
    const token = getAuthToken();
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    await throwIfResNotOk(res);
    
    return res.json();
  } catch (error: any) {
    console.error('API Request Error:', error);
    
    // If backend is not available, return fallback data for auth endpoints
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('Backend not available, using fallback data');
      return getFallbackResponse(url, options?.method || 'GET', options?.body);
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const token = getAuthToken();
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(fullUrl, {
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        removeAuthToken();
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error: any) {
      if (error.message === "Unauthorized" && unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // If backend is not available, return fallback data
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.warn('Backend not available, using fallback data');
        const endpoint = queryKey[0] as string;
        return getFallbackResponse(endpoint, 'GET');
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        if (error?.message === "Unauthorized") {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
