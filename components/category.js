import { dbWrapper } from "./db.js";

const CATEGORIAS_PREDEFINIDAS = [
    "Alimentación", "Transporte", "Ocio", "Servicios", "Salud", "Educación", "Otros"
];

export class CategoriaComponent {
    constructor() {
        this.lista = document.getElementById("lista-categorias");
        this.formCategoria = document.getElementById("form-categoria");
        this.editandoNombre = null;
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
            if (this.editandoNombre === cat.nombre) {
                // Formulario de edición en línea
                li.innerHTML = `
                    <form class="form-editar-categoria" style="display:inline;">
                        <input type="text" name="nuevoNombre" value="${cat.nombre}" required style="width:120px;">
                        <button type="submit">Guardar</button>
                        <button type="button" class="btn-cancelar">Cancelar</button>
                    </form>
                `;
                li.querySelector("form").onsubmit = e => {
                    e.preventDefault();
                    const nuevoNombre = li.querySelector('input[name="nuevoNombre"]').value.trim();
                    this.guardarEdicionCategoria(cat.nombre, nuevoNombre);
                };
                li.querySelector(".btn-cancelar").onclick = () => {
                    this.editandoNombre = null;
                    this.render();
                };
            } else {
                li.textContent = cat.nombre;
                const btnEditar = document.createElement("button");
                btnEditar.textContent = "Editar";
                btnEditar.onclick = () => {
                    this.editandoNombre = cat.nombre;
                    this.render();
                };
                const btnEliminar = document.createElement("button");
                btnEliminar.textContent = "Eliminar";
                btnEliminar.onclick = () => this.eliminarCategoria(cat.nombre);
                li.appendChild(btnEditar);
                li.appendChild(btnEliminar);
            }
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

    async guardarEdicionCategoria(nombreViejo, nombreNuevo) {
        if (!nombreNuevo || nombreNuevo === nombreViejo) {
            this.editandoNombre = null;
            this.render();
            return;
        }
        const existe = await dbWrapper.get("categorias", nombreNuevo);
        if (existe) {
            alert("Ya existe una categoría con ese nombre.");
            return;
        }
        // Actualiza la categoría
        await dbWrapper.delete("categorias", nombreViejo);
        await dbWrapper.add("categorias", { nombre: nombreNuevo });
        // Actualiza transacciones asociadas
        const db = await dbWrapper.open();
        const tx = db.transaction("transacciones", "readwrite");
        const store = tx.objectStore("transacciones");
        store.openCursor().onsuccess = function (e) {
            const cursor = e.target.result;
            if (cursor) {
                if (cursor.value.categoria === nombreViejo) {
                    const updated = { ...cursor.value, categoria: nombreNuevo };
                    cursor.update(updated);
                }
                cursor.continue();
            }
        };
        tx.oncomplete = () => {
            this.editandoNombre = null;
            this.render();
            window.dispatchEvent(new Event("transacciones-actualizadas"));
        };
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
        tx.oncomplete = () => {
            this.render();
            window.dispatchEvent(new Event("transacciones-actualizadas"));
        };
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

