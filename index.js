import { CategoriaComponent } from "./components/category.js";
import { DashboardComponent } from "./components/dashboard.js";

const categoriaComponent = new CategoriaComponent();
const dashboardComponent = new DashboardComponent();

function setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.querySelector('main');
    const nav = document.querySelector('nav');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-submit');
    const loader = document.getElementById('loader');
    
    loginScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    nav.style.display = 'none';
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        // Validación simple (en producción usar autenticación segura)
        if(username && password) {
            localStorage.setItem('f1-finanzas-loggedin', 'true');
            loginScreen.style.display = 'none';
            loader.style.display = 'flex';
            setTimeout(() => {
                loader.style.display = 'none';
                mainContent.style.display = 'block';
                nav.style.display = 'flex';
                setupNavegacion();
            }, 2000);        // 2 segundos de "cargando"
        }else{
            alert('¡Necesitas ingresar usuario y contraseña!');
        }
    });
}

// Llamar a esta función al inicio
setupLogin();

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
            // Actualiza la clase active en los enlaces
            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
            if (destino === "dashboard") {
                dashboardComponent.render();
            }
            if (destino === "categorias") {
                categoriaComponent.render();
            }
        });
    });
    // Mostrar dashboard por defecto y marcarlo como activo
    secciones.forEach(sec => {
        document.getElementById(sec).style.display = (sec === "dashboard") ? "block" : "none";
    });
    navLinks.forEach(l => l.classList.remove("active"));
    document.querySelector('nav a[href="dashboard"]').classList.add("active");
    dashboardComponent.render();
}
setupNavegacion();