import { inicializarCategorias, setupFormCategoria } from "./components/category.js";
import { setupDashboard, demoGraficosSiNoHayDatos } from "./components/dashboard.js";

// Navegación entre secciones
function setupNavegacion() {
    const secciones = ["dashboard", "transacciones", "categorias", "presupuestos"];
    const navLinks = document.querySelectorAll("nav a");
    navLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const destino = link.getAttribute("href");
            secciones.forEach(sec => {
                document.getElementById(sec).style.display = (sec === destino) ? "block" : "none";
            });
            if (destino === "dashboard") {
                setupDashboard();
                demoGraficosSiNoHayDatos();
            }
        });
    });
    // Mostrar dashboard por defecto
    secciones.forEach(sec => {
        document.getElementById(sec).style.display = (sec === "dashboard") ? "block" : "none";
    });
    setupDashboard();
    demoGraficosSiNoHayDatos();
}

inicializarCategorias();
setupFormCategoria();
setupNavegacion();