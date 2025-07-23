const DB_NAME = "finanzas";
const DB_VERSION = 2; // Incrementa versión

export class DBWrapper {
    constructor() {
        this.db = null;
    }

    async open() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("categorias")) {
                    db.createObjectStore("categorias", { keyPath: "nombre" });
                }
                if (!db.objectStoreNames.contains("transacciones")) {
                    db.createObjectStore("transacciones", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("presupuestos")) {
                    db.createObjectStore("presupuestos", { keyPath: "id" });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            request.onerror = (e) => reject(e);
        });
    }

    async getAll(storeName) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }

    async add(storeName, value) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.add(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }

    async get(storeName, key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }


    async delete(storeName, key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = reject;
        });
    }


    
    async update(storeName, value) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const req = store.put(value);
            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }


}

// Para compatibilidad con el código existente, puedes exportar una instancia:
export const dbWrapper = new DBWrapper();

