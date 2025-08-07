import { useTranslation } from 'react-i18next';
import { StorePageStub } from './StorePageStub';

// All the remaining store pages as separate components

export function PurchaseRequestDetail() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Purchase Request Detail"
      description="View and manage individual purchase request details."
      breadcrumbs={[
        { title: t('purchaseRequests'), href: '/store/purchase-requests' },
        { title: 'PR-2024-001' }
      ]}
      features={[
        'View purchase request details',
        'Edit request information',
        'Approve/reject requests',
        'Track approval workflow',
        'Generate purchase orders'
      ]}
    />
  );
}

export function InventoryTransferIn() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Inventory Transfer In"
      description="Receive and process incoming inventory transfers from suppliers or other locations."
      breadcrumbs={[
        { title: t('inventory'), href: '/store/inventory' },
        { title: 'Transfer In' }
      ]}
      features={[
        'Scan barcodes for incoming items',
        'Update inventory quantities',
        'Track transfer documents',
        'Quality inspection workflow',
        'Generate receiving reports'
      ]}
    />
  );
}

export function InventoryTransferOut() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Inventory Transfer Out"
      description="Process outgoing inventory transfers to customers, returns, or other locations."
      breadcrumbs={[
        { title: t('inventory'), href: '/store/inventory' },
        { title: 'Transfer Out' }
      ]}
      features={[
        'Create transfer out documents',
        'Scan items for shipment',
        'Update inventory levels',
        'Generate shipping labels',
        'Track transfer status'
      ]}
    />
  );
}

export function Products() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Products"
      description="Manage product catalog, pricing, and product information."
      breadcrumbs={[{ title: 'Products' }]}
      features={[
        'Product catalog management',
        'Price management',
        'Product images and descriptions',
        'Category organization',
        'Bulk import/export'
      ]}
    />
  );
}

export function ProductDetail() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Product Detail"
      description="View and edit detailed product information."
      breadcrumbs={[
        { title: 'Products', href: '/store/products' },
        { title: 'Product Details' }
      ]}
      features={[
        'Product specifications',
        'Inventory levels',
        'Pricing history',
        'Sales analytics',
        'Related products'
      ]}
    />
  );
}

export function ProductLookup() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Product Lookup"
      description="Quick product search and barcode scanning for point-of-sale operations."
      breadcrumbs={[
        { title: 'Products', href: '/store/products' },
        { title: 'Lookup' }
      ]}
      features={[
        'Barcode scanning',
        'Quick search by SKU/name',
        'Real-time price display',
        'Stock availability',
        'Add to cart/order'
      ]}
    />
  );
}

export function CustomerDetail() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Customer Detail"
      description="View comprehensive customer information and interaction history."
      breadcrumbs={[
        { title: t('crm'), href: '/store/customers' },
        { title: 'Customer Details' }
      ]}
      features={[
        'Customer profile information',
        'Order history',
        'Payment history',
        'Support tickets',
        'Communication log'
      ]}
    />
  );
}

export function CustomerInteractions() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Customer Interactions"
      description="Track and manage all customer interactions and communications."
      breadcrumbs={[
        { title: t('crm'), href: '/store/customers' },
        { title: 'Customer', href: '/store/customers/1' },
        { title: 'Interactions' }
      ]}
      features={[
        'Interaction timeline',
        'Email communications',
        'Phone call logs',
        'Support ticket history',
        'Follow-up reminders'
      ]}
    />
  );
}

// AfterSalesReturns moved to @/modules/after-sales/components/AfterSalesReturns

export function AfterSalesReturnDetail() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Return Detail"
      description="Process individual return requests and manage return workflow."
      breadcrumbs={[
        { title: t('afterSales'), href: '/store/after-sales/returns' },
        { title: 'Return Details' }
      ]}
      features={[
        'Return inspection',
        'Condition assessment',
        'Refund calculation',
        'Return shipping',
        'Customer communication'
      ]}
    />
  );
}

export function Repairs() {
  return <div>Repairs page will be imported directly</div>;
}

export function RepairDetail() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Repair Detail"
      description="Track individual repair progress and manage repair workflow."
      breadcrumbs={[
        { title: t('repairs'), href: '/store/repairs' },
        { title: 'Repair Details' }
      ]}
      features={[
        'Repair status tracking',
        'Parts and labor costs',
        'Technician assignment',
        'Customer notifications',
        'Quality control'
      ]}
    />
  );
}

export function OrderSearch() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Order Search"
      description="Advanced search and filtering for all types of orders."
      breadcrumbs={[{ title: t('orderSearch') }]}
      features={[
        'Multi-criteria search',
        'Date range filtering',
        'Status-based filtering',
        'Customer search',
        'Export search results'
      ]}
    />
  );
}


export function Scrap() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Scrap Management"
      description="Track and manage scrapped or damaged inventory."
      breadcrumbs={[{ title: t('scrap') }]}
      features={[
        'Scrap item documentation',
        'Damage assessment',
        'Disposal tracking',
        'Cost accounting',
        'Audit trail'
      ]}
    />
  );
}

export function AfterSalesScrap() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="After-Sales Scrap"
      description="Manage scrapped items from after-sales processes."
      breadcrumbs={[
        { title: t('afterSales'), href: '/store/after-sales/returns' },
        { title: 'Scrap' }
      ]}
      features={[
        'Return item scrapping',
        'Warranty claim scrapping',
        'Disposal documentation',
        'Insurance claims',
        'Environmental compliance'
      ]}
    />
  );
}

export function Settings() {
  const { t } = useTranslation();
  return (
    <StorePageStub
      title="Settings"
      description="Configure store settings and system preferences."
      breadcrumbs={[{ title: t('settings') }]}
      features={[
        'Store configuration',
        'User management',
        'System preferences',
        'Integration settings',
        'Backup and restore'
      ]}
    />
  );
}