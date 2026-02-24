import fs from 'fs';
import path from 'path';

// [DataService] Data Migration Complete: Now using PostgreSQL as the primary source of truth.
// Local CSV loading is disabled to save server memory (RAM).

let dataCache = global._strideDataCache;

if (!dataCache) {
    dataCache = global._strideDataCache = {
        geoJSON: null,
        initialized: false
    };
}

export async function initializeGlobalData() {
    if (dataCache.initialized) {
        return dataCache;
    }

    const datasetDir = path.join(process.cwd(), 'datasets');
    console.log("[DataService] Initializing Global Data (Postgres-First Mode)...");

    try {
        // 1. GeoJSON (Still needed for map boundaries in some views)
        const geojsonPath = path.join(datasetDir, 'gadm41_PHL_1.json');
        if (fs.existsSync(geojsonPath)) {
            dataCache.geoJSON = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
            console.log(`[DataService] Loaded GeoJSON spatial boundaries.`);
        }

        dataCache.initialized = true;
        console.log("[DataService] Global Initialization Complete!");
        return dataCache;

    } catch (error) {
        console.error("[DataService] Error during initialization:", error);
        throw error;
    }
}

export function getGlobalData() {
    return dataCache;
}
