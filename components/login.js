export class LoginComponent {
    constructor() {
        this.loginScreen = document.getElementById('login-screen');
        this.mainContent = document.querySelector('main');
        this.nav = document.querySelector('nav');
        this.loginForm = document.getElementById('login-form');
        this.loader = document.getElementById('loader');
        this.showCreateAccountBtn = document.getElementById('show-create-account');
        this.createAccountScreen = document.getElementById('create-account-screen');
        this.backToLoginBtn = document.getElementById('back-to-login');
        this.createAccountForm = document.getElementById('create-account-form');
        this.init();
    }

    init() {
        // Mostrar pantalla de login
        this.loginScreen.style.display = 'flex';
        this.mainContent.style.display = 'none';
        this.nav.style.display = 'none';
        this.createAccountScreen.style.display = 'none';

        this.showCreateAccountBtn.addEventListener('click', () => {
            this.loginScreen.style.display = 'none';
            this.createAccountScreen.style.display = 'flex';
        });

        this.backToLoginBtn.addEventListener('click', () => {
            this.createAccountScreen.style.display = 'none';
            this.loginScreen.style.display = 'flex';
        });

        this.createAccountForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUser = document.getElementById('create-username').value;
            const newPass = document.getElementById('create-password').value;
            if (newUser && newPass) {
                localStorage.setItem('f1-finanzas-user', newUser);
                localStorage.setItem('f1-finanzas-pass', newPass);
                alert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
                this.createAccountScreen.style.display = 'none';
                this.loginScreen.style.display = 'flex';
            } else {
                alert('Debes ingresar usuario y contraseña.');
            }
        });

        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const savedUser = localStorage.getItem('f1-finanzas-user');
            const savedPass = localStorage.getItem('f1-finanzas-pass');
            if (username && password) {
                if (savedUser && savedPass) {
                    if (username === savedUser && password === savedPass) {
                        localStorage.setItem('f1-finanzas-loggedin', 'true');
                        this.loginScreen.style.display = 'none';
                        const loadingSound = document.getElementById('loading-sound');
                        loadingSound.volume = 0.3;
                        loadingSound.play().catch(() => {});
                        this.loader.style.display = 'flex';
                        setTimeout(() => {
                            this.loader.style.display = 'none';
                            this.mainContent.style.display = 'block';
                            this.nav.style.display = 'flex';
                            loadingSound.pause();
                            window.dispatchEvent(new Event('login-success'));
                        }, 2000);
                    } else {
                        alert('Usuario o contraseña incorrectos.');
                    }
                } else {
                    alert('No existe ninguna cuenta. Por favor crea una.');
                }
            } else {
                alert('¡Necesitas ingresar usuario y contraseña!');
            }
        });
    }
}
