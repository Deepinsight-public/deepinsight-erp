import fs from 'fs'
import path from 'path'

/**
 * Generate OpenAPI specification for the Store Management API
 */
const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Store Management API",
    version: "2.0.0",
    description: "Comprehensive API for store operations including sales, inventory, repairs, and more",
    contact: {
      name: "API Support",
      email: "support@example.com"
    }
  },
  servers: [
    {
      url: "/api",
      description: "Current API endpoints"
    },
    {
      url: "/api/hq",
      description: "Future HQ-only endpoints for consolidated reports"
    }
  ],
  paths: {
    "/store/healthz": {
      get: {
        summary: "Health check",
        tags: ["System"],
        responses: {
          "200": {
            description: "System is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean" },
                    timestamp: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/store/auth/login": {
      post: {
        summary: "User authentication",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 6 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Authentication successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                    profile: { $ref: "#/components/schemas/Profile" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Authentication failed"
          }
        }
      }
    },
    "/store/sales-orders": {
      get: {
        summary: "List sales orders",
        tags: ["Sales"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "customer", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          "200": {
            description: "Sales orders retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SalesOrder" }
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create sales order",
        tags: ["Sales"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateSalesOrderRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Sales order created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalesOrder" }
              }
            }
          }
        }
      }
    },
    "/store/sales-orders/{id}": {
      get: {
        summary: "Get sales order details",
        tags: ["Sales"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        responses: {
          "200": {
            description: "Sales order details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SalesOrderDetail" }
              }
            }
          }
        }
      }
    },
    "/store/sales-orders/pivot": {
      get: {
        summary: "Sales pivot analysis",
        tags: ["Analytics"],
        parameters: [
          { name: "source", in: "query", schema: { type: "string" } },
          { name: "dateFrom", in: "query", schema: { type: "string", format: "date" } },
          { name: "dateTo", in: "query", schema: { type: "string", format: "date" } },
          { name: "groupBy", in: "query", schema: { type: "string", enum: ["order_date", "store", "source", "cashier", "product_type"] } }
        ],
        responses: {
          "200": {
            description: "Pivot analysis data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/SalesSummary" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/store/dashboard": {
      get: {
        summary: "Dashboard metrics",
        tags: ["Analytics"],
        responses: {
          "200": {
            description: "Dashboard data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardData" }
              }
            }
          }
        }
      }
    },
    "/store/scrap": {
      post: {
        summary: "Create scrap record with photos",
        tags: ["Scrap"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "string", description: "JSON string of scrap data" },
                  photos: {
                    type: "array",
                    items: { type: "string", format: "binary" }
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Scrap record created with photo URLs",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ScrapHeader" }
              }
            }
          }
        }
      }
    },
    "/store/repairs": {
      post: {
        summary: "Create repair with document",
        tags: ["Repairs"],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  data: { type: "string", description: "JSON string of repair data" },
                  document: { type: "string", format: "binary", description: "Repair document (PDF)" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Repair created with document URL",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Repair" }
              }
            }
          }
        }
      }
    },
    "/store/logistics/lines/{id}": {
      put: {
        summary: "Update logistics line with delivery proof",
        tags: ["Logistics"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  proof: { type: "string", format: "binary", description: "Delivery proof image" },
                  status: { type: "string", enum: ["delivered", "failed"] }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Logistics line updated with proof",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogisticsLine" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          full_name: { type: "string" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["store_employee", "store_manager", "hq_admin"] },
          store_id: { type: "string", format: "uuid" },
          is_active: { type: "boolean" }
        }
      },
      SalesOrder: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          order_number: { type: "string" },
          customer_name: { type: "string" },
          customer_first: { type: "string" },
          customer_last: { type: "string" },
          customer_email: { type: "string", format: "email" },
          customer_phone: { type: "string" },
          total_amount: { type: "number", format: "decimal" },
          warranty_amount: { type: "number", format: "decimal" },
          warranty_years: { type: "integer" },
          customer_source: { type: "string" },
          payment_method: { type: "string" },
          status: { type: "string" },
          order_date: { type: "string", format: "date-time" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      SalesOrderDetail: {
        allOf: [
          { $ref: "#/components/schemas/SalesOrder" },
          {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: { $ref: "#/components/schemas/SalesOrderItem" }
              }
            }
          }
        ]
      },
      SalesOrderItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          product_id: { type: "string", format: "uuid" },
          quantity: { type: "integer" },
          unit_price: { type: "number", format: "decimal" },
          map_at_sale: { type: "number", format: "decimal" },
          price_map_rate: { type: "number", format: "decimal" },
          unit_cost_at_sale: { type: "number", format: "decimal" },
          gross_profit: { type: "number", format: "decimal" },
          total_amount: { type: "number", format: "decimal" }
        }
      },
      SalesSummary: {
        type: "object",
        properties: {
          order_date: { type: "string", format: "date" },
          store_id: { type: "string", format: "uuid" },
          store_name: { type: "string" },
          source: { type: "string" },
          cashier_name: { type: "string" },
          product_type: { type: "string" },
          transaction_amount: { type: "number", format: "decimal" },
          total_map: { type: "number", format: "decimal" },
          price_map_ratio: { type: "number", format: "decimal" },
          total_cost: { type: "number", format: "decimal" },
          total_gross_profit: { type: "number", format: "decimal" },
          warranty_amount: { type: "number", format: "decimal" }
        }
      },
      DashboardData: {
        type: "object",
        properties: {
          todaysSales: {
            type: "object",
            properties: {
              amount: { type: "number", format: "decimal" },
              orderCount: { type: "integer" }
            }
          },
          inventoryWarnings: {
            type: "object",
            properties: {
              count: { type: "integer" },
              items: { type: "array", items: { type: "object" } }
            }
          },
          pendingTasks: {
            type: "object",
            properties: {
              transfersToReceive: { type: "integer" },
              returnsToRestock: { type: "integer" },
              scrapToApprove: { type: "integer" }
            }
          }
        }
      },
      ScrapHeader: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          scrap_no: { type: "string" },
          status: { type: "string" },
          total_qty: { type: "integer" },
          total_value: { type: "number", format: "decimal" },
          photo_urls: { type: "array", items: { type: "string", format: "uri" } },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Repair: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          repair_id: { type: "string" },
          customer_name: { type: "string" },
          type: { type: "string" },
          description: { type: "string" },
          status: { type: "string" },
          cost: { type: "number", format: "decimal" },
          document_url: { type: "string", format: "uri" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      LogisticsLine: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          order_id: { type: "string", format: "uuid" },
          delivery_status: { type: "string" },
          proof_url: { type: "string", format: "uri" },
          delivered_at: { type: "string", format: "date-time" }
        }
      },
      CreateSalesOrderRequest: {
        type: "object",
        required: ["customerName", "totalAmount", "lines"],
        properties: {
          customerName: { type: "string" },
          customerEmail: { type: "string", format: "email" },
          customerPhone: { type: "string" },
          customerFirst: { type: "string" },
          customerLast: { type: "string" },
          totalAmount: { type: "number", format: "decimal" },
          discountAmount: { type: "number", format: "decimal" },
          taxAmount: { type: "number", format: "decimal" },
          warrantyAmount: { type: "number", format: "decimal" },
          warrantyYears: { type: "integer" },
          customerSource: { type: "string" },
          paymentMethod: { type: "string" },
          lines: {
            type: "array",
            items: {
              type: "object",
              required: ["productId", "quantity", "unitPrice"],
              properties: {
                productId: { type: "string", format: "uuid" },
                quantity: { type: "integer", minimum: 1 },
                unitPrice: { type: "number", format: "decimal" },
                mapAtSale: { type: "number", format: "decimal" },
                unitCostAtSale: { type: "number", format: "decimal" },
                totalAmount: { type: "number", format: "decimal" }
              }
            }
          }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          pages: { type: "integer" }
        }
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    { BearerAuth: [] }
  ]
}

// Write OpenAPI spec to public directory
const publicDir = path.join(process.cwd(), 'public')
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
}

const outputPath = path.join(publicDir, 'openapi.json')
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2))

console.log(`OpenAPI specification generated at: ${outputPath}`)