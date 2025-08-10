// Product management service
import { UserContext, PaginationOptions, ApiError, ErrorCodes } from '/packages/shared/src/index.ts';
import { RBACService } from '../rbac.ts';
import { AuditLogger, withAudit } from '../audit.ts';

export interface Product {
  id: string;
  sku: string;
  productName: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  price?: number;
  cost?: number;
  mapPrice?: number;
  barcode?: string;
  kwCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreate {
  sku: string;
  productName: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  price?: number;
  cost?: number;
  mapPrice?: number;
  barcode?: string;
  kwCode?: string;
}

export interface ProductUpdate {
  productName?: string;
  brand?: string;
  model?: string;
  category?: string;
  description?: string;
  price?: number;
  cost?: number;
  mapPrice?: number;
  barcode?: string;
  kwCode?: string;
  isActive?: boolean;
}

export interface ProductList {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export class ProductService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private authToken?: string;
  private auditLogger: AuditLogger;

  constructor(supabaseUrl: string, supabaseKey: string, auditLogger: AuditLogger, authToken?: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.authToken = authToken;
    this.auditLogger = auditLogger;
  }

  private getClient() {
    const createClient = (globalThis as any).createClient;
    return createClient(this.supabaseUrl, this.supabaseKey, {
      global: {
        headers: this.authToken ? { Authorization: this.authToken } : {}
      }
    });
  }

  async getProducts(
    userContext: UserContext,
    options: PaginationOptions & { search?: string; category?: string }
  ): Promise<ProductList> {
    RBACService.requirePermission(userContext, 'products', 'read');

    const { page, limit, search, category } = options;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const supabase = this.getClient();
    
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`sku.ilike.%${search}%,product_name.ilike.%${search}%,brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 500, error.message);
    }

    const products = data?.map(p => this.mapDatabaseToResponse(p, userContext)) || [];

    return {
      products,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    };
  }

  async getProduct(productId: string, userContext: UserContext): Promise<Product> {
    RBACService.requirePermission(userContext, 'products', 'read');

    const supabase = this.getClient();
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.PRODUCT_NOT_FOUND, 404, 'Product not found');
    }

    return this.mapDatabaseToResponse(data, userContext);
  }

  @withAudit('product', 'create')
  async createProduct(productData: ProductCreate, userContext: UserContext): Promise<Product> {
    RBACService.requirePermission(userContext, 'products', 'create');

    const supabase = this.getClient();
    
    const dbProductData = {
      sku: productData.sku,
      product_name: productData.productName,
      brand: productData.brand,
      model: productData.model,
      category: productData.category,
      description: productData.description,
      price: productData.price,
      cost: productData.cost,
      map_price: productData.mapPrice,
      barcode: productData.barcode,
      kw_code: productData.kwCode,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(dbProductData)
      .select('*')
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    return this.mapDatabaseToResponse(data, userContext);
  }

  @withAudit('product', 'update')
  async updateProduct(productId: string, updates: ProductUpdate, userContext: UserContext): Promise<Product> {
    RBACService.requirePermission(userContext, 'products', 'update');

    const supabase = this.getClient();
    
    const dbUpdates: any = {};
    if (updates.productName !== undefined) dbUpdates.product_name = updates.productName;
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.mapPrice !== undefined) dbUpdates.map_price = updates.mapPrice;
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
    if (updates.kwCode !== undefined) dbUpdates.kw_code = updates.kwCode;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }

    return this.mapDatabaseToResponse(data, userContext);
  }

  @withAudit('product', 'delete')
  async deleteProduct(productId: string, userContext: UserContext): Promise<void> {
    RBACService.requirePermission(userContext, 'products', 'delete');

    const supabase = this.getClient();
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (error) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 400, error.message);
    }
  }

  private mapDatabaseToResponse(dbProduct: any, userContext: UserContext): Product {
    const product = {
      id: dbProduct.id,
      sku: dbProduct.sku,
      productName: dbProduct.product_name,
      brand: dbProduct.brand,
      model: dbProduct.model,
      category: dbProduct.category,
      description: dbProduct.description,
      price: dbProduct.price,
      cost: dbProduct.cost,
      mapPrice: dbProduct.map_price,
      barcode: dbProduct.barcode,
      kwCode: dbProduct.kw_code,
      isActive: dbProduct.is_active,
      createdAt: dbProduct.created_at,
      updatedAt: dbProduct.updated_at,
    };

    return RBACService.filterCostData(userContext, product);
  }
}