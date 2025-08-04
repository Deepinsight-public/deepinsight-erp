import { z } from 'zod';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  SalesOrderListResponseSchema,
  PurchaseRequestListResponseSchema,
  InventoryListResponseSchema,
  CustomerListResponseSchema,
  ProductListResponseSchema,
  ReturnListResponseSchema,
  RepairListResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from './api-schemas';

const API_BASE_URL = '/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      if (schema) {
        return schema.parse(data);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth API
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const validatedCredentials = LoginRequestSchema.parse(credentials);
    return this.request('/store/auth/login', {
      method: 'POST',
      body: JSON.stringify(validatedCredentials),
    }, LoginResponseSchema);
  }

  async logout(): Promise<void> {
    return this.request('/store/auth/logout', { method: 'POST' });
  }

  // Sales Orders API
  async getSalesOrders(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/sales-orders?${queryParams}`, {}, SalesOrderListResponseSchema);
  }

  async getSalesOrder(id: string) {
    return this.request(`/store/sales-orders/${id}`);
  }

  async createSalesOrder(data: any) {
    return this.request('/store/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Purchase Requests API
  async getPurchaseRequests(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/purchase-requests?${queryParams}`, {}, PurchaseRequestListResponseSchema);
  }

  async getPurchaseRequest(id: string) {
    return this.request(`/store/purchase-requests/${id}`);
  }

  async createPurchaseRequest(data: any) {
    return this.request('/store/purchase-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Inventory API
  async getInventory(params?: { page?: number; pageSize?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/store/inventory?${queryParams}`, {}, InventoryListResponseSchema);
  }

  async getInventoryTransfers(type: 'in' | 'out') {
    return this.request(`/store/inventory/transfer-${type}`);
  }

  // Products API
  async getProducts(params?: { page?: number; pageSize?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/store/products?${queryParams}`, {}, ProductListResponseSchema);
  }

  async getProduct(id: string) {
    return this.request(`/store/products/${id}`);
  }

  async searchProducts(query: string) {
    return this.request(`/store/products/lookup?q=${encodeURIComponent(query)}`);
  }

  // Customers API
  async getCustomers(params?: { page?: number; pageSize?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);

    return this.request(`/store/customers?${queryParams}`, {}, CustomerListResponseSchema);
  }

  async getCustomer(id: string) {
    return this.request(`/store/customers/${id}`);
  }

  async getCustomerInteractions(id: string) {
    return this.request(`/store/customers/${id}/interactions`);
  }

  // Returns API
  async getAfterSalesReturns(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/after-sales/returns?${queryParams}`, {}, ReturnListResponseSchema);
  }

  async getAfterSalesReturn(id: string) {
    return this.request(`/store/after-sales/returns/${id}`);
  }

  async getCustomerReturns(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/customer-returns?${queryParams}`, {}, ReturnListResponseSchema);
  }

  async getHQReturns(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/hq-returns?${queryParams}`, {}, ReturnListResponseSchema);
  }

  // Repairs API
  async getRepairs(params?: { page?: number; pageSize?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);

    return this.request(`/store/repairs?${queryParams}`, {}, RepairListResponseSchema);
  }

  async getRepair(id: string) {
    return this.request(`/store/repairs/${id}`);
  }

  // Scrap API
  async getAfterSalesScrap() {
    return this.request('/store/after-sales/scrap');
  }

  async getScrap() {
    return this.request('/store/scrap');
  }

  // Order Search API
  async searchOrders(query: string, type?: string) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (type) queryParams.append('type', type);

    return this.request(`/store/orders/search?${queryParams}`);
  }

  // Dashboard API
  async getDashboardData() {
    return this.request('/store/dashboard');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;