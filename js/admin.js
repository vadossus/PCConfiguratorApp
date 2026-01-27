class AdminPanel {
    constructor() {
        this.API_BASE_URL = 'api/admin.php?action=';
        this.currentSection = 'dashboard';
        this.componentsData = [];
        this.usersData = [];
        this.buildsData = [];
        this.componentTypes = {
            'cpus': 'Процессоры',
            'motherboards': 'Материнские платы', 
            'rams': 'Оперативная память',
            'gpus': 'Видеокарты',
            'storages': 'Накопители',
            'psus': 'Блоки питания',
            'cases': 'Корпуса',
            'coolers': 'Охлаждение'
        };

        this.activityTypes = {
            'user_register': 'Регистрация пользователя',
            'user_delete': 'Удаление пользователя',
            'user_role_change': 'Изменение роли пользователя',
            'build_save': 'Сохранение сборки',
            'build_delete': 'Удаление сборки',
            'component_add': 'Добавление компонента',
            'component_edit': 'Редактирование компонента',
            'component_delete': 'Удаление компонента',
            'component_toggle': 'Изменение статуса компонента',
            'import_components': 'Импорт компонентов'
        };
        
        this.activities = [];
        this.activityPage = 1;
        this.activityLimit = 15;
        this.hasMoreActivities = true;
        
        this.filters = {
            category: 'all',
            search: '',
            sortBy: 'id',
            sortOrder: 'desc',
            page: 1,
            limit: 10
        };
        
        this.init();
    }

    init() {
        this.checkAdminAccess();
        this.initUI();
        this.loadDashboardData();
        this.bindEvents();   
    }

    checkAdminAccess() {
        const savedUser = localStorage.getItem('currentUser');
        
        if (!savedUser) {
            window.location.href = 'index.html';
            return false;
        }
        
        try {
            const user = JSON.parse(savedUser);
            
            if (user.role !== 'admin') {
                window.location.href = 'index.html';
                return false;
            }
            
            return true;
            
        } catch (error) {
            window.location.href = 'index.html';
            return false;
        }
    }

    initUI() {
        this.initNavigation();
        this.showSection(this.currentSection);
        this.initComponentTypeSelect();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.switchSection(section);
            });
        });
    }

    initFilters() {
        const typeFilter = document.getElementById('component-type-filter');
        const searchInput = document.getElementById('component-search');
        const sortSelect = document.getElementById('component-sort');
        
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                this.filters.sortBy = sortBy;
                this.filters.sortOrder = sortOrder;
                this.applyFilters();
            });
        }
    }

    async applyFilters() {
        await this.loadComponents();
    }

    async logActivity(type, description = '') {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const activityData = {
                type: type,
                readable_type: this.activityTypes[type] || type,
                description: description,
                user_id: user.id || 0
            };
            
            const response = await fetch(`${this.API_BASE_URL}log_activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activityData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.refreshActivityList();
            }
            
        } catch (error) {
        }
    }

    async loadActivities(page = 1, refresh = false) {
        try {
            if (refresh) {
                this.activityPage = 1;
                this.hasMoreActivities = true;
                this.activities = [];
            }
            
            const offset = (page - 1) * this.activityLimit;
            const params = new URLSearchParams({
                limit: this.activityLimit,
                offset: offset
            });
            
            const response = await fetch(`${this.API_BASE_URL}get_activities&${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                const newActivities = data.activities || [];
                
                if (page === 1) {
                    this.activities = newActivities;
                } else {
                    this.activities = [...this.activities, ...newActivities];
                }
                
                this.hasMoreActivities = newActivities.length === this.activityLimit;
                this.activityPage = page;
                
                this.updateActivityDisplay();
            } else {
                this.showFallbackActivity();
            }
            
        } catch (error) {
            this.showFallbackActivity();
        }
    }

     updateActivityDisplay() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        if (!this.activities || this.activities.length === 0) {
            activityList.innerHTML = this.getEmptyActivityHTML();
            return;
        }
        
        const html = this.activities.map(activity => this.getActivityItemHTML(activity)).join('');
        
        let loadMoreHTML = '';
        if (this.hasMoreActivities) {
            loadMoreHTML = `
                <div class="load-more-activities">
                    <button class="btn-load-more" onclick="adminPanel.loadMoreActivities()">
                        Показать еще
                    </button>
                </div>
            `;
        }
        
        activityList.innerHTML = html + loadMoreHTML;
    }
    
    getEmptyActivityHTML() {
        return `
            <div class="no-activity">
                <div class="no-activity-content">
                    <p>История активности пуста</p>
                    <small>Совершите действия в админ-панели, чтобы увидеть их здесь</small>
                </div>
            </div>
        `;
    }
    
    getActivityItemHTML(activity) {
        const icon = activity.icon || this.getActivityIcon(activity.action_type);
        const timeAgo = activity.timestamp_formatted || this.getTimeAgo(activity.created_at);
        const userInfo = activity.user_display || (activity.username ? activity.username : 'Система');
        
        let description = activity.description_short || '';
        if (!description && activity.description) {
            const parts = activity.description.split(': ');
            description = parts.length > 1 ? parts.slice(1).join(': ') : '';
        }
        
        return `
            <div class="activity-item">
                <div class="activity-icon" title="${activity.action_type || 'Действие'}">
                    ${icon}
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <span class="activity-user">${userInfo}</span>
                        <span class="activity-time">${timeAgo}</span>
                    </div>
                    <p class="activity-description">
                        <strong>${activity.type_name || activity.action_type || 'Действие'}</strong>
                        ${description ? `: ${description}` : ''}
                    </p>
                </div>
            </div>
        `;
    }
    
    loadMoreActivities() {
        this.loadActivities(this.activityPage + 1);
    }
    
    refreshActivityList() {
        this.loadActivities(1, true);
    }
    
    getActivityIcon(actionType) {
        const iconMap = {
            'user_register': '👤',
            'user_delete': '🗑️',
            'user_role_change': '🔄',
            'build_save': '💾',
            'build_delete': '🗑️',
            'component_add': '➕',
            'component_edit': '✏️',
            'component_delete': '🗑️',
            'component_toggle': '⚡',
            'login': '🔑',
            'logout': '🚪',
            'import_components': '📥'
        };
        
        return iconMap[actionType] || '📝';
    }
    
    getTimeAgo(timestamp) {
        if (!timestamp) return 'Недавно';
        
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        if (diffHours < 24) return `${diffHours} ч. назад`;
        if (diffDays < 7) return `${diffDays} дн. назад`;
        
        return activityTime.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showFallbackActivity() {
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = `
                <div class="no-activity">
                    <div class="no-activity-content">
                        <p>Не удалось загрузить активность</p>
                        <small>Проверьте подключение и попробуйте позже</small>
                    </div>
                </div>
            `;
        }
    }

    switchSection(section) {
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.admin-nav-link').forEach(link => link.classList.remove('active'));
        
        const sectionElement = document.getElementById(`${section}-section`);
        const navLink = document.querySelector(`[data-section="${section}"]`);
        
        if (sectionElement) {
            sectionElement.classList.add('active');
            this.currentSection = section;
            this.loadSectionData(section);
        }
        
        if (navLink) navLink.classList.add('active');
    }

    showSection(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (sectionElement) this.switchSection(section);
    }

    initComponentTypeSelect() {
        const typeSelect = document.getElementById('component-category');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">Выберите категорию</option>';
            for (const [key, value] of Object.entries(this.componentTypes)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = value;
                typeSelect.appendChild(option);
            }
        }
    }

    async loadDashboardData() {
        try {
            this.showLoader();
            const stats = await this.getDashboardStats();
            this.updateDashboardStats(stats);
            await this.loadActivities();
            this.hideLoader();
        } catch (error) {
            this.showError('Ошибка загрузки данных');
            this.hideLoader();
        }
    }

    async getDashboardStats() {
        try {
            const [users, components, builds] = await Promise.all([
                this.fetchCount('users'),
                this.fetchCount('components'),
                this.fetchCount('user_builds')
            ]);

            return {
                users: users,
                components: components,
                builds: builds,
                errors: 0
            };
        } catch (error) {
            return { users: 0, components: 0, builds: 0, errors: 0 };
        }
    }

    async fetchCount(table) {
        try {
            const response = await fetch(`${this.API_BASE_URL}get_count&table=${table}`);
            if (response.ok) {
                const data = await response.json();
                return data.count || 0;
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    updateDashboardStats(stats) {
        const elements = {
            'stat-users': stats.users,
            'stat-components': stats.components,
            'stat-builds': stats.builds,
            'stat-errors': stats.errors,
            'total-users': stats.users,
            'total-builds': stats.builds
        };

        for (const [id, value] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }
    }

    async loadComponents() {
        try {
            this.showLoader('Загрузка компонентов...');
            
            const params = new URLSearchParams({
                page: this.filters.page,
                limit: this.filters.limit
            });
            
            if (this.filters.category && this.filters.category !== 'all') {
                params.append('category', this.filters.category);
            }
            
            if (this.filters.search) {
                params.append('search', this.filters.search);
            }
            
            if (this.filters.sortBy) {
                params.append('sort', this.filters.sortBy);
                params.append('order', this.filters.sortOrder);
            }
            
            const response = await fetch(`${this.API_BASE_URL}get_component&${params.toString()}`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            
            const data = await response.json();
            
            if (data.success) {
                this.componentsData = data.components || [];
                this.renderComponentsTable(this.componentsData, data.pagination?.total || 0);
            } else {
                this.showError(data.message || 'Ошибка загрузки компонентов');
                this.renderComponentsTable([], 0);
            }
            
            this.hideLoader();
            
        } catch (error) {
            this.showError('Ошибка загрузки компонентов');
            this.renderComponentsTable([], 0);
            this.hideLoader();
        }
    }

    async fetchUsers() {
        try {
            const response = await fetch(`${this.API_BASE_URL}get_users`);
            if (!response.ok) throw new Error('Ошибка загрузки');
            
            const data = await response.json();
            return data.users || [];
        } catch (error) {
            return [];
        }
    }

    async loadUsers() {
        try {
            this.showLoader('Загрузка пользователей...');
            this.usersData = await this.fetchUsers();
            this.renderUsersTable(this.usersData);
            this.hideLoader();
        } catch (error) {
            this.showError('Ошибка загрузки пользователей');
            this.hideLoader();
        }
    }

    async loadBuilds() {
        const grid = document.getElementById('builds-grid');
        if (!grid) return;

        try {
            const response = await fetch('api/admin.php?action=get_builds');
            const data = await response.json();

            if (data.success && data.builds && data.builds.length > 0) {
                grid.innerHTML = data.builds.map(build => {
                    const iconsHTML = this.renderBuildIcons(build.components || {});
                    
                    let componentCount = 0;
                    if (build.components) {
                        Object.values(build.components).forEach(comp => {
                            if (Array.isArray(comp)) {
                                componentCount += comp.length;
                            } else if (comp && typeof comp === 'object') {
                                componentCount++;
                            }
                        });
                    }

                    return `
                    <div class="build-card">
                        <div class="build-card-header">
                            <span class="build-id">#${build.id}</span>
                            <div class="build-stats">
                                <span class="component-count">${componentCount} компонентов</span>
                                <span class="build-date">${new Date(build.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        
                        ${iconsHTML ? `
                        <div class="build-preview-row">
                            ${iconsHTML}
                        </div>
                        ` : '<div class="no-components">Нет выбранных компонентов</div>'}
                        
                        <div class="build-card-content">
                            <h3>${build.name || 'Конфигурация ПК'}</h3>
                            <p class="user">${build.username || 'Пользователь'}</p>
                            <div class="price">${Number(build.total_price).toLocaleString('ru-RU')} ₽</div>
                        </div>

                        <div class="build-actions">
                            <button class="btn-delete" onclick="adminPanel.deleteBuild(${build.id})">
                                Удалить
                            </button>
                        </div>
                    </div>`;
                }).join('');
            } else {
                grid.innerHTML = '<div class="no-data">Сборок пока нет</div>';
            }
        } catch (error) {
            grid.innerHTML = '<div class="no-data">Ошибка загрузки сборок</div>';
        }
    }

    renderBuildIcons(components) {
        if (!components) return '';
        
        const allCategories = [
            { key: 'cpus', name: 'Процессор', icon: 'cpu_icon.png' },
            { key: 'motherboards', name: 'Материнская плата', icon: 'motherboard_icon.png' },
            { key: 'rams', name: 'Оперативная память', icon: 'ram_icon.png' },
            { key: 'gpus', name: 'Видеокарта', icon: 'gpu_icon.png' },
            { key: 'psus', name: 'Блок питания', icon: 'power_supply_icon.png' },
            { key: 'cases', name: 'Корпус', icon: 'pc_case_icon.png' },
            { key: 'coolers', name: 'Охлаждение', icon: 'cooler_cpu_icon.png' },
            { key: 'storages', name: 'Накопители', icon: 'hdd_icon.png' }
        ];
        
        let iconsHTML = '';
        
        allCategories.forEach(category => {
            const item = components[category.key];
            
            if (category.key === 'storages') {
                if (Array.isArray(item) && item.length > 0) {
                    const maxToShow = 3;
                    const storagesToShow = item.slice(0, maxToShow);
                    
                    storagesToShow.forEach((storage, index) => {
                        if (storage && storage.id) {
                            const title = storage.name || `Накопитель ${index + 1}`;
                            const imgSrc = storage.image ? 
                                `source/${category.key}/${storage.image}` : 
                                `source/icons/${category.icon}`;
                            
                            iconsHTML += `
                                <div class="mini-icon-slot storage-icon" title="${title}">
                                    <img src="${imgSrc}" alt="${title}" 
                                        onerror="this.src='source/icons/${category.icon}'">
                                    ${index === 0 && item.length > maxToShow ? 
                                        `<span class="storage-count">+${item.length - maxToShow}</span>` : ''}
                                </div>
                            `;
                        }
                    });
                }
            } 
            else {
                if (item && typeof item === 'object' && item.id) {
                    const title = item.name || category.name;
                    const imgSrc = item.image ? 
                        (item.image.startsWith('http://') || item.image.startsWith('https://') ? 
                            item.image : 
                            `source/${category.key}/${item.image}`) : 
                        `source/icons/${category.icon}`;
                    
                    iconsHTML += `
                        <div class="mini-icon-slot" title="${title}">
                            <img src="${imgSrc}" alt="${title}" 
                                onerror="this.src='source/icons/${category.icon}'">
                        </div>
                    `;
                }
            }
        });
        
        return iconsHTML;
    }
    
    getImagePath(imageName, category) {
        if (!imageName) return `source/icons/${category}_icon.png`;
        
        imageName = imageName.trim();
        
        if (imageName.startsWith('http://') || 
            imageName.startsWith('https://') || 
            imageName.startsWith('data:')) {
            return imageName;
        }
        
        return `source/${category}/${imageName}`;
    }

    async deleteBuild(id) {
        if (!confirm('Вы уверены, что хотите удалить эту сборку?')) return;
        
        try {
            const response = await fetch(`${this.API_BASE_URL}delete_build`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Сборка успешно удалена');
                await this.logActivity('build_delete', `Удалена сборка ID: ${id}`);
                this.loadBuilds();
            } else {
                this.showError(data.message || 'Ошибка удаления');
            }
        } catch (error) {
            this.showError('Ошибка удаления сборки');
        }
    }

    renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Нет пользователей</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const buildsCount = user.builds_count || 0;
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>
                    <select class="role-select" data-user-id="${user.id}" onchange="adminPanel.updateUserRole(${user.id}, this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                <td>${buildsCount}</td>
                <td>
                    <span class="badge badge-success">Активен</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-delete" onclick="adminPanel.deleteUser(${user.id})" title="Удалить">
                            <span>🗑️</span>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    renderComponentsTable(components, totalItems = 0) {
        const tbody = document.getElementById('components-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (components.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Компоненты не найдены</td></tr>';
            this.renderPagination(0, 1, 10);
            return;
        }
        
        components.forEach(component => {
            const row = document.createElement('tr');
            
            const imagePath = component.image 
                ? (component.image.startsWith('http://') || component.image.startsWith('https://') 
                    ? component.image 
                    : `source/${component.category_slug || 'components'}/${component.image}`)
                : 'source/icons/component_placeholder.png';
            
            row.innerHTML = `
                <td>${component.id}</td>
                <td>
                    <div class="component-info">
                        <img src="${imagePath}" alt="${this.escapeHtml(component.name)}" 
                             class="component-thumb" 
                             onerror="this.src='source/icons/component_placeholder.png'">
                        <div>
                            <strong>${this.escapeHtml(component.name)}</strong>
                            <div class="text-muted small">
                                ${this.escapeHtml(component.description || '').substring(0, 50)}
                                ${component.description && component.description.length > 50 ? '...' : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${this.componentTypes[component.category_slug] || component.category_slug || 'Неизвестно'}</td>
                <td>
                    <div class="component-specs">
                        <div><small>${component.socket || '—'}</small></div>
                        <div><small>${component.memory_type || '—'}</small></div>
                    </div>
                </td>
                <td class="text-right">${this.formatPrice(component.price)} ₽</td>
                <td>
                    <span class="status-badge ${component.is_active ? 'active' : 'inactive'}">
                        ${component.is_active ? 'Активен' : 'Не активен'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="adminPanel.editComponent(${component.id})" 
                                title="Редактировать">
                            Редактировать
                        </button>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="adminPanel.deleteComponent(${component.id})" 
                                title="Удалить">
                            Удалить
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" 
                                onclick="adminPanel.toggleComponent(${component.id}, ${component.is_active})" 
                                title="${component.is_active ? 'Деактивировать' : 'Активировать'}">
                            ${component.is_active ? '⛔' : '✅'}
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        this.renderPagination(totalItems, this.filters.page, this.filters.limit);
    }

    renderPagination(totalItems, currentPage, itemsPerPage) {
        const pagination = document.getElementById('components-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = `<div class="pagination">`;
        
        html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
                         onclick="adminPanel.changePage(${currentPage - 1})" 
                         ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                                 onclick="adminPanel.changePage(${i})">${i}</button>`;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                html += `<span class="page-dots">...</span>`;
            }
        }
        
        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                         onclick="adminPanel.changePage(${currentPage + 1})" 
                         ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
        
        html += `</div>`;
        
        pagination.innerHTML = html;
    }

    changePage(page) {
        this.filters.page = page;
        this.applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async editComponent(id) {
        try {
            this.showLoader('Загрузка компонентов...');
            
            const response = await fetch(`${this.API_BASE_URL}get_components`);
            if (!response.ok) throw new Error('ошибка загрузки компонентов');
            
            const data = await response.json();
            this.hideLoader();
            
            if (data.success && data.components) {
                const component = data.components.find(comp => parseInt(comp.id) === parseInt(id));
                if (component) {
                    this.showEditComponentModal(component);
                } else {
                    this.showError('компонент не найден');
                }
            } else {
                this.showError(data.message || 'ошибка загрузки компонентов');
            }
            
        } catch (error) {
            this.hideLoader();
            this.showError('ошибка загрузки данных компонента');
        }
    }

    showEditComponentModal(component) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'edit-component-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Редактировать компонент</h3>
                    <span class="close-button" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="edit-component-form" class="admin-form">
                        <input type="hidden" name="id" value="${component.id}">
                        
                        <div class="form-group">
                            <label>Категория:</label>
                            <select name="category" required disabled>
                                <option value="${component.category_slug}">
                                    ${this.componentTypes[component.category_slug] || component.category_slug}
                                </option>
                            </select>
                            <small class="form-text">Категория не может быть изменена</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Название:</label>
                            <input type="text" name="name" value="${this.escapeHtml(component.name)}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Описание:</label>
                            <textarea name="description" rows="3">${this.escapeHtml(component.description || '')}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Цена (₽):</label>
                            <input type="number" name="price" value="${component.price}" required min="0" step="0.01">
                        </div>
                        
                        <div class="form-group">
                            <label>Изображение:</label>
                            <input type="text" name="image" value="${this.escapeHtml(component.image || '')}" 
                                placeholder="URL или имя файла">
                            <small class="form-text">
                                Введите URL (ссылкой) или имя файла из папки source/категория/
                            </small>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Сокет:</label>
                                <input type="text" name="socket" value="${this.escapeHtml(component.socket || '')}">
                            </div>
                            
                            <div class="form-group">
                                <label>Тип памяти:</label>
                                <input type="text" name="memory_type" value="${this.escapeHtml(component.memory_type || '')}">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Мощность (Вт):</label>
                                <input type="number" name="wattage" value="${component.wattage || ''}" min="0">
                            </div>
                            
                            <div class="form-group">
                                <label>Ёмкость (ГБ):</label>
                                <input type="number" name="capacity" value="${component.capacity || ''}" min="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Критические характеристики (JSON массив):</label>
                            <textarea name="critical_specs" rows="3">${this.formatJSONForTextarea(component.critical_specs)}</textarea>
                            <small class="form-text">Формат: ["характеристика1", "характеристика2"]</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Флаги совместимости (JSON массив):</label>
                            <textarea name="compatibility_flags" rows="3">${this.formatJSONForTextarea(component.compatibility_flags)}</textarea>
                            <small class="form-text">Формат: ["флаг1", "флаг2"]</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Статус:</label>
                            <select name="is_active">
                                <option value="1" ${component.is_active ? 'selected' : ''}>Активен</option>
                                <option value="0" ${!component.is_active ? 'selected' : ''}>Не активен</option>
                            </select>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                            <button type="button" class="btn btn-secondary" 
                                    onclick="this.closest('.modal').remove()">Отмена</button>
                            <button type="button" class="btn btn-danger" 
                                    onclick="adminPanel.deleteComponent(${component.id}, true)">Удалить</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#edit-component-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateComponent(new FormData(form));
        });
    }

    async updateComponent(formData) {
        try {
            const componentData = {
                id: parseInt(formData.get('id')),
                name: formData.get('name'),
                description: formData.get('description') || '',
                price: parseFloat(formData.get('price')),
                image: formData.get('image') || '',
                socket: formData.get('socket') || null,
                memory_type: formData.get('memory_type') || null,
                wattage: formData.get('wattage') ? parseInt(formData.get('wattage')) : null,
                capacity: formData.get('capacity') ? parseInt(formData.get('capacity')) : null,
                is_active: formData.get('is_active') === '1' ? 1 : 0
            };
            

            const imageValue = formData.get('image') || '';
            if (imageValue && 
                !imageValue.startsWith('http://') && 
                !imageValue.startsWith('https://') && 
                imageValue.includes('.')) {
                componentData.image = imageValue;
            } else {
                componentData.image = imageValue;
            }
            const criticalSpecsText = formData.get('critical_specs');
            if (criticalSpecsText && criticalSpecsText.trim()) {
                try {
                    componentData.critical_specs = JSON.parse(criticalSpecsText);
                } catch (e) {
                    this.showError('Ошибка в critical_specs');
                    return;
                }
            }
            
            const compatibilityFlagsText = formData.get('compatibility_flags');
            if (compatibilityFlagsText && compatibilityFlagsText.trim()) {
                try {
                    componentData.compatibility_flags = JSON.parse(compatibilityFlagsText);
                } catch (e) {
                    this.showError('Ошибка в compatibility_flags');
                    return;
                }
            }
            
            const response = await fetch(`${this.API_BASE_URL}update_component`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(componentData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('компонент успешно обновлен');
                await this.logActivity('component_edit', `Обновлён компонент ID: ${componentData.id}`);
                document.getElementById('edit-component-modal')?.remove();
                this.loadComponents();
            } else {
                this.showError(data.message || 'ошибка обновления');
            }
            
        } catch (error) {
            this.showError('Ошибка обновления компонента');
        }
    }

    async deleteComponent(id, fromModal = false) {
        if (!fromModal && !confirm('Вы уверены, что хотите удалить этот компонент?')) {
            return;
        }
        
        if (fromModal) {
            if (!confirm('Вы уверены, что хотите удалить этот компонент?\nЭто действие нельзя отменить.')) {
                return;
            }
            document.getElementById('edit-component-modal')?.remove();
        }
        
        try {
            const response = await fetch(`${this.API_BASE_URL}delete_component`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Компонент успешно удален');
                await this.logActivity('component_delete', `Удалён компонент ID: ${id}`);
                this.loadComponents();
            } else {
                this.showError(data.message || 'Ошибка удаления');
            }
            
        } catch (error) {
            this.showError('Ошибка удаления компонента');
        }
    }

    async toggleComponent(id, currentStatus) {
        try {
            const response = await fetch(`${this.API_BASE_URL}toggle_component`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: id, 
                    is_active: !currentStatus 
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showSuccess(`Компонент ${!currentStatus ? 'активирован' : 'деактивирован'}`);
                const action = !currentStatus ? 'активирован' : 'деактивирован';
                await this.logActivity('component_toggle', `Компонент ID:${id} ${action}`);
                this.loadComponents();
            } else {
                this.showError(data.message || 'Ошибка изменения статуса');
            }
        } catch (error) {
            this.showError('Ошибка изменения статуса');
        }
    }

    async updateUserRole(userId, newRole) {
        try {
            const response = await fetch(`${this.API_BASE_URL}update_user_role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    user_id: userId, 
                    role: newRole 
                })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showSuccess(`Роль пользователя изменена на "${newRole === 'admin' ? 'Администратор' : 'Пользователь'}"`);
                await this.logActivity('user_role_change', `ID пользователя: ${userId}, новая роль: ${newRole}`);

                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                if (currentUser.id === userId) {
                    currentUser.role = newRole;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }
                
                this.loadUsers();
            } else {
                this.showError(data.message || 'Ошибка изменения роли');
            }
        } catch (error) {
            this.showError('Ошибка изменения роли пользователя');
        }
    }

    async deleteUser(id) {
        if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
        
        try {
            const response = await fetch(`${this.API_BASE_URL}delete_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Пользователь успешно удален');
                await this.logActivity('user_delete', `Удалён пользователь ID: ${id}`);
                this.loadUsers();
            } else {
                this.showError(data.message || 'Ошибка удаления');
            }
        } catch (error) {
            this.showError('Ошибка удаления пользователя');
        }
    }

    showAddComponentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'add-component-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Добавить компоненты</h3>
                    <span class="close-button" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="manual">Вручную</button>
                        <button class="tab-btn" data-tab="json">Импорт JSON</button>
                        <button class="tab-btn" data-tab="bulk">Массовый импорт</button>
                    </div>
                    
                    <div class="tab-content active" id="tab-manual">
                        <form id="add-component-form" class="admin-form">
                            <div class="form-group">
                                <label>Категория:</label>
                                <select id="component-category-modal" name="category" required>
                                    <option value="">Выберите категорию</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Название:</label>
                                <input type="text" name="name" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Цена (₽):</label>
                                <input type="number" name="price" required min="0">
                            </div>
                            
                            <div class="form-group">
                                <label>Изображение:</label>
                                <input type="text" name="image" 
                                    placeholder="Ссылкой или имя файла (например: cpu_amd.png)">
                                <small class="form-text">
                                    Можно указать URL или имя файла из папки source/категория/
                                </small>
                            </div>
                            
                            <div class="form-group">
                                <label>Сокет (для CPU/MB):</label>
                                <input type="text" name="socket" placeholder="AM4, LGA1700 и т.д.">
                            </div>
                            
                            <div class="form-group">
                                <label>Тип памяти (для RAM/MB):</label>
                                <select name="memory_type">
                                    <option value="">Не указан</option>
                                    <option value="DDR4">DDR4</option>
                                    <option value="DDR5">DDR5</option>
                                </select>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Мощность (Вт):</label>
                                    <input type="number" name="wattage" min="0">
                                </div>
                                
                                <div class="form-group">
                                    <label>Ёмкость (ГБ):</label>
                                    <input type="number" name="capacity" min="0">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Критические характеристики (JSON массив):</label>
                                <textarea name="critical_specs" placeholder='["6 ядер", "12 потоков", "3.7 ГГц"]' rows="3"></textarea>
                                <small class="form-text">В формате JSON массива: ["характеристика1", "характеристика2"]</small>
                            </div>
                            
                            <div class="form-group">
                                <label>Флаги совместимости (JSON массив):</label>
                                <textarea name="compatibility_flags" placeholder='["AM4", "DDR4"]' rows="3"></textarea>
                                <small class="form-text">В формате JSON массива: ["флаг1", "флаг2"]</small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Добавить</button>
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="tab-content" id="tab-json">
                        <div class="upload-area" id="json-upload-area">
                            <div class="upload-icon">📁</div>
                            <h4>Перетащите JSON файл сюда</h4>
                            <p>или</p>
                            <input type="file" id="json-file-input" accept=".json" 
                                onchange="adminPanel.handleFileUpload(event)" 
                                style="display: none;">
                            <label for="json-file-input" class="btn btn-primary">
                                Выберите файл
                            </label>
                            <p class="upload-hint">Поддерживается структура компонентов по категориям</p>
                        </div>
                        
                        <div class="json-preview" id="json-preview" style="display: none;">
                            <h4>Предпросмотр данных</h4>
                            <pre id="json-preview-content"></pre>
                            <button class="btn btn-success" onclick="adminPanel.confirmImport()">Импортировать</button>
                        </div>
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button class="btn btn-secondary" onclick="adminPanel.downloadTemplate()">
                                Скачать шаблон
                            </button>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="tab-bulk">
                        <div class="form-group">
                            <label>JSON данные (полная структура):</label>
                            <textarea id="bulk-json-input" placeholder='{
    "components": {
        "cpus": [...],
        "motherboards": [...],
    }
}' rows="15"></textarea>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-primary" onclick="adminPanel.importBulkJSON()">
                                Импортировать все
                            </button>
                            <button class="btn btn-secondary" onclick="adminPanel.validateJSON()">
                                Проверить JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        this.initTabs(modal);
        this.initCategorySelect(modal);
        
        const form = modal.querySelector('#add-component-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitComponentForm(new FormData(form));
        });
        
        this.initDragAndDrop(modal);
    }

    initTabs(modal) {
        modal.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modal.querySelector(`#tab-${tab}`).classList.add('active');
            });
        });
    }

    initCategorySelect(modal) {
        const categorySelect = modal.querySelector('#component-category-modal');
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        for (const [key, value] of Object.entries(this.componentTypes)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            categorySelect.appendChild(option);
        }
    }

    initDragAndDrop(modal) {
        const uploadArea = modal.querySelector('#json-upload-area');
        const fileInput = modal.querySelector('#json-file-input');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            });
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            });
        });
        
        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });
    }

    async submitComponentForm(formData) {
        try {
            const componentData = {
                category_slug: formData.get('category'),
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                image: formData.get('image') || '',
                socket: formData.get('socket') || '',
                memory_type: formData.get('memory_type') || '',
                wattage: formData.get('wattage') ? parseInt(formData.get('wattage')) : null,
                capacity: formData.get('capacity') ? parseInt(formData.get('capacity')) : null
            };
            
            const imageValue = formData.get('image') || '';
                if (imageValue && 
                    !imageValue.startsWith('http://') && 
                    !imageValue.startsWith('https://') && 
                    imageValue.includes('.')) {
                    componentData.image = imageValue;
                } else {
                    componentData.image = imageValue;
                }

            const criticalSpecsText = formData.get('critical_specs');
            if (criticalSpecsText && criticalSpecsText.trim()) {
                try {
                    componentData.critical_specs = JSON.parse(criticalSpecsText);
                } catch (e) {
                    this.showError('Ошибка в critical_specs');
                    return;
                }
            }
            
            const compatibilityFlagsText = formData.get('compatibility_flags');
            if (compatibilityFlagsText && compatibilityFlagsText.trim()) {
                try {
                    componentData.compatibility_flags = JSON.parse(compatibilityFlagsText);
                } catch (e) {
                    this.showError('Ошибка в compatibility_flags');
                    return;
                }
            }
            
            const response = await fetch(`${this.API_BASE_URL}add_component`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(componentData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('компонент успешно добавлен');
                await this.logActivity('component_add', `добавлен компонент: ${componentData.name}`);
                document.getElementById('add-component-modal')?.remove();
                this.loadComponents();
            } else {
                this.showError(data.message || 'ошибка добавления');
            }
            
        } catch (error) {
            this.showError('ошибка добавления компонента');
        }
    }

    async importBulkJSON() {
        const textarea = document.getElementById('bulk-json-input');
        const jsonText = textarea.value.trim();
        
        if (!jsonText) {
            this.showError('Введите в формате JSON данные');
            return;
        }
        
        try {
            const jsonData = JSON.parse(jsonText);
            await this.importFromJSON(jsonData);
        } catch (error) {
            this.showError('Ошибка парсинга JSON');
        }
    }

    validateJSON() {
        const textarea = document.getElementById('bulk-json-input');
        const jsonText = textarea.value.trim();
        
        if (!jsonText) {
            this.showError('Введите в формате JSON данные');
            return;
        }
        
        try {
            const jsonData = JSON.parse(jsonText);
            const componentCount = this.countComponents(jsonData);
            
            this.showMessage(
                `Найдено компонентов:\n` +
                Object.entries(componentCount).map(([cat, count]) => `• ${this.componentTypes[cat] || cat}: ${count}`).join('\n'),
                'success'
            );
            
        } catch (error) {
            this.showError('Ошибка в JSON');
        }
    }

    countComponents(jsonData) {
        const counts = {};
        if (jsonData.components) {
            for (const [category, components] of Object.entries(jsonData.components)) {
                counts[category] = Array.isArray(components) ? components.length : 0;
            }
        }
        return counts;
    }

    async importFromJSON(jsonData) {
        try {
            this.showLoader('Импорт компонентов из JSON...');
            
            if (!jsonData.components) {
                throw new Error('формат JSON не верный: отсутствует секция components');
            }
            
            let importedCount = 0;
            let errors = [];
            
            const categoryMap = {
                'cpus': 'cpus',
                'motherboards': 'motherboards',
                'rams': 'rams',
                'gpus': 'gpus',
                'storages': 'storages',
                'psus': 'psus',
                'cases': 'cases',
                'coolers': 'coolers'
            };
            
            for (const [categorySlug, components] of Object.entries(jsonData.components)) {
                for (const component of components) {
                    try {
                        const componentData = this.prepareComponentForImport(component, categorySlug);
                        
                        const response = await fetch(`${this.API_BASE_URL}add_component`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(componentData)
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            importedCount++;
                        } else {
                            errors.push({
                                component: component.name,
                                error: result.message
                            });
                        }
                        
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                    } catch (error) {
                        errors.push({
                            component: component.name,
                            error: error.message
                        });
                    }
                }
            }
            
            this.hideLoader();
            
            if (errors.length === 0) {
                this.showSuccess(`Успешно импортировано ${importedCount} компонентов`);
                await this.logActivity('import_components', `Импортировано ${importedCount} компонентов`);
                this.loadComponents();
            } else {
                this.showMessage(
                    `импортировано ${importedCount} компонентов, ${errors.length} ошибок`,
                    'warning'
                );
            }
            
            return { importedCount, errors };
            
        } catch (error) {
            this.hideLoader();
            this.showError('ошибка импорта');
            return { importedCount: 0, errors: [error.message] };
        }
    }

    prepareComponentForImport(component, categorySlug) {
        const componentData = {
            category_slug: categorySlug,
            name: component.name,
            price: component.price,
            image: component.image || '',
        };
        
        componentData.description = `импортирован: ${component.name}`;
        
        if (component.critical_specs && Array.isArray(component.critical_specs)) {
            componentData.critical_specs = component.critical_specs;
        }
        
        if (component.compatibility_flags && Array.isArray(component.compatibility_flags)) {
            componentData.compatibility_flags = component.compatibility_flags;
        }
        
        switch(categorySlug) {
            case 'cpus':
                componentData.socket = component.socket || '';
                componentData.wattage = component.wattage || null;
                componentData.description = `Процессор ${component.name}`;
                break;
                
            case 'motherboards':
                componentData.socket = component.socket || '';
                componentData.memory_type = component.memoryType || component.type || '';
                componentData.form_factor = component.formFactor || '';
                componentData.description = `Материнская плата ${component.name}`;
                break;
                
            case 'rams':
                componentData.memory_type = component.type || '';
                componentData.speed = component.speed || null;
                componentData.capacity = component.size || null;
                componentData.description = `Оперативная память ${component.name}`;
                break;
                
            case 'gpus':
                componentData.wattage = component.wattage || null;
                componentData.description = `Видеокарта ${component.name}`;
                break;
                
            case 'storages':
                componentData.type = component.type || '';
                componentData.capacity = component.capacity || null;
                componentData.description = `Накопитель ${component.name}`;
                break;
                
            case 'psus':
                componentData.wattage = component.wattage || null;
                componentData.efficiency = component.efficiency || '';
                componentData.form_factor = component.formFactor || '';
                componentData.description = `Блок питания ${component.name}`;
                break;
                
            case 'cases':
                componentData.form_factor = component.formFactor || '';
                componentData.description = `Корпус ${component.name}`;
                break;
                
            case 'coolers':
                componentData.type = component.type || '';
                if (component.socket) {
                    if (Array.isArray(component.socket)) {
                        componentData.socket = component.socket.join(', ');
                    } else {
                        componentData.socket = component.socket.toString();
                    }
                }
                componentData.tdp = component.tdp || null;
                componentData.description = `Охлаждение ${component.name}`;
                break;
        }
        
        Object.keys(componentData).forEach(key => {
            if (componentData[key] === null || componentData[key] === undefined || componentData[key] === '') {
                delete componentData[key];
            }
        });
        
        return componentData;
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            this.showError('Пожалуйста, выберите JSON файл');
            return;
        }
        
        try {
            this.showLoader('Чтение файла...');
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    if (!confirm(`Найдено компонентов:\n` +
                        `• Процессоры: ${jsonData.components?.cpus?.length || 0}\n` +
                        `• Материнские платы: ${jsonData.components?.motherboards?.length || 0}\n` +
                        `• Оперативная память: ${jsonData.components?.rams?.length || 0}\n` +
                        `• Видеокарты: ${jsonData.components?.gpus?.length || 0}\n` +
                        `• Накопители: ${jsonData.components?.storages?.length || 0}\n` +
                        `• Блоки питания: ${jsonData.components?.psus?.length || 0}\n` +
                        `• Корпуса: ${jsonData.components?.cases?.length || 0}\n` +
                        `• Охлаждение: ${jsonData.components?.coolers?.length || 0}\n\n` +
                        `Импортировать все компоненты?`)) {
                        this.hideLoader();
                        return;
                    }
                    
                    await this.importFromJSON(jsonData);
                    
                } catch (error) {
                    this.hideLoader();
                    this.showError('Ошибка парсинга JSON');
                }
            };
            
            reader.onerror = () => {
                this.hideLoader();
                this.showError('Ошибка чтения файла');
            };
            
            reader.readAsText(file);
            
        } catch (error) {
            this.hideLoader();
            this.showError('Ошибка загрузки файла');
        }
    }

    downloadTemplate() {
        const template = {
            "metadata": {
                "total_components": {
                    "cpus": 8,
                    "motherboards": 6,
                    "rams": 5,
                    "gpus": 6,
                    "storages": 4,
                    "psus": 4,
                    "cases": 3,
                    "coolers": 4
                }
            },
            "components": {
                "cpus": [
                    {
                        "id": 1,
                        "name": "Пример процессора",
                        "category": "cpu",
                        "price": 25000,
                        "image": "cpu_example.png",
                        "compatibility_flags": ["AM4", "DDR4"],
                        "critical_specs": ["6 ядер", "12 потоков", "3.7 ГГц"],
                        "socket": "AM4",
                        "wattage": 65
                    }
                ],
                "motherboards": [
                    {
                        "id": 1,
                        "name": "Пример материнской платы",
                        "category": "motherboard",
                        "price": 15000,
                        "image": "mb_example.png",
                        "compatibility_flags": ["AM4", "DDR4"],
                        "critical_specs": ["Socket AM4", "DDR4", "2 слота M.2"],
                        "socket": "AM4",
                        "memoryType": "DDR4",
                        "formFactor": "ATX"
                    }
                ]
            }
        };
        
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'components_template.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Шаблон скачан!', 'info');
    }

    bindEvents() {
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => this.loadDashboardData());
        document.getElementById('refresh-components')?.addEventListener('click', () => this.loadComponents());
        document.getElementById('refresh-users')?.addEventListener('click', () => this.loadUsers());
        document.getElementById('refresh-builds')?.addEventListener('click', () => this.loadBuilds());
        
        document.getElementById('add-component')?.addEventListener('click', () => this.showAddComponentModal());
        
        this.initFilters();
        
        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    showLoader(text = 'Загрузка...') {
        const loader = document.getElementById('global-loader');
        const loaderText = loader?.querySelector('.loader-text');
        if (loaderText) loaderText.textContent = text;
        loader?.classList.remove('hidden');
    }

    hideLoader() {
        const loader = document.getElementById('global-loader');
        loader?.classList.add('hidden');
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert(message);
    }

    showMessage(message, type = 'info') {
        if (type === 'info') {
            alert('ℹ ' + message);
        } else if (type === 'success') {
            this.showSuccess(message);
        } else {
            this.showError(message);
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price || 0);
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatJSONForTextarea(data) {
        if (!data) return '';
        
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return data;
            }
        }
        
        if (Array.isArray(data)) {
            return JSON.stringify(data, null, 2);
        }
        
        return '';
    }

    async loadSectionData(section) {
        switch(section) {
            case 'dashboard': await this.loadDashboardData(); break;
            case 'components': 
                await this.loadComponents(); 
                break;
            case 'users': 
                await this.loadUsers(); 
                break;
            case 'builds': 
                await this.loadBuilds();
                break;
        }
    }

    countComponents(components) {
        if (!components) return '0 компонентов';
        
        let count = 0;
        Object.values(components).forEach(comp => {
            if (Array.isArray(comp)) {
                count += comp.length;
            } else if (comp && typeof comp === 'object') {
                count++;
            }
        });
        
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;
        
        let word = 'компонентов';
        if (lastDigit === 1 && lastTwoDigits !== 11) word = 'компонент';
        if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) word = 'компонента';
        
        return `${count} ${word}`;
    }
    
}



document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});