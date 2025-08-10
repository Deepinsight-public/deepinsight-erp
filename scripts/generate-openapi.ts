#!/usr/bin/env node

/**
 * Generate OpenAPI specification and save to public/openapi.json
 * This script fetches the OpenAPI spec from the running edge function
 * and saves it for frontend/QA alignment
 */

import fs from 'fs'
import path from 'path'

async function generateOpenAPI() {
  try {
    // Try to fetch from local development endpoint first
    let response;
    const endpoints = [
      'http://localhost:54321/functions/v1/api-new/api/docs',
      'https://teeiqfgegkshfizvzmqj.supabase.co/functions/v1/api-new/api/docs'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying to fetch OpenAPI spec from: ${endpoint}`);
        response = await fetch(endpoint);
        if (response.ok) break;
      } catch (error) {
        console.warn(`Failed to fetch from ${endpoint}:`, error.message);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error('Failed to fetch OpenAPI spec from all endpoints');
      
      // Fallback to static generation
      console.log('Generating static OpenAPI spec...');
      response = { ok: true, json: () => Promise.resolve(staticOpenApiSpec) };
    }

    const openApiSpec = await response.json();
    
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Save OpenAPI spec to public directory
    const outputPath = path.join(publicDir, 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));
    
    console.log(`✅ OpenAPI specification saved to: ${outputPath}`);
    console.log(`📊 API contains ${Object.keys(openApiSpec.paths || {}).length} endpoints`);
    
    // Generate summary for frontend/QA teams
    const summary = {
      generated: new Date().toISOString(),
      version: openApiSpec.info?.version || '1.0.0',
      title: openApiSpec.info?.title || 'Store API',
      endpoints: Object.keys(openApiSpec.paths || {}),
      totalEndpoints: Object.keys(openApiSpec.paths || {}).length,
      methods: Object.values(openApiSpec.paths || {}).flatMap(
        (path: any) => Object.keys(path)
      ).filter((method, index, array) => array.indexOf(method) === index)
    };
    
    fs.writeFileSync(
      path.join(publicDir, 'api-summary.json'), 
      JSON.stringify(summary, null, 2)
    );
    
    console.log(`📋 API summary saved for frontend/QA teams`);
    
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    process.exit(1);
  }
}

// Static fallback OpenAPI spec
const staticOpenApiSpec = {
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
    // Core endpoints from the edge function will be fetched dynamically
    // This is a fallback for offline generation
  },
  components: {
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

// Run if called directly
if (require.main === module) {
  generateOpenAPI();
}

module.exports = { generateOpenAPI };