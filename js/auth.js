class AuthManager {
    constructor() {
        this.currentUser = null;
        this.API_BASE_URL = 'api/';
        this.init();
    }

    async init() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI(); 
                await this.validateSession();
            } catch (error) {
                localStorage.removeItem('currentUser');
            }
        }
        
        this.initAuthModal();
    }

    initAuthModal() {
        const authModal = document.getElementById('auth-modal');

        if (!authModal) {
            return;
        }
        const closeButton = authModal.querySelector('.close-button');
        const modalContent = authModal.querySelector('.modal-content');
        
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideAuthModal();
            });
        }
        
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                this.hideAuthModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !authModal.classList.contains('hidden')) {
                this.hideAuthModal();
            }
        });
        
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        
        this.initFormSwitching();
    }

    initFormSwitching() {
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const registerFields = document.getElementById('register-fields');
        
        if (!switchToRegister || !switchToLogin || !registerFields) return;

        const newSwitchToRegister = switchToRegister.cloneNode(true);
        const newSwitchToLogin = switchToLogin.cloneNode(true);
        
        switchToRegister.replaceWith(newSwitchToRegister);
        switchToLogin.replaceWith(newSwitchToLogin);
    
        newSwitchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        newSwitchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}auth.php?action=login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка входа');
            }

            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUI();
            
            this.hideAuthModal();
            
            this.dispatchAuthEvent('login', this.currentUser);
            
            return this.currentUser;
            
        } catch (error) {
            this.dispatchAuthEvent('loginError', error);
            throw error;
        }
    }

    async register(username, email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}auth.php?action=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password,
                    role: 'user'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка регистрации');
            }

            this.currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUI();
            
            this.hideAuthModal();
            
            this.dispatchAuthEvent('register', this.currentUser);
            
            return this.currentUser;
            
        } catch (error) {
            this.dispatchAuthEvent('registerError', error);
            throw error;
        }
    }

    async logout() {
        try {
            await fetch(`${this.API_BASE_URL}auth.php?action=logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            const oldUser = this.currentUser;
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.updateUI();
            
            this.dispatchAuthEvent('logout', oldUser);
            
            this.showMessage('Вы успешно вышли из системы', 'success');
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserAvatar() {
        if (!this.currentUser) return '👤';
        const firstLetter = this.currentUser.username.charAt(0).toUpperCase();
        return firstLetter;
    }

    updateUI() {
        const loginLink = document.getElementById('login-link');
        const favoritesLink = document.getElementById('favorites-link');
        const adminLink = document.getElementById('admin-link');
        const logoutLink = document.getElementById('logout-link');
        const userInfo = document.getElementById('user-info');

        if (this.isLoggedIn()) {
            if (loginLink) loginLink.classList.add('hidden');
            
            if (favoritesLink) favoritesLink.classList.remove('hidden');
            if (logoutLink) logoutLink.classList.remove('hidden');
            
            if (userInfo) {
                userInfo.classList.remove('hidden');
                userInfo.innerHTML = `
                    <div class="nav-user-info">
                        <div class="user-avatar">${this.getUserAvatar()}</div>
                        <span>${this.currentUser.username}</span>
                    </div>
                `;
            }
            
            // Показываем админку если нужно
            if (this.isAdmin()) {
                if (adminLink) adminLink.classList.remove('hidden');
            } else {
                if (adminLink) adminLink.classList.add('hidden');
            }
        } else {
            if (loginLink) loginLink.classList.remove('hidden');
            
            if (favoritesLink) favoritesLink.classList.add('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            if (logoutLink) logoutLink.classList.add('hidden');
            if (userInfo) {
                userInfo.classList.add('hidden');
                userInfo.innerHTML = '';
            }
        }
    }

    requireAuth() {
        if (!this.isLoggedIn()) {
            this.showAuthModal();
            return false;
        }
        return true;
    }

    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        const authForm = document.getElementById('auth-form');
        const authMessage = document.getElementById('auth-message');
        
        if (authForm) authForm.reset();
        if (authMessage) {
            authMessage.textContent = '';
            authMessage.className = 'auth-message';
        }
        
        this.showLoginForm();
        
        authModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; 
    }

    showLoginForm() {
        const registerFields = document.getElementById('register-fields');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const authTitle = document.getElementById('auth-title');
        const submitButton = document.getElementById('auth-submit');
        
        if (registerFields) registerFields.classList.add('hidden');
        if (switchToRegister) switchToRegister.classList.remove('hidden');
        if (switchToLogin) switchToLogin.classList.add('hidden');
        if (authTitle) authTitle.textContent = 'Вход в систему';
        if (submitButton) submitButton.textContent = 'Войти';
    }

    showRegisterForm() {
        const registerFields = document.getElementById('register-fields');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const authTitle = document.getElementById('auth-title');
        const submitButton = document.getElementById('auth-submit');
        
        if (registerFields) registerFields.classList.remove('hidden');
        if (switchToRegister) switchToRegister.classList.add('hidden');
        if (switchToLogin) switchToLogin.classList.remove('hidden');
        if (authTitle) authTitle.textContent = 'Регистрация';
        if (submitButton) submitButton.textContent = 'Зарегистрироваться';
    }

    hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        authModal.classList.add('hidden');
        document.body.style.overflow = ''; 
        
        const authForm = document.getElementById('auth-form');
        if (authForm) authForm.reset();
        
        const authMessage = document.getElementById('auth-message');
        if (authMessage) {
            authMessage.textContent = '';
            authMessage.className = 'auth-message';
        }
        
        const authLoading = document.getElementById('auth-loading');
        if (authLoading) authLoading.classList.add('hidden');
        
        this.showLoginForm();
    }

    showMessage(message, type = 'info') {
        if (window.UIManager && UIManager.showNotification) {
            UIManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    dispatchAuthEvent(eventName, data) {
        const event = new CustomEvent(`auth:${eventName}`, { detail: data });
        window.dispatchEvent(event);
    }

    async validateSession() {
        if (!this.currentUser) return false;

        try {
            const response = await fetch(`${this.API_BASE_URL}auth.php?action=validate`);
            if (!response.ok) {
                throw new Error('Invalid session');
            }
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }
}

window.authManager = new AuthManager();