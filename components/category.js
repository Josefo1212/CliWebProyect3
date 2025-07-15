import { abrirDB } from "./db.js";

const CATEGORIAS_PREDEFINIDAS = [
    "Alimentación", "Transporte", "Ocio", "Servicios", "Salud", "Educación", "Otros"
];

export async function inicializarCategorias() {
    const db = await abrirDB();
    const tx = db.transaction("categorias", "readonly");
    const store = tx.objectStore("categorias");
    const req = store.getAll();
    req.onsuccess = function () {
        if (req.result.length === 0) {
            const txAdd = db.transaction("categorias", "readwrite");
            const storeAdd = txAdd.objectStore("categorias");
            CATEGORIAS_PREDEFINIDAS.forEach(nombre => {
                storeAdd.add({ nombre });
            });
            txAdd.oncomplete = renderCategorias;
        } else {
            renderCategorias();
        }
    };
}

export async function renderCategorias() {
    const db = await abrirDB();
    const tx = db.transaction("categorias", "readonly");
    const store = tx.objectStore("categorias");
    const req = store.getAll();
    req.onsuccess = function () {
        const lista = document.getElementById("lista-categorias");
        if (!lista) return;
        lista.innerHTML = "";
        req.result.forEach(cat => {
            const li = document.createElement("li");
            li.textContent = cat.nombre;
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.onclick = () => eliminarCategoria(cat.nombre);
            li.appendChild(btnEliminar);
            lista.appendChild(li);
        });
        actualizarSelectsCategorias(req.result.map(c => c.nombre));
    };
}

function actualizarSelectsCategorias(categorias) {
    const selects = [
        ...document.querySelectorAll('form select[name="categoria"]')
    ];
    selects.forEach(select => {
        const valorActual = select.value;
        select.innerHTML = '<option value="">Categoría</option>';
        categorias.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
        select.value = valorActual;
    });
}

export async function agregarCategoria(nombre) {
    nombre = nombre.trim();
    if (!nombre) return;
    const db = await abrirDB();
    const tx = db.transaction("categorias", "readwrite");
    const store = tx.objectStore("categorias");
    const getReq = store.get(nombre);
    getReq.onsuccess = function () {
        if (getReq.result) {
            alert("La categoría ya existe.");
        } else {
            store.add({ nombre });
            tx.oncomplete = renderCategorias;
        }
    };
}

export async function eliminarCategoria(nombre) {
    if (!confirm(`¿Eliminar la categoría "${nombre}" y todas sus transacciones asociadas?`)) return;
    const db = await abrirDB();
    // Elimina la categoría
    const txCat = db.transaction("categorias", "readwrite");
    txCat.objectStore("categorias").delete(nombre);
    // Elimina transacciones asociadas
    const txTrans = db.transaction("transacciones", "readwrite");
    const storeTrans = txTrans.objectStore("transacciones");
    storeTrans.openCursor().onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor) {
            if (cursor.value.categoria === nombre) {
                cursor.delete();
            }
            cursor.continue();
        }
    };
    txCat.oncomplete = renderCategorias;
    // Si tienes render de transacciones, llama aquí también
    // txTrans.oncomplete = renderTransacciones;
}

// Maneja el formulario de agregar categoría
export function setupFormCategoria() {
    const formCategoria = document.getElementById("form-categoria");
    if (formCategoria) {
        formCategoria.addEventListener("submit", e => {
            e.preventDefault();
            const input = formCategoria.elements["nombre"];
            agregarCategoria(input.value);
            input.value = "";
        });
    }
}
