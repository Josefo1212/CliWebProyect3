import { dbWrapper } from "./db.js";

export class DashboardComponent {
    constructor() {
        this.dashboard = document.getElementById("dashboard");
        this.render();
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
        const recientes = transacciones
            .filter(t => t.fecha && t.fecha.startsWith(mes))
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .slice(0, 5);
        const ul = document.getElementById("transacciones-recientes-lista");
        if (!ul) return;
        ul.innerHTML = "";
        recientes.forEach(t => {
            const li = document.createElement("li");
            li.textContent = `${t.fecha} - ${t.tipo === "ingreso" ? "+" : "-"}${t.monto} (${t.categoria})${t.descripcion ? ": " + t.descripcion : ""}`;
            ul.appendChild(li);
        });
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
        // Intenta mostrar datos reales, si no hay, muestra demo
        this.demoGraficosSiNoHayDatos();
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


