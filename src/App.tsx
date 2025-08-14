import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from "@/components";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";

// Auth module pages
import RequestResetPage from "@/modules/auth/pages/RequestResetPage";
import ResetSentPage from "@/modules/auth/pages/ResetSentPage";
import NewPasswordPage from "@/modules/auth/pages/NewPasswordPage";
import ResetSuccessPage from "@/modules/auth/pages/ResetSuccessPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Store Layout and Pages
import { AfterSalesReturns } from "@/modules/after-sales/components/AfterSalesReturns";
import NewAfterSalesReturn from "./pages/store/NewAfterSalesReturn";
import NewWarrantyClaim from "./pages/store/NewWarrantyClaim";
import WarrantyClaimDetail from "./pages/store/WarrantyClaimDetail";
import AfterSalesReturnDetail from "./pages/store/AfterSalesReturnDetail";
import Repairs from "./pages/store/Repairs";
import NewRepair from "./pages/store/NewRepair";
import RepairDetail from "./pages/store/RepairDetail";
import { StoreLayout } from "@/components/store/StoreLayout";
import Dashboard from "./pages/store/Dashboard";
import SalesOrders from "./pages/store/SalesOrders";
import SalesOrdersHistory from "./pages/store/SalesOrdersHistory";
import SalesOrderDetail from "./pages/store/SalesOrderDetail";
import NewSalesOrder from "./pages/store/NewSalesOrder";
import SalesOrderSuccess from "./pages/store/SalesOrderSuccess";
import PurchaseRequests from "./pages/store/PurchaseRequests";
import NewPurchaseRequest from "./pages/store/NewPurchaseRequest";
import Inventory from "./pages/store/Inventory";
import Customers from "./pages/store/Customers";
import {
  PurchaseRequestDetail,
  InventoryTransferIn,
  InventoryTransferOut,
  Products,
  ProductDetail,
  ProductLookup,
  CustomerDetail,
  CustomerInteractions,
  AfterSalesScrap,
  OrderSearch,
} from "./pages/store/OtherStorePages";

import ScrapManagement from './pages/store/Scrap';
import NewScrap from './pages/store/NewScrap';
import BarcodesPO2 from './pages/store/BarcodesPO2';
const SalesOrdersPivot = lazy(() => import('./pages/store/SalesOrdersPivot'));

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t, ready } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{ready ? t('loading') : 'Loading...'}</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route index element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/request" element={<RequestResetPage />} />
                <Route path="/auth/sent" element={<ResetSentPage />} />
                <Route path="/auth/reset" element={<NewPasswordPage />} />
                <Route path="/auth/success" element={<ResetSuccessPage />} />

                {/* Protected Store Routes */}
                <Route path="/store" element={
                  <ProtectedRoute>
                    <StoreLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<Dashboard />} />
                  
                  {/* Sales Orders */}
                  <Route path="sales-orders" element={<SalesOrders />} />
                  <Route path="sales-orders/history" element={<SalesOrdersHistory />} />
                  <Route path="sales-orders/pivot" element={
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                      <SalesOrdersPivot />
                    </Suspense>
                  } />
                  <Route path="sales-orders/new" element={<NewSalesOrder />} />
                  <Route path="sales-orders/success" element={<SalesOrderSuccess />} />
                  <Route path="sales-orders/:id" element={<SalesOrderDetail />} />
                  
                  {/* Purchase Requests */}
                  <Route path="purchase-requests" element={<PurchaseRequests />} />
                  <Route path="purchase-requests/new" element={<NewPurchaseRequest />} />
                  <Route path="purchase-requests/:id" element={<PurchaseRequestDetail />} />
                  
                  {/* Inventory */}
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="inventory/transfer-in" element={<InventoryTransferIn />} />
                  <Route path="inventory/transfer-out" element={<InventoryTransferOut />} />
                  
                  {/* Products */}
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="products/lookup" element={<ProductLookup />} />
                  
                  {/* Customers/CRM */}
                  <Route path="customers" element={<Customers />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="customers/:id/interactions" element={<CustomerInteractions />} />
                  
                  {/* After-Sales */}
                  <Route path="after-sales/returns" element={<AfterSalesReturns />} />
                  <Route path="after-sales/returns/new" element={<NewAfterSalesReturn />} />
                  <Route path="after-sales/warranty/new" element={<NewWarrantyClaim />} />
                  <Route path="after-sales/warranty/:id" element={<WarrantyClaimDetail />} />
                  <Route path="after-sales/returns/:id" element={<AfterSalesReturnDetail />} />
                  <Route path="after-sales/scrap" element={<AfterSalesScrap />} />
                  
                  {/* Repairs */}
                  <Route path="repairs" element={<Repairs />} />
                  <Route path="repairs/new" element={<NewRepair />} />
                  <Route path="repairs/:id" element={<RepairDetail />} />
                  
                  {/* Order Search */}
                  <Route path="orders/search" element={<OrderSearch />} />
                  
                  
                  {/* Scrap Management */}
                  <Route path="scrap" element={<ScrapManagement />} />
                  <Route path="scrap/new" element={<NewScrap />} />
                  
                  {/* Barcodes PO2 */}
                  <Route path="barcodes_po2" element={<BarcodesPO2 />} />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}