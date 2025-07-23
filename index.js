import { CategoriaComponent } from "./components/category.js";
import { DashboardComponent } from "./components/dashboard.js";
import { TransactionsComponent } from "./components/transactions.js";
import { BudgetsComponent } from "./components/budgets.js";


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

function setupLogin() {
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.querySelector('main');
    const nav = document.querySelector('nav');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-submit');
    const loader = document.getElementById('loader');
    const showCreateAccountBtn = document.getElementById('show-create-account');
    const createAccountScreen = document.getElementById('create-account-screen');
    const backToLoginBtn = document.getElementById('back-to-login');
    const createAccountForm = document.getElementById('create-account-form');
    const createAccountSubmit = document.getElementById('create-account-submit');

    // Mostrar pantalla de login
    loginScreen.style.display = 'flex';
    mainContent.style.display = 'none';
    nav.style.display = 'none';
    createAccountScreen.style.display = 'none';






    // Mostrar pantalla de crear cuenta
    showCreateAccountBtn.addEventListener('click', () => {
        loginScreen.style.display = 'none';
        createAccountScreen.style.display = 'flex';
    });

    // Volver al login desde crear cuenta
    backToLoginBtn.addEventListener('click', () => {
        createAccountScreen.style.display = 'none';
        loginScreen.style.display = 'flex';
    });

    // Crear cuenta
    createAccountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newUser = document.getElementById('create-username').value;
        const newPass = document.getElementById('create-password').value;
        if (newUser && newPass) {
            // Guardar usuario y contraseña en localStorage (simple, no seguro)
            localStorage.setItem('f1-finanzas-user', newUser);
            localStorage.setItem('f1-finanzas-pass', newPass);
            alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
            createAccountScreen.style.display = 'none';
            loginScreen.style.display = 'flex';
        } else {
            alert('Debes ingresar usuario y contraseña.');
        }
    });

    // Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const savedUser = localStorage.getItem('f1-finanzas-user');
        const savedPass = localStorage.getItem('f1-finanzas-pass');
        
        // Validación simple (en producción usar autenticación segura)
        if(username && password) {
        if (savedUser && savedPass) {
            if (username === savedUser && password === savedPass) {
                localStorage.setItem('f1-finanzas-loggedin', 'true');
                loginScreen.style.display = 'none';

                // Reproducir sonido de carga
                const loadingSound = document.getElementById('loading-sound');
                loadingSound.volume = 0.3; // Volumen al 30%
                loadingSound.play().catch(e => console.log("Error al reproducir sonido de carga:", e));

                loader.style.display = 'flex';
                setTimeout(() => {
                    loader.style.display = 'none';
                    mainContent.style.display = 'block';
                    nav.style.display = 'flex';
                    setupNavegacion();
                    loadingSound.pause(); // Opcional: Detener el sonido al terminar
                }, 2000);
                } else {
                alert('Usuario o contraseña incorrectos.');
            }
        } else {
            alert('No existe ninguna cuenta. Por favor crea una.');
        }
     }else{
            alert('¡Necesitas ingresar usuario y contraseña!');
        }
    });
}

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
        setupLogin();
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