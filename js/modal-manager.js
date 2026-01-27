class ModalManager {
    constructor(dataManager, configurator) {
        this.dataManager = dataManager;
        this.configurator = configurator;
        this.currentComponentType = null;
        this.currentFilters = {};
        this.currentPage = 1;
        this.itemsPerPage = 5;
        
        this.categoryMapping = {
            'cpus': 'cpus',
            'motherboards': 'motherboards',
            'rams': 'rams',
            'gpus': 'gpus',
            'storages': 'storages',
            'psus': 'psus',
            'cases': 'cases',
            'coolers': 'coolers'
        };

        this.init();
    }

    init() {
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modal = document.getElementById('component-modal');
        const closeButton = modal.querySelector('.close-button');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hide_component_modal();
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hide_component_modal();
            }
        });
    }

    async showComponentModal(componentType, filters = {}) {
        this.currentComponentType = componentType;
        
        this.currentFilters = this.getSmartFilters(componentType, filters);
        this.currentPage = 1;
        
        const modal = document.getElementById('component-modal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            const typeNames = {
                'cpus': 'процессор',
                'motherboards': 'материнскую плату',
                'rams': 'оперативную память',
                'gpus': 'видеокарту',
                'storages': 'накопитель',
                'psus': 'блок питания',
                'cases': 'корпус',
                'coolers': 'охлаждение'
            };
            modalTitle.textContent = `Выберите ${typeNames[componentType] || componentType}`;
        }
        
        const modalBody = document.getElementById('modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="modal-loading">
                    <div class="spinner"></div>
                    <p>Загрузка компонентов...</p>
                </div>
            `;
        }
        
        await this.loadComponentPage(componentType, 1, this.currentFilters);
    }

    getSmartFilters(componentType, filters) {
        const smartFilters = {};
        
        switch(componentType) {
            case 'motherboards':
                if (filters.socket) {
                    smartFilters.socket = filters.socket;
                }
                break;
                
            case 'rams':
                break;
                
            case 'coolers':
                break;
                
            case 'cases':
                break;
                
            case 'psus':
                if (filters.min_wattage) {
                    smartFilters.min_wattage = filters.min_wattage;
                }
                break;
        }
        
        return smartFilters;
    }

    async loadComponentPage(componentType, page = 1, filters = {}) {
        try {
            
            const pageData = await this.dataManager.getComponentsPage(
                componentType, 
                page, 
                filters, 
                this.itemsPerPage
            );
            
            if (!pageData) {
                return;
            }
            
            let components = [];
            
            if (pageData.components && Array.isArray(pageData.components)) {
                components = pageData.components;
            } else if (Array.isArray(pageData)) {
                components = pageData;
            } else if (pageData.success && pageData.components) {
                components = pageData.components;
            } else if (pageData.data && Array.isArray(pageData.data)) {
                components = pageData.data;
            }
            

            if (components.length > this.itemsPerPage) {
                components = components.slice(0, this.itemsPerPage);
            }
            
            components = components.map(component => {
                const isCompatible = this.checkCompatibility(component);
                return {
                    ...component,
                    isCompatible: isCompatible
                };
            });
            
             this.renderComponents(components, {
                currentPage: pageData.currentPage || page,
                totalPages: pageData.totalPages || Math.ceil(components.length / this.itemsPerPage) || 1,
                totalItems: pageData.totalItems || components.length,
                hasNext: pageData.hasNext || (page < (pageData.totalPages || 1)),
                hasPrev: pageData.hasPrev || (page > 1)
            });
            
        } catch (error) {
            this.renderError('ошибка: ' + error.message);
        }
    }

    renderComponents(components, pageData) {
        const modalBody = document.getElementById('modal-body');
    
        if (!Array.isArray(components)) {
            components = [];
        }
        
        let html = `
            <div class="components-modal-content">
                <div class="components-search">
                    <input type="text" 
                        id="modal-search-input" 
                        placeholder="Поиск ${this.getComponentTypeName(this.currentComponentType)}..." 
                        class="search-input">
                    <button onclick="window.modalManager.handleSearch()" class="btn-search">
                        Найти
                    </button>
                </div>
        `;
        
        html += `
                <div class="components-list-info">
                    Найдено: ${pageData.totalItems} компонентов
                </div>
                
                <div class="components-grid" id="modal-components-list">
        `;
        
        if (!components || components.length === 0) {
            html += `
                <div class="no-components">
                    <div class="no-components-icon">😕</div>
                    <h4>Компоненты не найдены</h4>
                    <p>Попробуйте изменить поисковый запрос или фильтры</p>
                </div>
            `;
        } else {
            components.forEach(component => {
                if (component) {
                    html += this.renderComponentCard(component);
                }
            });
        }

        const hasActiveFilters = Object.keys(this.currentFilters).length > 0 && 
                            !(Object.keys(this.currentFilters).length === 1 && this.currentFilters.search);
        
        if (hasActiveFilters) {
            html += `
                <div class="filter-clear-section">
                    <button class="btn-clear-filters" onclick="window.modalManager.clearFilters()">
                        <span class="clear-icon">×</span>
                        Очистить фильтры
                    </button>
                </div>
            `;
        }
        
        
        html += `
                </div>
        `;
        
        if (pageData.totalItems > 0) {
            html += this.renderPagination(pageData);
        }
        
        html += `</div>`;
        
        modalBody.innerHTML = html;

        this.currentPage = pageData.currentPage || this.currentPage;
        
        const searchInput = document.getElementById('modal-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    }
    renderComponentCard(component) {    
        const price = component.price ? this.formatPrice(component.price) : 'Цена не указана';
        const name = component.name || 'Без названия';
        const specs = component.critical_specs ? 
            (Array.isArray(component.critical_specs) ? 
                component.critical_specs.slice(0, 2).join(' • ') : 
                component.critical_specs) : 
            '';
        
        const currentType = this.currentComponentType;
        const componentId = component.id;
        
        const isCompatible = this.checkCompatibility(component);
        const compatibilityClass = isCompatible ? 'compatible' : 'incompatible';
        
        let compatibilityText = 'Совместим';
        let compatibilityIcon = '✓';
        
        if (!isCompatible) {
            compatibilityIcon = '⚠';
            
            const currentBuild = window.configurator?.currentBuild;
            
            if (currentType === 'rams' && currentBuild?.motherboards?.memory_type && component.type) {
                const mbMemoryType = currentBuild.motherboards.memory_type;
                const ramType = component.type;
                
                if (ramModules > mbSlots) {
                    compatibilityText = `Требуется ${ramModules} слота, на плате только ${mbSlots}`;
                } else {
                    compatibilityText = 'Несовместимый тип памяти';
                }

                if ((mbMemoryType.includes('DDR4') && ramType.includes('DDR5')) || 
                    (mbMemoryType.includes('DDR5') && ramType.includes('DDR4'))) {
                    compatibilityText = `Несовместимо: материнская плата поддерживает ${mbMemoryType}`;
                } else {
                    compatibilityText = `Несовместимо с материнской платой (${mbMemoryType})`;
                }
            } 
            else if (currentType === 'motherboards' && currentBuild?.cpus?.socket && component.socket) {
                compatibilityText = `Несовместимо: процессор требует сокет ${currentBuild.cpus.socket}`;
            }
            else if (currentType === 'cpus' && currentBuild?.motherboards?.socket && component.socket) {
                compatibilityText = `Несовместимо: плата требует сокет ${currentBuild.motherboards.socket}`;
            } 
            else if (currentType === 'coolers' && currentBuild?.cpus?.socket && component.socket) {
                compatibilityText = `Возможно не поддерживает сокет ${currentBuild.cpus.socket}`;
            }
            else if (currentType === 'cases' && currentBuild?.motherboards?.form_factor) {
                compatibilityText = `Проверьте поддержку платы ${currentBuild.motherboards.form_factor}`;
            }
            else {
                compatibilityText = 'Возможна несовместимость';
            }
        }
        
        return `
            <div class="component-card-modal ${compatibilityClass}" 
                onclick="window.modalManager.selectComponent(${componentId}, '${currentType}')">
                <div class="component-card-image">
                    <img src="${this.getComponentImagePath(component)}" alt="${name}" 
                        onerror="this.onerror=null; this.parentElement.innerHTML='${this.getComponentIcon(component)}';">
                </div>
                <div class="component-card-info">
                    <div class="component-card-name">${name}</div>
                    ${specs ? `<div class="component-card-specs">${specs}</div>` : ''}
                    <div class="compatibility-indicator ${isCompatible ? 'compatible' : 'incompatible'}">
                        ${compatibilityIcon} ${compatibilityText}
                    </div>
                </div>
                <div class="component-card-price-section">
                    <div class="component-card-price">${price} ₽</div>
                    <button class="btn-select-component" 
                            onclick="event.stopPropagation(); window.modalManager.selectComponent(${componentId}, '${currentType}')">
                        ${isCompatible ? 'Выбрать' : 'Выбрать с предупреждением'}
                    </button>
                </div>
            </div>
        `;
    }

    checkCompatibility(component) {
        const componentData = component.component || component;
        if (!window.configurator) return true;
        const currentBuild = window.configurator.currentBuild;


        if (this.currentComponentType === 'motherboards' && currentBuild?.cpus?.socket && componentData.socket) {
            const cpuSocket = currentBuild.cpus.socket.toUpperCase();
            const mbSocket = String(componentData.socket).toUpperCase();
            
            if (mbSocket !== cpuSocket && !mbSocket.includes(cpuSocket) && !cpuSocket.includes(mbSocket)) {
                return false;
            }
        }

    if (this.currentComponentType === 'cpus' && currentBuild?.motherboards?.socket && componentData.socket) {
        const mbSocket = currentBuild.motherboards.socket.toUpperCase();
        const cpuSocket = String(componentData.socket).toUpperCase();
        
        if (cpuSocket !== mbSocket && !cpuSocket.includes(mbSocket) && !mbSocket.includes(cpuSocket)) {
            return false;
        }
    }

        if (this.currentComponentType === 'rams' && currentBuild?.motherboards?.memory_type) {
            const mbMemoryType = currentBuild.motherboards.memory_type.toUpperCase();
            const ramType = (componentData.type || componentData.memory_type || "").toUpperCase();

            if (ramType) {
                const mbIsDDR4 = mbMemoryType.includes('DDR4');
                const mbIsDDR5 = mbMemoryType.includes('DDR5');
                const ramIsDDR4 = ramType.includes('DDR4');
                const ramIsDDR5 = ramType.includes('DDR5');

                if ((mbIsDDR4 && ramIsDDR5) || (mbIsDDR5 && ramIsDDR4)) {
                    return false; 
                }
            }
        }

        if (this.currentComponentType === 'motherboards' && currentBuild?.rams) {
            const mbType = (componentData.memory_type || "").toUpperCase();
            const ramType = (currentBuild.rams.type || currentBuild.rams.memory_type || "").toUpperCase();

            if (mbType && ramType) {
                if ((mbType.includes('DDR4') && ramType.includes('DDR5')) || 
                    (mbType.includes('DDR5') && ramType.includes('DDR4'))) {
                    return false;
                }
            }
        }
        
        if (this.currentComponentType === 'coolers' && currentBuild?.cpus?.socket && componentData.socket) {
            const cpuSocket = currentBuild.cpus.socket.toUpperCase();
            let coolerSocket = componentData.socket;
            
            let coolerSockets = [];
            if (typeof coolerSocket === 'string') {
                coolerSockets = coolerSocket.split(/[,|]/).map(s => s.trim().toUpperCase());
            } else if (Array.isArray(coolerSocket)) {
                coolerSockets = coolerSocket.map(s => String(s).toUpperCase());
            } else {
                coolerSockets = [String(coolerSocket).toUpperCase()];
            }
            
            const isCompatible = coolerSockets.some(socket => 
                socket === cpuSocket || 
                socket.includes(cpuSocket) || 
                cpuSocket.includes(socket)
            );
            
            if (!isCompatible) {
                return false;
            }
        }
        
        if (this.currentComponentType === 'cases' && currentBuild?.motherboards?.form_factor && componentData.supported_form_factors) {
            const mbFormFactor = currentBuild.motherboards.form_factor.toUpperCase();
            let caseFormFactors = componentData.supported_form_factors;
            
            if (typeof caseFormFactors === 'string') {
                caseFormFactors = caseFormFactors.split(/[,|]/).map(f => f.trim().toUpperCase());
            } else if (Array.isArray(caseFormFactors)) {
                caseFormFactors = caseFormFactors.map(f => String(f).toUpperCase());
            } else {
                caseFormFactors = [String(caseFormFactors).toUpperCase()];
            }
            
            const isCompatible = caseFormFactors.some(factor => {
                const factor_upper = factor.toUpperCase();
                if (factor_upper === mbFormFactor) return true;
                
                const compability_cases = {
                    'E-ATX': ['E-ATX', 'ATX', 'MICRO-ATX', 'MINI-ITX'],
                    'ATX': ['ATX', 'MICRO-ATX', 'MINI-ITX'],
                    'MICRO-ATX': ['MICRO-ATX', 'MINI-ITX'],
                    'MINI-ITX': ['MINI-ITX']
                };
                
                if (compability_cases[factor_upper]) {
                    return compability_cases[factor_upper].includes(mbFormFactor);
                }
                
                return false;
            });
            
            if (!isCompatible) {
                return false;
            }
        }
        
        return true;
    }

    async selectComponent(componentId) {
        const componentType = String(this.currentComponentType).trim();
        
        try {
            const apiCategory = this.categoryMapping[componentType] || 
                            componentType.replace(/s$/, '');
            
            const componentData = await this.dataManager.getComponentDetails(componentId, apiCategory);
            
            if (!componentData) {
                throw new Error('компонент не найден');
            }
            
            if (!componentData.category) {
                componentData.category = componentType.replace(/s$/, '');
            }
            
            this.hide_component_modal();
            
            setTimeout(() => {
                if (window.configurator && window.configurator.selectComponent) {
                    window.configurator.selectComponent(componentType, componentData);
                }
            }, 100);
            
        } catch (error) {
            alert(`ошибка выбора компонента: ${error.message}`);
        }
    }

    handleSearch() {
        const searchInput = document.getElementById('modal-search-input');
        if (!searchInput) return;
        
        const query = searchInput.value.trim();
        
        if (query) {
            this.currentFilters.search = query;
        } else {
            delete this.currentFilters.search;
        }
        
        this.loadComponentPage(this.currentComponentType, 1, this.currentFilters);
    }

    clearFilters() {
        this.currentFilters = {};
        this.loadComponentPage(this.currentComponentType, 1, this.currentFilters);
    }

    renderPagination(pageData) {
        return `
            <div class="modal-pagination">
                <button class="btn-pagination ${!pageData.hasPrev ? 'disabled' : ''}" 
                        onclick="window.modalManager.prevPage()" 
                        ${!pageData.hasPrev ? 'disabled' : ''}>
                    ←
                </button>
                
                <span class="page-info">
                    ${pageData.currentPage} из ${pageData.totalPages}
                </span>
                
                <button class="btn-pagination ${!pageData.hasNext ? 'disabled' : ''}" 
                        onclick="window.modalManager.nextPage()" 
                        ${!pageData.hasNext ? 'disabled' : ''}>
                    →
                </button>
            </div>
        `;
    }

    async nextPage() {
        if (this.currentPage < 100) {
            this.currentPage++;
            await this.loadComponentPage(this.currentComponentType, this.currentPage, this.currentFilters);
        }
    }

    async prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadComponentPage(this.currentComponentType, this.currentPage, this.currentFilters);
        }
    }

    renderError(message) {
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <div class="modal-error">
                <div class="error-icon">⚠️</div>
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button onclick="window.modalManager.retryLoad()" class="btn-retry">
                    Попробовать снова
                </button>
            </div>
        `;
    }

    async retryLoad() {
        await this.loadComponentPage(this.currentComponentType, this.currentPage, this.currentFilters);
    }

    getComponentTypeName(type) {
        const names = {
            'cpus': 'процессор',
            'motherboards': 'материнскую плату', 
            'rams': 'оперативную память',
            'gpus': 'видеокарту',
            'storages': 'накопитель',
            'psus': 'блок питания',
            'cases': 'корпус',
            'coolers': 'охлаждение'
        };
        return names[type] || type;
    }

    getComponentIcon(component) {
        const type = component.category || '';
        const iconMap = {
            'cpu': '⚡',
            'motherboard': '🔌',
            'ram': '💾',
            'gpu': '🎮',
            'storage': '💿',
            'psu': '🔋',
            'cooler': '❄️',
            'case': '🖥️'
        };
        return iconMap[type] || '❓';
    }

    getComponentImagePath(component) {        
        if (window.dataManager && window.dataManager.getComponentImagePath) {
            return window.dataManager.getComponentImagePath(component);
        }
        
        if (!component || !component.image) {
            return 'source/icons/default_component.png';
        }
        
        let imagePath = component.image;
        
        let categoryFolder = this.getCategoryFolder(component);
        
        return `source/${categoryFolder}/${imagePath}`;
    }

    getCategoryFolder(component) {
        if (!component) return 'components';
        
        const typeMap = {
            'cpu': 'cpus',
            'процессор': 'cpus',
            'motherboard': 'motherboards',
            'материнская плата': 'motherboards',
            'ram': 'rams',
            'оперативная память': 'rams',
            'gpu': 'gpus',
            'видеокарта': 'gpus',
            'storage': 'storages',
            'накопитель': 'storages',
            'psu': 'psus',
            'блок питания': 'psus',
            'case': 'cases',
            'корпус': 'cases',
            'cooler': 'coolers',
            'охлаждение': 'coolers'
        };
        
        if (component.category) {
            return typeMap[component.category.toLowerCase()] || component.category;
        }
        
        if (this.currentComponentType) {
            return this.currentComponentType; 
        }
        
        return 'components';
    }

    formatPrice(price) {
        if (!price) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    hide_component_modal() {
        const modal = document.getElementById('component-modal');
        modal.classList.add('hidden');
        this.currentComponentType = null;
        this.currentFilters = {};
        this.currentPage = 1;
    }
}

window.ModalManager = ModalManager;