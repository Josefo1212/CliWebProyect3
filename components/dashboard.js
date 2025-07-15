import { abrirDB } from "./db.js";

// Utilidad para obtener el mes actual en formato YYYY-MM
function getMesActual() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Renderiza el resumen del mes actual
export async function renderDashboardResumen(mesSeleccionado = null) {
    const db = await abrirDB();
    const tx = db.transaction("transacciones", "readonly");
    const store = tx.objectStore("transacciones");
    const req = store.getAll();
    req.onsuccess = function () {
        const transacciones = req.result;
        const mes = mesSeleccionado || getMesActual();
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
    };
}

// Renderiza las transacciones recientes (últimas 5 del mes)
export async function renderTransaccionesRecientes(mesSeleccionado = null) {
    const db = await abrirDB();
    const tx = db.transaction("transacciones", "readonly");
    const store = tx.objectStore("transacciones");
    const req = store.getAll();
    req.onsuccess = function () {
        const transacciones = req.result;
        const mes = mesSeleccionado || getMesActual();
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
    };
}

// Filtro de mes para el dashboard
export function setupDashboardMesFiltro() {
    let filtro = document.getElementById("dashboard-mes-filtro");
    if (!filtro) {
        filtro = document.createElement("input");
        filtro.type = "month";
        filtro.id = "dashboard-mes-filtro";
        filtro.value = getMesActual();
        filtro.style.marginBottom = "1rem";
        const dashboard = document.getElementById("dashboard");
        dashboard.insertBefore(filtro, dashboard.firstChild);
    }
    filtro.addEventListener("change", () => {
        actualizarDashboard(filtro.value);
    });
}

// Actualiza todo el dashboard
export function actualizarDashboard(mesSeleccionado = null) {
    renderDashboardResumen(mesSeleccionado);
    renderTransaccionesRecientes(mesSeleccionado);
    renderDashboardCharts(mesSeleccionado);
}

// Inicializa el dashboard (llamar al mostrar la sección)
export function setupDashboard() {
    setupDashboardMesFiltro();
    actualizarDashboard(document.getElementById("dashboard-mes-filtro").value);
}

// Renderiza los gráficos del dashboard (usa demo si no hay datos)
export function renderDashboardCharts(mesSeleccionado = null) {
    // Intenta mostrar datos reales, si no hay, muestra demo
    demoGraficosSiNoHayDatos();
}

// SOLO PARA DEMO: muestra datos de ejemplo si no hay transacciones
export async function demoGraficosSiNoHayDatos() {
    const db = await abrirDB();
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

// Llama a esta función después de setupDashboard() SOLO PARA DEMO
