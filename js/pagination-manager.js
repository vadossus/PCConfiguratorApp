'use strict';

const PaginationManager = (() => {
    const _current = new Map();
    const _total = new Map();
    const _page_cache = new Map();
    const _all_cache = new Map();
    const _per_page = 5;

    const loadComponentPage = async (type, page = 1, filters = {}) => {
        try {
            const key = _cache_key(type, page, filters);
            if (_page_cache.has(key)) return _page_cache.get(key);

            const all = await _get_all(type);
            if (!all.length) return _empty_page();

            const filtered = _apply_filters(all, filters);
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
            return _empty_page();
        }
    };

    const _apply_filters = (components, filters) => {
        if (!filters || !Object.keys(filters).length) return components;

        return components.filter(c => {
            let ok = true;
            const ignore = ['cooler', 'storage', 'psu', 'case'];

            if (ignore.includes(c.category)) {
                if (filters.searchQuery && c.name) {
                    ok = c.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
                }
                return ok;
            }

            if (filters.socket && c.socket && (c.category === 'cpu' || c.category === 'motherboard')) {
                ok = c.socket === filters.socket;
            }

            if (filters.memoryType) {
                if (c.memoryType && c.category === 'motherboard') ok = c.memoryType === filters.memoryType;
                if (c.type && c.category === 'ram') ok = c.type === filters.memoryType;
            }

            if (filters.searchQuery && c.name) {
                ok = ok && c.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
            }

            return ok;
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