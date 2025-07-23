import { dbWrapper } from "./db.js";

export class TransactionsComponent {
    constructor() {
        this.form = document.getElementById("form-transaccion");
        this.tabla = document.getElementById("tabla-transacciones").querySelector("tbody");
        this.filtroDescripcion = document.getElementById("filtro-descripcion");
        this.filtroTipo = document.getElementById("filtro-tipo");
        // NUEVO: Filtro por categoría
        this.filtroCategoria = null;
        this.editandoId = null;
        this.init();
    }

    async init() {
        this.form.addEventListener("submit", e => this.handleSubmit(e));
        this.filtroDescripcion.addEventListener("input", () => this.render());
        this.filtroTipo.addEventListener("change", () => this.render());
        // Agrega filtro por categoría
        this.agregarFiltroCategoria();
        this.render();
    }

    async agregarFiltroCategoria() {
        // Crea select de filtro por categoría
        const formDiv = this.form.parentElement.querySelector("div");
        if (!formDiv) return;
        let filtroCat = document.getElementById("filtro-categoria");
        if (!filtroCat) {
            filtroCat = document.createElement("select");
            filtroCat.id = "filtro-categoria";
            filtroCat.innerHTML = '<option value="">Todas las categorías</option>';
            filtroCat.style.marginRight = "0.5rem";
            formDiv.insertBefore(filtroCat, formDiv.firstChild);
        }
        this.filtroCategoria = filtroCat;
        // Rellena opciones
        const categorias = await dbWrapper.getAll("categorias");
        categorias.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.nombre;
            opt.textContent = cat.nombre;
            filtroCat.appendChild(opt);
        });
        filtroCat.onchange = () => this.render();
    }

    async render() {
        let transacciones = await dbWrapper.getAll("transacciones");
        // Filtros
        const filtroDesc = this.filtroDescripcion.value.trim().toLowerCase();
        const filtroTipo = this.filtroTipo.value;
        const filtroCategoria = this.filtroCategoria ? this.filtroCategoria.value : "";
        if (filtroDesc) {
            transacciones = transacciones.filter(t =>
                (t.descripcion && t.descripcion.toLowerCase().includes(filtroDesc)) ||
                (t.categoria && t.categoria.toLowerCase().includes(filtroDesc))
            );
        }
        if (filtroTipo) {
            transacciones = transacciones.filter(t => t.tipo === filtroTipo);
        }
        if (filtroCategoria) {
            transacciones = transacciones.filter(t => t.categoria === filtroCategoria);
        }
        // Ordenar por fecha descendente
        transacciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
        // Render tabla
        this.tabla.innerHTML = "";
        for (const t of transacciones) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.tipo === "ingreso" ? "Ingreso" : "Egreso"}</td>
                <td>${Number(t.monto).toFixed(2)}</td>
                <td>${t.fecha}</td>
                <td>${t.categoria}</td>
                <td>${t.descripcion || ""}</td>
                <td>
                    <button class="btn-editar" data-id="${t.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${t.id}">Eliminar</button>
                </td>
            `;
            this.tabla.appendChild(tr);
        }
        // Botones editar/eliminar
        this.tabla.querySelectorAll(".btn-editar").forEach(btn =>
            btn.onclick = () => this.cargarEdicion(btn.dataset.id)
        );
        this.tabla.querySelectorAll(".btn-eliminar").forEach(btn =>
            btn.onclick = () => this.eliminarTransaccion(btn.dataset.id)
        );
    }

    async handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this.form));
    if (!data.tipo || !data.monto || !data.fecha || !data.categoria) return;
    
    data.monto = Number(data.monto);
    
    try {
        if (this.editandoId) {
            // Editar transacción
            data.id = this.editandoId;
            await dbWrapper.delete("transacciones", data.id);
            await dbWrapper.add("transacciones", data);
            this.editandoId = null;
            this.form.querySelector("button[type=submit]").textContent = "Registrar";
        } else {
            // Nueva transacción
            data.id = Date.now().toString() + Math.random().toString(16).slice(2);
            await dbWrapper.add("transacciones", data);
        }
        
        // Reproducir sonido al completar
        const audio = document.getElementById('transaction-sound');
        audio.currentTime = 0; // Reiniciar si ya estaba sonando
        audio.volume = 0.5; // Volumen al 50%
        await audio.play().catch(e => console.log("Error al reproducir sonido:", e));
        
        this.form.reset();
        this.render();
        window.dispatchEvent(new Event("transacciones-actualizadas"));
    } catch (error) {
        console.error("Error al guardar transacción:", error);
    }
}

    async cargarEdicion(id) {
        const t = await dbWrapper.get("transacciones", id);
        if (!t) return;
        this.form.elements["tipo"].value = t.tipo;
        this.form.elements["monto"].value = t.monto;
        this.form.elements["fecha"].value = t.fecha;
        this.form.elements["categoria"].value = t.categoria;
        this.form.elements["descripcion"].value = t.descripcion || "";
        this.editandoId = id;
        this.form.querySelector("button[type=submit]").textContent = "Actualizar";
    }

    async eliminarTransaccion(id) {
        if (!confirm("¿Eliminar esta transacción?")) return;
        await dbWrapper.delete("transacciones", id);
        this.render();
        window.dispatchEvent(new Event("transacciones-actualizadas"));
    }
}
