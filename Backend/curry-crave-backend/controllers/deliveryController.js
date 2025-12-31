import Settings from '../models/Settings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load pincode database
let pincodeDatabase = {};
try {
    const pincodeDataPath = path.join(__dirname, '../data/pincodes.json');
    const pincodeData = JSON.parse(fs.readFileSync(pincodeDataPath, 'utf8'));
    pincodeDatabase = pincodeData.pincodes;
    console.log(`✅ Loaded ${Object.keys(pincodeDatabase).length} pincodes from database`);
} catch (error) {
    console.error('⚠️ Error loading pincode database:', error.message);
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Helper function to fetch coordinates from OpenStreetMap Nominatim (free geocoding)
async function geocodePincode(pincode) {
    try {
        // Use Nominatim to geocode the pincode
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`,
            {
                headers: {
                    'User-Agent': 'CurryCrave-DeliveryApp/1.0'
                }
            }
        );
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }
    } catch (error) {
        console.error(`Nominatim geocoding error for ${pincode}:`, error.message);
    }
    return null;
}

// Helper function to fetch pincode info from India Post API
async function fetchPincodeInfoFromAPI(pincode) {
    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const postOffice = data[0].PostOffice[0];
            return {
                area: postOffice.Name || 'Unknown',
                city: postOffice.District || 'Unknown',
                state: postOffice.State || 'Unknown',
                region: postOffice.Region || 'Unknown'
            };
        }
    } catch (error) {
        console.error(`India Post API error for ${pincode}:`, error.message);
    }
    return null;
}

// Combined function to get full pincode data with coordinates
async function fetchPincodeFromAPI(pincode) {
    try {
        // First get area info from India Post API
        const areaInfo = await fetchPincodeInfoFromAPI(pincode);

        // Then get coordinates from Nominatim
        const coords = await geocodePincode(pincode);

        if (areaInfo || coords) {
            const pincodeData = {
                lat: coords?.lat || 0,
                lng: coords?.lng || 0,
                area: areaInfo?.area || 'Unknown',
                city: areaInfo?.city || 'Unknown',
                state: areaInfo?.state || 'Unknown',
                region: areaInfo?.region || 'Unknown',
                hasCoordinates: !!(coords?.lat && coords?.lng)
            };

            // Add to local database for caching
            pincodeDatabase[pincode] = pincodeData;
            console.log(`✅ Fetched pincode ${pincode}: ${pincodeData.area}, ${pincodeData.city} (Coordinates: ${pincodeData.hasCoordinates ? 'Yes' : 'No'})`);
            return pincodeData;
        }
    } catch (error) {
        console.error(`Error fetching pincode ${pincode}:`, error.message);
    }
    return null;
}

// Function to fetch nearby pincodes (using a range approach since we can't query all pincodes)
async function fetchNearbyPincodes(centerPincode, radiusKm) {
    const centerData = pincodeDatabase[centerPincode];
    if (!centerData || !centerData.hasCoordinates) {
        return [];
    }

    const nearbyPincodes = [];

    // Check all pincodes in our local database
    for (const [pincode, data] of Object.entries(pincodeDatabase)) {
        if (data.lat && data.lng && data.lat !== 0) {
            const distance = calculateDistance(
                centerData.lat,
                centerData.lng,
                data.lat,
                data.lng
            );

            if (distance <= radiusKm && pincode !== centerPincode) {
                nearbyPincodes.push({
                    pincode,
                    area: data.area,
                    city: data.city,
                    state: data.state,
                    distance: distance
                });
            }
        }
    }

    // Sort by distance
    nearbyPincodes.sort((a, b) => a.distance - b.distance);

    return nearbyPincodes;
}

// Validate if pincode is deliverable
export const validatePincode = async (req, res) => {
    try {
        const { pincode } = req.body;

        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit pincode'
            });
        }

        // Get settings
        const settings = await Settings.getSettings();
        const { restaurantLocations, restaurantPincode, deliveryRadius, servicablePincodes } = settings.deliverySettings;

        // First check if pincode is in manually added servicable pincodes
        const manualPincode = servicablePincodes.find(p => p.pincode === pincode && p.isActive);
        if (manualPincode) {
            return res.json({
                success: true,
                deliverable: true,
                message: `We deliver to ${manualPincode.area || pincode}!`,
                area: manualPincode.area || 'Your area',
                distance: null,
                source: 'manual'
            });
        }

        // Get customer pincode coordinates (try local DB first, then API)
        let customerCoords = pincodeDatabase[pincode];
        if (!customerCoords) {
            customerCoords = await fetchPincodeFromAPI(pincode);
        }

        if (!customerCoords || customerCoords.lat === 0) {
            // Pincode not found anywhere
            return res.json({
                success: true,
                deliverable: false,
                message: 'Sorry, we could not verify this pincode. Please contact us for delivery options.',
                area: null,
                distance: null,
                source: 'unknown'
            });
        }

        // Get all active restaurant locations
        const activeLocations = (restaurantLocations || []).filter(loc => loc.isActive);

        // If no multi-locations configured, fall back to legacy single pincode
        if (activeLocations.length === 0 && restaurantPincode) {
            activeLocations.push({
                pincode: restaurantPincode,
                name: 'Main Location',
                area: pincodeDatabase[restaurantPincode]?.area || 'Restaurant'
            });
        }

        if (activeLocations.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'No restaurant locations configured. Please contact the restaurant.'
            });
        }

        // Check distance from each restaurant location and find the nearest one
        let nearestLocation = null;
        let nearestDistance = Infinity;

        for (const location of activeLocations) {
            let locationCoords = pincodeDatabase[location.pincode];
            if (!locationCoords || locationCoords.lat === 0) {
                locationCoords = await fetchPincodeFromAPI(location.pincode);
            }

            if (locationCoords && locationCoords.lat !== 0) {
                const distance = calculateDistance(
                    locationCoords.lat,
                    locationCoords.lng,
                    customerCoords.lat,
                    customerCoords.lng
                );

                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestLocation = {
                        ...location,
                        coords: locationCoords,
                        distance: distance
                    };
                }
            }
        }

        if (!nearestLocation) {
            return res.status(500).json({
                success: false,
                message: 'Restaurant locations not configured properly. Please contact the restaurant.'
            });
        }

        const isDeliverable = nearestDistance <= deliveryRadius;

        const locationLabel = nearestLocation.name || nearestLocation.area || nearestLocation.pincode || 'Restaurant';

        return res.json({
            success: true,
            deliverable: isDeliverable,
            message: isDeliverable
                ? `Great! We deliver to ${customerCoords.area} (${nearestDistance} KM from ${locationLabel})`
                : `Sorry, ${customerCoords.area} is ${nearestDistance} KM away from ${locationLabel}. We deliver within ${deliveryRadius} KM only.`,
            area: customerCoords.area,
            city: customerCoords.city,
            distance: nearestDistance,
            nearestLocation: locationLabel,
            deliveryRadius: deliveryRadius,
            source: 'calculated'
        });

    } catch (error) {
        console.error('Error validating pincode:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating pincode',
            error: error.message
        });
    }
};

// Get pincode info
export const getPincodeInfo = async (req, res) => {
    try {
        const { pincode } = req.params;

        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit pincode'
            });
        }

        const pincodeInfo = pincodeDatabase[pincode];

        if (!pincodeInfo) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found in database'
            });
        }

        res.json({
            success: true,
            data: {
                pincode,
                ...pincodeInfo
            }
        });

    } catch (error) {
        console.error('Error getting pincode info:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting pincode info',
            error: error.message
        });
    }
};

// Get delivery settings (for frontend)
export const getDeliverySettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const { restaurantLocations, restaurantPincode, deliveryRadius, servicablePincodes } = settings.deliverySettings;

        res.json({
            success: true,
            data: {
                restaurantLocations: restaurantLocations || [],
                restaurantPincode, // Legacy field
                deliveryRadius,
                servicablePincodes: servicablePincodes.filter(p => p.isActive)
            }
        });

    } catch (error) {
        console.error('Error getting delivery settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting delivery settings',
            error: error.message
        });
    }
};

// Add servicable pincode (Admin only)
export const addServicablePincode = async (req, res) => {
    try {
        const { pincode, area } = req.body;

        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit pincode'
            });
        }

        const settings = await Settings.getSettings();

        // Check if pincode already exists
        const existingPincode = settings.deliverySettings.servicablePincodes.find(
            p => p.pincode === pincode
        );

        if (existingPincode) {
            // Update existing
            existingPincode.area = area || existingPincode.area;
            existingPincode.isActive = true;
        } else {
            // Add new
            settings.deliverySettings.servicablePincodes.push({
                pincode,
                area: area || pincodeDatabase[pincode]?.area || '',
                isActive: true
            });
        }

        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: `Pincode ${pincode} added to servicable areas`,
            data: settings.deliverySettings.servicablePincodes
        });

    } catch (error) {
        console.error('Error adding servicable pincode:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding servicable pincode',
            error: error.message
        });
    }
};

// Remove servicable pincode (Admin only)
export const removeServicablePincode = async (req, res) => {
    try {
        const { pincode } = req.params;

        const settings = await Settings.getSettings();

        // Find and deactivate (or remove) the pincode
        const pincodeIndex = settings.deliverySettings.servicablePincodes.findIndex(
            p => p.pincode === pincode
        );

        if (pincodeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Pincode not found in servicable areas'
            });
        }

        // Remove the pincode
        settings.deliverySettings.servicablePincodes.splice(pincodeIndex, 1);
        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: `Pincode ${pincode} removed from servicable areas`,
            data: settings.deliverySettings.servicablePincodes
        });

    } catch (error) {
        console.error('Error removing servicable pincode:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing servicable pincode',
            error: error.message
        });
    }
};

// Update delivery area settings (Admin only)
export const updateDeliveryAreaSettings = async (req, res) => {
    try {
        const { restaurantPincode, deliveryRadius } = req.body;

        const settings = await Settings.getSettings();

        if (restaurantPincode) {
            // Check if pincode exists in local database
            let pincodeData = pincodeDatabase[restaurantPincode];

            // If not in local database, try to fetch from external API
            if (!pincodeData) {
                pincodeData = await fetchPincodeFromAPI(restaurantPincode);
            }

            // If still no data, create a placeholder
            if (!pincodeData) {
                console.log(`⚠️ Pincode ${restaurantPincode} not found in any database. Saving anyway.`);
                pincodeDatabase[restaurantPincode] = {
                    lat: 0,
                    lng: 0,
                    area: 'Custom Location',
                    city: 'Unknown',
                    state: 'Unknown',
                    hasCoordinates: false
                };
                pincodeData = pincodeDatabase[restaurantPincode];
            }

            settings.deliverySettings.restaurantPincode = restaurantPincode;
        }

        if (deliveryRadius !== undefined) {
            if (deliveryRadius < 1 || deliveryRadius > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery radius must be between 1 and 100 KM'
                });
            }
            settings.deliverySettings.deliveryRadius = deliveryRadius;
        }

        settings.updatedAt = Date.now();
        await settings.save();

        const restaurantData = pincodeDatabase[settings.deliverySettings.restaurantPincode];
        const hasCoordinates = restaurantData?.lat !== 0 && restaurantData?.lng !== 0;

        res.json({
            success: true,
            message: hasCoordinates
                ? 'Delivery area settings updated successfully!'
                : `Saved! Location: ${restaurantData?.area || 'Custom'}, ${restaurantData?.city || ''}, ${restaurantData?.state || ''}. Note: Use "Manually Add Servicable Pincodes" to add delivery areas.`,
            data: {
                restaurantPincode: settings.deliverySettings.restaurantPincode,
                deliveryRadius: settings.deliverySettings.deliveryRadius,
                restaurantArea: restaurantData?.area || 'Custom Location',
                restaurantCity: restaurantData?.city || 'Unknown',
                restaurantState: restaurantData?.state || 'Unknown',
                hasCoordinates: hasCoordinates,
                note: !hasCoordinates ? 'Automatic radius calculation not available for this pincode. Please manually add servicable pincodes.' : null
            }
        });

    } catch (error) {
        console.error('Error updating delivery area settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating delivery area settings',
            error: error.message
        });
    }
};

// Get all pincodes within radius (for admin reference)
export const getPincodesInRadius = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const { restaurantPincode, deliveryRadius } = settings.deliverySettings;

        const restaurantCoords = pincodeDatabase[restaurantPincode];
        if (!restaurantCoords) {
            return res.status(500).json({
                success: false,
                message: 'Restaurant location not configured properly'
            });
        }

        const pincodesInRadius = [];

        for (const [pincode, coords] of Object.entries(pincodeDatabase)) {
            const distance = calculateDistance(
                restaurantCoords.lat,
                restaurantCoords.lng,
                coords.lat,
                coords.lng
            );

            if (distance <= deliveryRadius) {
                pincodesInRadius.push({
                    pincode,
                    area: coords.area,
                    city: coords.city,
                    distance
                });
            }
        }

        // Sort by distance
        pincodesInRadius.sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            data: {
                restaurantPincode,
                restaurantArea: restaurantCoords.area,
                deliveryRadius,
                totalPincodes: pincodesInRadius.length,
                pincodes: pincodesInRadius
            }
        });

    } catch (error) {
        console.error('Error getting pincodes in radius:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting pincodes in radius',
            error: error.message
        });
    }
};

// Scan and discover nearby pincodes (Admin only)
// This scans a range of pincodes around the restaurant and geocodes them
export const scanNearbyPincodes = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        const { restaurantPincode, deliveryRadius } = settings.deliverySettings;

        // First, ensure restaurant pincode has coordinates
        let restaurantData = pincodeDatabase[restaurantPincode];
        if (!restaurantData || !restaurantData.hasCoordinates) {
            restaurantData = await fetchPincodeFromAPI(restaurantPincode);
        }

        if (!restaurantData || !restaurantData.hasCoordinates) {
            return res.json({
                success: true,
                message: 'Could not get coordinates for restaurant pincode. Using database pincodes only.',
                data: {
                    restaurantPincode,
                    restaurantArea: restaurantData?.area || 'Unknown',
                    scannedCount: 0,
                    nearbyPincodes: [],
                    note: 'Geocoding service could not find coordinates for this pincode.'
                }
            });
        }

        // Get the base pincode number
        const basePincode = parseInt(restaurantPincode);
        const nearbyPincodes = [];
        const scannedPincodes = new Set();

        // Generate a range of pincodes to check (±50 from base, covering ~100 pincodes)
        const range = 30;
        const pincodesToCheck = [];

        for (let i = -range; i <= range; i++) {
            const candidatePincode = (basePincode + i).toString().padStart(6, '0');
            if (candidatePincode.length === 6 && !scannedPincodes.has(candidatePincode)) {
                pincodesToCheck.push(candidatePincode);
                scannedPincodes.add(candidatePincode);
            }
        }

        // Process pincodes in batches to avoid rate limiting
        const batchSize = 5;
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < pincodesToCheck.length; i += batchSize) {
            const batch = pincodesToCheck.slice(i, i + batchSize);

            await Promise.all(batch.map(async (pincode) => {
                // Check if already in database with coordinates
                let pincodeData = pincodeDatabase[pincode];

                if (!pincodeData || !pincodeData.hasCoordinates) {
                    // Fetch from APIs
                    pincodeData = await fetchPincodeFromAPI(pincode);
                }

                if (pincodeData && pincodeData.hasCoordinates && pincodeData.lat !== 0) {
                    const distance = calculateDistance(
                        restaurantData.lat,
                        restaurantData.lng,
                        pincodeData.lat,
                        pincodeData.lng
                    );

                    if (distance <= deliveryRadius && pincode !== restaurantPincode) {
                        nearbyPincodes.push({
                            pincode,
                            area: pincodeData.area,
                            city: pincodeData.city,
                            state: pincodeData.state,
                            distance: distance
                        });
                    }
                }
            }));

            // Rate limiting: wait between batches
            if (i + batchSize < pincodesToCheck.length) {
                await delay(1000); // Wait 1 second between batches for Nominatim rate limit
            }
        }

        // Sort by distance
        nearbyPincodes.sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            message: `Scanned ${scannedPincodes.size} pincodes, found ${nearbyPincodes.length} within ${deliveryRadius} KM`,
            data: {
                restaurantPincode,
                restaurantArea: restaurantData.area,
                restaurantCity: restaurantData.city,
                restaurantState: restaurantData.state,
                deliveryRadius,
                scannedCount: scannedPincodes.size,
                nearbyPincodes
            }
        });

    } catch (error) {
        console.error('Error scanning nearby pincodes:', error);
        res.status(500).json({
            success: false,
            message: 'Error scanning nearby pincodes',
            error: error.message
        });
    }
};

// Add or update a restaurant location (Admin only)
export const addRestaurantLocation = async (req, res) => {
    try {
        const { pincode, name } = req.body;

        if (!pincode || pincode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 6-digit pincode'
            });
        }

        const settings = await Settings.getSettings();

        // Check if we already have 20 locations
        if ((settings.deliverySettings.restaurantLocations || []).length >= 20) {
            // Check if this pincode already exists
            const existingIndex = settings.deliverySettings.restaurantLocations.findIndex(
                loc => loc.pincode === pincode
            );

            if (existingIndex === -1) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 20 restaurant locations allowed. Please remove one first.'
                });
            }
        }

        // Fetch pincode info
        let pincodeData = pincodeDatabase[pincode];
        if (!pincodeData) {
            pincodeData = await fetchPincodeFromAPI(pincode);
        }

        // Check if pincode already exists
        if (!settings.deliverySettings.restaurantLocations) {
            settings.deliverySettings.restaurantLocations = [];
        }

        const existingIndex = settings.deliverySettings.restaurantLocations.findIndex(
            loc => loc.pincode === pincode
        );

        const locationData = {
            pincode,
            name: name || `Location ${settings.deliverySettings.restaurantLocations.length + 1}`,
            area: pincodeData?.area || 'Unknown',
            city: pincodeData?.city || 'Unknown',
            state: pincodeData?.state || 'Unknown',
            isActive: true
        };

        if (existingIndex !== -1) {
            // Update existing
            settings.deliverySettings.restaurantLocations[existingIndex] = locationData;
        } else {
            // Add new
            settings.deliverySettings.restaurantLocations.push(locationData);
        }

        // Also update legacy field to first active location
        if (settings.deliverySettings.restaurantLocations.length > 0) {
            settings.deliverySettings.restaurantPincode = settings.deliverySettings.restaurantLocations[0].pincode;
        }

        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: `Restaurant location ${pincode} (${locationData.area}, ${locationData.city}) added successfully!`,
            data: settings.deliverySettings.restaurantLocations
        });

    } catch (error) {
        console.error('Error adding restaurant location:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding restaurant location',
            error: error.message
        });
    }
};

// Remove a restaurant location (Admin only)
export const removeRestaurantLocation = async (req, res) => {
    try {
        const { pincode } = req.params;

        const settings = await Settings.getSettings();

        if (!settings.deliverySettings.restaurantLocations) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant locations configured'
            });
        }

        const locationIndex = settings.deliverySettings.restaurantLocations.findIndex(
            loc => loc.pincode === pincode
        );

        if (locationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant location not found'
            });
        }

        // Remove the location
        settings.deliverySettings.restaurantLocations.splice(locationIndex, 1);

        // Update legacy field
        if (settings.deliverySettings.restaurantLocations.length > 0) {
            settings.deliverySettings.restaurantPincode = settings.deliverySettings.restaurantLocations[0].pincode;
        }

        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: `Restaurant location ${pincode} removed successfully!`,
            data: settings.deliverySettings.restaurantLocations
        });

    } catch (error) {
        console.error('Error removing restaurant location:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing restaurant location',
            error: error.message
        });
    }
};

// Toggle restaurant location active status (Admin only)
export const toggleRestaurantLocation = async (req, res) => {
    try {
        const { pincode } = req.params;

        const settings = await Settings.getSettings();

        if (!settings.deliverySettings.restaurantLocations) {
            return res.status(404).json({
                success: false,
                message: 'No restaurant locations configured'
            });
        }

        const location = settings.deliverySettings.restaurantLocations.find(
            loc => loc.pincode === pincode
        );

        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant location not found'
            });
        }

        // Toggle active status
        location.isActive = !location.isActive;

        settings.updatedAt = Date.now();
        await settings.save();

        res.json({
            success: true,
            message: `Restaurant location ${pincode} is now ${location.isActive ? 'active' : 'inactive'}`,
            data: settings.deliverySettings.restaurantLocations
        });

    } catch (error) {
        console.error('Error toggling restaurant location:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling restaurant location',
            error: error.message
        });
    }
};
