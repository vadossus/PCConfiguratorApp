class DataManager {
    constructor() {
        this.componentDetailsCache = new Map();
        this.compatibilityRules = this.getCompatibilityRules();
        this.API_BASE_URL = 'api/'; 
        
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
        
        this.allComponentsCache = new Map();
    }

    getCachedComponents() {
        return this.componentsData;
    }

    async getComponentsPage(componentType, page = 1, filters = {}) {
        try {
         
            let apiCategory = this.categoryMapping[componentType];
            
            if (!apiCategory) {
                apiCategory = componentType.replace(/s$/, '');
            }
            
            const params = new URLSearchParams();
            params.append('category', apiCategory);
            params.append('page', page);
            params.append('limit', 10);
            
            if (this.shouldApplyFilter(componentType, 'search', filters.search)) {
                params.append('search', filters.search);
            }
            
            if (this.shouldApplyFilter(componentType, 'socket', filters.socket)) {
                params.append('socket', filters.socket);
            }
            
            if (this.shouldApplyFilter(componentType, 'memory_type', filters.memory_type)) {
                params.append('memory_type', filters.memory_type);
            }
            
            if (this.shouldApplyFilter(componentType, 'min_wattage', filters.min_wattage)) {
                params.append('min_wattage', filters.min_wattage);
            }
            
            if (this.shouldApplyFilter(componentType, 'form_factor', filters.form_factor)) {
                params.append('form_factor', filters.form_factor);
            }
            
            const url = `api/components.php?${params.toString()}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            let components = [];
            let totalPages = 1;
            let totalItems = 0;
            
            if (data.success && Array.isArray(data.components)) {
                components = data.components;
                totalPages = data.total_pages || 1;
                totalItems = data.total_items || components.length;
            } else if (Array.isArray(data)) {
                components = data;
                totalItems = data.length;
            } else if (data.components && Array.isArray(data.components)) {
                components = data.components;
                totalPages = data.total_pages || 1;
                totalItems = data.total_items || components.length;
            } else if (data.success && data.data && Array.isArray(data.data)) {
                components = data.data;
                totalPages = data.total_pages || 1;
                totalItems = data.total || components.length;
            } else if (data.data && Array.isArray(data.data)) {
                components = data.data;
                totalPages = data.pages || 1;
                totalItems = data.total || components.length;
            } else {
                components = [];
            }
                   
            components = components.map(component => {
                if (!component.category) {
                    return {
                        ...component,
                        category: apiCategory
                    };
                }
                return component;
            });
            
            return {
                components: components,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                itemsPerPage: 10
            };
            
        } catch (error) {
            return this.getFallbackComponents(componentType, page, filters);
        }
    }

    shouldApplyFilter(componentType, filterName, filterValue) {
        if (!filterValue) return false;
        
        const filterMap = {
            'cpus': ['search'],
            'motherboards': ['search', 'socket'],
            'rams': ['search', 'memory_type'],
            'gpus': ['search'],
            'storages': ['search'],
            'psus': ['search', 'min_wattage'],
            'cases': ['search', 'form_factor'],
            'coolers': ['search', 'socket']
        };
        
        const allowedFilters = filterMap[componentType] || ['search'];
        return allowedFilters.includes(filterName);
    }

    getFallbackComponents(componentType, page, filters) {
        const testData = this.getTestComponents(componentType);
        
        let filteredComponents = testData;
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredComponents = filteredComponents.filter(comp => 
                comp.name.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.socket && this.shouldApplyFilter(componentType, 'socket', filters.socket)) {
            filteredComponents = filteredComponents.filter(comp => 
                comp.socket === filters.socket
            );
        }
        
        if (filters.memory_type && this.shouldApplyFilter(componentType, 'memory_type', filters.memory_type)) {
            filteredComponents = filteredComponents.filter(comp => 
                comp.memory_type === filters.memory_type || comp.type === filters.memory_type
            );
        }
        
        const startIndex = (page - 1) * 10;
        const paginated = filteredComponents.slice(startIndex, startIndex + 10);
        
        return {
            components: paginated,
            currentPage: page,
            totalPages: Math.ceil(filteredComponents.length / 10),
            totalItems: filteredComponents.length,
            hasNext: page < Math.ceil(filteredComponents.length / 10),
            hasPrev: page > 1,
            itemsPerPage: 10
        };
    }

    getTestComponents(componentType) {
        const testData = {
            cpus: [
                {
                    id: 1, name: "AMD Ryzen 5 5600X", category: "cpu", price: 25000,
                    image: "ryzen5_5600x.jpg", socket: "AM4", wattage: 65,
                    critical_specs: ["6 ядер", "12 потоков", "3.7 ГГц"]
                },
                {
                    id: 2, name: "Intel Core i5-12400F", category: "cpu", price: 18000,
                    image: "i5_12400f.jpg", socket: "LGA1700", wattage: 65,
                    critical_specs: ["6 ядер", "12 потоков", "2.5 ГГц"]
                },
                {
                    id: 3, name: "AMD Ryzen 7 5800X", category: "cpu", price: 32000,
                    image: "ryzen7_5800x.jpg", socket: "AM4", wattage: 105,
                    critical_specs: ["8 ядер", "16 потоков", "3.8 ГГц"]
                }
            ],
            motherboards: [
                {
                    id: 1, name: "ASUS ROG Strix B550-F", category: "motherboard", price: 15000,
                    image: "asus_b550f.jpg", socket: "AM4", memory_type: "DDR4",
                    critical_specs: ["Socket AM4", "DDR4", "2 слота M.2"]
                },
                {
                    id: 2, name: "Gigabyte B660M", category: "motherboard", price: 12000,
                    image: "gigabyte_b660m.jpg", socket: "LGA1700", memory_type: "DDR5",
                    critical_specs: ["Socket LGA1700", "DDR5", "Micro-ATX"]
                },
                {
                    id: 3, name: "MSI MAG B550 TOMAHAWK", category: "motherboard", price: 17000,
                    image: "msi_b550_tomahawk.jpg", socket: "AM4", memory_type: "DDR4",
                    critical_specs: ["Socket AM4", "DDR4", "ATX", "2.5G LAN"]
                }
            ],
            rams: [
                {
                    id: 1, name: "Kingston Fury Beast 16GB", category: "ram", price: 6000,
                    image: "kingston_fury_beast.jpg", type: "DDR4", speed: 3200,
                    critical_specs: ["16 ГБ", "DDR4", "3200 МГц"]
                },
                {
                    id: 2, name: "Corsair Vengeance 32GB", category: "ram", price: 8500,
                    image: "corsair_vengeance.jpg", type: "DDR4", speed: 3600,
                    critical_specs: ["32 ГБ", "DDR4", "3600 МГц"]
                },
                {
                    id: 3, name: "G.Skill Trident Z 16GB", category: "ram", price: 7500,
                    image: "gskill_trident.jpg", type: "DDR5", speed: 6000,
                    critical_specs: ["16 ГБ", "DDR5", "6000 МГц"]
                }
            ],
            gpus: [
                {
                    id: 1, name: "NVIDIA RTX 3060", category: "gpu", price: 35000,
                    image: "rtx3060.jpg", wattage: 170,
                    critical_specs: ["12 ГБ GDDR6", "PCIe 4.0"]
                },
                {
                    id: 2, name: "AMD Radeon RX 6700 XT", category: "gpu", price: 38000,
                    image: "rx6700xt.jpg", wattage: 230,
                    critical_specs: ["12 ГБ GDDR6", "PCIe 4.0"]
                }
            ],
            storages: [
                {
                    id: 1, name: "Samsung 980 1TB", category: "storage", price: 8000,
                    image: "samsung_980.jpg", type: "M.2", capacity: 1000,
                    critical_specs: ["1 ТБ", "M.2 NVMe", "3500 МБ/с"]
                },
                {
                    id: 2, name: "WD Blue 2TB", category: "storage", price: 5000,
                    image: "wd_blue.jpg", type: "SATA", capacity: 2000,
                    critical_specs: ["2 ТБ", "SATA 3", "560 МБ/с"]
                }
            ],
            psus: [
                {
                    id: 1, name: "Seasonic Focus 750W", category: "psu", price: 9000,
                    image: "seasonic_focus.jpg", wattage: 750, efficiency: "80+ Gold",
                    critical_specs: ["750 Вт", "80+ Gold", "Полумодульный"]
                },
                {
                    id: 2, name: "Corsair RM850x", category: "psu", price: 12000,
                    image: "corsair_rm850x.jpg", wattage: 850, efficiency: "80+ Gold",
                    critical_specs: ["850 Вт", "80+ Gold", "Полностью модульный"]
                }
            ],
            cases: [
                {
                    id: 1, name: "NZXT H510", category: "case", price: 7000,
                    image: "nzxt_h510.jpg", form_factor: "ATX", maxGPULength: 360,
                    critical_specs: ["Mid-Tower", "ATX", "Tempered Glass"]
                },
                {
                    id: 2, name: "Fractal Design Meshify C", category: "case", price: 8500,
                    image: "fractal_meshify.jpg", form_factor: "ATX", maxGPULength: 315,
                    critical_specs: ["Mid-Tower", "ATX", "Mesh Front Panel"]
                }
            ],
            coolers: [
                {
                    id: 1, name: "Noctua NH-U12S", category: "cooler", price: 6000,
                    image: "noctua_nh-u12s.jpg", socket: ["AM4", "LGA1700", "LGA1200"],
                    critical_specs: ["Башенный", "120mm вентилятор", "Низкий шум"]
                },
                {
                    id: 2, name: "Cooler Master Hyper 212", category: "cooler", price: 3500,
                    image: "coolermaster_hyper212.jpg", socket: ["AM4", "LGA1700"],
                    critical_specs: ["Башенный", "120mm вентилятор", "4 тепловые трубки"]
                }
            ]
        };
        
        return testData[componentType] || [];
    }

    async getComponentDetails(componentId, componentType) {
        const cacheKey = `${componentType}_${componentId}`;
        
        if (this.componentDetailsCache.has(cacheKey)) {
            return this.componentDetailsCache.get(cacheKey);
        }

        try {
            const url = `${this.API_BASE_URL}components.php?id=${componentId}&category=${componentType}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            let component;
            
            if (data.success && data.component) {
                component = data.component;
            } else if (data.component) {
                component = data.component;
            } else if (data.id && data.name) {
                component = data;
            } else {
                const testData = this.getTestComponents(componentType + 's');
                component = testData.find(comp => comp.id === componentId);
            }
            
            if (component) {
                this.componentDetailsCache.set(cacheKey, component);
                return component;
            }
            
            return null;
        } catch (error) {
            const testData = this.getTestComponents(componentType + 's');
            return testData.find(comp => comp.id === componentId) || null;
        }
    }

    async searchComponents(componentType, query, filters = {}) {
        const searchFilters = {
            ...filters,
            search: query
        };
        return await this.getComponentsPage(componentType, 1, searchFilters);
    }

    validateCompatibility(currentBuild) {
        const errors = [];
        const warnings = [];
        
        const getComponentData = (comp) => {
            if (!comp) return null;
            return comp.component || comp;
        };

        const componentsToCheck = [
            { type: 'cpus', name: 'Процессор', required: true },
            { type: 'motherboards', name: 'Материнская плата', required: true },
            { type: 'rams', name: 'Оперативная память', required: true },
            { type: 'gpus', name: 'Видеокарта', required: false },
            { type: 'storages', name: 'Накопитель', required: false, isArray: true },
            { type: 'psus', name: 'Блок питания', required: false },
            { type: 'cases', name: 'Корпус', required: false },
            { type: 'coolers', name: 'Охлаждение', required: false }
        ];

        const selectedCount = componentsToCheck.reduce((count, comp) => {
            const component = currentBuild[comp.type];
            if (comp.isArray) {
                return count + (Array.isArray(component) && component.length > 0 ? 1 : 0);
            } else {
                return count + (component ? 1 : 0);
            }
        }, 0);

        
        if (currentBuild.cpus && currentBuild.motherboards) {
            const cpuData = getComponentData(currentBuild.cpus);
            const mbData = getComponentData(currentBuild.motherboards);
            
            const cpuSocket = cpuData?.socket;
            const mbSocket = mbData?.socket;
            
            if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
                errors.push({
                    component1: 'cpus',
                    component2: 'motherboards',
                    message: `Процессор ${cpuData.name} (сокет ${cpuSocket}) не совместим с материнской платой ${mbData.name} (сокет ${mbSocket})`
                });
            }
        }

        if (currentBuild.rams && currentBuild.motherboards) {
            const ramData = getComponentData(currentBuild.rams);
            const mbData = getComponentData(currentBuild.motherboards);
            
            const ramType = ramData?.type || ramData?.memory_type;
            const mbMemoryType = mbData?.memory_type || mbData?.memoryType;
            
            if (ramType && mbMemoryType && ramType !== mbMemoryType) {
                errors.push({
                    component1: 'rams',
                    component2: 'motherboards',
                    message: `Оперативная память ${ramData.name} (${ramType}) не совместима с материнской платой ${mbData.name} (${mbMemoryType})`
                });
            }
        }

        if (currentBuild.cases && currentBuild.motherboards) {
            const caseData = getComponentData(currentBuild.cases);
            const mbData = getComponentData(currentBuild.motherboards);
            
            const caseFormFactors = caseData?.supportedFormFactors || [];
            const mbFormFactor = mbData?.form_factor || mbData?.formFactor;
            
            if (mbFormFactor && caseFormFactors.length > 0 && !caseFormFactors.includes(mbFormFactor)) {
                errors.push({
                    component1: 'motherboards',
                    component2: 'cases',
                    message: `Материнская плата ${mbData.name} (${mbFormFactor}) не поместится в корпус ${caseData.name} (поддерживает: ${caseFormFactors.join(', ')})`
                });
            }
        }

        if (currentBuild.storages && Array.isArray(currentBuild.storages)) {
            currentBuild.storages.forEach((storage) => {
                const storageData = getComponentData(storage);
                const mbData = getComponentData(currentBuild.motherboards);
                
                if (storageData?.type === 'M.2' && mbData && mbData.m2Slots === 0) {
                    errors.push({
                        component1: 'storages',
                        component2: 'motherboards',
                        message: `Накопитель ${storageData.name} (M.2) требует слот M.2, но материнская плата ${mbData.name} не имеет слотов M.2`
                    });
                }
            });
        }

        const totalWattage = this.calculateTotalWattage(currentBuild);
        if (currentBuild.psus) {
            const psuData = getComponentData(currentBuild.psus);
            if (psuData && totalWattage > psuData.wattage) {
                warnings.push({
                    message: `Мощность блока питания ${psuData.wattage}W может быть недостаточной для системы (расчетная мощность: ${totalWattage}W)`
                });
            }
        }

        if (currentBuild.gpus && currentBuild.cases) {
            const gpuData = getComponentData(currentBuild.gpus);
            const caseData = getComponentData(currentBuild.cases);
            
            const gpuLength = gpuData?.length || 300;
            const caseMaxLength = caseData?.maxGPULength || 350;
            
            if (gpuLength > caseMaxLength) {
                warnings.push({
                    message: `Видеокарта может не поместиться в корпус. Длина видеокарты: ${gpuLength}mm, максимальная длина в корпусе: ${caseMaxLength}mm`
                });
            }
        }

        if (currentBuild.coolers && currentBuild.cpus) {
            const coolerData = getComponentData(currentBuild.coolers);
            const cpuData = getComponentData(currentBuild.cpus);
            
            const coolerSockets = Array.isArray(coolerData?.socket) ? 
                coolerData.socket : [coolerData?.socket];
            const cpuSocket = cpuData?.socket;
            
            if (cpuSocket && coolerSockets.length > 0 && !coolerSockets.includes(cpuSocket)) {
                errors.push({
                    component1: 'coolers',
                    component2: 'cpus',
                    message: `Охлаждение ${coolerData.name} не совместимо с процессором ${cpuData.name} (сокет ${cpuSocket})`
                });
            }
        }

        const progress = (selectedCount / componentsToCheck.length) * 100;

        return {
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors: errors,
            warnings: warnings,
            totalWattage: totalWattage,
            progress: progress,
            selectedCount: selectedCount,
            totalCount: componentsToCheck.length
        };
    }

    calculateTotalWattage(build) {
        let total = 0;
        
        const getComponentData = (comp) => comp?.component || comp;
        
        const cpuData = getComponentData(build.cpus);
        const gpuData = getComponentData(build.gpus);
        const ramData = getComponentData(build.rams);
        
        if (cpuData && cpuData.wattage) total += parseInt(cpuData.wattage) || 0;
        if (gpuData && gpuData.wattage) total += parseInt(gpuData.wattage) || 0;
        if (ramData && ramData.wattage) total += parseInt(ramData.wattage) || 0;
        
        if (build.storages && Array.isArray(build.storages)) {
            build.storages.forEach(storage => {
                const storageData = storage?.component || storage;
                if (storageData.wattage) total += parseInt(storageData.wattage) || 0;
            });
        }
        
        return Math.ceil(total * 1.2);
    }

    getCompatibilityFilters(currentBuild) {
        
        const filters = {};
        
        const getComponentData = (comp) => {
            if (!comp) return null;
            return comp.component || comp;
        };
        
        if (currentBuild.cpus) {
            const cpuData = getComponentData(currentBuild.cpus);
            if (cpuData && cpuData.socket) {
                filters.socket = cpuData.socket;
            }
        }
        
        if (currentBuild.motherboards) {
            const mbData = getComponentData(currentBuild.motherboards);
            if (mbData) {
                if (mbData.memory_type) {
                    filters.memory_type = mbData.memory_type;
                } else if (mbData.memoryType) {
                    filters.memory_type = mbData.memoryType;
                }
                
                if (mbData.form_factor) {
                    filters.form_factor = mbData.form_factor;
                }
            }
        }
        
        if (currentBuild.psus) {
            const psuData = getComponentData(currentBuild.psus);
            const totalWattage = this.calculateTotalWattage(currentBuild);
            
            if (totalWattage > 0) {
                filters.min_wattage = Math.ceil(totalWattage * 0.8); 
            }
        }
        
        return filters;
    }

    getCompatibilityRules() {
        return {
            sockets: {
                'AM4': ['AM4'],
                'LGA1700': ['LGA1700'], 
                'AM5': ['AM5'],
                'LGA1200': ['LGA1200'],
                'LGA1151': ['LGA1151'],
                'TR4': ['TR4']
            },
            memoryTypes: {
                'DDR4': ['DDR4'],
                'DDR5': ['DDR5'],
                'DDR3': ['DDR3']
            },
            storageTypes: {
                'M.2': { requires: 'm2Slots', min: 1 },
                'SATA': { requires: 'sataPorts', min: 1 },
                'NVMe': { requires: 'm2Slots', min: 1 }
            },
            formFactors: {
                'ATX': ['ATX', 'E-ATX', 'Micro-ATX'],
                'Micro-ATX': ['ATX', 'Micro-ATX', 'Mini-ITX'],
                'Mini-ITX': ['ATX', 'Micro-ATX', 'Mini-ITX']
            }
        };
    }

    getComponentTypes() {
        return [
            { type: 'cpus', name: 'Процессоры', icon: '⚡', slug: 'cpu' },
            { type: 'motherboards', name: 'Мат.плата', icon: '🔌', slug: 'motherboard' },
            { type: 'rams', name: 'Оперативная память', icon: '💾', slug: 'ram' },
            { type: 'gpus', name: 'Видеокарты', icon: '🎮', slug: 'gpu' },
            { type: 'storages', name: 'Накопители', icon: '💿', slug: 'storage' },
            { type: 'psus', name: 'Блок питания', icon: '🔋', slug: 'psu' },
            { type: 'coolers', name: 'Охлаждение', icon: '❄️', slug: 'cooler' },
            { type: 'cases', name: 'Корпус', icon: '🖥️', slug: 'case' }
        ];
    }

    getComponentNameByType(type) {
        const types = this.getComponentTypes();
        const found = types.find(t => t.type === type);
        return found ? found.name : type;
    }

    getEmptyPageData() {
        return {
            components: [],
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false,
            itemsPerPage: 5
        };
    }

    clearCache() {
        this.componentDetailsCache.clear();
        this.allComponentsCache.clear();
    }

    async testImagePath(imagePath) {
        if (!imagePath) return false;
        
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    getComponentImagePath(component) {
        
        if (!component || !component.image) {
            return 'source/icons/default_component.png';
        }
        
        let imagePath = component.image;
        
        let categoryFolder = this.getComponentCategoryFolder(component);
        
        const possiblePaths = [];
        
        if (imagePath.startsWith('http://') || 
            imagePath.startsWith('https://') || 
            imagePath.startsWith('/')) {
            possiblePaths.push(imagePath);
        }
        
        possiblePaths.push(`source/${categoryFolder}/${imagePath}`);
        
        if (imagePath.includes('/')) {
            possiblePaths.push(`source/${imagePath}`);
            possiblePaths.push(imagePath);
        } else {
            possiblePaths.push(`source/images/${categoryFolder}/${imagePath}`);
            possiblePaths.push(`images/${categoryFolder}/${imagePath}`);
            possiblePaths.push(`components/${categoryFolder}/${imagePath}`);
        }
        
        possiblePaths.push(`source/${imagePath}`);
        
        possiblePaths.push('source/icons/default_component.png');
            
        return possiblePaths[0];
    }

    getComponentCategoryFolder(component) {
        if (!component || !component.category) {
            return 'components';
        }
        
        const category = component.category.toLowerCase();
        
        const categoryMap = {
            'cpu': 'cpus',
            'процессор': 'cpus',
            'processor': 'cpus',
            
            'motherboard': 'motherboards',
            'материнская плата': 'motherboards',
            'материнская_плата': 'motherboards',
            'mainboard': 'motherboards',
            
            'ram': 'rams',
            'оперативная память': 'rams',
            'оперативная_память': 'rams',
            'memory': 'rams',
            
            'gpu': 'gpus',
            'видеокарта': 'gpus',
            'видео карта': 'gpus',
            'videocard': 'gpus',
            'graphics card': 'gpus',
            
            'storage': 'storages',
            'накопитель': 'storages',
            'жесткий диск': 'storages',
            'ssd': 'storages',
            'hdd': 'storages',
            'hard drive': 'storages',
            
            'psu': 'psus',
            'блок питания': 'psus',
            'блок_питания': 'psus',
            'power supply': 'psus',
            
            'case': 'cases',
            'корпус': 'cases',
            'computer case': 'cases',
            
            'cooler': 'coolers',
            'охлаждение': 'coolers',
            'кулер': 'coolers',
            'cooling': 'coolers'
        };
        
        return categoryMap[category] || category;
    }

    formatPrice(price) {
        if (!price) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    }

    getComponentSpecs(component) {
        const specs = [];
        
        if (component) {
            if (component.critical_specs && Array.isArray(component.critical_specs)) {
                specs.push(...component.critical_specs.slice(0, 3));
            }
            
            if (component.socket) specs.push(`Сокет: ${component.socket}`);
            if (component.memory_type) specs.push(`Память: ${component.memory_type}`);
            if (component.type) specs.push(`Тип: ${component.type}`);
            if (component.wattage) specs.push(`Мощность: ${component.wattage}W`);
            if (component.capacity) specs.push(`Объем: ${component.capacity}`);
            if (component.speed) specs.push(`Скорость: ${component.speed}`);
            if (component.form_factor) specs.push(`Форм-фактор: ${component.form_factor}`);
            if (component.efficiency) specs.push(`Эффективность: ${component.efficiency}`);
            if (component.tdp) specs.push(`TDP: ${component.tdp}W`);
        }
        
        return specs.slice(0, 3);
    }

    async testAPIConnection() {
        try {
            const response = await fetch(`api/components.php?category=cpu&limit=1`);
            if (response.ok) {
                const data = await response.json();
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
    
    if (!window.dataManager) {
        window.dataManager = new DataManager();
    }
}