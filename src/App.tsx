import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Store Layout and Pages
import { StoreLayout } from "@/components/store/StoreLayout";
import Dashboard from "./pages/store/Dashboard";
import SalesOrders from "./pages/store/SalesOrders";
import SalesOrderDetail from "./pages/store/SalesOrderDetail";
import NewSalesOrder from "./pages/store/NewSalesOrder";
import PurchaseRequests from "./pages/store/PurchaseRequests";
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
  AfterSalesReturns,
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Store Routes */}
            <Route path="/store" element={<StoreLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Sales Orders */}
              <Route path="sales-orders" element={<SalesOrders />} />
              <Route path="sales-orders/new" element={<NewSalesOrder />} />
              <Route path="sales-orders/:id" element={<SalesOrderDetail />} />
              
              {/* Purchase Requests */}
              <Route path="purchase-requests" element={<PurchaseRequests />} />
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
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
