import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Store Layout and Pages
import { AfterSalesReturns } from "@/modules/after-sales/components/AfterSalesReturns";
import NewAfterSalesReturn from "./pages/store/NewAfterSalesReturn";
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
  AfterSalesReturnDetail,
  AfterSalesScrap,
  Repairs,
  RepairDetail,
  OrderSearch,
  CustomerReturns,
  HQReturns,
  Scrap,
  Settings,
} from "./pages/store/OtherStorePages";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
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
                <Route path="after-sales/returns/:id" element={<AfterSalesReturnDetail />} />
                <Route path="after-sales/scrap" element={<AfterSalesScrap />} />
                
                {/* Repairs */}
                <Route path="repairs" element={<Repairs />} />
                <Route path="repairs/:id" element={<RepairDetail />} />
                
                {/* Order Search */}
                <Route path="orders/search" element={<OrderSearch />} />
                
                {/* Returns */}
                <Route path="customer-returns" element={<CustomerReturns />} />
                <Route path="hq-returns" element={<HQReturns />} />
                
                {/* Scrap */}
                <Route path="scrap" element={<Scrap />} />
                
                {/* Settings */}
                <Route path="settings" element={<Settings />} />
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

export default App;
