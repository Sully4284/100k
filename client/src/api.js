const API_URL = '/api';

class API {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Pixels
  async getPixels() {
    return this.request('/pixels');
  }

  async getGridInfo() {
    return this.request('/grid/info');
  }

  async purchasePixels(pixels) {
    return this.request('/pixels/purchase', {
      method: 'POST',
      body: JSON.stringify({ pixels }),
    });
  }

  async updatePixels(pixels) {
    return this.request('/pixels/update', {
      method: 'PUT',
      body: JSON.stringify({ pixels }),
    });
  }

  async getMyPixels() {
    return this.request('/pixels/mine');
  }

  // Admin
  async getUsers() {
    return this.request('/admin/users');
  }

  async deletePixel(x, y) {
    return this.request(`/admin/pixels/${x}/${y}`, {
      method: 'DELETE',
    });
  }

  // Stats
  async getStats() {
    return this.request('/stats');
  }
}

export default new API();
