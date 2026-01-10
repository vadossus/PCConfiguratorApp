class UIManager {
    static showLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }
    }

    static hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    static updateNavigation(authManager) {
        const loginLink = document.getElementById('login-link');
        const favoritesLink = document.getElementById('favorites-link');
        const adminLink = document.getElementById('admin-link');
        const logoutLink = document.getElementById('logout-link');

        if (authManager.isLoggedIn()) {
            loginLink.classList.add('hidden');
            favoritesLink.classList.remove('hidden');
            logoutLink.classList.remove('hidden');
            
            if (authManager.isAdmin()) {
                adminLink.classList.remove('hidden');
            } else {
                adminLink.classList.add('hidden');
            }
        } else {
            loginLink.classList.remove('hidden');
            favoritesLink.classList.add('hidden');
            adminLink.classList.add('hidden');
            logoutLink.classList.add('hidden');
        }
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    static createComponentCard(componentType, componentData) {
        const hasComponent = componentData !== null;
        
        return `
            <tr class="component-row" data-component-type="${componentType}">
                <td class="component-name">${this.getComponentName(componentType)}</td>
                <td class="component-action">
                    <button class="btn-select-component" 
                            onclick="configurator.openComponentSelection('${componentType}')">
                        ${hasComponent ? 'Изменить' : 'Выбрать'}
                    </button>
                    ${hasComponent ? `
                        <button class="btn-remove-component" 
                                onclick="configurator.removeComponent('${componentType}')">
                            Убрать
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }

    static getComponentIcon(componentType) {
        const icons = {
            'cpus': '⚡',
            'motherboards': '🔌',
            'rams': '💾',
            'gpus': '🎮',
            'storages': '💿',
            'psus': '🔋',
            'cases': '🖥️'
        };
        return icons[componentType] || '❓';
    }

    static getComponentName(componentType) {
        const names = {
            'cpus': 'Процессоры',
            'motherboards': 'Мат.плата',
            'rams': 'Оперативная память',
            'gpus': 'Видеокарты',
            'storages': 'Накопители',
            'psus': 'Блок питания',
            'cases': 'Корпус',
            'coolers': 'Охлаждение'
        };
        return names[componentType] || componentType;
    }
}