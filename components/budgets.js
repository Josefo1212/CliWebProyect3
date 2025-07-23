import { dbWrapper } from "./db.js";

export class BudgetsComponent {
    constructor() {
        this.form = document.getElementById("form-presupuesto");
        this.tabla = document.getElementById("tabla-presupuestos").querySelector("tbody");
        this.editandoId = null;
        this.init();
    }

    async init() {
        if (this.form) {
            this.form.addEventListener("submit", e => this.handleSubmit(e));
            // Rellena selects de categorías
            this.actualizarSelectCategorias();
        }
        this.render();
        window.addEventListener("transacciones-actualizadas", () => this.render());
    }

    async actualizarSelectCategorias() {
        const select = this.form.elements["categoria"];
        const categorias = await dbWrapper.getAll("categorias");
        select.innerHTML = '<option value="">Categoría</option>';
        categorias.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.nombre;
            opt.textContent = cat.nombre;
            select.appendChild(opt);
        });
    }

    async render() {
        const presupuestos = await dbWrapper.getAll("presupuestos");
        const transacciones = await dbWrapper.getAll("transacciones");
        this.tabla.innerHTML = "";
        for (const p of presupuestos) {
            // Monto real: suma de transacciones del tipo, categoría y mes
            let real = 0;
            if (p.tipo === "egreso") {
                real = transacciones.filter(t =>
                    t.tipo === "egreso" &&
                    t.categoria === p.categoria &&
                    t.fecha && t.fecha.startsWith(p.mes)
                ).reduce((acc, t) => acc + Number(t.monto), 0);
            } else if (p.tipo === "ingreso") {
                real = transacciones.filter(t =>
                    t.tipo === "ingreso" &&
                    t.fecha && t.fecha.startsWith(p.mes)
                ).reduce((acc, t) => acc + Number(t.monto), 0);
            }
            const desviacion = (p.tipo === "egreso" ? real - Number(p.monto) : real - Number(p.monto));
            const alerta = p.tipo === "egreso" && real > Number(p.monto);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.tipo === "egreso" ? "Egreso" : "Ingreso"}</td>
                <td>${p.categoria || "-"}</td>
                <td>${p.mes}</td>
                <td>${Number(p.monto).toFixed(2)}</td>
                <td>${real.toFixed(2)}</td>
                <td style="color:${desviacion > 0 && p.tipo === "egreso" ? "#e10600" : "#0f0"}">${desviacion.toFixed(2)}</td>
                <td>
                    <button class="btn-editar" data-id="${p.id}">Editar</button>
                    <button class="btn-eliminar" data-id="${p.id}">Eliminar</button>
                </td>
            `;
            if (alerta) {
                tr.style.background = "#2a0000";
                tr.title = "¡Se ha superado el presupuesto!";
            }
            this.tabla.appendChild(tr);
        }
        // Botones editar/eliminar
        this.tabla.querySelectorAll(".btn-editar").forEach(btn =>
            btn.onclick = () => this.cargarEdicion(btn.dataset.id)
        );
        this.tabla.querySelectorAll(".btn-eliminar").forEach(btn =>
            btn.onclick = () => this.eliminarPresupuesto(btn.dataset.id)
        );
    }

    async handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this.form));
    if (!data.tipo || !data.monto || !data.mes) return;
    
    data.monto = parseFloat(data.monto);
    if (isNaN(data.monto) || data.monto <= 0) return;
    if (!data.categoria) return;
    
    try {
        if (this.editandoId) {
            // Editar presupuesto
            data.id = this.editandoId;
            await dbWrapper.update("presupuestos", data);
            this.editandoId = null;
            this.form.querySelector("button[type=submit]").textContent = "Asignar";
        } else {
            // Validar duplicados
            const presupuestos = await dbWrapper.getAll("presupuestos");
            const existe = presupuestos.find(p => 
                p.tipo === data.tipo && 
                p.categoria === data.categoria && 
                p.mes === data.mes
            );
            if (existe) {
                alert("Ya existe un presupuesto para ese tipo/categoría/mes.");
                return;
            }
            data.id = Date.now().toString() + Math.random().toString(16).slice(2);
            await dbWrapper.add("presupuestos", data);
        }
        
        // Reproducir sonido al completar
        const audio = document.getElementById('transaction-sound');
        audio.currentTime = 0;
        audio.volume = 0.5;
        await audio.play().catch(e => console.log("Error al reproducir sonido:", e));
        
        this.form.reset();
        this.render();
        window.dispatchEvent(new Event("presupuestos-actualizados"));
    } catch (error) {
        console.error("Error al guardar presupuesto:", error);
    }
}

    async cargarEdicion(id) {
        const p = await dbWrapper.get("presupuestos", id);
        if (!p) return;
        this.form.elements["tipo"].value = p.tipo;
        this.form.elements["categoria"].value = p.categoria;
        this.form.elements["monto"].value = p.monto;
        this.form.elements["mes"].value = p.mes;
        this.editandoId = id;
        this.form.querySelector("button[type=submit]").textContent = "Actualizar";
    }

    async eliminarPresupuesto(id) {
        if (!confirm("¿Eliminar este presupuesto?")) return;
        await dbWrapper.delete("presupuestos", id);
        this.render();
        window.dispatchEvent(new Event("presupuestos-actualizados"));
    }
}
