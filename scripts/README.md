# Test Scripts

This directory contains test and utility scripts for the Earth Engine MCP server.

## Available Scripts

### `client.mjs`
Basic client placeholder for MCP connection reference.

### `test-ee-tools.mjs`
Comprehensive test client that demonstrates all available Earth Engine tools.

## Usage

### Test the server (when running):
```bash
# Start the server first
pnpm dev

# In another terminal, run the test client
node scripts/test-ee-tools.mjs

# Or use the npm script
pnpm test:client
```

### Test with custom server URL:
```bash
node scripts/test-ee-tools.mjs https://your-deployed-server.vercel.app
```

## What the test client does:

1. **Health Check**: Verifies server is running
2. **Tool Listing**: Shows all 23 available Earth Engine tools
3. **Demo Workflow**: Demonstrates NDVI analysis workflow
4. **Usage Examples**: Provides sample parameters for each tool

## Sample Output:

```
🌍 Earth Engine MCP Server Test Client
=====================================
Server: http://localhost:3000

📋 Testing Health Check...
✅ Health: { ok: true, time: '2024-01-08T12:00:00.000Z' }

🔧 Testing Earth Engine Tools...
Available tools to test: 5

📌 Tool: health_check
   Basic server health
   Params: {}

📌 Tool: auth_check
   Earth Engine authentication
   Params: {}

📌 Tool: search_gee_catalog
   Search for Sentinel-2 datasets
   Params: {
     "query": "sentinel-2"
   }

...

📊 Example Workflow: NDVI Analysis
===================================

Step 1: search_gee_catalog
  Purpose: Find Sentinel-2 Surface Reflectance dataset
  
Step 2: filter_collection_by_date_and_region
  Purpose: Filter for summer 2024 in California
  
Step 3: calculate_spectral_index
  Purpose: Calculate NDVI
  
Step 4: get_map_visualization_url
  Purpose: Generate map tiles for visualization
  
Step 5: calculate_summary_statistics
  Purpose: Get NDVI statistics for the region

📚 Complete Tool List (23 tools)
================================

🔐 Authentication
  • health_check - Server health status
  • auth_check - Verify Earth Engine connection

🔍 Discovery
  • search_gee_catalog - Search datasets
  • filter_collection_by_date_and_region - Filter collections
  • get_dataset_band_names - Get band information

[... all 23 tools listed by category ...]

✨ Test client complete!

🚀 Next steps:
   1. Configure .env.local with your Earth Engine credentials
   2. Run: pnpm dev
   3. Connect MCP client to: http://localhost:3000/api/mcp/sse
   4. Start processing satellite imagery!
```

## Connecting to MCP

To actually execute Earth Engine operations:

1. **Start the server**: `pnpm dev`
2. **Connect an MCP client** (like Claude Desktop) to: `http://localhost:3000/api/mcp/sse`
3. **Use the tools** through the MCP client interface

The test scripts help verify your server is running and show what tools are available, but actual Earth Engine operations must be executed through the MCP protocol.
