import { CategoriaComponent } from "./components/category.js";
import { DashboardComponent } from "./components/dashboard.js";

const categoriaComponent = new CategoriaComponent();
const dashboardComponent = new DashboardComponent();

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
                dashboardComponent.render();
            }
            if (destino === "categorias") {
                categoriaComponent.render();
            }
        });
    });
    // Mostrar dashboard por defecto
    secciones.forEach(sec => {
        document.getElementById(sec).style.display = (sec === "dashboard") ? "block" : "none";
    });
    dashboardComponent.render();
}
setupNavegacion();