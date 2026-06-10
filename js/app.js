'use strict';

const App = (() => {
    let _data = null;
    let _auth = null;
    let _config = null;
    let _modal = null;

    const _show_loader = (text = 'Загрузка...') => {
        const loader = document.getElementById('global-loader');
        if (!loader) return;
        const textEl = loader.querySelector('.loader-text');
        if (textEl) textEl.textContent = text;
        loader.classList.remove('hidden');
    };

    const _hide_loader = () => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    };

    const _bind = () => {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                _modal?.hideComponentModal();
                _auth?.hideModal();
            }
        });

        window.addEventListener('beforeunload', () => {
            localStorage.setItem('currentBuild', JSON.stringify(_config?.build || {}));
        });

        window.addEventListener('scroll', () => {
            const btn = document.querySelector('.scroll-top');
            if (btn) btn.classList.toggle('visible', window.scrollY > 300);
        });

        document.querySelector('.scroll-top')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        document.getElementById('admin-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'admin.html';
        });
    };

    const _init = async () => {
        _show_loader('Загрузка приложения...');

        _data = DataManager;
        _auth = AuthManager;
        _config = Configurator;
        _modal = ModalManager;

        _show_loader('Загрузка конфигуратора...');
        _config.init(_data, _auth);
        
        _show_loader('Загрузка модальных окон...');
        _modal.init(_data, _config);

        window.modalManager = _modal;
        window.configurator = _config;

        await new Promise(r => setTimeout(r, 500));
        
        _hide_loader();
        _bind();
    };

    return Object.freeze({ init: _init });
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

function scrollToConfigurator() {
    const configurator = document.getElementById('configurator');
    if (configurator) {
        configurator.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}