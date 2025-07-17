import { dbWrapper } from "./db.js";

const CATEGORIAS_PREDEFINIDAS = [
    "Alimentación", "Transporte", "Ocio", "Servicios", "Salud", "Educación", "Otros"
];

export class CategoriaComponent {
    constructor() {
        this.lista = document.getElementById("lista-categorias");
        this.formCategoria = document.getElementById("form-categoria");
        this.init();
    }

    async init() {
        let categorias = await dbWrapper.getAll("categorias");
        if (categorias.length === 0) {
            for (const nombre of CATEGORIAS_PREDEFINIDAS) {
                await dbWrapper.add("categorias", { nombre });
            }
            categorias = await dbWrapper.getAll("categorias");
        }
        this.render(categorias);
        this.setupFormCategoria();
    }

    async render(categorias = null) {
        if (!this.lista) return;
        if (!categorias) categorias = await dbWrapper.getAll("categorias");
        this.lista.innerHTML = "";
        categorias.forEach(cat => {
            const li = document.createElement("li");
            li.textContent = cat.nombre;
            const btnEliminar = document.createElement("button");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.onclick = () => this.eliminarCategoria(cat.nombre);
            li.appendChild(btnEliminar);
            this.lista.appendChild(li);
        });
        this.actualizarSelectsCategorias(categorias);
    }

    actualizarSelectsCategorias(categorias) {
        const selects = document.querySelectorAll('form select[name="categoria"]');
        selects.forEach(select => {
            const valorActual = select.value;
            select.innerHTML = '<option value="">Categoría</option>';
            categorias.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat.nombre;
                opt.textContent = cat.nombre;
                select.appendChild(opt);
            });
            select.value = valorActual;
        });
    }

    async agregarCategoria(nombre) {
        nombre = nombre.trim();
        if (!nombre) return;
        const existente = await dbWrapper.get("categorias", nombre);
        if (existente) {
            alert("La categoría ya existe.");
        } else {
            await dbWrapper.add("categorias", { nombre });
            this.render();
        }
    }

    async eliminarCategoria(nombre) {
        if (!confirm(`¿Eliminar la categoría "${nombre}" y todas sus transacciones asociadas?`)) return;
        await dbWrapper.delete("categorias", nombre);
        // Elimina transacciones asociadas
        const db = await dbWrapper.open();
        const tx = db.transaction("transacciones", "readwrite");
        const store = tx.objectStore("transacciones");
        store.openCursor().onsuccess = function (e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.categoria === nombre) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
        tx.oncomplete = () => this.render();
    }

    setupFormCategoria() {
        if (this.formCategoria) {
            this.formCategoria.addEventListener("submit", e => {
                e.preventDefault();
                const input = this.formCategoria.elements["nombre"];
                this.agregarCategoria(input.value);
                input.value = "";
            });
        }
    }
}

