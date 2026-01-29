class Configurator {
    constructor(dataManager, authManager) {
        this.dataManager = dataManager;
        this.authManager = authManager;
        this.currentBuild = {
            cpus: null,
            motherboards: null,
            rams: null,
            gpus: null,
            storages: [],
            psus: null,
            cases: null,
            coolers: null
        };
        this.compatibilityStatus = {
            isValid: false,
            hasWarnings: false,
            errors: [],
            warnings: []
        };
        
        this.openComponentSelection = this.openComponentSelection.bind(this);
        this.handleAuthSubmit = this.handleAuthSubmit.bind(this);
        
        this.init();
    }

    init() {     
        this.loadBuildFromStorage();
        
        const domLoadedHandler = () => {
            this.renderComponentCards();
            this.calculate_power();
            this.updateCompatibilityStatus();
            this.initEventListeners();
            this.initFavoritesModal();
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', domLoadedHandler);
        } else {
            setTimeout(domLoadedHandler, 100);
        }
    }

    

    renderComponentCards() {
            Object.keys(this.currentBuild).forEach(type => {
            this.renderComponentCard(type);
        });
        
        const componentTypes = [
            { type: 'cpus', name: 'Процессор' },
            { type: 'motherboards', name: 'Материнская плата' },
            { type: 'rams', name: 'Оперативная память' },
            { type: 'gpus', name: 'Видеокарта' },
            { type: 'storages', name: 'Накопители' },
            { type: 'psus', name: 'Блок питания' },
            { type: 'cases', name: 'Корпус' },
            { type: 'coolers', name: 'Охлаждение' }
        ];
        
        const container = document.getElementById('components-table-container');
        if (!container) {
            return;
        }
        
        let html = '';
        
        componentTypes.forEach(typeInfo => {
            if (typeInfo.type === 'storages') {
                html += this.renderStorageComponent(typeInfo, this.currentBuild[typeInfo.type]);
            } else {
                html += this.renderSingleComponent(typeInfo, this.currentBuild[typeInfo.type]);
            }
        });
        
        container.innerHTML = html;
        
        this.updateTotalPriceDisplay();
        this.updateCompatibilityStatus();
    }

    updateTotalPriceDisplay() {
        const totalPrice = this.calculateTotalPrice();
        const totalPriceElement = document.getElementById('total-price');
        
        if (totalPriceElement) {
            totalPriceElement.textContent = this.formatPrice(totalPrice) + ' ₽';
        }
        
        const buildPriceElement = document.getElementById('build-price');
        if (buildPriceElement) {
            buildPriceElement.textContent = this.formatPrice(totalPrice) + ' ₽';
        }
    }

    initFavoritesModal() {
        const modal = document.getElementById('favorites-modal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.close-button');
        
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.add('hidden');
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        const favLink = document.getElementById('favorites-link');
        if (favLink) {
            favLink.onclick = (e) => {
                e.preventDefault();
                this.showFavorites();
            };
        }
    }

    getComponentIconPath(componentType) {
        const iconMap = {
            'cpus': 'source/icons/cpu_icon.png',
            'motherboards': 'source/icons/motherboard_icon.png',
            'rams': 'source/icons/ram_icon.png',
            'gpus': 'source/icons/gpu_icon.png',
            'storages': 'source/icons/hdd_icon.png',
            'psus': 'source/icons/power_supply_icon.png',
            'cases': 'source/icons/pc_case_icon.png',
            'coolers': 'source/icons/cooler_cpu_icon.png'
        };
        
        let path = iconMap[componentType];
        
        if (!path) {
            const alternativeMap = {
                'cpu': 'cpus',
                'motherboard': 'motherboards',
                'ram': 'rams',
                'gpu': 'gpus',
                'storage': 'storages',
                'psu': 'psus',
                'case': 'cases',
                'cooler': 'coolers'
            };
            
            const alternativeType = alternativeMap[componentType];
            if (alternativeType) {
                path = iconMap[alternativeType];
            }
        }
        
        if (!path) {
            path = 'source/icons/default_component.png';
        }
        return path;
    }

    getComponentEmoji(componentType) {
        const emojiMap = {
            'cpus': '⚡',
            'cpu': '⚡',
            'motherboards': '🔌',
            'motherboard': '🔌',
            'rams': '💾',
            'ram': '💾',
            'gpus': '🎮',
            'gpu': '🎮',
            'storages': '💿',
            'storage': '💿',
            'psus': '🔋',
            'psu': '🔋',
            'coolers': '❄️',
            'cooler': '❄️',
            'cases': '🖥️',
            'case': '🖥️'
        };
        return emojiMap[componentType] || '❓';
    }

    initEventListeners() {
        let self = this
        const saveBtn = document.getElementById('save-build-btn');
        if (saveBtn) {
            saveBtn.onclick = (e) => this.saveBuildToServer(e); 
        }
        const resetBtn = document.getElementById('reset-build-btn');
        if (resetBtn) {
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            
            const updatedResetBtn = document.getElementById('reset-build-btn');
            
            updatedResetBtn.addEventListener('click', function resetHandler(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                self.resetBuild();
            });
        }
        const powerToggle = document.getElementById('power-toggle');
        const powerWidget = document.querySelector('.power-widget');
        const powerDetails = document.getElementById('power-details');
        
        if (powerToggle && powerWidget && powerDetails) {
            powerToggle.replaceWith(powerToggle.cloneNode(true));
            
            const newPowerToggle = document.getElementById('power-toggle');
            let isAnimating = false;
            
            newPowerToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation(); 
                
                isAnimating = true;

                const isActive = powerWidget.classList.toggle('active');
                
                if (isActive) {
                    powerDetails.style.maxHeight = '400px';
                    powerDetails.style.opacity = '1';
                } else {
                    powerDetails.style.maxHeight = '0';
                    powerDetails.style.opacity = '0';
                }
                
                setTimeout(() => {
                    isAnimating = false;
                }, 300);
            });
        } 
        
        const overclockCheckbox = document.getElementById('overclock-check');
        if (overclockCheckbox) {
            overclockCheckbox.addEventListener('change', () => {
                this.calculate_power();
            });
        }

        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }
        
        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.authManager.logout();
        });
        
        document.getElementById('login-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.authManager.showAuthModal();
        });
    }

    async openComponentSelection(componentType) {
        
        if (window.modalManager && typeof window.modalManager.showComponentModal === 'function') {
            const filters = this.dataManager.getCompatibilityFilters(this.currentBuild);
            await window.modalManager.showComponentModal(componentType, filters);
            return;
        }
        
        if (this.modalManager && typeof this.modalManager.showComponentModal === 'function') {
            const filters = this.dataManager.getCompatibilityFilters(this.currentBuild);
            await this.modalManager.showComponentModal(componentType, filters);
            return;
        }
         
        if (!this.dataManager) {
            this.showMessage('менеджер данных не загружен', 'error');
            return;
        }
    }




    selectComponent(componentType, componentData) {
        if (!componentType && componentType !== '') {    
            if (componentData && componentData.category_id) {
                const categoryMap = {
                    1: 'cpus',
                    2: 'motherboards', 
                    3: 'rams',
                    4: 'gpus',
                    5: 'storages',
                    6: 'psus',
                    7: 'cases',
                    8: 'coolers'
                };
                componentType = categoryMap[componentData.category_id];
            }
            
            if (!componentType) {
                this.showMessage('тип компонента не определен', 'error');
                return;
            }
        }
    
        
        if (!componentType) {
            this.showMessage('тип компонента не определен', 'error');
            return;
        }
        
        if (!componentData) {
            this.showMessage('нет данных компонента', 'error');
            return;
        }
        
        let realComponent = this.extractComponentData(componentData);
        
        if (!realComponent) {
            this.showMessage('неверный формат данных компонента', 'error');
            return;
        }
        
        
        if (!realComponent.id) {
            realComponent.id = Date.now();
        }
        if (!realComponent.name) {
            realComponent.name = 'Компонент ' + componentType;
        }
        
        if (!realComponent.category) {
            const categoryMap = {
                'cpus': 'cpu',
                'motherboards': 'motherboard',
                'rams': 'ram',
                'gpus': 'gpu',
                'storages': 'storage',
                'psus': 'psu',
                'cases': 'case',
                'coolers': 'cooler'
            };
            realComponent.category = categoryMap[componentType] || componentType;
        }
        
        if (componentType === 'storages') {
            if (!this.currentBuild.storages) {
                this.currentBuild.storages = [];
            }
            this.currentBuild.storages.push(realComponent);
        } else {
            this.currentBuild[componentType] = realComponent;
        }
        
        if (this.currentBuild.null !== undefined) {
            delete this.currentBuild.null;
        }
        
        
        this.renderComponentCards();
        this.updateCompatibilityStatus();
        this.calculate_power();
        this.saveBuildToStorage();
        
        this.showMessage(`"${realComponent.name}" добавлен в сборку!`, 'success');
    }

    extractComponentData(data) {
        if (!data) return null;
        
        if (data.id && data.name) {
            return data;
        }
        
        if (data.success && data.component) {
            return data.component;
        }
        
        if (data.component) {
            return data.component;
        }
        
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        return data;
    }

    getComponentSpecs(component) { 
        if (!component) return ['Характеристики не указаны'];
        
        if (component.critical_specs) {
            if (Array.isArray(component.critical_specs)) {
                return component.critical_specs;
            } else if (typeof component.critical_specs === 'string') {
                try {
                    const parsed = JSON.parse(component.critical_specs);
                    if (Array.isArray(parsed)) return parsed;
                } catch (e) {
                    return [component.critical_specs];
                }
            }
        }
        
        if (component.specs && Array.isArray(component.specs)) {
            return component.specs;
        }
        
        const specs = [];
        
        const fields = [
            { key: 'socket', label: 'Сокет' },
            { key: 'memory_type', label: 'Память' },
            { key: 'type', label: 'Тип' },
            { key: 'capacity', label: 'Объем' },
            { key: 'speed', label: 'Скорость' },
            { key: 'wattage', label: 'Мощность', suffix: 'W' },
            { key: 'form_factor', label: 'Форм-фактор' },
            { key: 'tdp', label: 'TDP', suffix: 'W' },
            { key: 'cores', label: 'Ядер' },
            { key: 'threads', label: 'Потоков' },
            { key: 'frequency', label: 'Частота' }
        ];
        
        fields.forEach(field => {
            if (component[field.key]) {
                const value = component[field.key];
                specs.push(`${field.label}: ${value}${field.suffix || ''}`);
            }
        });
        
        return specs.length > 0 ? specs : ['Характеристики не указаны'];
    }

    getComponentData(rawComponent) {
        if (!rawComponent) return null;
        if (rawComponent.component) {
            return rawComponent.component;
        }
        return rawComponent;
    }

    removeComponent(componentType, index = null) {        
        if (confirm('Убрать компонент из сборки?')) {
            if (componentType === 'storages' && index !== null) {
                if (Array.isArray(this.currentBuild.storages)) {
                    this.currentBuild.storages.splice(index, 1);
                }
            } else {
                this.currentBuild[componentType] = null;
            }
            
            this.renderComponentCards();
            this.calculate_power();
            this.updateCompatibilityStatus();
            this.saveBuildToStorage();
            this.showMessage('Компонент удален из сборки', 'success');
        }
    }

    async updateCompatibilityStatus() {
        this.showLoader();
        
        try {
            this.compatibilityStatus = this.dataManager.validateCompatibility(this.currentBuild);
            
            const componentTypes = ['cpus', 'motherboards', 'rams', 'gpus', 'storages', 'psus', 'cases', 'coolers'];
            
<<<<<<< HEAD
=======
            let selectedCount = 0;
            const totalCount = 8;
            
            for (const type of componentTypes) {
                const component = this.currentBuild[type];
                if (type === 'storages') {
                    if (Array.isArray(component) && component.length > 0) {
                        selectedCount++;
                    }
                } else if (component !== null && component !== undefined) {
                    selectedCount++;
                }
            }
            
            this.compatibilityStatus.selectedCount = selectedCount;
            this.compatibilityStatus.totalCount = totalCount;
            this.compatibilityStatus.progress = (selectedCount / totalCount) * 100;
            
>>>>>>> 0a8b963 (Обновление полного проекта)
            this.compatibilityStatus.errors = [];
            this.compatibilityStatus.warnings = [];
            
            for (const type of componentTypes) {
                const component = this.currentBuild[type];
                if (!component) continue;
                
                if (type === 'storages' && Array.isArray(component)) {
                    component.forEach((storage, index) => {
                        const compatibility = this.checkComponentCompatibility(type, storage);
                        if (!compatibility.compatible) {
                            this.compatibilityStatus.warnings.push({
                                component1: type,
                                component2: type,
                                message: `Накопитель ${index + 1}: ${compatibility.message}`
                            });
                        }
                    });
                } else {
                    const compatibility = this.checkComponentCompatibility(type, component);
                    if (!compatibility.compatible) {
                        this.compatibilityStatus.warnings.push({
                            component1: type,
                            component2: type,
                            message: compatibility.message
                        });
                    }
                }
            }
            
            this.compatibilityStatus.isValid = this.compatibilityStatus.errors.length === 0;
            this.compatibilityStatus.hasWarnings = this.compatibilityStatus.warnings.length > 0;
            
            this.renderCompatibilityStatus();
            this.updateSaveButton();
            this.updateComponentStatuses();
            this.updateSaveButtonState();
            
        } catch (error) {
        } finally {
            setTimeout(() => {
                this.hideLoader();
            }, 300);
        }
    }
    
    renderCompatibilityStatus() {
        const progressBar = document.getElementById('progress-bar');
        const compatibilityText = document.getElementById('compatibility-text');
        const compatibilityCount = document.getElementById('compatibility-count');

        if (!progressBar || !compatibilityText || !compatibilityCount) return;
        
        let statusMessage = '';
        const progress = this.compatibilityStatus.progress || 0;
        const selectedCount = this.compatibilityStatus.selectedCount || 0;
        const totalCount = this.compatibilityStatus.totalCount || 8;

        compatibilityCount.textContent = `${selectedCount}/${totalCount}`;
        progressBar.style.width = `${progress}%`;
        
        if (progress === 100 && this.compatibilityStatus.isValid) {
            progressBar.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        } else if (progress >= 50) {
            progressBar.style.background = 'linear-gradient(90deg, #ffc107, #fd7e14)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, #dc3545, #e83e8c)';
        }

        if (selectedCount === 0) {
            statusMessage = 'Выберите компоненты для совместимости';
        } else if (this.compatibilityStatus.isValid && !this.compatibilityStatus.hasWarnings) {
            if (selectedCount === totalCount) {
                statusMessage = 'Все компоненты совместимы!';
            } else {
                statusMessage = `Выбранные компоненты совместимы. Выбрано ${selectedCount} из ${totalCount} компонентов.`;
            }
        } else if (this.compatibilityStatus.isValid && this.compatibilityStatus.hasWarnings) {
            statusMessage = 'Предупреждения к компонентам: ' + 
                        this.compatibilityStatus.warnings.map(w => w.message).join('; ');
        } else {
            statusMessage = 'Обнаружены ошибки совместимости: ' + 
                        this.compatibilityStatus.errors.map(e => e.message).join('; ');
        }
        
        compatibilityText.textContent = statusMessage;
        compatibilityText.className = `compatibility-text ${this.compatibilityStatus.isValid ? 
            (this.compatibilityStatus.hasWarnings ? 'warning' : 'success') : 'error'}`;
    }

    updateSaveButton() {
        const saveButton = document.getElementById('save-build-btn');
        const canSave = this.compatibilityStatus.isValid && 
                       Object.values(this.currentBuild).some(component => {
                           if (Array.isArray(component)) {
                               return component.length > 0;
                           }
                           return component !== null;
                       });

        saveButton.classList.toggle('disabled', !canSave);
        saveButton.disabled = !canSave;
    }

    calculateTotalPrice() {
        let total = 0;
        
<<<<<<< HEAD
        Object.values(this.currentBuild).forEach(component => {
            if (Array.isArray(component)) {
                component.forEach(item => {
                    total += item.price || 0;
                });
            } else if (component && component.price) {
                total += component.price;
=======
        Object.keys(this.currentBuild).forEach(type => {
            const item = this.currentBuild[type];
            
            if (!item) return; 

            if (type === 'storages' && Array.isArray(item)) {
                item.forEach(storage => {
                    total += parseFloat(storage.price || 0);
                });
            } else {
                total += parseFloat(item.price || 0);
>>>>>>> 0a8b963 (Обновление полного проекта)
            }
        });
        
        return total;
    }
    
    async saveBuildToFavorites(buildData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
                favorites.push(buildData);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                resolve();
            }, 500);
        });
    }

    resetBuild() {
        if (confirm('Вы уверены, что хотите сбросить текущую сборку?')) {
            this.currentBuild = {
                cpus: null,
                motherboards: null,
                rams: null,
                gpus: null,
                storages: [],
                psus: null,
                cases: null,
                coolers: null
            };
            
            this.renderComponentCards();
            this.updateCompatibilityStatus();
            this.clearBuildFromStorage();
            this.calculate_power();
            this.showMessage('Сборка сброшена', 'success');
        }
    }

    renderComponentCard(component, componentType, isSelected = false) {
        if (!component) {
            return '';
        }
        
        const componentData = component.component || component;
        
        const price = componentData.price ? this.formatPrice(componentData.price) : 'Цена не указана';
        const name = componentData.name || 'Без названия';
        const specs = componentData.critical_specs ? 
            (Array.isArray(componentData.critical_specs) ? 
                componentData.critical_specs.slice(0, 2).join(' • ') : 
                componentData.critical_specs) : 
        '';
        
        const componentId = componentData.id;
        
        const imagePath = this.getComponentImagePath(componentData, componentType);
        
        const cardClass = isSelected ? 'component-card selected' : 'component-card';
        const selectedClass = isSelected ? 'selected' : '';
        
        return `
            <div class="${cardClass} ${selectedClass}" 
                data-component-id="${componentId}" 
                data-component-type="${componentType}">
                <div class="component-card-image">
                    <img src="${imagePath}" 
                        alt="${name}" 
                        class="component-image"
                        onerror="this.onerror=null; this.src='source/icons/default_component.png'; this.alt='Изображение не найдено'">
                    ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
                </div>
                <div class="component-card-content">
                    <div class="component-card-header">
                        <h4 class="component-card-name">${name}</h4>
                        <div class="component-card-price">${price} ₽</div>
                    </div>
                    ${specs ? `<div class="component-card-specs">${specs}</div>` : ''}
                    <div class="component-card-actions">
                        <button class="btn-component-info" onclick="window.configurator.showComponentDetails('${componentType}', ${componentId})">
                            Подробнее
                        </button>
                        ${!isSelected ? 
                            `<button class="btn-select" onclick="window.configurator.selectComponent('${componentType}', ${componentId})">
                                Выбрать
                            </button>` : 
                            `<button class="btn-remove" onclick="window.configurator.removeComponent('${componentType}')">
                                Удалить
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    calculate_power() {
        let totalPower = 0;
        const build = this.currentBuild;
        
        let detailsHTML = '';
        let hasComponents = false;
        
    
        const defaultWattages = {
            cpus: 65,       
            gpus: 150,      
            motherboards: 50, 
            rams: 5,        
            coolers: 8,     
            cases: 10,      
            psus: 0,        
            storages: 5     
        };
        
        if (build.cpus) {
            hasComponents = true;
            let cpuPower = parseInt(build.cpus.wattage) || defaultWattages.cpus;
            totalPower += cpuPower;
            detailsHTML += `<div class="power-item"><span>Процессор</span> <span>${cpuPower} W</span></div>`;
        }
        
        if (build.gpus) {
            hasComponents = true;
            let gpuPower = parseInt(build.gpus.wattage) || defaultWattages.gpus;
            totalPower += gpuPower;
            detailsHTML += `<div class="power-item"><span>Видеокарта</span> <span>${gpuPower} W</span></div>`;
        }
        

        if (build.motherboards) {
            hasComponents = true;
            let mbPower = parseInt(build.motherboards.wattage);
            if (isNaN(mbPower) || mbPower <= 0) mbPower = defaultWattages.motherboards;
            totalPower += mbPower;
            detailsHTML += `<div class="power-item"><span>Материнская плата</span> <span>${mbPower} W</span></div>`;
        }
        
        if (build.rams) {
            hasComponents = true;
            let ramPower = parseInt(build.rams.wattage);
            if (isNaN(ramPower) || ramPower <= 0) ramPower = defaultWattages.rams;
            totalPower += ramPower;
            detailsHTML += `<div class="power-item"><span>Оперативная память</span> <span>${ramPower} W</span></div>`;
        }
        
        if (Array.isArray(build.storages) && build.storages.length > 0) {
            hasComponents = true;
            build.storages.forEach((storage, index) => {
                let storagePower = parseInt(storage.wattage) || defaultWattages.storages;
                totalPower += storagePower;
                detailsHTML += `<div class="power-item"><span>Накопитель ${index + 1}</span> <span>${storagePower} W</span></div>`;
            });
        }
        
        if (build.coolers) {
            hasComponents = true;
            let coolerPower = parseInt(build.coolers.wattage);
            if (isNaN(coolerPower) || coolerPower <= 0) coolerPower = defaultWattages.coolers;
            totalPower += coolerPower;
            detailsHTML += `<div class="power-item"><span>Кулер процессора</span> <span>${coolerPower} W</span></div>`;
        }
        
        if (build.cases) {
            hasComponents = true;
            let casePower = parseInt(build.cases.wattage);
            if (isNaN(casePower) || casePower <= 0) casePower = defaultWattages.cases;
            totalPower += casePower;
            detailsHTML += `<div class="power-item"><span>Корпус</span> <span>${casePower} W</span></div>`;
        }
        
        if (build.psus) {
            hasComponents = true;
            let psuWattage = parseInt(build.psus.wattage) || 0;
            if (psuWattage > 0) {
                detailsHTML += `<div class="power-item"><span>Блок питания</span> <span>${psuWattage} W</span></div>`;
            }
        }
        
        const overclockCheckbox = document.getElementById('overclock-check');
        if (overclockCheckbox && overclockCheckbox.checked && hasComponents) {
            let cpuPower = build.cpus ? (parseInt(build.cpus.wattage) || defaultWattages.cpus) : 0;
            let gpuPower = build.gpus ? (parseInt(build.gpus.wattage) || defaultWattages.gpus) : 0;
            let overclockPower = Math.ceil((cpuPower + gpuPower) * 0.20);
            
            if (overclockPower > 0) {
                totalPower += overclockPower;
                detailsHTML += `<div class="power-item" style="color: #ff9800"><span>Разгон (+20%)</span> <span>+${overclockPower} W</span></div>`;
            }
        }
        
        const wattageElement = document.getElementById('total-wattage');
        if (wattageElement) {
            wattageElement.innerText = totalPower;
        }
        
        const breakdownList = document.getElementById('power-breakdown-list');
        if (breakdownList) {
            if (!hasComponents) {
                breakdownList.innerHTML = `<div class="no-components">Выберите компоненты для расчета</div>`;
            } else {
                detailsHTML += `<div class="power-divider"></div>`;
                detailsHTML += `<div class="power-item total"><span>Итого потребление</span> <span>${totalPower} W</span></div>`;
                const recommendedPower = Math.ceil(totalPower * 1.2);
                detailsHTML += `<div class="power-item recommendation"><span>Рекомендуемый БП</span> <span>от ${recommendedPower} W</span></div>`;
                if (build.psus) {
                    const psuWattage = parseInt(build.psus.wattage) || 0;
                    if (psuWattage > 0) {
                        if (psuWattage < totalPower) {
                            detailsHTML += `<div class="power-item warning"><span>Выбранный БП (${psuWattage}W) маловат</span></div>`;
                        } else if (psuWattage >= recommendedPower) {
                            detailsHTML += `<div class="power-item ok"><span>Выбранный БП (${psuWattage}W) подходит</span></div>`;
                        } else {
                            detailsHTML += `<div class="power-item warning"><span>Выбранный БП (${psuWattage}W) без запаса</span></div>`;
                        }
                    }
                }
                
                breakdownList.innerHTML = detailsHTML;
            }
        }
        
        return totalPower;
    }

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    renderSingleComponent(typeInfo, component) {
        const hasComponent = component && component.name;
        
        const iconPath = this.getComponentIconPath(typeInfo.type);
        const fallbackEmoji = this.getComponentEmoji(typeInfo.type);
        
        const iconHtml = `
            <div class="component-icon">
                <img src="${iconPath}" 
                    alt="${typeInfo.name}" 
                    class="component-icon-img"
                    onerror="
                        this.style.display = 'none';
                        const emojiSpan = this.parentNode.querySelector('.component-icon-emoji');
                        if (emojiSpan) emojiSpan.style.display = 'block';
                    ">
                <span class="component-icon-emoji" style="display: none;">${fallbackEmoji}</span>
            </div>
        `;
        
        const isRequired = this.isRequiredComponent(typeInfo.type);
        const requiredBadge = isRequired ? '<span class="required-badge" title="Необходим для работоспособности системы">*</span>' : '';
        
        const rowClass = isRequired && !hasComponent ? 'component-row missing-required' : 'component-row';
        
        let html = `
            <div class="component-with-selection" data-component-type="${typeInfo.type}">
                <div class="${rowClass}">
                    <div class="component-name">
                        ${iconHtml}
                        <span>${typeInfo.name}</span>
                        ${requiredBadge}
                    </div>
                    <div class="component-action">
                        <button class="btn-select-component" 
                                onclick="window.configurator.openComponentSelection('${typeInfo.type}')">
                            ${hasComponent ? 'Изменить' : 'Выбрать'}
                        </button>
                    </div>
                </div>
        `;
        
        if (hasComponent) {
            const name = component.name || 'Без названия';
            const price = component.price ? `${this.formatPrice(component.price)} ₽` : 'Цена не указана';
            
            let specs = 'Характеристики не указаны';
            if (component.critical_specs) {
                if (Array.isArray(component.critical_specs)) {
                    specs = component.critical_specs.slice(0, 3).join(' • ');
                } else if (typeof component.critical_specs === 'string') {
                    specs = component.critical_specs;
                }
            }
            
            const status = this.get_Status(typeInfo.type, component);
            const statusText = this.get_text(status);
            const statusIcon = this.get_icon(status);
            
            const componentImage = this.getComponentImagePath(component, typeInfo.type);
            
            html += `
                <div class="selected-component-view ${status}">
                    <div class="selected-component-main">
                        <div class="selected-component-image">
                            <img src="${componentImage}" alt="${name}" 
                                onerror="
                                    this.onerror = null;
                                    this.src = '${iconPath}';
                                    this.alt = '${name} - изображение не найдено';
                                ">
                        </div>
                        <div class="selected-component-info">
                            <div class="selected-component-name-row">
                                <h4 class="selected-component-name">${name}</h4>
                                <span class="selected-component-status" title="${statusText}">
                                    ${statusIcon}
                                </span>
                            </div>
                            <div class="selected-component-specs">${specs}</div>
                            <div class="selected-component-price-row">
                                <span class="selected-component-price">${price}</span>
                                <button class="btn-remove-selected" 
                                        onclick="window.configurator.removeComponent('${typeInfo.type}')">
                                    Убрать из сборки
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    }


    isRequiredComponent(componentType) {
        const requiredComponents = ['cpus', 'motherboards', 'rams'];
        return requiredComponents.includes(componentType);
    }

    renderStorageComponent(typeInfo, storageComponents) {
        const storages = Array.isArray(storageComponents) ? storageComponents : [];
        const hasStorages = storages.length > 0;
        
        const iconPath = this.getComponentIconPath(typeInfo.type);
        const fallbackEmoji = this.getComponentEmoji(typeInfo.type);
        
        const iconHtml = `
            <div class="component-icon">
                <img src="${iconPath}" 
                    alt="${typeInfo.name}" 
                    class="component-icon-img"
                    onerror="
                        this.style.display = 'none';
                        const emojiSpan = this.parentNode.querySelector('.component-icon-emoji');
                        if (emojiSpan) emojiSpan.style.display = 'block';
                    ">
                <span class="component-icon-emoji" style="display: none;">${fallbackEmoji}</span>
            </div>
        `;
        
        let html = `
            <div class="component-with-selection" data-component-type="${typeInfo.type}">
                <div class="component-row">
                    <div class="component-name">
                        ${iconHtml}
                        <span>${typeInfo.name} ${hasStorages ? `(${storages.length})` : ''}</span>
                    </div>
                    <div class="component-action">
                        <button class="btn-select-component" 
                                onclick="window.configurator.openComponentSelection('${typeInfo.type}')">
                            ${hasStorages ? 'Добавить ещё' : 'Добавить накопитель'}
                        </button>
                    </div>
                </div>
        `;
        
        if (hasStorages) {
            storages.forEach((storage, index) => {
                const storageName = storage.name || 'Накопитель';
                const storagePrice = storage.price ? this.formatPrice(storage.price) + ' ₽' : 'Цена не указана';
                
                let storageSpecs = 'Характеристики не указаны';
                if (storage.critical_specs) {
                    if (Array.isArray(storage.critical_specs)) {
                        storageSpecs = storage.critical_specs.slice(0, 2).join(' • ');
                    } else if (typeof storage.critical_specs === 'string') {
                        storageSpecs = storage.critical_specs;
                    }
                }
                
                const storageStatus = this.get_Status(typeInfo.type, storage);
                const statusText = this.get_text(storageStatus);
                const statusIcon = this.get_icon(storageStatus);
                
                const storageImage = this.getComponentImagePath(storage, typeInfo.type);
                
                html += `
                    <div class="selected-component-view ${storageStatus}" data-index="${index}">
                        <div class="selected-component-main">
                            <div class="selected-component-image">
                                <img src="${storageImage}" alt="${storageName}" 
                                    onerror="
                                        this.onerror = null;
                                        this.src = '${iconPath}';
                                        this.alt = '${storageName} - изображение не найдено';
                                    ">
                            </div>
                            <div class="selected-component-info">
                                <div class="selected-component-name-row">
                                    <h4 class="selected-component-name">${storageName}</h4>
                                    <span class="selected-component-status" title="${statusText}">
                                        ${statusIcon}
                                    </span>
                                </div>
                                <div class="selected-component-specs">${storageSpecs}</div>
                                <div class="selected-component-price-row">
                                    <span class="selected-component-price">${storagePrice}</span>
                                    <button class="btn-remove-selected" 
                                            onclick="window.configurator.removeComponent('${typeInfo.type}', ${index})">
                                        Убрать
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        return html;
    }

    getCategoryFolder(component, componentType) {
        if (component && component.category) {
            const categoryMap = {
                'cpu': 'cpus', 'процессор': 'cpus',
                'motherboard': 'motherboards', 'материнская плата': 'motherboards',
                'ram': 'rams', 'оперативная память': 'rams',
                'gpu': 'gpus', 'видеокарта': 'gpus',
                'storage': 'storages', 'накопитель': 'storages',
                'ssd': 'storages', 'hdd': 'storages',
                'psu': 'psus', 'блок питания': 'psus',
                'case': 'cases', 'корпус': 'cases',
                'cooler': 'coolers', 'охлаждение': 'coolers'
            };
            return categoryMap[component.category.toLowerCase()] || component.category;
        }
        

        const typeMap = {
            'cpus': 'cpus',
            'motherboards': 'motherboards',
            'rams': 'rams',
            'gpus': 'gpus',
            'storages': 'storages',
            'psus': 'psus',
            'cases': 'cases',
            'coolers': 'coolers'
        };
        
        return typeMap[componentType] || componentType || 'components';
    }

    async showFavorites() {
        if (!this.authManager.isLoggedIn()) {
            this.authManager.showAuthModal();
            return;
        }

        const modal = document.getElementById('favorites-modal');
        modal.classList.remove('hidden');
        
        await this.loadUserBuilds();
    }

    async loadUserBuilds() {
        const grid = document.getElementById('favorites-grid');
        const loader = document.getElementById('favorites-loading');
        
        grid.innerHTML = '';
        loader.classList.remove('hidden');

        try {
            const response = await fetch('api/admin.php?action=get_builds');
            const data = await response.json();

            loader.classList.add('hidden');

            if (data.success && data.builds && data.builds.length > 0) {
                this.renderFavorites(data.builds);
            } else {
                grid.innerHTML = `
                    <div class="no-data">
                        <img src="source/icons/pc_case_icon.png" style="width: 64px; opacity: 0.5; margin-bottom: 10px;">
                        <p>Нет сохраненных сборок.</p>
                        <button class="btn btn-primary" onclick="document.getElementById('favorites-modal').classList.add('hidden')">
                            Создать первую сборку
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            loader.classList.add('hidden');
            grid.innerHTML = '<div class="no-data error">Не удалось загрузить сборки. Попробуйте позже.</div>';
        }
    }

    async renderFavorites(builds) {
        const grid = document.getElementById('favorites-grid');
        
        if (!builds || builds.length === 0) {
            grid.innerHTML = `
                <div class="no-data">
                    <img src="source/icons/pc_case_icon.png" style="width: 64px; opacity: 0.5; margin-bottom: 10px;">
                    <p>Нет сохраненных сборок.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('favorites-modal').classList.add('hidden')">
                        Создать первую сборку
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = builds.map(build => {
            let components = build.components;
            if (typeof components === 'string') {
                try {
                    components = JSON.parse(components);
                } catch (e) {
                    components = {};
                }
            }
            
            let componentCount = 0;
            if (components) {
                Object.values(components).forEach(comp => {
                    if (Array.isArray(comp)) {
                        componentCount += comp.length;
                    } else if (comp && typeof comp === 'object' && comp.id) {
                        componentCount++;
                    }
                });
            }
            
            const iconsHTML = this.renderBuildIcons(components || {});
            
            const buildDate = new Date(build.created_at).toLocaleDateString('ru-RU');
            
            const totalPrice = Number(build.total_price).toLocaleString('ru-RU');
            
            return `
            <div class="build-card" id="build-${build.id}">
                <div class="build-card-header">
                    <span class="build-id">#${build.id}</span>
                    <div class="build-stats">
                        <span class="component-count">${componentCount} компонентов</span>
                        <span class="build-date">${buildDate}</span>
                    </div>
                </div>
                
                ${iconsHTML ? `
                <div class="build-preview-row">
                    ${iconsHTML}
                </div>
                ` : '<div class="no-components">Нет выбранных компонентов</div>'}
                
                <div class="build-card-content">
                    <h3>${build.name || 'Конфигурация ПК'}</h3>
                    <p class="user">${build.username || 'Сборка'}</p>
                    <div class="price">${totalPrice} ₽</div>
                </div>

                <div class="build-actions">
                    <button class="btn-load-build" onclick="configurator.loadSavedBuild(${build.id})">
                        Загрузить
                    </button>
                    <button class="btn-delete-build" onclick="configurator.deleteSavedBuild(${build.id})">
                        Удалить
                    </button>
                </div>
            </div>`;
        }).join('');

        this.cachedBuilds = builds;
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
                                this.getImagePath(storage.image, category.key) : 
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
                        this.getImagePath(item.image, category.key) : 
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
        
        if (imageName.startsWith('source/')) {
            return imageName;
        }
        
        return `source/${category}/${imageName}`;
    }

    getFullComponentData(component, componentType) {
        if (component.image || component.category) {
            return component;
        }
        
        const componentId = component.id;
        
        if (this.currentBuild[componentType]) {
            if (componentType === 'storages' && Array.isArray(this.currentBuild[componentType])) {
                const found = this.currentBuild[componentType].find(item => item.id == componentId);
                if (found) return found;
            } else if (this.currentBuild[componentType] && this.currentBuild[componentType].id == componentId) {
                return this.currentBuild[componentType];
            }
        }
        
        if (this.dataManager) {
            const allComponents = this.dataManager.getCachedComponents();
            if (allComponents) {
                for (const category in allComponents) {
                    if (allComponents[category]) {
                        const found = allComponents[category].find(comp => comp.id == componentId);
                        if (found) return found;
                    }
                }
            }
        }
        
        return {
            ...component,
            category: componentType.slice(0, -1), 
            category_id: this.getCategoryId(componentType)
        };
    }

    getCategoryId(componentType) {
        const map = {
            'cpus': 1,
            'motherboards': 2,
            'rams': 3,
            'gpus': 4,
            'storages': 5,
            'psus': 6,
            'cases': 7,
            'coolers': 8
        };
        return map[componentType] || 0;
    }

<<<<<<< HEAD
    loadSavedBuild(buildId) {

=======
    async loadSavedBuild(buildId) {
>>>>>>> 0a8b963 (Обновление полного проекта)
        const build = this.cachedBuilds?.find(b => b.id == buildId);
        
        if (!build) {
            alert("Сборка не найдена");
            return;
        }
        
        if (!confirm(`Загрузить сборку "${build.name}"?`)) return;
        
        this.showLoader('Загрузка компонентов...');
        
        try {
            this.currentBuild = this.getEmptyBuild();
            
            let components = build.components;
            
            if (!components && build.compatibility_data) {
                try {
                    components = JSON.parse(build.compatibility_data);
                } catch (e) {
                    components = {};
                }
            }
            
<<<<<<< HEAD
=======
            let inactiveComponents = [];
            let hasComponents = false;
>>>>>>> 0a8b963 (Обновление полного проекта)
            
            if (components && typeof components === 'object') {
                for (const [type, componentData] of Object.entries(components)) {
                    if (!componentData) continue;
                    
<<<<<<< HEAD
                    
                    if (type === 'storages' && Array.isArray(componentData)) {
                        this.currentBuild[type] = componentData.map(item => this.normal_component(item, type));
                    } else if (componentData && componentData.id) {
                        this.currentBuild[type] = this.normal_component(componentData, type);
                    }
                }
            }
                
            this.saveBuildToStorage();
            this.calculatePowerConsumption();
            this.renderComponentCards();
            this.updateCompatibilityStatus();
            const modal = document.getElementById('favorites-modal');
            if (modal) modal.classList.add('hidden');
            
            this.showMessage(`Сборка "${build.name}" загружена!`, 'success');
            
        } catch (error) {
            this.showMessage(`${error.message}`, 'error');
=======
                    if (type === 'storages' && Array.isArray(componentData)) {
                        const activeStorages = [];
                        for (const item of componentData) {
                            const normalized = this.normal_component(item, type);
                            activeStorages.push(normalized);
                            const isActive = await this.checkComponentActivity(item.id, type);
                            if (!isActive) {
                                inactiveComponents.push({
                                    type: type,
                                    name: normalized.name,
                                    id: item.id
                                });
                            }
                        }
                        if (activeStorages.length > 0) {
                            this.currentBuild[type] = activeStorages;
                            hasComponents = true;
                        }
                    } else if (componentData && componentData.id) {
                        const normalized = this.normal_component(componentData, type);
                        this.currentBuild[type] = normalized;
                        hasComponents = true;
                        const isActive = await this.checkComponentActivity(componentData.id, type);
                        if (!isActive) {
                            inactiveComponents.push({
                                type: type,
                                name: normalized.name,
                                id: componentData.id
                            });
                        }
                    }
                }
            }
            
            this.saveBuildToStorage();
            this.calculate_power();
            this.renderComponentCards();
            this.updateCompatibilityStatus();
            
            this.showMessage(`Сборка "${build.name}" загружена!`, 'success');
            
            const modal = document.getElementById('favorites-modal');
            if (modal) modal.classList.add('hidden');
            
        } catch (error) {
            this.showMessage(`Ошибка загрузки: ${error.message}`, 'error');
>>>>>>> 0a8b963 (Обновление полного проекта)
        } finally {
            this.hideLoader();
        }
    }

<<<<<<< HEAD
=======
    async checkComponentActivity(componentId, componentType) {
        try {
            const response = await fetch(`api/admin.php?action=check_component_activity&id=${componentId}&type=${componentType}`);
            if (!response.ok) {
                return true;
            }
            
            const data = await response.json();
            if (data.success) {
                return data.is_active !== false; 
            }
            return false;
        } catch (error) {
            return false;
        }
    }

>>>>>>> 0a8b963 (Обновление полного проекта)
    async getComponentFromDatabase(componentId, componentType) {
        try {
            const tableMap = {
                'cpus': 'cpus',
                'motherboards': 'motherboards',
                'rams': 'rams',
                'gpus': 'gpus',
                'storages': 'storages',
                'psus': 'psus',
                'cases': 'cases',
                'coolers': 'coolers'
            };
            
            const tableName = tableMap[componentType];
            if (!tableName) return null;
            
            const response = await fetch(`api/admin.php?action=get_component_single&id=${componentId}&type=${componentType}`);
            const data = await response.json();
            
            if (data.success && data.component) {
                return this.normal_component(data.component, componentType);
            }
            
            return null;
        } catch (error) {
            return null;
        }
    }

    normal_component(component, componentType) {
        return {
            id: component.id,
            name: component.name || 'Компонент',
            price: component.price || 0,
            category: componentType.slice(0, -1), 
            image: component.image || '',
            socket: component.socket || '',
            memory_type: component.memory_type || '',
            wattage: component.wattage || 0,
            capacity: component.capacity || 0,
            speed: component.speed || '',
            tdp: component.tdp || 0,
            type: component.type || '',
<<<<<<< HEAD
=======
            is_active: component.is_active !== undefined ? component.is_active : 1, 
>>>>>>> 0a8b963 (Обновление полного проекта)
            
            critical_specs: this.parseJSONField(component.critical_specs, []),
            compatibility_flags: this.parseJSONField(component.compatibility_flags, []),
            specs: this.parseJSONField(component.specs, [])
        };
    }

    parseJSONField(field, defaultValue) {
        if (!field) return defaultValue;
        
        if (typeof field === 'string') {
            try {
                return JSON.parse(field);
            } catch (e) {
                return [field];
            }
        } else if (Array.isArray(field)) {
            return field;
        }
        
        return defaultValue;
    }

    async deleteSavedBuild(buildId) {
        try {
            const response = await fetch('api/builds.php?action=delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: buildId })
            });

            const data = await response.json();

            if (data.success) {
                const card = document.getElementById(`build-${buildId}`);
                if (card) card.remove();
                
                const grid = document.getElementById('favorites-grid');
                if (grid.children.length === 0) {
                    this.loadUserBuilds(); 
                }
                
                this.showMessage('Сборка удалена', 'success');
            } else {
                throw new Error(data.message || 'Ошибка удаления');
            }
        } catch (error) {
            this.showMessage(`${error.message}`, 'error');
        }
    }

    get_Status(componentType, componentData) {
<<<<<<< HEAD
        if (!this.compatibilityStatus) return 'unknown';
        
=======
        if (!componentData) return 'unknown';
        
        if (componentData.is_active === 0) {
            return 'inactive'; 
        }

        if (!this.compatibilityStatus) return 'success';
            
>>>>>>> 0a8b963 (Обновление полного проекта)
        if (this.compatibilityStatus.isValid && !this.compatibilityStatus.hasWarnings) {
            return 'success';
        }
        
        const componentName = componentData?.name || '';
        
        for (const error of this.compatibilityStatus.errors || []) {
            const errorContainsName = componentName && error.message.includes(componentName);
            const errorContainsType = error.message.includes(this.getComponentTypeName(componentType));
            
            const isSocketError = (componentType === 'cpus' || componentType === 'motherboards' || componentType === 'coolers') && 
                                error.message.includes('сокет');
            
            const isRamError = componentType === 'rams' && 
                            error.message.includes('память') && 
                            error.message.includes('не совместима');
            
            if (errorContainsName || errorContainsType || isSocketError || isRamError) {
                const isCoolerCompatibilityWarning = componentType === 'coolers' && 
                                                    error.message.includes('возможно не совместим') ||
                                                    error.message.includes('проверьте совместимость');
                
                if (isCoolerCompatibilityWarning) {
                    return 'warning'; 
                }
                return 'error';
            }
        }
        
        for (const warning of this.compatibilityStatus.warnings || []) {
            if (warning.message.includes(componentName) || 
                warning.message.includes(this.getComponentTypeName(componentType))) {
                return 'warning';
            }
        }
        
        if (this.compatibilityStatus.hasWarnings) {
            return 'warning';
        }
        
        if (!this.compatibilityStatus.isValid && this.compatibilityStatus.errors?.length > 0) {
            const hasErrorsForThisComponent = this.compatibilityStatus.errors.some(error => 
                error.component1 === componentType || error.component2 === componentType ||
                error.message.includes(componentName) ||
                error.message.includes(this.getComponentTypeName(componentType))
            );
            
            if (!hasErrorsForThisComponent) {
                return 'success'; 
            }
        }
        
        return !this.compatibilityStatus.isValid ? 'error' : 'success';
    }

    getComponentImagePath(component, componentType) {
        
        if (!component) {
            return this.getComponentIconPath ? this.getComponentIconPath(componentType) : 'source/icons/default_component.png';
        }
        
        const componentData = component.component || component;
        
        if (!componentData.image) {
            return this.getComponentIconPath ? this.getComponentIconPath(componentType) : 'source/icons/default_component.png';
        }
        
        let imagePath = componentData.image.toString().trim();
        
        imagePath = imagePath.replace(/^\.\//, '').replace(/^\/+/, '');
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || 
            imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
            return imagePath;
        }
        
        if (imagePath.startsWith('source/') || imagePath.startsWith('images/')) {
            return imagePath;
        }
        
        let category = componentData.category || '';
        if (!category) {
            const typeMap = {
                'cpus': 'cpu',
                'motherboards': 'motherboard',
                'rams': 'ram', 
                'gpus': 'gpu',
                'storages': 'storage',
                'psus': 'psu',
                'coolers': 'cooler',
                'cases': 'case'
            };
            category = typeMap[componentType] || 'components';
        }
        
        const possiblePaths = [
            `source/${category}s/${imagePath}`,  
            `source/${category}/${imagePath}`,
            `source/images/${category}/${imagePath}`,
            `images/${category}/${imagePath}`,
            `source/${imagePath}`,
            `images/${imagePath}`,
            `source/icons/${category}_icon.png`,
            imagePath 
        ];
           
        return possiblePaths[0];
    }

    get_error_compability(componentType, component) {
        if (!component) return 'unknown';
        
        const compatibility = this.checkComponentCompatibility(componentType, component);
        
        if (compatibility.compatible) {
            return 'success';
        } else {
            return 'warning';
        }
    }

<<<<<<< HEAD
    
=======
>>>>>>> 0a8b963 (Обновление полного проекта)

    updateComponentStatuses() {
        const componentTypes = ['cpus', 'motherboards', 'rams', 'gpus', 'psus', 'cases', 'coolers'];
        
        componentTypes.forEach(type => {
            const component = this.currentBuild[type];
            if (component) {
                const container = document.querySelector(`[data-component-type="${type}"]`);
                if (container) {
                    const selectedView = container.querySelector('.selected-component-view');
                    if (selectedView) {
<<<<<<< HEAD
                        const status = this.get_error_compability(type, component);
=======
                        const status = this.get_Status(type, component);
>>>>>>> 0a8b963 (Обновление полного проекта)
                        selectedView.className = `selected-component-view ${status}`;
                        
                        const statusElement = selectedView.querySelector('.selected-component-status');
                        if (statusElement) {
                            statusElement.textContent = this.get_icon(status);
                            statusElement.title = this.get_text(status);
                        }
                    }
                }
            }
        });
        
        if (Array.isArray(this.currentBuild.storages)) {
            this.currentBuild.storages.forEach((storage, index) => {
                const container = document.querySelector('[data-component-type="storages"]');
                if (container) {
                    const storageViews = container.querySelectorAll('.selected-component-view');
                    if (storageViews[index]) {
<<<<<<< HEAD
                        const status = this.getComponentStatusFromCompatibilityErrors('storages', storage);
=======
                        const status = this.get_Status('storages', storage);
>>>>>>> 0a8b963 (Обновление полного проекта)
                        storageViews[index].className = `selected-component-view ${status}`;
                        
                        const statusElement = storageViews[index].querySelector('.selected-component-status');
                        if (statusElement) {
                            statusElement.textContent = this. get_icon(status);
                            statusElement.title = this.get_text(status);
                        }
                    }
                }
            });
        }
    }

    get_icon(status) {
        switch(status) {
            case 'success': return '✓';
            case 'warning': return '⚠';
            case 'error': return '✗';
<<<<<<< HEAD
=======
            case 'inactive': return '⚠'
>>>>>>> 0a8b963 (Обновление полного проекта)
            default: return '?';
        }
    }

    get_text(status) {
        switch(status) {
            case 'success': return 'Компонент совместим с остальной сборкой';
            case 'warning': return 'Есть предупреждение по совместимости. Проверьте спецификации.';
            case 'error': return 'Компонент несовместим с другими компонентами сборки';
<<<<<<< HEAD
=======
            case 'inactive': return 'Компонент не активен. Возможно, он удалён или временно недоступен.';
>>>>>>> 0a8b963 (Обновление полного проекта)
            default: return 'Статус совместимости не определен';
        }
    }

    
    formatPrice(price) {
        if (!price && price !== 0) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('save-build-btn'); 
        if (!saveBtn) return;

        const hasCPU = !!this.currentBuild.cpus;
        const hasMB = !!this.currentBuild.motherboards;
        const hasRAM = !!this.currentBuild.rams;

        const isReady = hasCPU && hasMB && hasRAM;

        if (isReady) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('btn-disabled'); 
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
        } else {
            saveBtn.disabled = true;
            saveBtn.classList.add('btn-disabled');
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
        }
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
        const authMessage = document.getElementById('auth-message');
        const authLoading = document.getElementById('auth-loading');
        const isRegisterMode = document.getElementById('register-fields') && 
                            !document.getElementById('register-fields').classList.contains('hidden');

        if (!username || !password) {
            this.showAuthMessage('Заполните поля', 'error');
            return;
        }
        
        if (isRegisterMode && !email) {
            this.showAuthMessage('Введите email', 'error');
            return;
        }

        try {
            if (authLoading) authLoading.classList.remove('hidden');
            if (authMessage) {
                authMessage.textContent = '';
                authMessage.className = 'auth-message';
            }

            let user;
            
            if (isRegisterMode) {
                user = await this.authManager.register(username, email, password);
                this.showAuthMessage('Регистрация успешна! Добро пожаловать!', 'success');
            } else {
                user = await this.authManager.login(username, password);
                this.showAuthMessage(`Добро пожаловать, ${user.username}!`, 'success');
            }

            setTimeout(() => {
                this.authManager.hideAuthModal();
                if (authLoading) authLoading.classList.add('hidden');
            }, 1500);

        } catch (error) {
            if (authLoading) authLoading.classList.add('hidden');
            this.showAuthMessage(error.message, 'error');
        }
    }

    showAuthMessage(message, type = 'info') {
        const authMessage = document.getElementById('auth-message');
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = `auth-message ${type}`;
            
            if (type === 'success') {
                setTimeout(() => {
                    authMessage.textContent = '';
                    authMessage.className = 'auth-message';
                }, 3000);
            }
        }
    }

    saveBuildToStorage() {
        localStorage.setItem('currentBuild', JSON.stringify(this.currentBuild));
    }

    loadBuildFromStorage() {
        const saved = localStorage.getItem('currentBuild');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);   
                if (parsed.null !== undefined) {
                    delete parsed.null;
                }
                
                Object.keys(parsed).forEach(key => {
                    if (parsed[key]) {
                        if (key === 'storages' && Array.isArray(parsed[key])) {
                            parsed[key] = parsed[key].map(item => this.extractComponentData(item));
                        } else if (key !== 'storages') {
                            parsed[key] = this.extractComponentData(parsed[key]);
                        }
                    }
                });
                
                this.currentBuild = parsed;
                
            } catch (error) {
                this.currentBuild = this.getEmptyBuild();
            }
        }
    }

    clearBuildFromStorage() {
        localStorage.removeItem('currentBuild');
    }

    showLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.remove('hidden');
        }
    }

    hideLoader() {
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    getCurrentBuild() {
        return this.currentBuild;
    }

    getCompatibilityStatus() {
        return this.compatibilityStatus;
    }

    getSelectedComponent(componentType) {
        return this.currentBuild[componentType];
    }

    getEmptyBuild() {
        return {
            cpus: null,
            motherboards: null,
            rams: null,
            gpus: null,
            storages: [],
            psus: null,
            cases: null,
            coolers: null
        };
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

    getCategoryFolder(component, componentType) {
        if (component && component.category) {
            const categoryMap = {
                'cpu': 'cpus', 'процессор': 'cpus',
                'motherboard': 'motherboards', 'материнская плата': 'motherboards',
                'ram': 'rams', 'оперативная память': 'rams',
                'gpu': 'gpus', 'видеокарта': 'gpus',
                'storage': 'storages', 'накопитель': 'storages',
                'ssd': 'storages', 'hdd': 'storages',
                'psu': 'psus', 'блок питания': 'psus',
                'case': 'cases', 'корпус': 'cases',
                'cooler': 'coolers', 'охлаждение': 'coolers'
            };
            return categoryMap[component.category.toLowerCase()] || component.category;
        }
        
        return componentType || 'components';
    }

    async saveBuildToServer(e) {
        if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        if (!this.authManager.currentUser) {
            alert("Пожалуйста, войдите в систему");
            return;
        }

        const hasComponents = Object.values(this.currentBuild).some(val => {
            if (Array.isArray(val)) {
                return val.length > 0;
            }
            return val !== null;
        });

        if (!hasComponents) {
            alert("Сборка пуста! Выберите хотя бы один компонент.");
            return;
        }

        if (this.isSaving) return;
        this.isSaving = true;
        this.showLoader();

        try {
            const components = {};
            
            for (const [type, component] of Object.entries(this.currentBuild)) {
                if (!component || (Array.isArray(component) && component.length === 0)) {
                    continue;
                }
                
                if (type === 'storages' && Array.isArray(component)) {
                    components[type] = component.map(item => ({
                        id: item.id || 0,
                        name: item.name || 'Накопитель',
                        price: item.price || 0,
                        image: item.image || '' 
                    }));
                } else if (component) {
                    components[type] = {
                        id: component.id || 0,
                        name: component.name || 'Компонент',
                        price: component.price || 0,
                        image: component.image || '' 
                    };
                }
            }

            const buildName = prompt(
                "Введите название сборки:", 
                "Моя сборка " + new Date().toLocaleDateString('ru-RU')
            ) || "Моя сборка " + new Date().toLocaleDateString('ru-RU');

            const buildData = {
                name: buildName,
                total_price: this.calculateTotalPrice(),
                components: components,  
                user_id: this.authManager.currentUser.id
            };


            const response = await fetch('api/builds.php?action=save', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(buildData)
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Ошибка сервера");
            }

            if (data.success) {
                alert("Сборка успешно сохранена!");
                if (!document.getElementById('favorites-modal').classList.contains('hidden')) {
                    await this.loadUserBuilds();
                }
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            alert(`Ошибка сохранения: ${error.message}`);
        } finally {
            this.isSaving = false;
            this.hideLoader();
        }
    }

    checkComponentCompatibility(componentType, component) {
        if (!component) return { compatible: true, message: '' };
        
        const cpu = this.currentBuild.cpus;
        const mb = this.currentBuild.motherboards;
        const cooler = this.currentBuild.coolers;
        const pcCase = this.currentBuild.cases;
        const rams = this.currentBuild.rams;
        
        if (componentType === 'motherboards') {
            const cpu = this.currentBuild.cpus;
            if (cpu && component.socket && cpu.socket) {
                if (component.socket !== cpu.socket) {
                    return {
                        compatible: false,
                        message: `Сокет материнской платы (${component.socket}) не подходит для процессора (${cpu.socket})`
                    };
                }
            }

            const ram = this.currentBuild.rams;
            if (ram && component.memory_type) {
                const mbMemoryType = component.memory_type.toUpperCase();
                const ramType = (ram.type || ram.memory_type || "").toUpperCase();

                if (ramType) {
                    const mbIsDDR4 = mbMemoryType.includes('DDR4');
                    const mbIsDDR5 = mbMemoryType.includes('DDR5');
                    const ramIsDDR4 = ramType.includes('DDR4');
                    const ramIsDDR5 = ramType.includes('DDR5');

                    if ((mbIsDDR4 && ramIsDDR5) || (mbIsDDR5 && ramIsDDR4)) {
                        return {
                            compatible: false,
                            message: `Выбранная плата поддерживает ${mbMemoryType}, а у вас в сборке ${ramType}.`
                        };
                    }
                }
            }

            if (ram && ram.modules && component.memorySlots) {
                if (parseInt(ram.modules) > parseInt(component.memorySlots)) {
                    return {
                        compatible: false,
                        message: `В этой плате ${component.memorySlots} слота(ов), что меньше чем ${ram.modules} модуля(ей) в выбранной ОЗУ.`
                    };
                }
            }
            return { compatible: true, message: '' };
        }
        
        if (componentType === 'rams') {
                const mb = this.currentBuild.motherboards;
                if (mb && mb.memory_type) {
                    const mbType = mb.memory_type.toUpperCase();
                    const ramType = (component.type || component.memory_type || "").toUpperCase();
                    
                    const mbIsDDR4 = mbType.includes('DDR4');
                    const mbIsDDR5 = mbType.includes('DDR5');
                    const ramIsDDR4 = ramType.includes('DDR4');
                    const ramIsDDR5 = ramType.includes('DDR5');

                    if (mb && mb.memorySlots && component.modules) {
                        if (parseInt(component.modules) > parseInt(mb.memorySlots)) {
                            return {
                                compatible: false,
                                message: `Недостаточно слотов: в ОЗУ ${component.modules} модуля(ей), а на плате всего ${mb.memorySlots} слота(ов).`
                            };
                        }
                    }

                    if ((mbIsDDR4 && ramIsDDR5) || (mbIsDDR5 && ramIsDDR4)) {
                        return {
                            compatible: false,
                            message: `Память ${ramType} не подходит к разъемам ${mbType} на материнской плате.`
                        };
                    }
                }
                return { compatible: true, message: '' };
            }
        
        if (componentType === 'coolers') {
            if (cpu && cpu.socket && component.socket) {
                const cpuSocket = cpu.socket.toUpperCase();
                let coolerSocket = component.socket;
                
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
                    return {
                        compatible: false,
                        message: `Кулер может не поддерживать сокет ${cpu.socket}. Проверьте совместимость.`
                    };
                }
            }
            return { compatible: true, message: '' };
        }
        
        if (componentType === 'cases') {
            if (mb && mb.form_factor && component.supported_form_factors) {
                const mbFormFactor = mb.form_factor.toUpperCase();
                let caseFormFactors = component.supported_form_factors;
                
                if (typeof caseFormFactors === 'string') {
                    caseFormFactors = caseFormFactors.split(/[,|]/).map(f => f.trim().toUpperCase());
                } else if (Array.isArray(caseFormFactors)) {
                    caseFormFactors = caseFormFactors.map(f => String(f).toUpperCase());
                } else {
                    caseFormFactors = [String(caseFormFactors).toUpperCase()];
                }
                
                const isCompatible = caseFormFactors.some(factor => {
                    const factorUpper = factor.toUpperCase();
                    if (factorUpper === mbFormFactor) return true;
                    
<<<<<<< HEAD
                    const compatibilityHierarchy = {
=======
                    const compatibility_erarxiya = {
>>>>>>> 0a8b963 (Обновление полного проекта)
                        'E-ATX': ['E-ATX', 'ATX', 'MICRO-ATX', 'MINI-ITX'],
                        'ATX': ['ATX', 'MICRO-ATX', 'MINI-ITX'],
                        'MICRO-ATX': ['MICRO-ATX', 'MINI-ITX'],
                        'MINI-ITX': ['MINI-ITX']
                    };
                    
<<<<<<< HEAD
                    if (compatibilityHierarchy[factorUpper]) {
                        return compatibilityHierarchy[factorUpper].includes(mbFormFactor);
=======
                    if (compatibility_erarxiya[factorUpper]) {
                        return compatibility_erarxiya[factorUpper].includes(mbFormFactor);
>>>>>>> 0a8b963 (Обновление полного проекта)
                    }
                    
                    return false;
                });
                
                if (!isCompatible) {
                    return {
                        compatible: false,
                        message: `Корпус может не поддерживать плату ${mb.form_factor}. Проверьте спецификации.`
                    };
                }
            }
            return { compatible: true, message: '' };
        }
        
        if (componentType === 'cpus') {
            if (mb && mb.socket && component.socket) {
                const cpuSocket = component.socket.toUpperCase();
                const mbSocket = mb.socket.toUpperCase();
                if (cpuSocket !== mbSocket) {
                    return {
                        compatible: false,
                        message: `Сокет процессора (${component.socket}) не совпадает с сокетом материнской платы (${mb.socket})`
                    };
                }
            }
            
            if (mb && mb.memory_type) {
                const mbMemoryType = mb.memory_type.toUpperCase();
                const mbIsDDR4 = mbMemoryType.includes('DDR4');
                const mbIsDDR5 = mbMemoryType.includes('DDR5');
                
                if (component.name) {
                    const cpuName = component.name.toLowerCase();
                    
                    if (mbIsDDR5 && cpuName.includes('ryzen 5 5600')) {
                        return {
                            compatible: false,
                            message: `Процессор ${component.name} не поддерживает DDR5 память материнской платы`
                        };
                    }
                    
                    if (mbIsDDR4 && cpuName.includes('ryzen 5 7600')) {
                        return {
                            compatible: false,
                            message: `Процессор ${component.name} требует DDR5 память, а материнская плата поддерживает DDR4`
                        };
                    }
                }
            }
            
            return { compatible: true, message: '' };
        }
        
        return { compatible: true, message: '' };
    }

}

