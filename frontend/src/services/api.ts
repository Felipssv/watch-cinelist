import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function getStoredAuth(): { token?: string; refreshToken?: string } {
  try {
    const stored = localStorage.getItem('cinelist-auth');
    if (!stored) return {};
    const parsed = JSON.parse(stored) as { state?: { token?: string; refreshToken?: string } };
    return { token: parsed?.state?.token ?? undefined, refreshToken: parsed?.state?.refreshToken ?? undefined };
  } catch {
    return {};
  }
}

api.interceptors.request.use((config) => {
  const { token } = getStoredAuth();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const { refreshToken } = getStoredAuth();
    if (!refreshToken) {
      // Sem refresh token — desloga
      localStorage.removeItem('cinelist-auth');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Aguarda a renovação em andamento
      return new Promise((resolve) => {
        refreshQueue.push((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<{ access_token: string }>(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      );
      const newToken = data.access_token;

      // Atualiza token no localStorage sem usar o hook (fora do React)
      const stored = localStorage.getItem('cinelist-auth');
      if (stored) {
        const parsed = JSON.parse(stored) as { state?: Record<string, unknown> };
        if (parsed.state) {
          parsed.state.token = newToken;
          localStorage.setItem('cinelist-auth', JSON.stringify(parsed));
        }
      }

      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      localStorage.removeItem('cinelist-auth');
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
