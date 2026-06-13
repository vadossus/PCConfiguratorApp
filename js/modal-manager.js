'use strict';

const ModalManager = (() => {
    let _data = null;
    let _config = null;
    let _type = null;
    let _filters = {};
    let _page = 1;
    const _per_page = 5;

    const TYPE_NAMES = Object.freeze({
        cpus: 'процессор', motherboards: 'материнскую плату', rams: 'оперативную память',
        gpus: 'видеокарту', storages: 'накопитель', psus: 'блок питания',
        cases: 'корпус', coolers: 'охлаждение'
    });

    const TYPE_SINGULAR = Object.freeze({
        cpus: 'cpus', motherboards: 'motherboards', rams: 'rams',
        gpus: 'gpus', storages: 'storages', psus: 'psus',
        cases: 'cases', coolers: 'coolers'
    });

    const CATEGORY_FOLDER = Object.freeze({
        cpu: 'cpus', cpus: 'cpus', motherboard: 'motherboards', motherboards: 'motherboards',
        ram: 'rams', rams: 'rams', gpu: 'gpus', gpus: 'gpus',
        storage: 'storages', storages: 'storages', psu: 'psus', psus: 'psus',
        cooler: 'coolers', coolers: 'coolers', case: 'cases', cases: 'cases'
    });

    const _bind = () => {
        const modal = document.getElementById('component-modal');
        if (!modal) return;

        const close_btn = modal.querySelector('.close-button');
        if (close_btn) close_btn.addEventListener('click', _hide);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) _hide();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) _hide();
        });

        const content = modal.querySelector('.modal-content');
        if (content) content.addEventListener('click', (e) => e.stopPropagation());
    };

    const _hide = () => {
        const modal = document.getElementById('component-modal');
        if (modal) modal.classList.add('hidden');
        _type = null;
        _filters = {};
        _page = 1;
    };

    const _show = (type, filters = {}) => {
        _type = type;
        _filters = {};
        _page = 1;

        if (type === 'psus' && filters.min_wattage) {
            _filters.min_wattage = filters.min_wattage;
        }
        
        if (type === 'motherboards' && filters.socket) {
            _filters.socket = filters.socket;
        }

        const modal = document.getElementById('component-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const title = document.getElementById('modal-title');
        if (title) title.textContent = `Выберите ${TYPE_NAMES[type] || type}`;

        const body = document.getElementById('modal-body');
        if (body) body.innerHTML = '<div class="modal-loading"><div class="spinner"></div><p>Загрузка компонентов...</p></div>';

        _load_page(1);
    };

    const _load_page = async (page) => {
        try {
            const page_data = await _data.getComponentsPage(_type, page, _filters);
            let components = [];
            if (page_data?.components) components = page_data.components;
            else if (Array.isArray(page_data)) components = page_data;

            if (components.length === 0 && Object.keys(_filters).length > 0) {
                const no_filter_data = await _data.getComponentsPage(_type, page, {});
                if (no_filter_data?.components) components = no_filter_data.components;
                else if (Array.isArray(no_filter_data)) components = no_filter_data;
            }

            if (components.length > _per_page) components = components.slice(0, _per_page);

            components = components.map(c => ({
                ...c,
                compatible: _check_one(c, _type)
            }));

            _render(components, {
                current: page_data?.currentPage || page,
                total: page_data?.totalPages || Math.ceil(components.length / _per_page) || 1,
                items: page_data?.totalItems || components.length,
                next: page_data?.hasNext || (page < (page_data?.totalPages || 1)),
                prev: page_data?.hasPrev || (page > 1)
            });
        } catch (e) {
            const body = document.getElementById('modal-body');
            if (body) {
                body.innerHTML = `<div class="modal-error"><h3>Ошибка загрузки</h3><p>${e.message || 'Не удалось загрузить компоненты'}</p><button onclick="ModalManager.retry()" class="btn-retry">Попробовать снова</button></div>`;
            }
        }
    };

    const _check_one = (component, type) => {
        const data = component.component || component;
        if (!_config) return true;
        const build = _config.build;
        const storages = build.storages || [];

        if (type === 'motherboards' && build?.cpus) {
            if (data.socket && data.socket.toUpperCase() !== build.cpus.socket.toUpperCase()) return false;
            
            if (data.memory_type && build.cpus.memory_type) {
                const mb_type = data.memory_type.toUpperCase();
                const cpu_type = build.cpus.memory_type.toUpperCase();
                if (!cpu_type.includes(mb_type) && !mb_type.includes(cpu_type)) return false;
            }
            
            if (build.rams) {
                const mb_type = (data.memory_type || '').toUpperCase();
                const ram_type = (build.rams.type || build.rams.memory_type || '').toUpperCase();
                if (mb_type && ram_type && ((mb_type.includes('DDR4') && ram_type.includes('DDR5')) || (mb_type.includes('DDR5') && ram_type.includes('DDR4')))) return false;
            }
        }

        if (type === 'cpus' && build?.motherboards?.socket && data.socket) {
            if (data.socket.toUpperCase() !== build.motherboards.socket.toUpperCase()) return false;
        }

        if (type === 'rams') {
            const ram_type = (data.type || data.memory_type || '').toUpperCase();
            
            if (build?.cpus?.memory_type) {
                const cpu_types = build.cpus.memory_type.toUpperCase();
                if (ram_type && !cpu_types.includes(ram_type)) return false;
            }

            if (build?.motherboards?.memory_type) {
                const mb_type = build.motherboards.memory_type.toUpperCase();
                if (ram_type && ((mb_type.includes('DDR4') && ram_type.includes('DDR5')) || (mb_type.includes('DDR5') && ram_type.includes('DDR4')))) return false;
                
                const mb_slots = build.motherboards.memory_slots || 4;
                if (mb_slots && data.modules && parseInt(data.modules) > mb_slots) return false;
            }
        }

        if (type === 'storages' && build?.motherboards) {
            const is_m2 = (s) => {
                const type = (s.type || '').toUpperCase();
                const formFactor = (s.form_factor || '').toUpperCase();
                const iface = (s.interface || '').toUpperCase();
                return type.includes('NVME') || formFactor.includes('M.2') || iface.includes('M.2') || iface.includes('PCI-E');
            };
            if (is_m2(data)) {
                const existing_m2 = storages.filter(s => is_m2(s)).length;
                const m2_slots = build.motherboards.m2_slots || 1;
                if (existing_m2 >= m2_slots) return false;
            } else {
                const existing_sata = storages.filter(s => !is_m2(s)).length;
                const sata_ports = build.motherboards.sata_ports || 4;
                if (existing_sata  >= sata_ports) return false;
            }
        }

        if (type === 'coolers' && build?.cpus?.socket && data.socket_compatibility) {
            const sockets = data.socket_compatibility.toUpperCase().split(/[,|]/).map(s => s.trim());
            if (!sockets.includes(build.cpus.socket.toUpperCase())) return false;
            if (build.cpus.tdp && data.tdp && parseInt(data.tdp) < parseInt(build.cpus.tdp)) return false;
        }

        if (type === 'cases' && build?.motherboards?.form_factor && data.supported_motherboards) {
            const mb_ff = build.motherboards.form_factor.toUpperCase();
            const case_ffs = data.supported_motherboards.toUpperCase().split(/[,|]/).map(f => f.trim());
            const hierarchy = { 'E-ATX': ['E-ATX','ATX','MICRO-ATX','MINI-ITX'], 'ATX': ['ATX','MICRO-ATX','MINI-ITX'], 'MICRO-ATX': ['MICRO-ATX','MINI-ITX'], 'MINI-ITX': ['MINI-ITX'] };
            let ok = false;
            for (const f of case_ffs) { if (f === mb_ff || (hierarchy[f] && hierarchy[f].includes(mb_ff))) { ok = true; break; } }
            if (!ok) return false;
        }

        if (type === 'psus') {
            const total = _config.calc_power ? _config.calc_power() : 0;
            if (total > 0 && data.wattage && parseInt(data.wattage) < total) return false;
        }

        return true;
    };

    const _render = (components, page_data) => {
        const body = document.getElementById('modal-body');
        if (!body) return;

        const type_name = TYPE_NAMES[_type] || _type;

        let html = `<div class="components-modal-content">
            <div class="components-search">
                <input type="text" id="modal-search-input" placeholder="Поиск ${type_name}..." class="search-input">
                <button onclick="ModalManager.search()" class="btn-search">Найти</button>
            </div>
            <div class="components-list-info">Найдено: ${page_data.items} компонентов</div>
            <div class="components-grid" id="modal-components-list">`;

        if (!components || !components.length) {
            html += `<div class="no-components"><h4>Компоненты не найдены</h4><p>Попробуйте изменить поисковый запрос или фильтры</p></div>`;
        } else {
            components.forEach(c => { if (c) html += _card(c); });
        }

        const has_filters = Object.keys(_filters).length > 0 && !(Object.keys(_filters).length === 1 && _filters.search);
        if (has_filters) {
            html += `<div class="filter-clear-section"><button class="btn-clear-filters" onclick="ModalManager.clearFilters()"><span class="clear-icon">&times;</span> Очистить фильтры</button></div>`;
        }

        html += '</div>';
        if (page_data.items > 0) html += _pagination(page_data);
        html += '</div>';
        body.innerHTML = html;

        _page = page_data.current;

        const search_input = document.getElementById('modal-search-input');
        if (search_input) {
            search_input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') _search();
            });
        }
    };

    const _card = (component) => {
        const price = component.price ? new Intl.NumberFormat('ru-RU').format(component.price) : '0';
        const name = component.name || 'Без названия';
        const id = component.component_id || component.id;
        const ok = component.compatible;
        const cls = ok ? 'compatible' : 'incompatible';
        const text = ok ? 'Совместим' : 'Несовместим';
        const img = _get_image(component);

        let specs = '';
        const parts = [];
        if (component.socket) parts.push(`Сокет: ${component.socket}`);
        if (component.memory_type) parts.push(`${component.memory_type}`);
        if (component.capacity) parts.push(`${component.capacity} ГБ`);
        if (component.wattage) parts.push(`${component.wattage}W`);
        if (component.type) parts.push(component.type);
        if (component.cores) parts.push(`${component.cores} ядер`);
        if (component.supported_motherboards) parts.push(`${component.supported_motherboards}`);
        if (component.memory_size) parts.push(`${component.memory_size} ГБ`);
        if (component.chipset) parts.push(component.chipset);
        specs = parts.slice(0, 2).join(' | ');

        return `<div class="component-card-modal ${cls}" onclick="ModalManager.select(${id}, '${_type}')">
            <div class="component-card-image"><img src="${img}" alt="${name}" onerror="this.src='source/icons/component_placeholder.png';"></div>
            <div class="component-card-info">
                <div class="component-card-name"><a href="component.html?id=${id}&type=${_type}" class="component-link" onclick="event.stopPropagation()">${name}</a></div>
                ${specs ? `<div class="component-card-specs">${specs}</div>` : ''}
                <div class="compatibility-indicator ${cls}">${text}</div>
            </div>
            <div class="component-card-price-section">
                <div class="component-card-price">${price} Р</div>
                <button class="btn-select-component" onclick="event.stopPropagation(); ModalManager.select(${id}, '${_type}')">${ok ? 'Выбрать' : 'Всё равно выбрать'}</button>
            </div>
        </div>`;
    };

    const _get_image = (component) => {
        if (_data?.getComponentImagePath) return _data.getComponentImagePath(component);
        if (!component?.image) return 'source/icons/default_component.png';
        const path = component.image.trim();
        if (path.startsWith('http')) return path;
        const folder = _get_folder(component);
        return `source/${folder}/${path}`;
    };

    const _get_folder = (component) => {
        if (!component) return 'components';
        if (component.category) return CATEGORY_FOLDER[component.category.toLowerCase()] || component.category;
        return _type || 'components';
    };

    const _pagination = (data) => `
        <div class="modal-pagination">
            <button class="btn-pagination ${!data.prev ? 'disabled' : ''}" onclick="ModalManager.prev()" ${!data.prev ? 'disabled' : ''}>&larr;</button>
            <span class="page-info">${data.current} из ${data.total}</span>
            <button class="btn-pagination ${!data.next ? 'disabled' : ''}" onclick="ModalManager.next()" ${!data.next ? 'disabled' : ''}>&rarr;</button>
        </div>`;

    const _search = () => {
        const input = document.getElementById('modal-search-input');
        if (!input) return;
        const q = input.value.trim();
        if (q) _filters.search = q; else delete _filters.search;
        _load_page(1);
    };

    const _clear = () => { _filters = {}; _load_page(1); };

    const _select = async (id, type) => {
        const actual_type = type || _type;
        try {
            const res = await fetch(`api/components.php?id=${id}&category=${actual_type}`);
            const data = await res.json();
            if (!data.success || !data.component) throw new Error('Компонент не найден');
            const c = data.component;
            if (c.component_id) c.id = c.component_id;
            if (!c.category) c.category = actual_type.replace(/s$/, '');
            _hide();
            setTimeout(() => { if (_config?.selectComponent) _config.selectComponent(actual_type, c); }, 100);
        } catch (e) { alert(`Ошибка выбора: ${e.message}`); }
    };

    const _init = (data_manager, configurator) => {
        _data = data_manager;
        _config = configurator;
        _bind();
    };

    return Object.freeze({
        init: _init,
        showComponentModal: _show,
        hideComponentModal: _hide,
        search: _search,
        select: _select,
        prev: () => { if (_page > 1) _load_page(_page - 1); },
        next: () => _load_page(_page + 1),
        retry: () => _load_page(_page),
        clearFilters: _clear
    });
})();

window.ModalManager = ModalManager;