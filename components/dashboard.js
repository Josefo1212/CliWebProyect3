import { dbWrapper } from "./db.js";

export class DashboardComponent {
    constructor() {
        this.dashboard = document.getElementById("dashboard");
        this.presupuestoResumenDiv = null;
        this.demoMessageDiv = null; // <-- NUEVO
        this.render();
        // Escucha eventos personalizados para actualización en tiempo real
        window.addEventListener("transacciones-actualizadas", () => this.render());
        window.addEventListener("presupuestos-actualizados", () => this.render());
    }

    getMesActual() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    async render(mesSeleccionado = null) {
        this.setupDashboardMesFiltro();
        const mes = mesSeleccionado || (document.getElementById("dashboard-mes-filtro")?.value || this.getMesActual());
        await this.renderDashboardResumen(mes);
        await this.renderTransaccionesRecientes(mes);
        await this.renderDashboardPresupuestoActual(mes);
        this.renderDashboardCharts(mes);
    }

    async renderDashboardResumen(mesSeleccionado = null) {
        const transacciones = await dbWrapper.getAll("transacciones");
        const mes = mesSeleccionado || this.getMesActual();
        let ingresos = 0, gastos = 0;
        transacciones.forEach(t => {
            if (t.fecha && t.fecha.startsWith(mes)) {
                if (t.tipo === "ingreso") ingresos += Number(t.monto);
                if (t.tipo === "egreso") gastos += Number(t.monto);
            }
        });
        document.getElementById("dashboard-ingresos").textContent = ingresos.toFixed(2);
        document.getElementById("dashboard-gastos").textContent = gastos.toFixed(2);
        document.getElementById("dashboard-balance").textContent = (ingresos - gastos).toFixed(2);
    }

    async renderTransaccionesRecientes(mesSeleccionado = null) {
        const transacciones = await dbWrapper.getAll("transacciones");
        const mes = mesSeleccionado || this.getMesActual();
        // Filtra por mes y ordena por fecha descendente y por id descendente si existe
        const recientes = transacciones
            .filter(t => t.fecha && t.fecha.startsWith(mes))
            .sort((a, b) => {
                // Primero por fecha descendente
                const cmp = b.fecha.localeCompare(a.fecha);
                if (cmp !== 0) return cmp;
                // Si hay id, por id descendente (más reciente primero)
                if (b.id !== undefined && a.id !== undefined) return b.id - a.id;
                return 0;
            })
            .slice(0, 5);

        const ul = document.getElementById("transacciones-recientes-lista");
        if (!ul) return;

        ul.innerHTML = "";
        recientes.forEach(t => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="fecha">${t.fecha.split('-').reverse().join('/')}</span>
                <span class="categoria">${t.categoria}</span>
                <span class="monto">${t.tipo === "ingreso" ? '+' : '-'}$${t.monto}</span>
                ${t.descripcion ? `<span class="descripcion">${t.descripcion}</span>` : ''}
            `;
            ul.appendChild(li);
        });
    }

    async renderDashboardPresupuestoActual(mesSeleccionado = null) {
        // Muestra el estado del presupuesto actual por categoría
        // Si no existe el store "presupuestos", no muestra nada
        const db = await dbWrapper.open();
        if (!db.objectStoreNames.contains("presupuestos")) return;

        const mes = mesSeleccionado || this.getMesActual();
        // Obtener presupuestos del mes
        const presupuestos = await new Promise((resolve, reject) => {
            const tx = db.transaction("presupuestos", "readonly");
            const store = tx.objectStore("presupuestos");
            const req = store.getAll();
            req.onsuccess = () => {
                // Solo presupuestos del mes seleccionado
                resolve(req.result.filter(p => p.mes === mes));
            };
            req.onerror = reject;
        });
        if (!this.presupuestoResumenDiv) {
            this.presupuestoResumenDiv = document.createElement("div");
            this.presupuestoResumenDiv.id = "dashboard-presupuesto-estado";
            this.presupuestoResumenDiv.style.marginBottom = "1rem";
            this.dashboard.insertBefore(this.presupuestoResumenDiv, document.getElementById("dashboard-summary").nextSibling);
        }
        if (presupuestos.length === 0) {
            this.presupuestoResumenDiv.innerHTML = "<p>No hay presupuestos asignados para este mes.</p>";
            return;
        }
        // Obtener transacciones del mes
        const transacciones = await dbWrapper.getAll("transacciones");
        let html = `<table style="width:100%;background:#18191c;color:#fff;border-radius:8px;margin-bottom:0.5rem;">
            <thead>
                <tr>
                    <th>Categoría</th>
                    <th>Presupuesto</th>
                    <th>Real</th>
                    <th>Desviación</th>
                </tr>
            </thead>
            <tbody>`;
        presupuestos.forEach(p => {
            const real = transacciones
                .filter(t => t.categoria === p.categoria && t.fecha && t.fecha.startsWith(mes) && t.tipo === "egreso")
                .reduce((acc, t) => acc + Number(t.monto), 0);
            const desviacion = real - Number(p.monto);
            html += `<tr>
                <td>${p.categoria}</td>
                <td>${Number(p.monto).toFixed(2)}</td>
                <td>${real.toFixed(2)}</td>
                <td style="color:${desviacion > 0 ? '#e10600' : '#0f0'}">${desviacion.toFixed(2)}</td>
            </tr>`;
        });
        html += "</tbody></table>";
        this.presupuestoResumenDiv.innerHTML = html;
    }

    setupDashboardMesFiltro() {
        let filtro = document.getElementById("dashboard-mes-filtro");
        if (!filtro) {
            filtro = document.createElement("input");
            filtro.type = "month";
            filtro.id = "dashboard-mes-filtro";
            filtro.value = this.getMesActual();
            filtro.style.marginBottom = "1rem";
            if (this.dashboard) this.dashboard.insertBefore(filtro, this.dashboard.firstChild);
        }
        filtro.onchange = () => {
            this.render(filtro.value);
        };
    }

    renderDashboardCharts(mesSeleccionado = null) {
        this.mostrarGraficosSegunDatos(mesSeleccionado);
    }

    async mostrarGraficosSegunDatos(mesSeleccionado = null) {
        const db = await dbWrapper.open();
        const tx = db.transaction("transacciones", "readonly");
        const store = tx.objectStore("transacciones");
        store.count().onsuccess = async (e) => {
            const chartsDiv = document.getElementById("dashboard-charts");
            // --- NUEVO: demo message handling ---
            if (!this.demoMessageDiv) {
                this.demoMessageDiv = document.createElement("div");
                this.demoMessageDiv.id = "dashboard-demo-message";
                this.demoMessageDiv.style.cssText = `
                    background: #23242a;
                    color: #ff8800;
                    border: 2px dashed #e10600;
                    border-radius: 8px;
                    padding: 0.7rem 1rem;
                    margin-bottom: 1rem;
                    text-align: center;
                    font-family: 'Oswald', 'Montserrat', Arial, sans-serif;
                    font-size: 1.08rem;
                    letter-spacing: 0.04em;
                    display: none;
                `;
                if (chartsDiv && chartsDiv.parentNode) {
                    chartsDiv.parentNode.insertBefore(this.demoMessageDiv, chartsDiv);
                }
            }
            // Limpia todos los gráficos existentes
            ["chart-gastos-categoria", "chart-balance-mensual", "chart-ingresos", "chart-evolucion-balance", "chart-distribucion"].forEach(id => {
                const canvas = document.getElementById(id);
                if (canvas && canvas.chartInstance) {
                    canvas.chartInstance.destroy();
                    canvas.chartInstance = null;
                }
                if (canvas) {
                    const ctx = canvas.getContext("2d");
                    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });

            if (chartsDiv) chartsDiv.style.display = "flex";

            if (e.target.result === 0) {
                // --- Mostrar mensaje de demo ---
                if (this.demoMessageDiv) {
                    this.demoMessageDiv.textContent = "Mostrando gráficos de demostración. Agrega transacciones para ver tus propios datos.";
                    this.demoMessageDiv.style.display = "block";
                }
                // Mostrar gráficos de ejemplo
                const c1 = document.getElementById("chart-gastos-categoria");
                if (window.Chart && c1) {
                    if (c1.chartInstance) {
                        c1.chartInstance.destroy();
                        c1.chartInstance = null;
                    }
                    c1.chartInstance = new Chart(c1, {
                        type: 'doughnut',
                        data: {
                            labels: ['Neumáticos', 'Transporte', 'Mecánicos'],
                            datasets: [{
                                data: [500, 300, 400],
                                backgroundColor: ['#d30000', '#ff8800', '#ffffff']
                            }]
                        }
                    });
                }
                const c2 = document.getElementById("chart-balance-mensual");
                if (window.Chart && c2) {
                    if (c2.chartInstance) {
                        c2.chartInstance.destroy();
                        c2.chartInstance = null;
                    }
                    c2.chartInstance = new Chart(c2, {
                        type: 'line',
                        data: {
                            labels: ['Mayo', 'Junio', 'Julio'],
                            datasets: [{
                                label: 'Estimado',
                                data: [1800, 2000, 2200],
                                borderColor: '#ffffff',
                                fill: false
                            }, {
                                label: 'Real',
                                data: [1600, 1900, 1800],
                                borderColor: '#d30000',
                                fill: false
                            }]
                        }
                    });
                }
                const c3 = document.getElementById("chart-ingresos");
                if (window.Chart && c3) {
                    if (c3.chartInstance) {
                        c3.chartInstance.destroy();
                        c3.chartInstance = null;
                    }
                    c3.chartInstance = new Chart(c3, {
                        type: 'bar',
                        data: {
                            labels: ['Julio'],
                            datasets: [
                                {
                                    label: 'Estimado',
                                    data: [5000],
                                    backgroundColor: '#ffffff'
                                },
                                {
                                    label: 'Real',
                                    data: [4800],
                                    backgroundColor: '#d30000'
                                }
                            ]
                        }
                    });
                }
                const c4 = document.getElementById("chart-evolucion-balance");
                if (window.Chart && c4) {
                    if (c4.chartInstance) {
                        c4.chartInstance.destroy();
                        c4.chartInstance = null;
                    }
                    c4.chartInstance = new Chart(c4, {
                        type: 'line',
                        data: {
                            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
                            datasets: [{
                                label: 'Balance Mensual',
                                data: [1200, 1300, 1500, 1600, 1800, 1900, 1800],
                                borderColor: '#ff8800',
                                fill: false
                            }]
                        }
                    });
                }
                const c5 = document.getElementById("chart-distribucion");
                if (window.Chart && c5) {
                    if (c5.chartInstance) {
                        c5.chartInstance.destroy();
                        c5.chartInstance = null;
                    }
                    c5.chartInstance = new Chart(c5, {
                        type: 'bar',
                        data: {
                            labels: ['Ingresos', 'Gastos'],
                            datasets: [{
                                label: 'Julio',
                                data: [5000, 3200],
                                backgroundColor: ['#ffffff', '#d30000']
                            }]
                        }
                    });
                }
            } else {
                // --- Ocultar mensaje de demo ---
                if (this.demoMessageDiv) {
                    this.demoMessageDiv.style.display = "none";
                }
                // Mostrar gráficos reales con datos reales
                const transacciones = await dbWrapper.getAll("transacciones");
                const presupuestos = db.objectStoreNames.contains("presupuestos")
                    ? await dbWrapper.getAll("presupuestos")
                    : [];

                // --- Gastos por categoría (doughnut) ---
                const mes = mesSeleccionado || this.getMesActual();
                const gastosMes = transacciones.filter(t => t.tipo === "egreso" && t.fecha && t.fecha.startsWith(mes));
                const gastosPorCategoria = {};
                gastosMes.forEach(t => {
                    gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + Number(t.monto);
                });
                const catLabels = Object.keys(gastosPorCategoria);
                const catData = Object.values(gastosPorCategoria);
                const catColors = catLabels.map((_, i) => ["#e10600", "#ff8800", "#fff", "#00bfff", "#00ff88", "#ff00cc", "#ffcc00"][i % 7]);
                const c1 = document.getElementById("chart-gastos-categoria");
                if (window.Chart && c1) {
                    if (c1.chartInstance) {
                        c1.chartInstance.destroy();
                        c1.chartInstance = null;
                    }
                    c1.chartInstance = new Chart(c1, {
                        type: 'doughnut',
                        data: {
                            labels: catLabels,
                            datasets: [{
                                data: catData,
                                backgroundColor: catColors
                            }]
                        },
                        options: {
                            plugins: { legend: { display: true } },
                            responsive: true
                        }
                    });
                }

                // --- Balance mensual (line) ---
                // Estimado: suma de presupuestos de egreso por mes
                // Real: suma de egresos por mes
                const meses = [];
                const realPorMes = {};
                const estimadoPorMes = {};
                transacciones.forEach(t => {
                    if (!t.fecha) return;
                    const mes = t.fecha.slice(0, 7);
                    if (!meses.includes(mes)) meses.push(mes);
                    if (t.tipo === "egreso") {
                        realPorMes[mes] = (realPorMes[mes] || 0) + Number(t.monto);
                    }
                });
                presupuestos.forEach(p => {
                    if (!meses.includes(p.mes)) meses.push(p.mes);
                    if (p.categoria && p.monto && p.mes) {
                        estimadoPorMes[p.mes] = (estimadoPorMes[p.mes] || 0) + Number(p.monto);
                    }
                });
                meses.sort();
                const c2 = document.getElementById("chart-balance-mensual");
                if (window.Chart && c2) {
                    if (c2.chartInstance) {
                        c2.chartInstance.destroy();
                        c2.chartInstance = null;
                    }
                    c2.chartInstance = new Chart(c2, {
                        type: 'line',
                        data: {
                            labels: meses,
                            datasets: [
                                {
                                    label: 'Estimado',
                                    data: meses.map(m => estimadoPorMes[m] || 0),
                                    borderColor: '#ffffff',
                                    fill: false
                            },
                            {
                                label: 'Real',
                                data: meses.map(m => realPorMes[m] || 0),
                                borderColor: '#e10600',
                                fill: false
                            }
                        ]
                    },
                    options: {
                        plugins: { legend: { display: true } },
                        responsive: true,
                        scales: { x: { display: true }, y: { display: true } }
                    }
                });
            }

                // --- Ingresos estimados vs reales (bar) ---
                // Estimado: presupuestos de ingresos por mes (si existen)
                // Real: suma de ingresos por mes
                const ingresosPorMes = {};
                const ingresosEstimadosPorMes = {};
                transacciones.forEach(t => {
                    if (!t.fecha) return;
                    const mes = t.fecha.slice(0, 7);
                    if (t.tipo === "ingreso") {
                        ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + Number(t.monto);
                    }
                });
                presupuestos.forEach(p => {
                    if (p.tipo === "ingreso" && p.mes) {
                        ingresosEstimadosPorMes[p.mes] = (ingresosEstimadosPorMes[p.mes] || 0) + Number(p.monto);
                    }
                });
                // Si no hay presupuestos de ingresos, solo muestra reales
                const mesesIngresos = Array.from(new Set([...Object.keys(ingresosPorMes), ...Object.keys(ingresosEstimadosPorMes)])).sort();
                const c3 = document.getElementById("chart-ingresos");
                if (window.Chart && c3) {
                    if (c3.chartInstance) {
                        c3.chartInstance.destroy();
                        c3.chartInstance = null;
                    }
                    c3.chartInstance = new Chart(c3, {
                        type: 'bar',
                        data: {
                            labels: mesesIngresos,
                            datasets: [
                                {
                                    label: 'Estimado',
                                    data: mesesIngresos.map(m => ingresosEstimadosPorMes[m] || 0),
                                    backgroundColor: '#ffffff'
                                },
                                {
                                    label: 'Real',
                                    data: mesesIngresos.map(m => ingresosPorMes[m] || 0),
                                    backgroundColor: '#e10600'
                                }
                            ]
                        },
                        options: {
                            plugins: { legend: { display: true } },
                            responsive: true,
                            scales: { x: { display: true }, y: { display: true } }
                        }
                    });
                }

                // Balance = ingresos - egresos por mes
                const balancePorMes = {};
                meses.forEach(m => {
                    const ingresos = ingresosPorMes[m] || 0;
                    const egresos = realPorMes[m] || 0;
                    balancePorMes[m] = ingresos - egresos;
                });
                const c4 = document.getElementById("chart-evolucion-balance");
                if (window.Chart && c4) {
                    if (c4.chartInstance) {
                        c4.chartInstance.destroy();
                        c4.chartInstance = null;
                    }
                    c4.chartInstance = new Chart(c4, {
                        type: 'line',
                        data: {
                            labels: meses,
                            datasets: [{
                                label: 'Balance Mensual',
                                data: meses.map(m => balancePorMes[m] || 0),
                                borderColor: '#ff8800',
                                fill: false
                            }]
                        },
                        options: {
                            plugins: { legend: { display: true } },
                            responsive: true,
                            scales: { x: { display: true }, y: { display: true } }
                        }
                    });
                }

                // --- Distribución ingresos/gastos (bar) ---
                // Para el mes seleccionado
                const ingresosMes = transacciones.filter(t => t.tipo === "ingreso" && t.fecha && t.fecha.startsWith(mes)).reduce((acc, t) => acc + Number(t.monto), 0);
                const egresosMes = gastosMes.reduce((acc, t) => acc + Number(t.monto), 0);
                const c5 = document.getElementById("chart-distribucion");
                if (window.Chart && c5) {
                    if (c5.chartInstance) {
                        c5.chartInstance.destroy();
                        c5.chartInstance = null;
                    }
                    c5.chartInstance = new Chart(c5, {
                        type: 'bar',
                        data: {
                            labels: ['Ingresos', 'Gastos'],
                            datasets: [{
                                label: mes,
                                data: [ingresosMes, egresosMes],
                                backgroundColor: ['#ffffff', '#e10600']
                            }]
                        },
                        options: {
                            plugins: { legend: { display: true } },
                            responsive: true,
                            scales: { x: { display: true }, y: { display: true } }
                        }
                    });
                }
            }
        };
    }

    async demoGraficosSiNoHayDatos() {
        const db = await dbWrapper.open();
        const tx = db.transaction("transacciones", "readonly");
        const store = tx.objectStore("transacciones");
        store.count().onsuccess = function (e) {
            if (e.target.result === 0) {
                // Mostrar el contenedor de gráficos
                const chartsDiv = document.getElementById("dashboard-charts");
                if (chartsDiv) chartsDiv.style.display = "block";
                // Si no hay datos, muestra gráficos de ejemplo
                window.Chart && new Chart(document.getElementById("chart-gastos-categoria"), {
                    type: 'doughnut',
                    data: {
                        labels: ['Neumáticos', 'Transporte', 'Mecánicos'],
                        datasets: [{
                            data: [500, 300, 400],
                            backgroundColor: ['#d30000', '#ff8800', '#ffffff']
                        }]
                    }
                });
                window.Chart && new Chart(document.getElementById("chart-balance-mensual"), {
                    type: 'line',
                    data: {
                        labels: ['Mayo', 'Junio', 'Julio'],
                        datasets: [{
                            label: 'Estimado',
                            data: [1800, 2000, 2200],
                            borderColor: '#ffffff',
                            fill: false
                        }, {
                            label: 'Real',
                            data: [1600, 1900, 1800],
                            borderColor: '#d30000',
                            fill: false
                        }]
                    }
                });
                window.Chart && new Chart(document.getElementById("chart-ingresos"), {
                    type: 'bar',
                    data: {
                        labels: ['Julio'],
                        datasets: [
                            {
                                label: 'Estimado',
                                data: [5000],
                                backgroundColor: '#ffffff'
                            },
                            {
                                label: 'Real',
                                data: [4800],
                                backgroundColor: '#d30000'
                            }
                        ]
                    }
                });
                window.Chart && new Chart(document.getElementById("chart-evolucion-balance"), {
                    type: 'line',
                    data: {
                        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
                        datasets: [{
                            label: 'Balance Mensual',
                            data: [1200, 1300, 1500, 1600, 1800, 1900, 1800],
                            borderColor: '#ff8800',
                            fill: false
                        }]
                    }
                });
                window.Chart && new Chart(document.getElementById("chart-distribucion"), {
                    type: 'bar',
                    data: {
                        labels: ['Ingresos', 'Gastos'],
                        datasets: [{
                            label: 'Julio',
                            data: [5000, 3200],
                            backgroundColor: ['#ffffff', '#d30000']
                        }]
                    }
                });
            }
        };
    }
}


