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
                throw new Error(`ошибка http: ${response.status}`);
            }
            
            const data = await response.json();
            const components = data.components?.[componentType] || [];;
    
            this.allComponentsCache.set(componentType, components);
            
            return components;
            
        } catch (error) {
            throw new Error(`проблемы с компонентами`, error);
        }
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


