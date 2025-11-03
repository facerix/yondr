// Development Service Worker with Mock Server
// This version includes the mock server for local development
// Import shared caching core
importScripts('/sw-core.js');

// Configure cache using shared config helper
const cacheConfig = CacheConfig.create('1.1.4-dev');
const CACHE_VERSION = cacheConfig.version;
const CACHE_NAMES = cacheConfig; // Object with name, staticName, runtimeName
const CACHE_PREFIX = cacheConfig.prefix;
const LOG_PREFIX = `[Yondr ${CACHE_VERSION} - Dev]`;

// Simple mock server implementation for Service Worker
class SWMockServer {
    constructor() {
        this.DB_NAME = '__DEV_MOCK__db';
        this.DB_VERSION = 1;
        this.STORE_COLLECTIONS = 'collections';
        this.STORE_RECORDS = 'records';
        this.STORE_USERS = 'users';
        this.db = null;
        this.initPromise = this._initDB();
    }

    async _initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('[MockServer] IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('[MockServer] IndexedDB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains(this.STORE_COLLECTIONS)) {
                    db.createObjectStore(this.STORE_COLLECTIONS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(this.STORE_RECORDS)) {
                    db.createObjectStore(this.STORE_RECORDS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(this.STORE_USERS)) {
                    db.createObjectStore(this.STORE_USERS, { keyPath: 'email' });
                }
                
                console.log('[MockServer] IndexedDB stores created');
            };
        });
    }

    async _ensureDB() {
        if (!this.db) {
            await this.initPromise;
        }
    }

    async _getAll(storeName) {
        await this._ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _get(storeName, key) {
        await this._ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _put(storeName, value) {
        await this._ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _delete(storeName, key) {
        await this._ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async _getCollections() {
        const collections = await this._getAll(this.STORE_COLLECTIONS);
        return collections.reduce((obj, col) => {
            obj[col.id] = col;
            return obj;
        }, {});
    }

    async _getCollection(id) {
        return await this._get(this.STORE_COLLECTIONS, id);
    }

    async _putCollection(collection) {
        return await this._put(this.STORE_COLLECTIONS, collection);
    }

    async _deleteCollection(id) {
        return await this._delete(this.STORE_COLLECTIONS, id);
    }

    async _getRecords() {
        const records = await this._getAll(this.STORE_RECORDS);
        return records.reduce((obj, rec) => {
            obj[rec.id] = rec;
            return obj;
        }, {});
    }

    async _getRecord(id) {
        return await this._get(this.STORE_RECORDS, id);
    }

    async _putRecord(record) {
        return await this._put(this.STORE_RECORDS, record);
    }

    async _deleteRecord(id) {
        return await this._delete(this.STORE_RECORDS, id);
    }

    async _getUser(email) {
        return await this._get(this.STORE_USERS, email);
    }

    async _putUser(user) {
        return await this._put(this.STORE_USERS, user);
    }

    async _deleteUser(email) {
        return await this._delete(this.STORE_USERS, email);
    }

    async handleRequest(request) {
        const url = new URL(request.url);
        const method = request.method;
        
        console.log(`[MockServer] ${method} ${url.pathname}${url.search}`);

        try {
            if (url.pathname.includes('/api/collections.php')) {
                return await this.handleCollectionsAPI(request, url, method);
            } else if (url.pathname.includes('/api/records.php')) {
                return await this.handleRecordsAPI(request, url, method);
            }
            
            // Pass through non-API requests
            return fetch(request);
        } catch (error) {
            console.error('[MockServer] Error:', error);
            return this.createErrorResponse(error.message, 500);
        }
    }

    async handleCollectionsAPI(request, url, method) {
        switch (method) {
            case 'POST':
                return await this.createCollection(request);
            case 'GET':
                return await this.getCollection(url);
            case 'PUT':
                return await this.updateCollection(request, url);
            case 'DELETE':
                return await this.deleteCollection(url);
            case 'OPTIONS':
                return this.createCORSResponse();
            default:
                return this.createErrorResponse('Method not allowed', 405);
        }
    }

    async handleRecordsAPI(request, url, method) {
        switch (method) {
            case 'POST':
                return await this.createRecord(request);
            case 'GET':
                return await this.getRecord(url);
            case 'PUT':
                return await this.updateRecord(request, url);
            case 'DELETE':
                return await this.deleteRecord(url);
            case 'OPTIONS':
                return this.createCORSResponse();
            default:
                return this.createErrorResponse('Method not allowed', 405);
        }
    }

    async createCollection(request) {
        const input = await request.json();
        
        if (!input || !input.data || !input.email || !input.password) {
            return this.createErrorResponse("Missing required fields", 400);
        }

        const email = input.email.toLowerCase().trim();
        const user = await this._getUser(email);
        
        // UPSERT: Check if user already has a collection
        if (user) {
            // Verify password
            const isValidPassword = await this.verifyPassword(input.password, user.passwordHash);
            if (!isValidPassword) {
                return this.createErrorResponse("Invalid password", 401);
            }

            // Return existing collection
            const collection = await this._getCollection(user.collectionId);
            return this.createSuccessResponse({
                success: true,
                id: collection.id,
                email: collection.email,
                data: collection.contents,
                created_at: collection.created_date,
                updated_at: collection.modified_date,
                existed: true
            }, 200);
        }

        // Create new collection
        const id = input.id || this.generateUUID();
        const passwordHash = await this.hashPassword(input.password);
        const collection = {
            id,
            email,
            password_hash: passwordHash,
            contents: input.data,
            created_date: new Date().toISOString(),
            modified_date: new Date().toISOString()
        };

        await this._putCollection(collection);
        await this._putUser({ email, passwordHash, collectionId: id });

        return this.createSuccessResponse({
            success: true,
            id,
            created_at: collection.created_date,
            existed: false
        }, 201);
    }

    async getCollection(url) {
        const params = url.searchParams;
        const email = params.get('email');
        const password = params.get('password');

        if (!email || !password) {
            return this.createErrorResponse("Missing email or password", 400);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await this._getUser(normalizedEmail);
        
        if (!user) {
            return this.createErrorResponse("Collection not found", 404);
        }

        const isValidPassword = await this.verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
            return this.createErrorResponse("Invalid password", 401);
        }

        const collection = await this._getCollection(user.collectionId);
        
        return this.createSuccessResponse({
            success: true,
            id: collection.id,
            email: collection.email,
            data: collection.contents,
            created_at: collection.created_date,
            updated_at: collection.modified_date
        });
    }

    async updateCollection(request, url) {
        const params = url.searchParams;
        const id = params.get('id');
        const input = await request.json();
        
        if (!id || !input || !input.data || !input.password) {
            return this.createErrorResponse("Missing required fields", 400);
        }

        const collection = await this._getCollection(id);
        if (!collection) {
            return this.createErrorResponse("Collection not found", 404);
        }

        const isValidPassword = await this.verifyPassword(input.password, collection.password_hash);
        if (!isValidPassword) {
            return this.createErrorResponse("Invalid password", 401);
        }

        collection.contents = input.data;
        collection.modified_date = new Date().toISOString();
        
        if (input.new_password) {
            collection.password_hash = await this.hashPassword(input.new_password);
            const user = await this._getUser(collection.email);
            if (user) {
                user.passwordHash = collection.password_hash;
                await this._putUser(user);
            }
        }

        await this._putCollection(collection);

        return this.createSuccessResponse({
            success: true,
            id,
            updated_at: collection.modified_date
        });
    }

    async deleteCollection(url) {
        const params = url.searchParams;
        const id = params.get('id');
        const password = params.get('password');

        if (!id || !password) {
            return this.createErrorResponse("Missing id or password", 400);
        }

        const collection = await this._getCollection(id);
        if (!collection) {
            return this.createErrorResponse("Collection not found", 404);
        }

        const isValidPassword = await this.verifyPassword(password, collection.password_hash);
        if (!isValidPassword) {
            return this.createErrorResponse("Invalid password", 401);
        }

        // Delete all records for this collection
        const allRecords = await this._getAll(this.STORE_RECORDS);
        for (const record of allRecords) {
            if (record.collection_id === id) {
                await this._deleteRecord(record.id);
            }
        }

        await this._deleteCollection(id);
        await this._deleteUser(collection.email);

        return this.createSuccessResponse({
            success: true,
            message: 'Collection deleted successfully'
        });
    }

    async createRecord(request) {
        const input = await request.json();
        
        if (!input || !input.id || !input.collection_id || !input.contents || !input.email || !input.password) {
            return this.createErrorResponse("Missing required fields", 400);
        }

        // Verify collection access
        const hasAccess = await this.verifyCollectionAccess(input.collection_id, input.email, input.password);
        if (!hasAccess) {
            return this.createErrorResponse("Access denied", 403);
        }

        const record = {
            id: input.id,
            collection_id: input.collection_id,
            contents: input.contents,
            created_date: new Date().toISOString(),
            modified_date: new Date().toISOString()
        };

        await this._putRecord(record);

        return this.createSuccessResponse({
            success: true,
            id: input.id,
            collection_id: input.collection_id,
            created_at: record.created_date
        }, 201);
    }

    async getRecord(url) {
        const params = url.searchParams;
        const collectionId = params.get('collection_id');
        const email = params.get('email');
        const password = params.get('password');
        const recordId = params.get('id');

        if (!collectionId || !email || !password) {
            return this.createErrorResponse("Missing required parameters", 400);
        }

        const hasAccess = await this.verifyCollectionAccess(collectionId, email, password);
        if (!hasAccess) {
            return this.createErrorResponse("Access denied", 403);
        }

        if (recordId) {
            // Get specific record
            const record = await this._getRecord(recordId);
            if (!record || record.collection_id !== collectionId) {
                return this.createErrorResponse("Record not found", 404);
            }

            return this.createSuccessResponse({
                success: true,
                record: {
                    id: record.id,
                    collection_id: record.collection_id,
                    contents: record.contents,
                    created_at: record.created_date,
                    updated_at: record.modified_date
                }
            });
        } else {
            // Get all records for collection
            const allRecords = await this._getAll(this.STORE_RECORDS);
            const recordsList = allRecords
                .filter(record => record.collection_id === collectionId)
                .map(record => ({
                    id: record.id,
                    collection_id: record.collection_id,
                    contents: record.contents,
                    created_at: record.created_date,
                    updated_at: record.modified_date
                }));

            return this.createSuccessResponse({
                success: true,
                records: recordsList,
                count: recordsList.length
            });
        }
    }

    async updateRecord(request, url) {
        const params = url.searchParams;
        const id = params.get('id');
        const input = await request.json();
        
        if (!id || !input || !input.collection_id || !input.contents || !input.email || !input.password) {
            return this.createErrorResponse("Missing required fields", 400);
        }

        const hasAccess = await this.verifyCollectionAccess(input.collection_id, input.email, input.password);
        if (!hasAccess) {
            return this.createErrorResponse("Access denied", 403);
        }

        const record = await this._getRecord(id);
        if (!record || record.collection_id !== input.collection_id) {
            return this.createErrorResponse("Record not found", 404);
        }

        record.contents = input.contents;
        record.modified_date = new Date().toISOString();
        await this._putRecord(record);

        return this.createSuccessResponse({
            success: true,
            id,
            updated_at: record.modified_date
        });
    }

    async deleteRecord(url) {
        const params = url.searchParams;
        const id = params.get('id');
        const collectionId = params.get('collection_id');
        const email = params.get('email');
        const password = params.get('password');

        if (!id || !collectionId || !email || !password) {
            return this.createErrorResponse("Missing required parameters", 400);
        }

        const hasAccess = await this.verifyCollectionAccess(collectionId, email, password);
        if (!hasAccess) {
            return this.createErrorResponse("Access denied", 403);
        }

        const record = await this._getRecord(id);
        if (!record || record.collection_id !== collectionId) {
            return this.createErrorResponse("Record not found", 404);
        }

        await this._deleteRecord(id);

        return this.createSuccessResponse({
            success: true,
            message: 'Record deleted successfully'
        });
    }

    async verifyCollectionAccess(collectionId, email, password) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this._getUser(normalizedEmail);
        
        if (!user || user.collectionId !== collectionId) {
            return false;
        }

        return await this.verifyPassword(password, user.passwordHash);
    }

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'brain-crack-salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPassword(password, hash) {
        const computedHash = await this.hashPassword(password);
        return computedHash === hash;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    createSuccessResponse(data, status = 200) {
        return new Response(JSON.stringify(data), {
            status,
            headers: this.getCORSHeaders()
        });
    }

    createErrorResponse(message, status = 400) {
        return new Response(JSON.stringify({
            success: false,
            message: message
        }), {
            status,
            headers: this.getCORSHeaders()
        });
    }

    createCORSResponse() {
        return new Response(null, {
            status: 200,
            headers: this.getCORSHeaders()
        });
    }

    getCORSHeaders() {
        return {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        };
    }
}

// Initialize mock server
const mockServer = new SWMockServer();

// Get shared resource lists plus dev-specific resources
const coreResources = CacheConfig.getCoreResources();
const devResources = CacheConfig.getDevResources();
const staticAssets = CacheConfig.getStaticAssets();

// Combine core and dev resources
const allCoreResources = [...coreResources, ...devResources];

console.log(`${LOG_PREFIX} Configuration loaded:`, {
  version: CACHE_VERSION,
  versionedCache: CACHE_NAMES.name,
  staticCache: CACHE_NAMES.staticName,
  coreResources: allCoreResources.length,
  staticAssets: staticAssets.length,
  mockServerEnabled: true
});

// Install event - cache versioned resources and static assets
self.addEventListener('install', event => {
  event.waitUntil(
    ServiceWorkerCore.handleInstall(
      CACHE_NAMES,
      allCoreResources,
      staticAssets,
      LOG_PREFIX,
      true // Skip waiting for immediate updates in dev
    )
  );
});

// Activate event - clean up old caches (but keep static cache)
self.addEventListener('activate', event => {
  event.waitUntil(
    ServiceWorkerCore.handleActivate(CACHE_NAMES, CACHE_PREFIX, LOG_PREFIX)
  );
});

// Fetch event - serve from cache, network, or mock server
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests with mock server
  if (url.pathname.includes('/api/')) {
    event.respondWith(mockServer.handleRequest(event.request));
    return;
  }
  
  // Only handle GET requests for non-API
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Use shared caching logic for non-API requests
  event.respondWith(
    ServiceWorkerCore.handleFetch(event.request, CACHE_NAMES, LOG_PREFIX)
      .catch(error => {
        console.error(`${LOG_PREFIX} Fetch failed:`, error);
        // Fallback to index for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw error;
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
  ServiceWorkerCore.handleMessage(event, CACHE_NAMES.name, CACHE_VERSION, LOG_PREFIX);
});
