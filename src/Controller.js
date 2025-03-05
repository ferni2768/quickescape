import { useState, useEffect, useCallback, useRef, useMemo, React } from 'react';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';
import {
    LocationOn, Flight, DirectionsCar, DirectionsBus, Train, LocalDining,
    AccountBalance, ShoppingBag, Nightlife, Hotel, AccessTimeFilled, StickyNote2,
    Lock, LockOpen, Visibility, VisibilityOff
} from '@mui/icons-material';

const APP_VERSION = '0.1';
const REGISTRY_KEY = 'app_registry';
const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;
const MAX_TRIPS = 10;
const throttleTimers = {};

export const RECTANGLE_SIZES = { 1: 375, 2: 275, 3: 200, 4: 150 };
export const RECTANGLE_BORDER_RADIUS = '2ch';

export const ICON_MAP = {
    // Travel icons
    'plane': <Flight />,
    'train': <Train />,
    'bus': <DirectionsBus />,
    'car': <DirectionsCar />,

    // Activity icons
    'tour': <LocationOn />,
    'culture': <AccountBalance />,
    'shop': <ShoppingBag />,
    'party': <Nightlife />,
    'hotel': <Hotel />,
    'eat': <LocalDining />,
    'free': <AccessTimeFilled />,

    // Note icon
    'note': <StickyNote2 />,

    // UI control icons
    'lock': <Lock style={{ pointerEvents: 'none' }} />,
    'lockOpen': <LockOpen style={{ pointerEvents: 'none' }} />,
    'visibility': <Visibility style={{ pointerEvents: 'none' }} />,
    'visibilityOff': <VisibilityOff style={{ pointerEvents: 'none' }} />
};

export const COLOR_MAP = {
    // Travel colors
    'travel': '#1D333A',

    // Activity colors
    'tour': '#DD3131',
    'culture': '#814822',
    'shop': '#69BC29',
    'party': '#3892C7',
    'hotel': '#A84355',
    'eat': '#FF8C00',
    'free': '#98A6AB',

    // Note color
    'note': '#FFC107',
};

//=============================================================================
// UTILITY FUNCTIONS
//=============================================================================

// Generate a random hash for trip identification
const generateTripHash = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    const length = 12;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Reverse map to get icon ID from component (for migration)
export const getIconId = (iconComponent) => {
    if (!iconComponent) return null;

    const iconType = iconComponent.type;
    for (const [id, icon] of Object.entries(ICON_MAP)) {
        if (icon.type === iconType) {
            return id;
        }
    }
    return null;
};

// Reverse map to get color ID from color value (for migration)
export const getColorId = (colorValue) => {
    if (!colorValue) return null;

    for (const [id, color] of Object.entries(COLOR_MAP)) {
        if (color === colorValue) {
            return id;
        }
    }
    return null;
};

// Sanitization for rectangles
const sanitizeRectangles = (rectangles) => {
    return rectangles.map(({ isDragging, isResizing, showGhost, ...rest }) => ({
        ...rest,
        isDragging: false,
        isResizing: false,
        showGhost: false
    }));
};

//=============================================================================
// ENCRYPTION FUNCTIONS
//=============================================================================

// Encryption using AES
const encryptData = (data) => {
    try {
        return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
    } catch (error) {
        console.error("Encryption error:", error);
        return null;
    }
};

// Decryption using AES
const decryptData = (cipherText) => {
    try {
        const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
};

//=============================================================================
// REGISTRY MANAGEMENT
//=============================================================================

// Get registry from localStorage
const getRegistry = () => {
    try {
        const encryptedRegistry = localStorage.getItem(REGISTRY_KEY);
        if (encryptedRegistry) {
            const decryptedRegistry = decryptData(encryptedRegistry);
            if (decryptedRegistry !== null) {
                return decryptedRegistry;
            }
        }

        // If no registry exists, create a default one
        return {
            version: APP_VERSION,
            last_accessed: 0,
            trips: []
        };
    } catch (error) {
        console.error("Error loading registry:", error);
        return {
            version: APP_VERSION,
            last_accessed: 0,
            trips: []
        };
    }
};

// Save registry to localStorage
const saveRegistry = (registry) => {
    try {
        const encrypted = encryptData(registry);
        if (encrypted) {
            localStorage.setItem(REGISTRY_KEY, encrypted);
        } else {
            console.error("Failed to encrypt registry");
        }
    } catch (error) {
        console.error("Error saving registry:", error);
    }
};

//=============================================================================
// TRIP MANAGEMENT
//=============================================================================

// Get current trip hash
const getCurrentTripHash = () => {
    const registry = getRegistry();
    if (registry.trips.length === 0) {
        // Create first trip if none exists
        const newTripHash = generateTripHash();
        registry.trips.push({
            hash: newTripHash,
            created: new Date().toISOString(),
            version: APP_VERSION
        });
        registry.last_accessed = 0;
        saveRegistry(registry);
        return newTripHash;
    }

    return registry.trips[registry.last_accessed].hash;
};

// Create a new trip
const createNewTrip = () => {
    const registry = getRegistry();

    // Check if maximum number of trips was reached
    if (registry.trips.length >= MAX_TRIPS) {
        console.error(`Maximum number of trips (${MAX_TRIPS}) reached`);
        return null;
    }

    const newTripHash = generateTripHash();
    registry.trips.push({
        hash: newTripHash,
        created: new Date().toISOString(),
        version: APP_VERSION
    });

    // Set the new trip as the active one
    registry.last_accessed = registry.trips.length - 1;

    saveRegistry(registry);
    return newTripHash;
};

// Switch to a different trip
const switchTrip = (index) => {
    const registry = getRegistry();

    if (index >= 0 && index < registry.trips.length) {
        registry.last_accessed = index;
        saveRegistry(registry);
        return registry.trips[index].hash;
    }

    return null;
};

//=============================================================================
// DATA STORAGE AND RETRIEVAL
//=============================================================================

// Get data from trip storage with default value
const getStoredData = (key, defaultValue) => {
    try {
        const tripHash = getCurrentTripHash();
        const encrypted = localStorage.getItem(tripHash);

        if (encrypted) {
            const decrypted = decryptData(encrypted);
            if (decrypted !== null && decrypted[key] !== undefined) {
                return decrypted[key];
            }
        }

        // Placeholder for legacy data format handling
        // This would check for data in the old format if needed in the future

        return defaultValue;
    } catch (error) {
        console.error(`Error loading data for ${key}:`, error);
        return defaultValue;
    }
};

// Save data with throttling
const saveData = (key, data, delay = 0) => {
    if (throttleTimers[key]) {
        clearTimeout(throttleTimers[key]);
    }

    throttleTimers[key] = setTimeout(() => {
        try {
            const tripHash = getCurrentTripHash();

            // Get existing trip data or create new object
            let tripData = {};
            const encrypted = localStorage.getItem(tripHash);

            if (encrypted) {
                const decrypted = decryptData(encrypted);
                if (decrypted !== null) {
                    tripData = decrypted;
                }
            }

            // Update the specific key in the trip data
            tripData[key] = data;

            // Encrypt and save the updated trip data
            const encryptedTripData = encryptData(tripData);
            if (encryptedTripData) {
                localStorage.setItem(tripHash, encryptedTripData);
            } else {
                console.error(`Failed to encrypt data for trip ${tripHash}`);
            }
        } catch (error) {
            console.error(`Error saving data for ${key}:`, error);
        }

        delete throttleTimers[key];
    }, delay);
};

//=============================================================================
// DATA MIGRATION
//=============================================================================

// Migrate legacy data to the new format
const migrateData = () => {
    try {
        // Check if registry already exists
        const existingRegistry = localStorage.getItem(REGISTRY_KEY);
        if (existingRegistry) {
            // Registry already exists, no need to migrate
            return;
        }

        // Placeholder for legacy data migration
        // This would handle migration from old formats if needed in the future

        // Create an empty registry if none exists
        const registry = {
            version: APP_VERSION,
            last_accessed: 0,
            trips: []
        };
        saveRegistry(registry);
    } catch (error) {
        console.error("Error during data migration:", error);
    }
};

//=============================================================================
// STATE INITIALIZERS
//=============================================================================

// Initializer for rectangles state
const initialRectangles = () => {
    const rectangles = getStoredData('rectangles', []);
    return rectangles.map(rect => ({
        ...rect,
        loadedFromStorage: true,
        isDragging: false,
        isResizing: false,
        showGhost: false,
        border: rect.border || 0,
        height: rect.height || 80
    }));
};

// Lazy initializer for camera state (cameraPosition, zoom, and locked)
const initialCameraState = () => {
    const camera = getStoredData('camera', {
        cameraPosition: { x: -window.innerWidth / 2, y: 0 },
        zoom: 0.4,
        locked: true
    });

    return camera;
};

// Lazy initializer for metadata (text, dateRange)
const initialMetadata = () => {
    const metadata = getStoredData('metadata', {
        text: "Trip Name",
        dateRange: { start: new Date(), end: dayjs().add(2, 'day').toDate() }
    });

    // Ensure dates are Date objects
    if (metadata.dateRange) {
        metadata.dateRange.start = new Date(metadata.dateRange.start);
        metadata.dateRange.end = new Date(metadata.dateRange.end);
    }

    return metadata;
};

//=============================================================================
// CONTROLLER HOOK
//=============================================================================

export const useController = () => {
    // Rectangle state
    const [rectangles, setRectangles] = useState(initialRectangles);
    const [activeRectangle, setActiveRectangle] = useState(null);

    // Camera state
    const initialCamera = initialCameraState();
    const [cameraPosition, setCameraPosition] = useState(initialCamera.cameraPosition);
    const [zoom, setZoom] = useState(initialCamera.zoom);
    const [locked, setLocked] = useState(initialCamera.locked);

    // Metadata state
    const initialMeta = initialMetadata();
    const [text, setText] = useState(initialMeta.text);
    const [dateRange, setDateRange] = useState(initialMeta.dateRange);

    // UI state
    const [adjustedMousePosition, setAdjustedMousePosition] = useState({ x: 0, y: 0 });
    const gridSize = 20;
    const maxRectangles = 150;

    // Refs for tracking changes
    const rectanglesRef = useRef(rectangles);
    const cameraStateRef = useRef({ cameraPosition, zoom, locked });
    const metadataRef = useRef({ text, dateRange });
    const preventFlushing = useRef(false);

    // Unique ID counter for rectangles
    const idCounter = useRef(0);

    // Initialize idCounter based on existing rectangles
    useEffect(() => {
        if (rectangles.length > 0) {
            const maxId = Math.max(...rectangles.map(r => r.id || 0));
            if (maxId >= idCounter.current) idCounter.current = maxId + 1;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Migrate data on first load
    useEffect(() => {
        migrateData();
    }, []);

    // Update refs when state changes
    useEffect(() => {
        rectanglesRef.current = rectangles;
    }, [rectangles]);

    useEffect(() => {
        cameraStateRef.current = { cameraPosition, zoom, locked };
    }, [cameraPosition, zoom, locked]);

    useEffect(() => {
        metadataRef.current = { text, dateRange };
    }, [text, dateRange]);

    // Memoized function to get client X and Y coordinates
    const getClientXY = useCallback((event) => {
        if (event.touches && event.touches.length > 0) {
            return {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY
            };
        }
        return { clientX: event.clientX, clientY: event.clientY };
    }, []);

    // Memoized function to create a new rectangle
    const createRectangle = useCallback((x, y, height, colorId, size, iconId, group) => {
        setRectangles(prev => {
            if (prev.length >= maxRectangles) return prev;
            const newRectangle = {
                id: idCounter.current,
                x: x / cameraStateRef.current.zoom,
                y: y / cameraStateRef.current.zoom,
                height: group === 0 ? height - gridSize : height,
                border: 0,
                isDragging: true,
                isResizing: false,
                showGhost: false,
                loadedFromStorage: false,
                colorId,
                size,
                iconId,
                text: "",
                isNote: group === 0
            };
            setActiveRectangle(newRectangle.id);
            return [...prev, newRectangle];
        });
        idCounter.current++;
    }, [maxRectangles]);

    // FOR DEVELOPMENT: delete all local storage data
    const clearData = useCallback(() => {
        const registry = getRegistry();
        registry.trips.forEach(trip => { localStorage.removeItem(trip.hash); });
        localStorage.removeItem(REGISTRY_KEY);

        // Refresh the page
        preventFlushing.current = true;
        window.location.reload();
    }, []);

    // Memoized controller object to prevent unnecessary re-renders
    const controller = useMemo(() => ({
        rectangles,
        setRectangles,
        activeRectangle,
        setActiveRectangle,
        adjustedMousePosition,
        setAdjustedMousePosition,
        gridSize,
        getClientXY,
        createRectangle,
        cameraPosition,
        setCameraPosition,
        zoom,
        setZoom,
        locked,
        setLocked,
        text,
        setText,
        dateRange,
        setDateRange,
        clearData
    }), [rectangles, activeRectangle, adjustedMousePosition, gridSize, getClientXY, createRectangle, cameraPosition, zoom, locked, dateRange, text, clearData]);

    // -------------------- STORAGE EFFECTS --------------------
    // Throttled saving for rectangles (0.5 seconds)
    useEffect(() => {
        if (rectangles.length === 0) return;
        saveData('rectangles', sanitizeRectangles(rectangles), 500);
    }, [rectangles]);

    // Throttled saving for camera state (2 seconds)
    useEffect(() => {
        saveData('camera', { cameraPosition, zoom, locked }, 2000);
    }, [cameraPosition, zoom, locked]);

    // Throttled saving for metadata (0.5 seconds)
    useEffect(() => {
        saveData('metadata', { text, dateRange }, 500);
    }, [text, dateRange]);

    // -------------------- FLUSH ON UNLOAD --------------------
    // Flush data to localStorage on page unload
    useEffect(() => {
        const flushData = () => {
            if (preventFlushing.current) return;

            // Get current trip hash
            const tripHash = getCurrentTripHash();

            // Use the ref values instead of direct state values
            const currentData = {
                rectangles: sanitizeRectangles(rectanglesRef.current),
                camera: cameraStateRef.current,
                metadata: metadataRef.current
            };

            // Save the data
            const encryptedTripData = encryptData(currentData);
            if (encryptedTripData) {
                localStorage.setItem(tripHash, encryptedTripData);
            } else {
                console.error(`Failed to encrypt data for trip ${tripHash}`);
            }
        };

        window.addEventListener('beforeunload', flushData);
        return () => {
            window.removeEventListener('beforeunload', flushData);
        };
    }, []);

    // -------------------- CLEAR DATA ON CTRL+D --------------------
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.keyCode === 68) {
                event.preventDefault();
                clearData();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [clearData]);

    return controller;
};

//=============================================================================
// TRIP MANAGER HOOK
//=============================================================================

export const useTripManager = () => {
    const [trips, setTrips] = useState([]);
    const [currentTripIndex, setCurrentTripIndex] = useState(0);

    // Load trips from registry
    useEffect(() => {
        const registry = getRegistry();
        setTrips(registry.trips);
        setCurrentTripIndex(registry.last_accessed);
    }, []);

    // Create a new trip
    const createTrip = useCallback(() => {
        const newTripHash = createNewTrip();
        if (newTripHash) {
            const registry = getRegistry();
            setTrips(registry.trips);
            setCurrentTripIndex(registry.last_accessed);
            return true;
        }
        return false;
    }, []);

    // Switch to a different trip
    const switchToTrip = useCallback((index) => {
        const tripHash = switchTrip(index);
        if (tripHash) {
            setCurrentTripIndex(index);
            // Force reload to get the new trip data
            window.location.reload();
            return true;
        }
        return false;
    }, []);

    // Delete a trip
    const deleteTrip = useCallback((index) => {
        const registry = getRegistry();

        if (index < 0 || index >= registry.trips.length) {
            return false;
        }

        // Get the hash of the trip to delete
        const tripHashToDelete = registry.trips[index].hash;

        // Remove the trip from the registry
        registry.trips.splice(index, 1);

        // Update last_accessed if needed
        if (registry.last_accessed >= registry.trips.length) {
            registry.last_accessed = Math.max(0, registry.trips.length - 1);
        }

        // Save the updated registry
        saveRegistry(registry);

        // Remove the trip data from localStorage
        localStorage.removeItem(tripHashToDelete);

        // Update state
        setTrips(registry.trips);
        setCurrentTripIndex(registry.last_accessed);

        // Force reload if the current trip was deleted
        if (index === currentTripIndex) {
            window.location.reload();
        }

        return true;
    }, [currentTripIndex]);

    return {
        trips,
        currentTripIndex,
        createTrip,
        switchToTrip,
        deleteTrip
    };
};