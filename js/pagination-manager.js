class PaginationManager {
    constructor() {
        this.currentPage = new Map();
        this.totalPages = new Map();
        this.itemsPerPage = 5;
        this.pageCache = new Map(); 
        this.allComponentsCache = new Map(); 
    }

    async loadComponentPage(componentType, page = 1, filters = {}) {
        try {
            const cacheKey = this.getCacheKey(componentType, page, filters);
            
            if (this.pageCache.has(cacheKey)) {
                return this.pageCache.get(cacheKey);
            }

            
            const components = await this.getAllComponents(componentType);

            if (components.length === 0) {
                return this.getEmptyPageData();
            }
            const filteredComponents = this.applyFilters(components, filters);

            const startIndex = (page - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedComponents = filteredComponents.slice(startIndex, endIndex);
            
            const totalPages = Math.ceil(filteredComponents.length / this.itemsPerPage);
            const totalItems = filteredComponents.length;

            const pageData = {
                components: paginatedComponents,
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalItems,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                itemsPerPage: this.itemsPerPage
            };

            this.pageCache.set(cacheKey, pageData);
            this.currentPage.set(componentType, page);
            this.totalPages.set(componentType, totalPages);
       
            return pageData;
            
        } catch (error) {
            return this.getEmptyPageData();
        }
    }

    async getAllComponents(componentType) {
        if (this.allComponentsCache.has(componentType)) {
            const cached = this.allComponentsCache.get(componentType);
            return cached;
        }

        try {
            const response = await fetch('./data/basic_components.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const components = data.components?.[componentType] || [];;
    
            this.allComponentsCache.set(componentType, components);
            
            return components;
            
        } catch (error) {
            
            const minimalData = this.getMinimalTestData(componentType);
            
            this.allComponentsCache.set(componentType, minimalData);
            return minimalData;
        }
    }

    getMinimalTestData(componentType) {
        const minimalData = {
            cpus: [
                {
                    id: 1,
                    name: "AMD Ryzen 5 5600X (Тестовый)",
                    category: "cpu",
                    price: 25000,
                    image: "cpu/ryzen5_5600x.jpg",
                    compatibility_flags: ["AM4", "DDR4"],
                    critical_specs: ["6 ядер", "12 потоков", "3.7 ГГц"],
                    socket: "AM4",
                    wattage: 65
                },
                {
                    id: 2,
                    name: "Intel Core i5-12400F (Тестовый)", 
                    category: "cpu", 
                    price: 18000,
                    image: "cpu/i5_12400f.jpg",
                    compatibility_flags: ["LGA1700", "DDR4"],
                    critical_specs: ["6 ядер", "12 потоков", "2.5 ГГц"],
                    socket: "LGA1700",
                    wattage: 65
                }
            ],
            motherboards: [
                {
                    id: 1,
                    name: "ASUS ROG Strix B550-F (Тестовый)",
                    category: "motherboard",
                    price: 15000,
                    image: "motherboard/asus_b550f.jpg",
                    compatibility_flags: ["AM4", "DDR4"],
                    critical_specs: ["Socket AM4", "DDR4", "2 слота M.2"],
                    socket: "AM4",
                    memoryType: "DDR4",
                    memorySlots: 4,
                    m2Slots: 2,
                    maxMemory: 128
                }
            ],
            rams: [
                {
                    id: 1,
                    name: "Kingston Fury Beast 16GB (Тестовый)",
                    category: "ram", 
                    price: 6000,
                    image: "ram/kingston_fury_beast.jpg",
                    compatibility_flags: ["DDR4"],
                    critical_specs: ["16 ГБ", "DDR4", "3200 МГц"],
                    type: "DDR4",
                    speed: 3200,
                    size: 16,
                    modules: 2
                }
            ],
            gpus: [
                {
                    id: 1,
                    name: "NVIDIA RTX 3060 (Тестовый)",
                    category: "gpu",
                    price: 35000,
                    image: "gpu/rtx3060.jpg",
                    compatibility_flags: ["PCIe"],
                    critical_specs: ["12 ГБ GDDR6", "PCIe 4.0"],
                    wattage: 170,
                    interface: "PCIe"
                }
            ],
            storages: [
                {
                    id: 1,
                    name: "Samsung 980 1TB (Тестовый)",
                    category: "storage",
                    price: 8000,
                    image: "storage/samsung_980.jpg",
                    compatibility_flags: ["M.2"],
                    critical_specs: ["1 ТБ", "M.2 NVMe", "3500 МБ/с"],
                    type: "M.2",
                    capacity: 1000
                }
            ],
            psus: [
                {
                    id: 1,
                    name: "Seasonic 750W (Тестовый)",
                    category: "psu",
                    price: 9000,
                    image: "psu/seasonic_focus.jpg",
                    compatibility_flags: ["ATX"],
                    critical_specs: ["750 Вт", "80+ Gold", "Полумодульный"],
                    wattage: 750,
                    efficiency: "80+ Gold",
                    formFactor: "ATX"
                }
            ],
            cases: [
                {
                    id: 1,
                    name: "NZXT H510 (Тестовый)",
                    category: "case", 
                    price: 7000,
                    image: "case/nzxt_h510.jpg",
                    compatibility_flags: ["ATX"],
                    critical_specs: ["Mid-Tower", "ATX", "Tempered Glass"],
                    formFactor: "ATX",
                    maxGPULength: 360
                }
            ]
        };

        return minimalData[componentType] || [];
    }

    applyFilters(components, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return components;
        }

        
        return components.filter(component => {
            let passesFilters = true;

            const ignoreFiltersFor = ['cooler', 'storage', 'psu', 'case'];
            
            if (ignoreFiltersFor.includes(component.category)) {
                if (filters.searchQuery && component.name) {
                    const query = filters.searchQuery.toLowerCase();
                    passesFilters = passesFilters && component.name.toLowerCase().includes(query);
                }
                return passesFilters;
            }

            if (filters.socket && component.socket && (component.category === 'cpu' || component.category === 'motherboard')) {
                passesFilters = passesFilters && (component.socket === filters.socket);
            }
            
            if (filters.memoryType) {
                if (component.memoryType && component.category === 'motherboard') {
                    passesFilters = passesFilters && (component.memoryType === filters.memoryType);
                }
                if (component.type && component.category === 'ram') {
                    passesFilters = passesFilters && (component.type === filters.memoryType);
                }
            }

            if (filters.searchQuery && component.name) {
                const query = filters.searchQuery.toLowerCase();
                passesFilters = passesFilters && component.name.toLowerCase().includes(query);
            }
            return passesFilters;
            });
    }

    async searchComponents(componentType, query, filters = {}) {
        
        const searchFilters = {
            ...filters,
            searchQuery: query
        };
        
        this.clearPageCacheForType(componentType);
        
        return await this.loadComponentPage(componentType, 1, searchFilters);
    }

    getCacheKey(componentType, page, filters) {
        return `${componentType}_page_${page}_${JSON.stringify(filters)}`;
    }

    clearPageCacheForType(componentType) {
        for (const key of this.pageCache.keys()) {
            if (key.startsWith(componentType)) {
                this.pageCache.delete(key);
            }
        }
    }

    clearAllCache() {
        this.pageCache.clear();
        this.allComponentsCache.clear();
    }

    getEmptyPageData() {
        return {
            components: [],
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNext: false,
            hasPrev: false,
            itemsPerPage: this.itemsPerPage
        };
    }

    getCurrentPage(componentType) {
        return this.currentPage.get(componentType) || 1;
    }

    getTotalPages(componentType) {
        return this.totalPages.get(componentType) || 1;
    }
}

if (typeof window !== 'undefined') {
    window.PaginationManager = PaginationManager;
    
    if (!window.paginationManager) {
        window.paginationManager = new PaginationManager();
    }
}

