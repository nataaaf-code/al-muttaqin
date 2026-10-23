import { Platform } from 'react-native';
import { OnboardingFormData, UserProfile } from '../types';

const TOKEN_KEY = 'al_muttaqin_auth_token';

// Tentukan Base URL API secara cerdas
export function getApiBaseUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://al-muttaqin.natsuko.ai.id';
}

export function getStoredToken(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('[Storage] Gagal membaca token:', e);
  }
  return null;
}

export function setStoredToken(token: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (e) {
    console.warn('[Storage] Gagal menyimpan token:', e);
  }
}

export function removeStoredToken(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('[Storage] Gagal menghapus token:', e);
  }
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request gagal dengan status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// 1. Modul Autentikasi & Onboarding
export const authApi = {
  async loginWithGoogle(credential: string): Promise<{ success: boolean; token: string; user: UserProfile }> {
    const res = await fetchApi<{ success: boolean; token: string; user: UserProfile }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async loginWithDemo(role: string): Promise<{ success: boolean; token: string; user: UserProfile }> {
    const res = await fetchApi<{ success: boolean; token: string; user: UserProfile }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ success: boolean; user: UserProfile }> {
    return fetchApi<{ success: boolean; user: UserProfile }>('/api/auth/me');
  },

  async submitOnboarding(data: OnboardingFormData): Promise<{ success: boolean; token: string; user: UserProfile }> {
    const res = await fetchApi<{ success: boolean; token: string; user: UserProfile }>('/api/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
};

// 2. Modul Ringkasan Publik (Tanpa Login)
export const publicApi = {
  async getSummary(): Promise<any> {
    return fetchApi('/api/public/summary');
  },
};

// 3. Modul Jamaah
export const jamaahApi = {
  async getAll(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/api/jamaah');
  },
  async create(payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi('/api/jamaah', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: number | string, payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/api/jamaah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number | string): Promise<{ success: boolean }> {
    return fetchApi(`/api/jamaah/${id}`, {
      method: 'DELETE',
    });
  },
};

// 4. Modul Keuangan & Kas
export const financeApi = {
  async getSummaryAndTransactions(): Promise<{ success: boolean; data: { summary: any; transactions: any[] } }> {
    return fetchApi('/api/finance');
  },
  async create(payload: { title: string; type: 'INCOME' | 'EXPENSE'; amount: number; category: string; pocket?: string; date?: string; notes?: string }): Promise<{ success: boolean; data: any }> {
    return fetchApi('/api/finance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number | string): Promise<{ success: boolean }> {
    return fetchApi(`/api/finance/${id}`, {
      method: 'DELETE',
    });
  },
};

// 5. Modul Agenda & Kegiatan
export const eventsApi = {
  async getAll(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/api/events');
  },
  async create(payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: number | string, payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number | string): Promise<{ success: boolean }> {
    return fetchApi(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },
};

// 6. Modul Inventaris
export const inventoryApi = {
  async getAll(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/api/inventory');
  },
  async create(payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: number | string, payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number | string): Promise<{ success: boolean }> {
    return fetchApi(`/api/inventory/${id}`, {
      method: 'DELETE',
    });
  },
};

// 7. Modul Pengurus Organisasi DKM
export const organizationApi = {
  async getAll(): Promise<{ success: boolean; data: any[] }> {
    return fetchApi('/api/organization');
  },
  async create(payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi('/api/organization', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async update(id: number | string, payload: any): Promise<{ success: boolean; data: any }> {
    return fetchApi(`/api/organization/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  async delete(id: number | string): Promise<{ success: boolean }> {
    return fetchApi(`/api/organization/${id}`, {
      method: 'DELETE',
    });
  },
};
