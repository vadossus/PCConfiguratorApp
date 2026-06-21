'use strict';

const PaginationManager = (() => {
    const _current = new Map();
    const _total = new Map();
    const _page_cache = new Map();
    const _all_cache = new Map();
    const _per_page = 5;

    const _get_all = async (type) => {
        if (_all_cache.has(type)) return _all_cache.get(type);

        const res = await fetch(`api/components.php?category=${type}`);
        if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
        
        const data = await res.json();

        const components = data.components || (Array.isArray(data) ? data : []);
        
        _all_cache.set(type, components);
        return components;
    };

    const loadComponentPage = async (type, page = 1, filters = {}) => {
        try {
            const key = _cache_key(type, page, filters);
            if (_page_cache.has(key)) return _page_cache.get(key);

            const all = await _get_all(type);
            if (!all.length) return _empty_page();

            const filtered = _apply_filters(all, filters, type);
            const start = (page - 1) * _per_page;
            const end = start + _per_page;
            const paginated = filtered.slice(start, end);
            const total_pages = Math.ceil(filtered.length / _per_page);
            const total_items = filtered.length;

            const result = {
                components: paginated,
                currentPage: page,
                totalPages: total_pages,
                totalItems: total_items,
                hasNext: page < total_pages,
                hasPrev: page > 1,
                itemsPerPage: _per_page
            };

            _page_cache.set(key, result);
            _current.set(type, page);
            _total.set(type, total_pages);

            return result;
        } catch (e) {
            console.error("Ошибка в loadComponentPage:", e); 
            return _empty_page();
        }
    };

    const _apply_filters = (components, filters, type = '') => {
        if (!filters || !Object.keys(filters).length) return components;

        const norm_type = String(type || '').toLowerCase().replace(/s$/, '');
        
        const search = (filters.searchQuery || filters.search || '').toLowerCase();
        const socketFilter = (filters.socket || '').toUpperCase();
        const memoryFilter = (filters.memoryType || filters.memory_type || '').toUpperCase().trim();
        const tdpFilter = parseInt(filters.tdp || filters.cpu_tdp || 0);
        const wattageFilter = parseInt(filters.wattage || filters.required_power || filters.calc_power || 0);
        const formFactorFilter = (filters.form_factor || filters.formFactor || '').toUpperCase();

        return components.filter(c => {
            const rawCat = String(c.category || norm_type || '').toLowerCase();
            const cat_single = rawCat.replace(/s$/, '');

            // поиск
            if (search && c.name) {
                if (!c.name.toLowerCase().includes(search)) return false;
            }

            // фильтр сокета
            const socketCats = ['cpu', 'motherboard', 'cooler'];
            if (socketFilter && socketCats.includes(cat_single)) {
                const c_socket_raw = c.socket || c.socket_compatibility || '';
                if (!c_socket_raw || !String(c_socket_raw).toUpperCase().includes(socketFilter)) {
                    return false;
                }
            }

            // фильтр памяти
            const memCats = ['motherboard', 'ram', 'cpu'];
            if (memoryFilter && memCats.includes(cat_single)) {
                const rawVal = String(c.memory_type || c.memoryType || c.type || '').toUpperCase();
                const cleanCompMem = rawVal.replace(/[^A-Z0-9]/g, '');
                const cleanFilterMem = memoryFilter.replace(/[^A-Z0-9]/g, '');
                
                if (!cleanCompMem.includes(cleanFilterMem)) {
                    console.log(`Отсеян: ${c.name} (Cat: ${cat_single}). Данные: "${rawVal}", Фильтр: "${memoryFilter}"`);
                    return false;
                }
            }

            // фильтр TDP
            if (tdpFilter && cat_single === 'cooler' && c.tdp) {
                if (parseInt(c.tdp) < tdpFilter) return false;
            }

            // фильтр мощности
            if (wattageFilter && cat_single === 'psu' && c.wattage) {
                if (parseInt(c.wattage) < wattageFilter) return false;
            }

            // форм-фактор
            if (formFactorFilter) {
                const hierarchy = { 
                    'E-ATX': ['E-ATX','ATX','MICRO-ATX','MINI-ITX'], 
                    'ATX': ['ATX','MICRO-ATX','MINI-ITX'], 
                    'MICRO-ATX': ['MICRO-ATX','MINI-ITX'], 
                    'MINI-ITX': ['MINI-ITX'] 
                };
                
                if (cat_single === 'case' && c.supported_motherboards) {
                    const ffs = c.supported_motherboards.toUpperCase().split(/[,|]/).map(f => f.trim());
                    if (!ffs.some(f => f === formFactorFilter || (hierarchy[f] && hierarchy[f].includes(formFactorFilter)))) return false;
                } else if (cat_single === 'motherboard' && c.form_factor) {
                    const c_ff = c.form_factor.toUpperCase();
                    if (!(c_ff === formFactorFilter || (hierarchy[formFactorFilter] && hierarchy[formFactorFilter].includes(c_ff)))) return false;
                }
            }

            return true;
        });
    };

    const searchComponents = async (type, query, filters = {}) => {
        const search_filters = { ...filters, searchQuery: query };
        _clear_type_cache(type);
        return await loadComponentPage(type, 1, search_filters);
    };

    const _cache_key = (type, page, filters) => {
        return `${type}_page_${page}_${JSON.stringify(filters)}`;
    };

    const _clear_type_cache = (type) => {
        for (const key of _page_cache.keys()) {
            if (key.startsWith(type)) _page_cache.delete(key);
        }
    };

    const clearAllCache = () => {
        _page_cache.clear();
        _all_cache.clear();
    };

    const _empty_page = () => ({
        components: [],
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
        itemsPerPage: _per_page
    });

    const getCurrentPage = (type) => _current.get(type) || 1;
    const getTotalPages = (type) => _total.get(type) || 1;

    return Object.freeze({
        loadComponentPage,
        searchComponents,
        clearAllCache,
        getCurrentPage,
        getTotalPages
    });
})();

window.PaginationManager = PaginationManager;