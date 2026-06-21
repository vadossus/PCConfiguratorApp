'use strict';

const ModalManager = (() => {
    let _data = null;
    let _config = null;
    let _type = null;
    let _filters = {};
    let _previous_filters = {}; 
    let _page = 1;
    const _per_page = 5;
    let _all_components = []; 

    const TYPE_NAMES = Object.freeze({
        cpus: 'процессор', motherboards: 'материную плату', rams: 'оперативную память',
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
        _previous_filters = {};
        _page = 1;
        _all_components = []; 
    };

    const _show = (type, filters = {}) => {
        _type = type;
        _filters = { ...filters }; 
        _previous_filters = {};
        _page = 1;
        _all_components = []; 

        const modal = document.getElementById('component-modal');
        if (!modal) return;
        modal.classList.remove('hidden');

        const title = document.getElementById('modal-title');
        if (title) title.textContent = `Выберите ${TYPE_NAMES[type] || type}`;

        const body = document.getElementById('modal-body');
        if (body) body.innerHTML = '<div class="modal-loading"><div class="spinner"></div><p>Загрузка компонентов...</p></div>';

        _load_page(1);
    };

    const _fetch_all_components = async (type, filters) => {
        let result_list = [];
        let current_p = 1;
        let total_p = 1;

        do {
            const page_data = await _data.getComponentsPage(type, current_p, filters, 1000);
            let components = [];

            if (page_data?.components) components = page_data.components;
            else if (Array.isArray(page_data)) components = page_data;

            if (!components || components.length === 0) break;

            result_list = result_list.concat(components);
            total_p = page_data?.totalPages || page_data?.total_pages || 1;
            current_p++;
        } while (current_p <= total_p && current_p <= 50); 

        return result_list;
    };

    const _load_page = async (page) => {
        try {
            // выполняем сетевой запрос только если массив еще не собран (первая страница или сброс фильтров)
            if (page === 1 || _all_components.length === 0) {
                const body = document.getElementById('modal-body');
                if (body && _all_components.length === 0) {
                    body.innerHTML = '<div class="modal-loading"><div class="spinner"></div><p>Загрузка компонентов...</p></div>';
                }

                let components = await _fetch_all_components(_type, _filters);

                // если из-за строгих фильтров ничего не найдено, берем полный список без фильтров
                if (components.length === 0 && Object.keys(_filters).length > 0) {
                    components = await _fetch_all_components(_type, {});
                }

                // просчет совместимости 
                components = components.map(c => ({
                    ...c,
                    compatible: _check_one(c, _type)
                }));

                // если активны фильтры совместимости — скрываем несовместимые
                const has_compat_filters = Object.keys(_filters).some(key => key !== 'search');
                if (has_compat_filters) {
                    components = components.filter(c => c.compatible);
                }

                _all_components = components;
            }

            _page = page;
            const total_items = _all_components.length;
            const total_pages = Math.ceil(total_items / _per_page) || 1;

            // защита от выхода за границы индексов страниц
            if (_page > total_pages) _page = total_pages;
            if (_page < 1) _page = 1;

            // срез массива под текущую страницу (клиентская пагинация)
            const start = (_page - 1) * _per_page;
            const end = start + _per_page;
            const paginated_components = _all_components.slice(start, end);

            // рендер страницы
            _render(paginated_components, {
                current: _page,
                total: total_pages,
                items: total_items,
                next: _page < total_pages,
                prev: _page > 1
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

        const data_mem = (data.type || data.memory_type || '').toUpperCase();
        const data_is_ddr4 = data_mem.includes('DDR4');
        const data_is_ddr5 = data_mem.includes('DDR5');
        const data_is_hybrid = data_mem.includes('DDR4/DDR5') || (data_is_ddr4 && data_is_ddr5);

        if (type === 'motherboards') {
            if (build?.cpus) {
                const mb_socket = (data.socket || '').toUpperCase();
                const cpu_socket = (build.cpus.socket || '').toUpperCase();
                if (mb_socket && cpu_socket && !mb_socket.includes(cpu_socket) && !cpu_socket.includes(mb_socket)) return false;
                
                if (data.memory_type && build.cpus.memory_type) {
                    const cpu_mem = build.cpus.memory_type.toUpperCase();
                    const cpu_has_ddr4 = cpu_mem.includes('DDR4');
                    const cpu_has_ddr5 = cpu_mem.includes('DDR5');

                    if (data_is_hybrid) {
                        if (!cpu_has_ddr4 && !cpu_has_ddr5) return false;
                    } else {
                        if (data_is_ddr4 && !cpu_has_ddr4) return false;
                        if (data_is_ddr5 && !cpu_has_ddr5) return false;
                    }
                }
            }
            
            if (build?.rams) {
                const ram_mem = (build.rams.type || build.rams.memory_type || '').toUpperCase();
                const ram_has_ddr4 = ram_mem.includes('DDR4');
                const ram_has_ddr5 = ram_mem.includes('DDR5');

                if (data_is_hybrid) {
                    if (!ram_has_ddr4 && !ram_has_ddr5) return false;
                } else {
                    if (data_is_ddr4 && !ram_has_ddr4) return false;
                    if (data_is_ddr5 && !ram_has_ddr5) return false;
                }
            }
        }

        if (type === 'cpus') {
            if (build?.motherboards?.socket && data.socket) {
                const cpu_socket = (data.socket || '').toUpperCase();
                const mb_socket = (build.motherboards.socket || '').toUpperCase();
                if (cpu_socket && mb_socket && !cpu_socket.includes(mb_socket) && !mb_socket.includes(cpu_socket)) return false;
            }
            if (build?.rams) {
                const ram_mem = (build.rams.type || build.rams.memory_type || '').toUpperCase();
                if (ram_mem.includes('DDR4') && !data_is_ddr4) return false;
                if (ram_mem.includes('DDR5') && !data_is_ddr5) return false;
            }
        }

        if (type === 'rams') {
            if (build?.cpus?.memory_type) {
                const cpu_mem = build.cpus.memory_type.toUpperCase();
                const cpu_has_ddr4 = cpu_mem.includes('DDR4');
                const cpu_has_ddr5 = cpu_mem.includes('DDR5');

                if (data_is_ddr4 && !cpu_has_ddr4) return false;
                if (data_is_ddr5 && !cpu_has_ddr5) return false;
            }

            if (build?.motherboards?.memory_type) {
                const mb_mem = build.motherboards.memory_type.toUpperCase();
                const mb_has_ddr4 = mb_mem.includes('DDR4');
                const mb_has_ddr5 = mb_mem.includes('DDR5');
                const mb_is_hybrid = mb_mem.includes('DDR4/DDR5') || (mb_has_ddr4 && mb_has_ddr5);

                if (mb_is_hybrid) {
                    if (!data_is_ddr4 && !data_is_ddr5) return false;
                } else {
                    if (data_is_ddr4 && !mb_has_ddr4) return false;
                    if (data_is_ddr5 && !mb_has_ddr5) return false;
                }
                
                const mb_slots = build.motherboards.memory_slots || 4;
                if (mb_slots && data.modules && parseInt(data.modules) > mb_slots) return false;
            }
        }

        if (type === 'storages' && build?.motherboards) {
            const is_nvme_m2 = (s) => {
                const s_type = (s.type || '').toUpperCase();
                const s_iface = (s.interface || '').toUpperCase();
                const s_ff = (s.form_factor || '').toUpperCase();
                return s_type.includes('NVME') || s_iface.includes('PCI-E') || (s_ff.includes('M.2') && !s_iface.includes('SATA')) || (s_iface.includes('M.2') && !s_iface.includes('SATA'));
            };

            const mb_m2_slots = parseInt(build.motherboards.m2_slots) || 0;
            const mb_sata_ports = parseInt(build.motherboards.sata_ports) || 4;

            const existing_nvme = storages.filter(s => is_nvme_m2(s)).length;
            const existing_sata = storages.filter(s => !is_nvme_m2(s)).length;

            if (is_nvme_m2(data)) {
                if (existing_nvme >= mb_m2_slots) return false;
            } else {
                if (existing_sata >= mb_sata_ports) return false;
            }
        }

        if (type === 'coolers') {
            if (build?.cpus) {
                if (data.socket_compatibility && build.cpus.socket) {
                    const cpu_socket = String(build.cpus.socket || '').toUpperCase();
                    const sockets = String(data.socket_compatibility || '').toUpperCase().split(/[,|]/).map(s => s.trim());
                    const hasMatch = sockets.some(s => s.includes(cpu_socket) || cpu_socket.includes(s));
                    if (!hasMatch) return false;
                }
                if (build.cpus.tdp && data.tdp && parseInt(data.tdp) < parseInt(build.cpus.tdp)) return false;
            }

            const cooler_type = String(data.type || '').toUpperCase();
            const extractNumbers = (str) => (String(str || '').match(/\d+/g) || []);

            if (cooler_type === 'AIO') {
                if (build?.cases) {
                    const supported_nums = extractNumbers(build.cases.radiator_support);
                    const rad_nums = extractNumbers(data.radiator_size);
                    const isSupported = rad_nums.length > 0 && rad_nums.every(num => supported_nums.includes(num));
                    if (rad_nums.length > 0 && !isSupported) return false;
                }
            } else {
                const cooler_height = parseInt(data.height) || 0;
                const max_height = parseInt(build?.cases?.max_cpu_cooler_height) || 0;
                if (cooler_height && max_height && cooler_height > max_height) return false;
            }
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
        const current_search_value = _filters.search || ''; 

        let html = `<div class="components-modal-content">
            <div class="components-search">
                <input type="text" id="modal-search-input" value="${current_search_value}" placeholder="Поиск ${type_name}..." class="search-input">
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
        const has_backup = Object.keys(_previous_filters).length > 0;

        if (has_filters) {
            html += `<div class="filter-clear-section"><button class="btn-clear-filters" onclick="ModalManager.clearFilters()"><span class="clear-icon">&times;</span> Очистить фильтры</button></div>`;
        } else if (has_backup) {
            html += `<div class="filter-clear-section"><button class="btn-clear-filters" onclick="ModalManager.restoreFilters()"><span class="clear-icon">&#x21BB;</span> Вернуть фильтры</button></div>`;
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
        _previous_filters = {}; 
        _all_components = []; 
        _load_page(1);
    };

    const _clear = () => { 
        _previous_filters = { ..._filters }; 
        _filters = {}; 
        _all_components = []; 
        _load_page(1); 
    };

    const _restore = () => {
        _filters = { ..._previous_filters }; 
        _previous_filters = {}; 
        _all_components = []; 
        _load_page(1);
    };

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
        } catch (e) {  }
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
        retry: () => { _all_components = []; _load_page(_page); }, 
        clearFilters: _clear,
        restoreFilters: _restore
    });
})();

window.ModalManager = ModalManager;