"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const earthengine_1 = __importDefault(require("@google/earthengine"));
const registry_1 = require("../registry");
const geo_1 = require("@/src/utils/geo");
/**
 * Extract place name from query string
 */
function extractPlaceName(query) {
    // Common place name patterns
    const patterns = [
        /for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "for San Francisco"
        /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "in New York"
        /of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "of Los Angeles"
        /over\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "over Tokyo"
        /around\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, // "around Paris"
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(query);
        if (match && match[1]) {
            return match[1];
        }
    }
    // Check for well-known place names directly
    const knownPlaces = [
        'San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Houston',
        'Tokyo', 'Paris', 'London', 'Berlin', 'Sydney', 'Mumbai', 'Delhi',
        'California', 'Texas', 'Florida', 'Nevada', 'Arizona'
    ];
    for (const place of knownPlaces) {
        if (query.includes(place)) {
            return place;
        }
    }
    return null;
}
(0, registry_1.register)({
    name: 'smart_filter_collection',
    description: 'Intelligently filter a collection by detecting place names and using administrative boundaries when possible',
    input: registry_1.z.object({
        query: registry_1.z.string().describe('Natural language query like "Sentinel-2 for San Francisco in January 2025"'),
        datasetId: registry_1.z.string(),
        startDate: registry_1.z.string(),
        endDate: registry_1.z.string(),
        fallbackRegion: registry_1.z.any().optional().describe('Fallback region if place name not found')
    }),
    output: registry_1.z.object({
        count: registry_1.z.number(),
        regionType: registry_1.z.string(),
        placeName: registry_1.z.string().nullable(),
        message: registry_1.z.string(),
        bounds: registry_1.z.any().optional()
    }),
    handler: async ({ query, datasetId, startDate, endDate, fallbackRegion }) => {
        // Try to extract place name from query
        const placeName = extractPlaceName(query);
        let region;
        let regionType = 'unknown';
        let message = '';
        if (placeName) {
            // Try to use administrative boundary
            const aoi = { placeName, type: 'Polygon', coordinates: [] };
            if (fallbackRegion) {
                Object.assign(aoi, fallbackRegion);
            }
            region = await (0, geo_1.parseAoi)(aoi);
            // Check if we actually got a boundary (parseAoi will use it if found)
            if (region) {
                regionType = 'administrative_boundary';
                message = `Using exact administrative boundary for ${placeName}`;
            }
        }
        // Fall back to provided region if no boundary found
        if (!region && fallbackRegion) {
            region = await (0, geo_1.parseAoi)(fallbackRegion);
            regionType = 'polygon';
            message = placeName
                ? `Could not find boundary for ${placeName}, using polygon instead`
                : 'Using provided polygon region';
        }
        if (!region) {
            throw new Error('No valid region found. Please provide coordinates or a recognized place name.');
        }
        // Filter the collection
        const col = new earthengine_1.default.ImageCollection(datasetId)
            .filterDate(startDate, endDate)
            .filterBounds(region);
        const count = await col.size().getInfo();
        // Get bounds for feedback
        let bounds;
        try {
            bounds = await region.bounds().getInfo();
        }
        catch (e) {
            // Bounds might not be available for all geometry types
        }
        return {
            count,
            regionType,
            placeName,
            message,
            bounds
        };
    },
});
// Also register a simpler version for direct place name queries
(0, registry_1.register)({
    name: 'filter_by_place_name',
    description: 'Filter a collection using a place name (automatically finds administrative boundary)',
    input: registry_1.z.object({
        placeName: registry_1.z.string().describe('Name of place like "San Francisco", "California", "United States"'),
        datasetId: registry_1.z.string(),
        startDate: registry_1.z.string(),
        endDate: registry_1.z.string()
    }),
    output: registry_1.z.object({
        count: registry_1.z.number(),
        found: registry_1.z.boolean(),
        message: registry_1.z.string(),
        area: registry_1.z.number().optional()
    }),
    handler: async ({ placeName, datasetId, startDate, endDate }) => {
        // Use the parseAoi function with placeName
        const aoi = { placeName };
        const region = await (0, geo_1.parseAoi)(aoi);
        if (!region) {
            return {
                count: 0,
                found: false,
                message: `Could not find administrative boundary for "${placeName}". Please check the spelling or use coordinates instead.`,
                area: undefined
            };
        }
        // Filter the collection
        const col = new earthengine_1.default.ImageCollection(datasetId)
            .filterDate(startDate, endDate)
            .filterBounds(region);
        const count = await col.size().getInfo();
        // Try to get area
        let area;
        try {
            const areaM2 = await region.area().getInfo();
            area = areaM2 / 1000000; // Convert to km²
        }
        catch (e) {
            // Area calculation might fail for some geometries
        }
        return {
            count,
            found: true,
            message: `Found ${count} images for ${placeName} (using administrative boundary${area ? `, area: ${Math.round(area)} km²` : ''})`,
            area
        };
    }
});
