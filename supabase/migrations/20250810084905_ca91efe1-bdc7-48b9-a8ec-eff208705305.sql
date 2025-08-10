-- Create missing tables and triggers for PO3B transfers and return tracking
-- Fix UUID generation function name

-- First, let's ensure we have the missing tables from the Prisma schema
-- Create PurchaseRequest and PurchaseRequestLine if they don't exist
CREATE TABLE IF NOT EXISTS "PurchaseRequest" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "storeId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  remarks TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "PurchaseRequest_storeId_idx" ON "PurchaseRequest"("storeId");
CREATE INDEX IF NOT EXISTS "PurchaseRequest_delete_idx" ON "PurchaseRequest"(delete);

CREATE TABLE IF NOT EXISTS "PurchaseRequestLine" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "requestId" TEXT NOT NULL REFERENCES "PurchaseRequest"(id),
  "productId" TEXT NOT NULL,
  qty INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "PurchaseRequestLine_requestId_idx" ON "PurchaseRequestLine"("requestId");
CREATE INDEX IF NOT EXISTS "PurchaseRequestLine_delete_idx" ON "PurchaseRequestLine"(delete);

-- Create core tracking tables that might be missing
CREATE TABLE IF NOT EXISTS "Item" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "a4lCode" TEXT UNIQUE NOT NULL,
  epc TEXT UNIQUE NOT NULL,
  "serialNo" TEXT UNIQUE,
  "productId" TEXT NOT NULL,
  "gradeLabel" TEXT,
  "loadDate" TIMESTAMP WITH TIME ZONE,
  "currentStoreId" TEXT,
  status TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "Item_productId_idx" ON "Item"("productId");
CREATE INDEX IF NOT EXISTS "Item_currentStoreId_idx" ON "Item"("currentStoreId");
CREATE INDEX IF NOT EXISTS "Item_a4lCode_idx" ON "Item"("a4lCode");
CREATE INDEX IF NOT EXISTS "Item_epc_idx" ON "Item"(epc);
CREATE INDEX IF NOT EXISTS "Item_serialNo_idx" ON "Item"("serialNo");
CREATE INDEX IF NOT EXISTS "Item_delete_idx" ON "Item"(delete);

CREATE TABLE IF NOT EXISTS "TransferOrder" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "docNo" TEXT UNIQUE NOT NULL,
  kind TEXT DEFAULT 'STORE_TO_STORE',
  "fromStoreId" TEXT NOT NULL,
  "toStoreId" TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  reason TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "TransferOrder_kind_idx" ON "TransferOrder"(kind);
CREATE INDEX IF NOT EXISTS "TransferOrder_fromStoreId_idx" ON "TransferOrder"("fromStoreId");
CREATE INDEX IF NOT EXISTS "TransferOrder_toStoreId_idx" ON "TransferOrder"("toStoreId");
CREATE INDEX IF NOT EXISTS "TransferOrder_delete_idx" ON "TransferOrder"(delete);

CREATE TABLE IF NOT EXISTS "TransferLine" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL REFERENCES "TransferOrder"(id),
  "itemId" TEXT UNIQUE NOT NULL,
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "TransferLine_orderId_idx" ON "TransferLine"("orderId");
CREATE INDEX IF NOT EXISTS "TransferLine_delete_idx" ON "TransferLine"(delete);

CREATE TABLE IF NOT EXISTS "ReturnOrder" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "docNo" TEXT UNIQUE NOT NULL,
  "storeId" TEXT NOT NULL,
  "returnWHId" TEXT,
  "originalOrderId" TEXT NOT NULL,
  "isCustomerReturn" BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'DRAFT',
  "refundMode" TEXT DEFAULT 'ADJUSTED_PRICE',
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "ReturnOrder_storeId_idx" ON "ReturnOrder"("storeId");
CREATE INDEX IF NOT EXISTS "ReturnOrder_returnWHId_idx" ON "ReturnOrder"("returnWHId");
CREATE INDEX IF NOT EXISTS "ReturnOrder_originalOrderId_idx" ON "ReturnOrder"("originalOrderId");
CREATE INDEX IF NOT EXISTS "ReturnOrder_delete_idx" ON "ReturnOrder"(delete);

CREATE TABLE IF NOT EXISTS "ReturnLine" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "orderId" TEXT NOT NULL REFERENCES "ReturnOrder"(id),
  "originalLineId" TEXT NOT NULL,
  "itemId" TEXT UNIQUE NOT NULL,
  "productBarcode" TEXT,
  reason TEXT,
  "restockStatus" TEXT DEFAULT 'PENDING',
  "restockedOn" TIMESTAMP WITH TIME ZONE,
  "restockedById" TEXT,
  "receivedById" TEXT,
  "receivedOn" TIMESTAMP WITH TIME ZONE,
  "hqApprovedById" TEXT,
  "hqApprovedOn" TIMESTAMP WITH TIME ZONE,
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "ReturnLine_orderId_idx" ON "ReturnLine"("orderId");
CREATE INDEX IF NOT EXISTS "ReturnLine_originalLineId_idx" ON "ReturnLine"("originalLineId");
CREATE INDEX IF NOT EXISTS "ReturnLine_restockStatus_idx" ON "ReturnLine"("restockStatus");
CREATE INDEX IF NOT EXISTS "ReturnLine_delete_idx" ON "ReturnLine"(delete);

CREATE TABLE IF NOT EXISTS "ScanLog" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId" TEXT NOT NULL,
  epc TEXT NOT NULL,
  action TEXT NOT NULL,
  "storeId" TEXT,
  "docType" TEXT,
  "docId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "ScanLog_epc_idx" ON "ScanLog"(epc);
CREATE INDEX IF NOT EXISTS "ScanLog_docType_docId_idx" ON "ScanLog"("docType", "docId");
CREATE INDEX IF NOT EXISTS "ScanLog_delete_idx" ON "ScanLog"(delete);

CREATE TABLE IF NOT EXISTS "ItemEvent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId" TEXT NOT NULL,
  type TEXT NOT NULL,
  "docType" TEXT,
  "docId" TEXT,
  "docNo" TEXT,
  "storeId" TEXT,
  payload JSONB,
  "createdById" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete BOOLEAN,
  delete_by TEXT,
  delete_on TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS "ItemEvent_itemId_createdAt_idx" ON "ItemEvent"("itemId", "createdAt");
CREATE INDEX IF NOT EXISTS "ItemEvent_docType_docId_idx" ON "ItemEvent"("docType", "docId");
CREATE INDEX IF NOT EXISTS "ItemEvent_delete_idx" ON "ItemEvent"(delete);