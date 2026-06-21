'use strict';

const AuthManager = (() => {
    const API = 'api/';
    let _user = null;

    const _emit = (name, data) => {
        window.dispatchEvent(new CustomEvent(`auth:${name}`, { detail: data }));
    };

    const _save = (data) => {
        _user = data;
        localStorage.setItem('currentUser', JSON.stringify(data));
    };

    const _clear = () => {
        _user = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('pc_build');
        localStorage.removeItem('currentBuild');
    };

    const _update_ui = () => {
        const logged = _user !== null;
        const isAdmin = logged && (_user.role === 'admin' || _user.role === 'sadmin');
        
        const elements = {
            'login-link': !logged,
            'logout-link': logged,
            'user-info': logged,
            'srav-link': logged,
            'admin-link': isAdmin
        };
        
        for (const [id, show] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) {
                if (show) {
                    el.classList.remove('hidden');
                } else {
                    el.classList.add('hidden');
                }
            }
        }
        
        const nav_name = document.getElementById('nav-username');
        if (nav_name && logged) nav_name.textContent = _user.username;
        
        const user_info = document.getElementById('user-info');
        if (user_info && logged) {
            user_info.style.cursor = 'pointer';
            user_info.onclick = () => { window.location.href = 'profile.html'; };
        }
    };

    const _reset_build = () => {
        if (!window.Configurator) return;
        window.Configurator.build = {
            cpus: null, motherboards: null, rams: null, gpus: null,
            storages: [], psus: null, cases: null, coolers: null
        };
        window.Configurator.render_cards();
        window.Configurator.calc_power();
        window.Configurator.check_compat();
    };

    const _show_error = (message) => {
        const auth_message = document.getElementById('auth-message');
        if (auth_message) {
            auth_message.textContent = message;
            auth_message.className = 'auth-message error';
            auth_message.style.display = 'block';
        }
    };

    const _show_success = (message) => {
        const auth_message = document.getElementById('auth-message');
        if (auth_message) {
            auth_message.textContent = message;
            auth_message.className = 'auth-message success';
            auth_message.style.display = 'block';
        }
    };

    const _login = async (username, password) => {
        const res = await fetch(`${API}auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Ошибка входа');
        _save(data.user);
        _update_ui();
        _emit('login', _user);
        return _user;
    };

    const _register = async (username, email, password) => {
        const res = await fetch(`${API}auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role: 'user' })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Ошибка регистрации');
        _save(data.user);
        _update_ui();
        _emit('register', _user);
        return _user;
    };

    const _logout = async () => {
        try { 
            await fetch(`${API}auth.php?action=logout`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }); 
        } catch (e) {}
        _clear();
        _update_ui();
        _reset_build();
        _emit('logout', null);
        window.location.href = 'index.html';
    };

    const _check = async () => {
        if (!_user) return false;
        try {
            const res = await fetch(`${API}auth.php?action=validate`);
            const data = await res.json();
            if (res.ok && data.valid) {
                if (data.user) { _user = { ..._user, ...data.user }; localStorage.setItem('currentUser', JSON.stringify(_user)); }
                return true;
            }
            return false;
        } catch (e) { return false; }
    };

    const _recover = async () => {
        if (!_user) return false;
        try {
            const res = await fetch(`${API}auth.php?action=restore_session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: _user.id, username: _user.username })
            });
            const data = await res.json();
            return res.ok && data.success;
        } catch (e) { return false; }
    };

    const _show_modal = () => {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        const form = document.getElementById('auth-form');
        const msg = document.getElementById('auth-message');
        if (form) form.reset();
        if (msg) { msg.textContent = ''; msg.className = 'auth-message'; msg.style.display = 'none'; }
        document.getElementById('register-fields')?.classList.add('hidden');
        document.getElementById('switch-to-register')?.classList.remove('hidden');
        document.getElementById('switch-to-login')?.classList.add('hidden');
        const title = document.getElementById('auth-title');
        const btn = document.getElementById('auth-submit');
        if (title) title.textContent = 'Вход в систему';
        if (btn) btn.textContent = 'Войти';
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const _hide_modal = () => {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        document.getElementById('auth-form')?.reset();
        const msg = document.getElementById('auth-message');
        if (msg) { msg.textContent = ''; msg.className = 'auth-message'; msg.style.display = 'none'; }
        document.getElementById('auth-loading')?.classList.add('hidden');
    };

    const _handle_submit = async (e) => {
        if (e) e.preventDefault();
        
        const username_input = document.getElementById('username');
        const password_input = document.getElementById('password');
        const email_input = document.getElementById('email');
        const register_fields = document.getElementById('register-fields');
        const auth_loader = document.getElementById('auth-loading');
        
        if (!username_input || !password_input) return;
        
        const username = username_input.value.trim();
        const password = password_input.value;
        const email = email_input ? email_input.value.trim() : '';
        const is_register = register_fields && !register_fields.classList.contains('hidden');

        if (!username || !password) {
            _show_error('Заполните все поля');
            return;
        }

        if (is_register && !email) {
            _show_error('Введите email');
            return;
        }

        try {
            if (auth_loader) auth_loader.classList.remove('hidden');
            _show_error('');

            if (is_register) {
                await _register(username, email, password);
                _show_success('Регистрация успешна!');
            } else {
                await _login(username, password);
                _show_success('Вход выполнен!');
            }

            setTimeout(() => _hide_modal(), 1000);
        } catch (err) {
            _show_error(err.message);
        } finally {
            if (auth_loader) auth_loader.classList.add('hidden');
        }
    };

    const _bind_modal = () => {
        const modal = document.getElementById('auth-modal');
        if (!modal) return;

        const close_btn = modal.querySelector('.close-button');
        if (close_btn) close_btn.addEventListener('click', _hide_modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) _hide_modal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) _hide_modal();
        });

        const content = modal.querySelector('.modal-content');
        if (content) content.addEventListener('click', (e) => e.stopPropagation());

        const to_register = document.getElementById('switch-to-register');
        const to_login = document.getElementById('switch-to-login');
        const register_fields = document.getElementById('register-fields');
        const submit_btn = document.getElementById('auth-submit');
        const auth_title = document.getElementById('auth-title');

        if (to_register) {
            to_register.addEventListener('click', (e) => {
                e.preventDefault();
                if (register_fields) register_fields.classList.remove('hidden');
                to_register.classList.add('hidden');
                if (to_login) to_login.classList.remove('hidden');
                if (auth_title) auth_title.textContent = 'Регистрация';
                if (submit_btn) submit_btn.textContent = 'Зарегистрироваться';
            });
        }

        if (to_login) {
            to_login.addEventListener('click', (e) => {
                e.preventDefault();
                if (register_fields) register_fields.classList.add('hidden');
                if (to_register) to_register.classList.remove('hidden');
                to_login.classList.add('hidden');
                if (auth_title) auth_title.textContent = 'Вход в систему';
                if (submit_btn) submit_btn.textContent = 'Войти';
            });
        }

        if (submit_btn) {
            submit_btn.addEventListener('click', _handle_submit);
        }

        const form = document.getElementById('auth-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                _handle_submit(e);
            });
        }

        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            const newLoginLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLoginLink, loginLink);
            newLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                _show_modal();
            });
        }

        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            const newLogoutLink = logoutLink.cloneNode(true);
            logoutLink.parentNode.replaceChild(newLogoutLink, logoutLink);
            newLogoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                _logout();
            });
        }
    };

    const _restore = async () => {
        const saved = localStorage.getItem('currentUser');
        if (!saved) {
            _bind_modal();
            return;
        }
        try {
            _user = JSON.parse(saved);
            _update_ui();
            const valid = await _check();
            if (!valid) {
                const recovered = await _recover();
                if (!recovered) { _clear(); _update_ui(); }
            }
        } catch (e) { localStorage.removeItem('currentUser'); }
        _bind_modal();
    };

    _restore();

    return Object.freeze({
        login: _login,
        register: _register,
        logout: _logout,
        isLogged: () => _user !== null,
        isAdmin: () => _user?.role === 'admin' || _user?.role === 'sadmin',
        getUser: () => _user,
        showModal: _show_modal,
        hideModal: _hide_modal,
        updateUI: _update_ui,
        requireAuth() {
            if (!_user) { _show_modal(); return false; }
            return true;
        }
    });
})();

window.AuthManager = AuthManager;