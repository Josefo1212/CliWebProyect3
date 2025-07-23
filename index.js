import { CategoriaComponent } from "./components/category.js";
import { DashboardComponent } from "./components/dashboard.js";
import { TransactionsComponent } from "./components/transactions.js";
import { BudgetsComponent } from "./components/budgets.js";
import { LoginComponent } from "./components/login.js";


document.body.addEventListener('click', () => {
    // "Activar" audios con el primer clic del usuario
    const loadingSound = document.getElementById('loading-sound');
    loadingSound.volume = 0;
    loadingSound.play().then(() => {
        loadingSound.pause();
        loadingSound.volume = 0.3;
    }).catch(e => console.log("Preparación de audio de carga:", e));
}, { once: true });

const categoriaComponent = new CategoriaComponent();
const dashboardComponent = new DashboardComponent();
const transactionsComponent = new TransactionsComponent();
const budgetsComponent = new BudgetsComponent();
const loginComponent = new LoginComponent();

window.addEventListener('login-success', () => {
    setupNavegacion();
});

function initApp() {
    const splash = document.getElementById('splash-screen');
    const loginScreen = document.getElementById('login-screen');
    
    // Configurar el splash screen
    splash.style.display = 'flex';
    loginScreen.style.display = 'none';
    // Configurar el evento de finalización de la animación
    document.getElementById('splash-logo').addEventListener('animationend', () => {
        splash.style.display = 'none';
        loginScreen.style.display = 'flex';
        //setupLogin();
    });
}

// Iniciar la aplicación
initApp();

function playTransactionSound() {
  const audio = document.getElementById('transaction-sound');
  audio.volume = 0.5; // Volumen al 50%
  audio.play().catch(e => {
    console.error("Error al reproducir sonido:", e);
    // Solución para navegadores que bloquean autoplay:
    document.body.addEventListener('click', () => audio.play(), { once: true });
  });
}

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
            if (destino === "transacciones") {
                transactionsComponent.render();
            }
            if (destino === "presupuestos") {
                budgetsComponent.render();
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

// En tu función de login exitoso:
document.body.addEventListener('click', () => {
    // "Activar" audio con un primer clic del usuario
    const audio = document.getElementById('transaction-sound');
    audio.volume = 0;
    audio.play().then(() => {
        audio.pause();
        audio.volume = 0.5; // Restaurar volumen
    }).catch(e => console.log("Preparación de audio:", e));
}, { once: true }); // Solo se ejecuta una vez