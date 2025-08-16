import { supabase } from '@/integrations/supabase/client';
import type { ProductSearchItem, ProductSearchParams, ProductSearchResponse } from '../types';

export const searchProducts = async (params: ProductSearchParams): Promise<ProductSearchResponse> => {
  const { 
    kwCode, 
    a4lCode, 
    modelNumber, 
    search,
    storeId,
    storeRegion,
    page = 1, 
    limit = 20 
  } = params;

  console.log('🔍 SEARCH DEBUG - Search params:', params);
  console.log('🔍 SEARCH DEBUG - Filters detected:', {
    hasA4lCode: !!(a4lCode && a4lCode.trim()),
    hasStoreId: !!(storeId && storeId.trim()), 
    hasSearch: !!(search && search.trim()),
    hasKwCode: !!(kwCode && kwCode.trim()),
    hasModelNumber: !!(modelNumber && modelNumber.trim())
  });

  // Query Item table to get individual items with their unique A4L codes
  let itemQuery = supabase
    .from('Item')
    .select(`
      id,
      a4lCode,
      epc,
      gradeLabel,
      loadDate,
      currentStoreId,
      status,
      createdAt,
      productId
    `, { count: 'exact' })
    .or('delete.is.null,delete.eq.false');

  // Apply only item-level filters at database level
  // (Product-level filters will be applied in memory)
  if (a4lCode && a4lCode.trim()) {
    // Search in actual A4L code field
    itemQuery = itemQuery.ilike('a4lCode', `%${a4lCode}%`);
  }

  if (search && search.trim() && !kwCode && !modelNumber) {
    // For general search (without product filters), search in A4L code and EPC
    itemQuery = itemQuery.or(`
      a4lCode.ilike.%${search}%,
      epc.ilike.%${search}%
    `);
  }

  // Filter by store if specified
  if (storeId && storeId.trim()) {
    itemQuery = itemQuery.eq('currentStoreId', storeId);
  }

  // Only apply database-level pagination if we have item-level filters
  // Otherwise fetch all items and apply client-side filtering + pagination
  const hasItemLevelFilters = (a4lCode && a4lCode.trim()) || 
                             (storeId && storeId.trim()) || 
                             (search && search.trim() && !kwCode && !modelNumber);

  console.log('🔍 SEARCH DEBUG - Pagination strategy:', {
    hasItemLevelFilters,
    willUseDatabasePagination: hasItemLevelFilters,
    willFetchAllItems: !hasItemLevelFilters
  });

  if (hasItemLevelFilters) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    itemQuery = itemQuery.range(from, to);
    console.log('🔍 SEARCH DEBUG - Applied database pagination:', { from, to });
  } else {
    console.log('🔍 SEARCH DEBUG - Will fetch ALL items for client-side filtering');
  }

  const { data: itemData, error: itemError, count } = await itemQuery;

  console.log('🔍 SEARCH DEBUG - Item query result:', { 
    itemCount: itemData?.length, 
    error: itemError?.message || itemError, 
    totalCount: count
  });
  
  if (itemError) {
    console.error('🔍 SEARCH DEBUG - ERROR: Item query failed, falling back to products:', itemError?.message || itemError);
    return await searchProductsDirectly(params); // Fallback to products table
  }

  if (!itemData || itemData.length === 0) {
    console.log('🔍 SEARCH DEBUG - WARNING: No items found, falling back to products search');
    return await searchProductsDirectly(params);
  }

  // Get ALL product and store data for the items - without additional filters
  const productIds = Array.from(new Set(itemData.map(item => item.productId).filter(Boolean)));
  const storeIds = Array.from(new Set(itemData.map(item => item.currentStoreId).filter(Boolean)));

  console.log('Fetching related data:', { productIds: productIds.length, storeIds: storeIds.length });

  // Fetch ALL products data first (no filtering here)
  let productsData: any[] = [];
  if (productIds.length > 0) {
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);
    
    if (productError) {
      console.error('Error fetching products:', productError);
    } else {
      productsData = products || [];
    }
  }

  // Fetch stores data
  let storesData: any[] = [];
  if (storeIds.length > 0) {
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .in('id', storeIds);
    
    if (storeError) {
      console.error('Error fetching stores:', storeError);
    } else {
      storesData = stores || [];
    }
  }

  // Create lookup maps
  const productsMap = new Map(productsData.map(p => [p.id, p]));
  const storesMap = new Map(storesData.map(s => [s.id, s]));

  // Apply product-level filtering to items AFTER fetching all product data
  const filteredItems = itemData.filter(item => {
    const product = productsMap.get(item.productId);
    
    // If no product data, exclude the item
    if (!product) {
      return false;
    }

    // Apply product-level filters
    if (kwCode && kwCode.trim()) {
      const productKwCode = product.kw_code || '';
      if (!productKwCode.toLowerCase().includes(kwCode.toLowerCase())) {
        return false;
      }
    }

    if (modelNumber && modelNumber.trim()) {
      const productModel = product.model || '';
      if (!productModel.toLowerCase().includes(modelNumber.toLowerCase())) {
        return false;
      }
    }

    if (search && search.trim() && (kwCode || modelNumber)) {
      const searchLower = search.toLowerCase();
      const productName = (product.product_name || '').toLowerCase();
      const productBrand = (product.brand || '').toLowerCase();
      const productModel = (product.model || '').toLowerCase();
      const productKwCode = (product.kw_code || '').toLowerCase();
      const productSku = (product.sku || '').toLowerCase();

      const matchesProduct = 
        productName.includes(searchLower) ||
        productBrand.includes(searchLower) ||
        productModel.includes(searchLower) ||
        productKwCode.includes(searchLower) ||
        productSku.includes(searchLower);

      if (!matchesProduct) {
        return false;
      }
    }

    return true;
  });

  console.log('Filtered items:', { originalCount: itemData.length, filteredCount: filteredItems.length });

  // Apply client-side pagination only if we didn't apply database-level pagination
  let paginatedItems = filteredItems;
  if (!hasItemLevelFilters) {
    const from = (page - 1) * limit;
    const to = from + limit;
    paginatedItems = filteredItems.slice(from, to);
    console.log('Client-side pagination applied:', { from, to, paginatedCount: paginatedItems.length });
  } else {
    console.log('Using database-level pagination:', { paginatedCount: paginatedItems.length });
  }

  // Map item data to search results using lookup maps
  const searchResults: ProductSearchItem[] = paginatedItems.map((item) => {
    const product = productsMap.get(item.productId);
    const store = storesMap.get(item.currentStoreId);
    
    return {
      id: item.id,
      inventoryId: item.id,
      a4lCode: item.a4lCode, // Real A4L code from Item table
      type: product?.category || 'Unknown',
      kwCode: product?.kw_code || 'N/A',
      grade: item.gradeLabel || 'Standard',
      model: product?.model || '',
      inStock: item.status !== 'sold' && item.currentStoreId !== null,
      currentStock: 1, // Each item is a single unit
      availableStock: item.status === 'sold' ? 0 : 1,
      mapPrice: product?.map_price || product?.price || 0,
      sku: product?.sku || item.a4lCode,
      productName: product?.product_name || `${product?.brand || ''} ${product?.model || ''}`.trim() || product?.description || 'Unknown Product',
      storeName: store?.name || 'Not Assigned',
      storeCode: store?.store_code || 'N/A',
      storeRegion: store?.type || 'Unknown',
      loadNumber: item.epc || 'N/A',
      loadInDate: item.loadDate || item.createdAt,
      isInStock: item.status !== 'sold' && item.currentStoreId !== null,
      currentLocation: item.currentStoreId ? 
        `${store?.name || 'Store'} - ${item.status || 'Available'}` : 
        'Not in store'
    };
  });

  // Calculate totals based on pagination approach
  let actualTotal: number;
  if (hasItemLevelFilters) {
    // Database-level pagination was used
    actualTotal = count || 0;
  } else {
    // Client-side pagination was used
    actualTotal = filteredItems.length;
  }
  
  const totalPages = Math.ceil(actualTotal / limit);

  console.log('Final search results:', { 
    searchResults: searchResults.length, 
    actualTotal, 
    totalPages,
    currentPage: page,
    totalItems: count,
    filteredItems: filteredItems.length,
    paginationMethod: hasItemLevelFilters ? 'database' : 'client-side'
  });

  return {
    data: searchResults,
    total: actualTotal,
    page,
    totalPages
  };
};

// Fallback function to search products directly when Item table is empty
async function searchProductsDirectly(params: ProductSearchParams): Promise<ProductSearchResponse> {
  const { 
    kwCode, 
    a4lCode, 
    modelNumber, 
    search,
    page = 1, 
    limit = 20 
  } = params;

  console.log('🚨 FALLBACK ACTIVATED - Using products fallback search instead of Item table');
  console.log('🚨 FALLBACK REASON - This explains why you see 38 items instead of 100!');

  let query = supabase
    .from('products')
    .select(`
      id,
      brand,
      model,
      kw_code,
      description,
      map_price,
      category,
      sku,
      product_name,
      is_active
    `, { count: 'exact' })
    .eq('is_active', true);

  // Apply filters with flexible partial matching
  if (search && search.trim()) {
    query = query.or(`
      sku.ilike.%${search}%,
      product_name.ilike.%${search}%,
      model.ilike.%${search}%,
      brand.ilike.%${search}%
    `);
  }

  if (kwCode && kwCode.trim()) {
    query = query.ilike('kw_code', `%${kwCode}%`);
  }

  if (a4lCode && a4lCode.trim()) {
    // For fallback, search in SKU or product name since no real A4L codes
    query = query.or(`sku.ilike.%${a4lCode}%,product_name.ilike.%${a4lCode}%`);
  }

  if (modelNumber && modelNumber.trim()) {
    query = query.ilike('model', `%${modelNumber}%`);
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching products directly:', error);
    return {
      data: [],
      total: 0,
      page,
      totalPages: 0
    };
  }

  const searchResults: ProductSearchItem[] = (data || []).map((product, index) => ({
    id: product.id,
    inventoryId: `product-${product.id}`,
    a4lCode: product.sku || `TEMP-${product.id}`, // Fallback A4L code
    type: product.category || 'Unknown',
    kwCode: product.kw_code || 'N/A',
    grade: 'Standard',
    model: product.model || '',
    inStock: true, // Assume available for products without item tracking
    currentStock: 1,
    availableStock: 1,
    mapPrice: product.map_price || 0,
    sku: product.sku || product.id,
    productName: product.product_name || `${product.brand || ''} ${product.model || ''}`.trim() || 'Unknown Product',
    storeName: 'Available',
    storeCode: 'ALL',
    storeRegion: 'Multi-Store',
    loadNumber: 'N/A',
    loadInDate: new Date().toISOString(),
    isInStock: true,
    currentLocation: 'Available for Order'
  }));

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: searchResults,
    total: count || 0,
    page,
    totalPages
  };
}