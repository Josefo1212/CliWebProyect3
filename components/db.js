const DB_NAME = "finanzas";
const DB_VERSION = 1;
let db = null;

export function abrirDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("categorias")) {
                db.createObjectStore("categorias", { keyPath: "nombre" });
            }
            if (!db.objectStoreNames.contains("transacciones")) {
                db.createObjectStore("transacciones", { keyPath: "id" });
            }
            // Puedes agregar presupuestos aquí si lo necesitas después
        };
        request.onsuccess = function (e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function (e) {
            reject(e);
        };
    });
}
