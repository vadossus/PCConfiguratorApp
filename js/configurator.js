'use strict';

const Configurator = (() => {
    let _data = null;
    let _auth = null;

    const _build = {
        cpus: null,
        motherboards: null,
        rams: null,
        gpus: null,
        storages: [],
        psus: null,
        cases: null,
        coolers: null
    };

    const _status = {
        valid: false,
        warnings: false,
        errors: [],
        warnings_list: [],
        progress: 0,
        selected: 0,
        total: 8
    };

    let _saving = false;

    const TYPE_NAMES = Object.freeze({
        cpus: 'Процессор', motherboards: 'Материнская плата', rams: 'Оперативная память',
        gpus: 'Видеокарта', storages: 'Накопители', psus: 'Блок питания',
        cases: 'Корпус', coolers: 'Охлаждение'
    });

    const REQUIRED = Object.freeze(['cpus', 'motherboards', 'rams']);

    const ICONS = Object.freeze({
        cpus: 'source/icons/cpu_icon.png', motherboards: 'source/icons/motherboard_icon.png',
        rams: 'source/icons/ram_icon.png', gpus: 'source/icons/gpu_icon.png',
        storages: 'source/icons/hdd_icon.png', psus: 'source/icons/power_supply_icon.png',
        cases: 'source/icons/pc_case_icon.png', coolers: 'source/icons/cooler_cpu_icon.png'
    });

    const DEFAULT_POWER = Object.freeze({
        cpus: 65, gpus: 150, motherboards: 50, rams: 5,
        coolers: 8, cases: 10, storages: 5
    });

    const FORM_FACTOR_HIERARCHY = Object.freeze({
        'E-ATX': ['E-ATX', 'ATX', 'MICRO-ATX', 'MINI-ITX'],
        'ATX': ['ATX', 'MICRO-ATX', 'MINI-ITX'],
        'MICRO-ATX': ['MICRO-ATX', 'MINI-ITX'],
        'MINI-ITX': ['MINI-ITX']
    });

    const _format_price = (price) => {
        if (!price && price !== 0) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    };

    const _show_loader = () => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.remove('hidden');
    };

    const _hide_loader = () => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    };

    const _show_message = (text, type = 'success') => {
        const oldMsg = document.querySelector('.custom-toast');
        if (oldMsg) oldMsg.remove();
        
        const msg = document.createElement('div');
        msg.className = `custom-toast toast-${type}`;
        msg.textContent = text;
        
        document.body.appendChild(msg);
        
        setTimeout(() => msg.classList.add('show'), 10);
        
        setTimeout(() => {
            msg.classList.remove('show');
            setTimeout(() => msg.remove(), 300);
        }, 3000);
    };
    const _save_storage = () => {
        localStorage.setItem('currentBuild', JSON.stringify(_build));
    };

    const _clear_storage = () => {
        localStorage.removeItem('currentBuild');
    };

    const _extract = (data) => {
        if (!data) return null;
        if (data.id && data.name) return data;
        if (data.success && data.component) return data.component;
        if (data.component) return data.component;
        if (Array.isArray(data) && data.length > 0) return data[0];
        return data;
    };

    const _normalize = (component, type) => ({
        id: component.component_id || component.id,
        reference_id: component.reference_id || component.id,
        name: component.name || 'Компонент',
        price: component.price || 0,
        category: type ? type.replace(/s$/, '') : (component.category || ''),
        image: component.image || '',
        socket: component.socket || '',
        memory_type: component.memory_type || '',
        wattage: component.wattage || 0,
        capacity: component.capacity || 0,
        speed: component.speed || '',
        tdp: component.tdp || 0,
        type: component.type || '',
        form_factor: component.form_factor || '',
        chipset: component.chipset || '',
        cores: component.cores || 0,
        threads: component.threads || 0,
        frequency: component.frequency || '',
        memory_size: component.memory_size || 0,
        interface: component.interface || '',
        memory_slots: component.memory_slots || 0,
        m2_slots: component.m2_slots || 0,
        sata_ports: component.sata_ports || 0,
        modules: component.modules || 0,
        supported_motherboards: component.supported_motherboards || '',
        socket_compatibility: component.socket_compatibility || '',
        supported_form_factors: component.supported_form_factors || '',
        max_gpu_length: component.max_gpu_length || 0,
        max_cpu_cooler_height: component.max_cpu_cooler_height || 0,
        manufacturer: component.manufacturer || '',
        is_active: component.is_active !== undefined ? component.is_active : 1,
        rgb: component.rgb || 0,
        cas_latency: component.cas_latency || '',
        efficiency: component.efficiency || '',
        modular: component.modular || '',
        pcie_connectors: component.pcie_connectors || 0,
        sata_connectors: component.sata_connectors || 0,
        pcie_version: component.pcie_version || '',
        wifi: component.wifi || 0,
        read_speed: component.read_speed || 0,
        write_speed: component.write_speed || 0,
        _pending_check: false
    });

    const _get_icon = (type) => ICONS[type] || 'source/icons/default_component.png';

    const _get_image = (component, type) => {
        if (!component) return _get_icon(type);
        const data = component.component || component;
        if (!data.image) return _get_icon(type);
        let path = data.image.toString().trim();
        path = path.replace(/^\.\//, '').replace(/^\/+/, '');
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('source/') || path.startsWith('images/')) return path;
        const map = { cpu: 'cpus', cpus: 'cpus', motherboard: 'motherboards', motherboards: 'motherboards', ram: 'rams', rams: 'rams', gpu: 'gpus', gpus: 'gpus', storage: 'storages', storages: 'storages', psu: 'psus', psus: 'psus', cooler: 'coolers', coolers: 'coolers', case: 'cases', cases: 'cases' };
        const cat = data.category ? map[data.category.toLowerCase()] || data.category : (map[type] || 'components');
        return `source/${cat}/${path}`;
    };

    const _get_specs = (component) => {
        if (!component) return 'Нету характеристики';
        
        const fields = [
            { key: 'socket', label: 'Сокет' },
            { key: 'cores', label: 'Ядер' },              
            { key: 'frequency', label: 'Частота' }, 
            { key: 'tdp', label: 'TDP', suffix: 'W' },      
            { key: 'memory_type', label: 'Память' },
            { key: 'type', label: 'Тип' },
            { key: 'capacity', label: 'Объем', suffix: ' ГБ' },
            { key: 'speed', label: 'Частота памяти', suffix: ' МГц' }, 
            { key: 'wattage', label: 'Мощность', suffix: 'W' },
            { key: 'form_factor', label: 'Форм-фактор' },
            { key: 'chipset', label: 'Чипсет' },
            { key: 'memory_size', label: 'Память', suffix: ' ГБ' },
            { key: 'supported_motherboards', label: 'Поддержка:' },
            { key: 'max_cpu_cooler_height', label: 'Макс. высота кулера', suffix: ' мм' },
            { key: 'modules', label: 'Модулей', suffix: ' шт' },
            { key: 'efficiency', label: 'КПД' },
            { key: 'modular', label: 'Модульность' },
            { key: 'interface', label: 'Интерфейс' },
            { key: 'read_speed', label: 'Чтение', suffix: ' МБ/с' },
            { key: 'write_speed', label: 'Запись', suffix: ' МБ/с' },
            { key: 'socket_compatibility', label: 'Совместимость' }
        ];
        
        const parts = [];
        fields.forEach(f => {
            if (component[f.key] && component[f.key] !== '0' && component[f.key] !== 0) {
                parts.push(`${f.label}: ${component[f.key]}${f.suffix || ''}`);
            }
        });
        
        return parts.length > 0 ? parts.slice(0, 3).join(' | ') : 'Характеристики не указаны';
    };

    const _total_price = () => {
        let total = 0;
        for (const [type, item] of Object.entries(_build)) {
            if (!item) continue;
            if (type === 'storages' && Array.isArray(item)) {
                item.forEach(s => { total += parseFloat(s.price || 0); });
            } else {
                total += parseFloat(item.price || 0);
            }
        }
        return total;
    };

    const _update_price = () => {
        const total = _total_price();
        const el = document.getElementById('total-price');
        if (el) el.textContent = `${_format_price(total)} Р`;
        const bp = document.getElementById('build-price');
        if (bp) bp.textContent = `${_format_price(total)} Р`;
    };

    const _get_status = (type, component) => {
        if (!component) return 'unknown';
        
        if (component.is_active !== undefined && Number(component.is_active) === 0) return 'inactive';

        const has_error = _status.errors.some(e => {
            if (e.component1 === type || e.component2 === type) return true;
            const type_name = TYPE_NAMES[type] || type;
            const error_lower = e.message.toLowerCase();
            if (type === 'cpus' && error_lower.includes('процессор')) return true;
            if (type === 'motherboards' && (error_lower.includes('материнск') || error_lower.includes('плат'))) return true;
            if (type === 'rams' && error_lower.includes('памят')) return true;
            if (type === 'gpus' && error_lower.includes('видеокарт')) return true;
            if (type === 'storages' && error_lower.includes('накопител')) return true;
            if (type === 'psus' && error_lower.includes('бп')) return true;
            if (type === 'cases' && error_lower.includes('корпус')) return true;
            if (type === 'coolers' && error_lower.includes('кулер')) return true;
            return false;
        });

        if (has_error) return 'error';

        const has_warning = _status.warnings_list.some(w => {
            if (w.component1 === type || w.component2 === type) return true;
            const type_name = TYPE_NAMES[type] || type;
            const warning_lower = w.message.toLowerCase();
            if (type === 'cpus' && warning_lower.includes('процессор')) return true;
            if (type === 'motherboards' && (warning_lower.includes('материнск') || warning_lower.includes('плат'))) return true;
            if (type === 'rams' && warning_lower.includes('памят')) return true;
            if (type === 'gpus' && warning_lower.includes('видеокарт')) return true;
            if (type === 'storages' && warning_lower.includes('накопител')) return true;
            if (type === 'psus' && warning_lower.includes('бп')) return true;
            if (type === 'cases' && warning_lower.includes('корпус')) return true;
            if (type === 'coolers' && warning_lower.includes('кулер')) return true;
            return false;
        });

        if (has_warning) return 'warning';

        return _status.valid ? 'success' : 'success';
    };

    const _check_activity = async (type, component) => {
        try {
            const res = await fetch(`api/admin.php?action=check_component_activity&id=${component.id}`);
            if (!res.ok) { component.is_active = 1; return; }
            const data = await res.json();
            if (data.success) {
                component.is_active = data.is_active ? 1 : 0;
                _render_cards();
            }
        } catch (e) { component.is_active = 1; }
    };

    const _status_icon = (s) => ({ success: '\u2713', warning: '\u26A0', error: '\u2717', inactive: '\u26A0' }[s] || '?');
    const _status_text = (s) => ({
        success: 'Компонент совместим', warning: 'Есть предупреждение',
        error: 'Компонент несовместим', inactive: 'Компонент неактивен'
    }[s] || 'Статус неизвестен');

    const _load_storage = async () => {
        const saved = localStorage.getItem('currentBuild');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.assign(_build, parsed);
                _render_cards();
                _calc_power();
                _check_compat();
            } catch(e) {}
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const buildId = urlParams.get('load_build_id');
        if (buildId) {
            await _load_saved_build_from_db(buildId);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    const _load_saved_build_from_db = async (buildId) => {
        _show_loader();
        try {
            const response = await fetch(`api/builds.php?action=get_builds`);
            const data = await response.json();
            
            let build = null;
            if (data.builds) {
                build = data.builds.find(b => b.id == buildId);
            }
            
            if (!build) {
                const pubResponse = await fetch('api/builds.php?action=get_public');
                const pubData = await pubResponse.json();
                if (pubData.builds) {
                    build = pubData.builds.find(b => b.id == buildId);
                }
            }
            
            if (!build) {
                _show_message('Сборка не найдена', 'error');
                _hide_loader();
                return;
            }
            
            let comps = build.components || {};
            if (!Object.keys(comps).length && build.compatibility_data) {
                try { comps = JSON.parse(build.compatibility_data); } catch(e) { comps = {}; }
            }
            
            Object.assign(_build, {
                cpus: null, motherboards: null, rams: null, gpus: null,
                storages: [], psus: null, cases: null, coolers: null
            });
            
            const categories = ['cpus', 'motherboards', 'rams', 'gpus', 'psus', 'cases', 'coolers'];
            
            for (const type of categories) {
                const item = comps[type];
                if (item && item.id) {
                    try {
                        const compRes = await fetch(`api/components.php?id=${item.id}`);
                        const compData = await compRes.json();
                        if (compData.success && compData.component) {
                            _build[type] = _normalize(compData.component, type);
                        } else {
                            _build[type] = _normalize(item, type);
                        }
                    } catch(e) {
                        _build[type] = _normalize(item, type);
                    }
                }
            }
            
            if (Array.isArray(comps.storages)) {
                _build.storages = await Promise.all(comps.storages.map(async (s) => {
                    try {
                        const compRes = await fetch(`api/components.php?id=${s.id}`);
                        const compData = await compRes.json();
                        if (compData.success && compData.component) {
                            return _normalize(compData.component, 'storages');
                        }
                        return _normalize(s, 'storages');
                    } catch(e) { 
                        return _normalize(s, 'storages');
                    }
                }));
            }
            
            _save_storage();
            
            _render_cards();
            _calc_power();
            setTimeout(() => {
                _check_compat();
                _update_price();
            }, 100);
            
            _show_message(`Сборка "${build.name}" загружена`, 'success');
            
        } catch(e) {
            console.error(e);
            _show_message('Ошибка загрузки сборки', 'error');
        }
        _hide_loader();
    };

    const _render_cards = () => {
        const pc = localStorage.getItem('pc_build');
        if (pc) {
            try {
                const parsed = JSON.parse(pc);
                if (parsed.null !== undefined) delete parsed.null;
                const fixed = { 
                    cpus: parsed.cpus || null, 
                    motherboards: parsed.motherboards || null, 
                    rams: parsed.rams || null, 
                    gpus: parsed.gpus || null, 
                    storages: parsed.storages || [], 
                    psus: parsed.psus || null, 
                    cases: parsed.cases || null, 
                    coolers: parsed.coolers || null 
                };
                Object.assign(_build, fixed);
                localStorage.removeItem('pc_build');
                _save_storage();
            } catch (e) {}
        }

        const container = document.getElementById('components-table-container');
        if (!container) return;

        _check_compat();
        
        const types = [
            { type: 'cpus', name: 'Процессор' }, 
            { type: 'motherboards', name: 'Материнская плата' },
            { type: 'rams', name: 'Оперативная память' }, 
            { type: 'gpus', name: 'Видеокарта' },
            { type: 'storages', name: 'Накопители' }, 
            { type: 'psus', name: 'Блок питания' },
            { type: 'cases', name: 'Корпус' }, 
            { type: 'coolers', name: 'Охлаждение' }
        ];

        let html = '';
        types.forEach(info => {
            html += info.type === 'storages' ? 
                _render_storage(info, _build[info.type]) : 
                _render_single(info, _build[info.type]);
        });
        container.innerHTML = html;
        _update_price();
    };

    const _render_single = (info, component) => {
        const has = component && component.name;
        const icon = _get_icon(info.type);
        const required = REQUIRED.includes(info.type);
        const badge = required ? '<span class="required-badge" title="Обязательный компонент">*</span>' : '';
        const row_class = required && !has ? 'component-row missing-required' : 'component-row';

        let html = `<div class="component-with-selection" data-component-type="${info.type}">
            <div class="${row_class}">
                <div class="component-name">
                    <div class="component-icon">
                        <img src="${icon}" alt="${info.name}" class="component-icon-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="component-icon-emoji" style="display:none;">${info.name[0]}</span>
                    </div>
                    <span>${info.name}</span>${badge}
                </div>
                <div class="component-action">
                    <button class="btn-select-component" onclick="Configurator.openSelection('${info.type}')">${has ? 'Изменить' : 'Выбрать'}</button>
                </div>
            </div>`;

        if (has) {
            const name = `<a href="component.html?id=${component.id}&type=${info.type}" class="component-link" onclick="event.stopPropagation()">${component.name || 'Без названия'}</a>`;
            const price = component.price ? `${_format_price(component.price)} Р` : 'Цена не указана';
            const specs = _get_specs(component);
            const status = _get_status(info.type, component);
            const image = _get_image(component, info.type);

            html += `<div class="selected-component-view ${status}">
                <div class="selected-component-main">
                    <div class="selected-component-image">
                        <img src="${image}" alt="${component.name || ''}" onerror="this.onerror=null; this.src='${icon}';">
                    </div>
                    <div class="selected-component-info">
                        <div class="selected-component-name-row">
                            <h4 class="selected-component-name">${name}</h4>
                            <span class="selected-component-status" title="${_status_text(status)}">${_status_icon(status)}</span>
                        </div>
                        <div class="selected-component-specs">${specs}</div>
                        <div class="selected-component-price-row">
                            <span class="selected-component-price">${price}</span>
                            <button class="btn-remove-selected" onclick="Configurator.removeComponent('${info.type}')">Убрать из сборки</button>
                        </div>
                    </div>
                </div>
            </div>`;
        }
        html += '</div>';
        return html;
    };

    const _render_storage = (info, items) => {
        const storages = Array.isArray(items) ? items : [];
        const has = storages.length > 0;
        const icon = _get_icon(info.type);

        let html = `<div class="component-with-selection" data-component-type="${info.type}">
            <div class="component-row">
                <div class="component-name">
                    <div class="component-icon">
                        <img src="${icon}" alt="${info.name}" class="component-icon-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="component-icon-emoji" style="display:none;">${info.name[0]}</span>
                    </div>
                    <span>${info.name} ${has ? `(${storages.length})` : ''}</span>
                </div>
                <div class="component-action">
                    <button class="btn-select-component" onclick="Configurator.openSelection('${info.type}')">${has ? 'Добавить ещё' : 'Добавить накопитель'}</button>
                </div>
            </div>`;

        if (has) {
            storages.forEach((storage, index) => {
                const name = storage.name ? `<a href="component.html?id=${storage.id}&type=${info.type}" class="component-link" onclick="event.stopPropagation()">${storage.name}</a>` : 'Накопитель';
                const price = storage.price ? `${_format_price(storage.price)} Р` : 'Цена не указана';
                const specs = _get_specs(storage);
                const status = _get_status(info.type, storage);
                const image = _get_image(storage, info.type);

                html += `<div class="selected-component-view ${status}" data-index="${index}">
                    <div class="selected-component-main">
                        <div class="selected-component-image">
                            <img src="${image}" alt="${storage.name || ''}" onerror="this.onerror=null; this.src='${icon}';">
                        </div>
                        <div class="selected-component-info">
                            <div class="selected-component-name-row">
                                <h4 class="selected-component-name">${name}</h4>
                                <span class="selected-component-status" title="${_status_text(status)}">${_status_icon(status)}</span>
                            </div>
                            <div class="selected-component-specs">${specs}</div>
                            <div class="selected-component-price-row">
                                <span class="selected-component-price">${price}</span>
                                <button class="btn-remove-selected" onclick="Configurator.removeComponent('${info.type}', ${index})">Убрать</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
        }
        html += '</div>';
        return html;
    };

    const _calc_power = () => {
        let total = 0;
        let details = '';
        let has = false;

        for (const [type, item] of Object.entries(_build)) {
            if (!item || type === 'psus') continue; 
            if (type === 'storages' && Array.isArray(item)) {
                item.forEach((s, i) => {
                    has = true;
                    const p = parseInt(s.wattage) || parseInt(s.tdp) || DEFAULT_POWER.storages || 0;
                    total += p;
                    details += `<div class="power-item"><span>Накопитель ${i + 1}</span><span>${p} W</span></div>`;
                });
            } else {
                has = true;
                let p = 0;
                if (type === 'coolers') {
                    p = DEFAULT_POWER.coolers;
                    details += `<div class="power-item"><span>${TYPE_NAMES[type]}</span><span>${p} W</span></div>`;
                } else {
                    p = parseInt(item.tdp) || parseInt(item.wattage) || DEFAULT_POWER[type] || 0;
                    details += `<div class="power-item"><span>${TYPE_NAMES[type]}</span><span>${p} W</span></div>`;
                }
                total += p;
            }
        }

        const oc = document.getElementById('overclock-check');
        if (oc && oc.checked && has) {
            const cpu_p = parseInt(_build.cpus?.wattage) || DEFAULT_POWER.cpus;
            const gpu_p = parseInt(_build.gpus?.wattage) || DEFAULT_POWER.gpus;
            const extra = Math.ceil((cpu_p + gpu_p) * 0.2);
            if (extra > 0) {
                total += extra;
                details += `<div class="power-item"><span>Разгон (+20%)</span><span>+${extra} W</span></div>`;
            }
        }

        const watt_el = document.getElementById('total-wattage');
        if (watt_el) watt_el.innerText = total;

        const list = document.getElementById('power-breakdown-list');
        if (list) {
            if (!has) {
                list.innerHTML = '<div class="no-components">Выберите компоненты для расчета</div>';
            } else {
                details += '<div class="power-divider"></div>';
                details += `<div class="power-item total"><span>Итого потребление</span><span>${total} W</span></div>`;
                const rec = Math.ceil(total * 1.2);
                const psu_12v = _build.psus ? Math.round((parseInt(_build.psus.wattage) || 0) * 0.85) : 0;
                
                if (_build.psus) {
                    const delta = psu_12v - total;
                    details += `<div class="power-item delta"><span>Запас мощности</span><span>${delta} W</span></div>`;
                } else {
                    details += `<div class="power-item delta"><span>Запас мощности</span><span>Выберите блок питания</span></div>`;
                }

                details += `<div class="power-item recommendation"><span>Рекомендуемый БП</span><span>от ${rec} W</span></div>`;

                if (_build.psus) {
                    const pw = parseInt(_build.psus.wattage) || 0;
                    if (pw > 0) {
                        if (pw < total) details += `<div class="power-item warning"><span>БП (${pw}W) маловат</span></div>`;
                        else if (pw >= rec) details += `<div class="power-item ok"><span>БП (${pw}W) подходит</span></div>`;
                        else details += `<div class="power-item warning"><span>БП (${pw}W) без запаса</span></div>`;
                    }
                }
                list.innerHTML = details;
            }
        }
        return total;
    };

    const _extract_mem_slots = (mb) => {
        if (!mb) return 4;
        if (mb.memory_slots) return parseInt(mb.memory_slots);
        if (mb.critical_specs) {
            const specs = Array.isArray(mb.critical_specs) ? mb.critical_specs : 
                        (typeof mb.critical_specs === 'string' ? JSON.parse(mb.critical_specs) : []);
            for (const s of specs) { 
                const m = s.match(/(\d+)\s*слот/); 
                if (m) return parseInt(m[1]); 
            }    }
        const name = (mb.name || '').toUpperCase();
        if (name.includes('MINI-ITX')) return 2;
        if (name.includes('MICRO-ATX')) return 2;
        if (name.includes('ATX')) return 4;
        if (name.includes('E-ATX')) return 8;
        return 4;
    };

    const _extract_m2 = (mb) => {
        if (!mb) return 1;
        if (mb.m2_slots) return parseInt(mb.m2_slots);
        if (mb.critical_specs) {
            const specs = Array.isArray(mb.critical_specs) ? mb.critical_specs : 
                        (typeof mb.critical_specs === 'string' ? JSON.parse(mb.critical_specs) : []);
            for (const s of specs) {
                const m = s.match(/(\d+)\s*(?:x|слот|слота|слотов)?\s*M\.?2/i);
                if (m) return parseInt(m[1]);
                if (s.match(/2x?\s*M\.?2/i) || s.includes('2 M.2')) return 2;
                if (s.match(/3x?\s*M\.?2/i) || s.includes('3 M.2')) return 3;
                if (s.match(/4x?\s*M\.?2/i) || s.includes('4 M.2')) return 4;
                if (s.includes('M.2') && !m) return 1;
            }
        }
        const name = (mb.name || '').toUpperCase();
        if (name.includes('X670') || name.includes('Z790') || name.includes('X570')) return 4;
        if (name.includes('B650') || name.includes('B660') || name.includes('B550')) return 2;
        if (name.includes('H610') || name.includes('A520')) return 1;
        return 1;
    };

    const _extract_sata = (mb) => {
        if (!mb) return 4;
        if (mb.sata_ports) return parseInt(mb.sata_ports);
        if (mb.critical_specs) {
            const specs = Array.isArray(mb.critical_specs) ? mb.critical_specs : 
                        (typeof mb.critical_specs === 'string' ? JSON.parse(mb.critical_specs) : []);
            for (const s of specs) { 
                const m = s.match(/(\d+)\s*порт.*?SATA/i); 
                if (m) return parseInt(m[1]); 
            }
        }
        const name = (mb.name || '').toUpperCase();
        if (name.includes('X670') || name.includes('Z790') || name.includes('X570')) return 8;
        if (name.includes('B650') || name.includes('B660') || name.includes('B550')) return 6;
        if (name.includes('H610') || name.includes('A520')) return 4;
        return 4;
    };

    const _check_compat = () => {
        _status.errors = [];
        _status.warnings_list = [];
        const cpu = _build.cpus;
        const mb = _build.motherboards;
        const ram = _build.rams;
        const gpu = _build.gpus;
        const storages = Array.isArray(_build.storages) ? _build.storages : [];
        const psu = _build.psus;
        const pc_case = _build.cases;
        const cooler = _build.coolers;

        let sel = 0;
        for (const [t, item] of Object.entries(_build)) {
            if (t === 'storages') { if (Array.isArray(item) && item.length > 0) sel++; }
            else if (item) sel++;
        }
        _status.selected = sel;
        _status.total = 8;
        _status.progress = (sel / 8) * 100;

        if (cpu && mb) {
            if (cpu.socket && mb.socket && cpu.socket.toUpperCase() !== mb.socket.toUpperCase()) {
                _status.errors.push({
                    component1: 'cpus', component2: 'motherboards',
                    message: `Сокет процессора (${cpu.socket}) не совпадает с сокетом платы (${mb.socket})`
                });
            }
        }

        if (ram && mb) {
            const ram_type = (ram.type || ram.memory_type || ram.memory || '').toUpperCase().trim();
            const mb_type = (mb.memory_type || mb.memory || '').toUpperCase().trim();
            
            if (ram_type && mb_type) {
                const is_hybrid_mb = mb_type.includes('DDR4/DDR5') || (mb_type.includes('DDR4') && mb_type.includes('DDR5'));
                
                if (is_hybrid_mb) {
                    if (!ram_type.includes('DDR4') && !ram_type.includes('DDR5')) {
                        _status.errors.push({
                            component1: 'rams',
                            component2: 'motherboards',
                            message: `Тип памяти (${ram.type}) не поддерживается гибридной материнской платой (${mb.memory_type})`
                        });
                    }
                } else {
                    const mb_ddr4 = mb_type.includes('DDR4');
                    const mb_ddr5 = mb_type.includes('DDR5');
                    const ram_ddr4 = ram_type.includes('DDR4');
                    const ram_ddr5 = ram_type.includes('DDR5');

                    if ((mb_ddr4 && !ram_ddr4) || (mb_ddr5 && !ram_ddr5)) {
                        _status.errors.push({
                            component1: 'rams',
                            component2: 'motherboards',
                            message: `Тип памяти (${ram.type || ram.memory_type}) не совпадает с типом памяти материнской платы (${mb.memory_type})`
                        });
                    }
                }
            }
        }

            if (mb && storages.length > 0) {
                const is_nvme_m2 = (s) => {
                    const t = (s.type || '').toUpperCase();
                    const ff = (s.form_factor || '').toUpperCase();
                    const iface = (s.interface || '').toUpperCase();
                    return t.includes('NVME') || iface.includes('PCI-E') || (ff.includes('M.2') && !iface.includes('SATA')) || (iface.includes('M.2') && !iface.includes('SATA'));
                };

                const nvme_count = storages.filter(is_nvme_m2).length;
                const sata_count = storages.filter(s => !is_nvme_m2(s)).length;

                const m2_slots = parseInt(mb.m2_slots) || 0;
                const sata_ports = parseInt(mb.sata_ports) || 4;

                if (nvme_count > m2_slots) {
                    _status.errors.push({
                        component1: 'storages', component2: 'motherboards',
                        message: `Материнская плата имеет ${m2_slots} M.2 слот(а), а выбрано ${nvme_count} NVMe M.2 накопитель(ей)`
                    });
                }

                if (sata_count > sata_ports) {
                    _status.errors.push({
                        component1: 'storages', component2: 'motherboards',
                        message: `Материнская плата имеет ${sata_ports} SATA порт(а), а выбрано ${sata_count} SATA накопитель(ей)`
                    });
                }
            }

        if (cooler) {
            if (cpu) {
                if (cpu.socket && cooler.socket_compatibility) {
                    const sockets = cooler.socket_compatibility.toUpperCase().split(/[,|]/).map(s => s.trim());
                    const has_match = sockets.some(s => s.includes(cpu.socket.toUpperCase()) || cpu.socket.toUpperCase().includes(s));
                    
                    if (!has_match) {
                        _status.warnings_list.push({
                            component1: 'coolers', component2: 'cpus',
                            message: `Кулер может не поддерживать сокет ${cpu.socket}. Проверьте совместимость.`
                        });
                    }
                }
                if (cpu.tdp && cooler.tdp && parseInt(cooler.tdp) < parseInt(cpu.tdp)) {
                    _status.warnings_list.push({
                        component1: 'coolers', component2: 'cpus',
                        message: `TDP кулера (${cooler.tdp}Вт) недостаточно для процессора (${cpu.tdp}Вт)`
                    });
                }
            }

            if (pc_case) {
                const cooler_type = (cooler.type || '').toUpperCase();

                if (cooler_type === 'AIO') { 
                    const extract_numb = (str) => (String(str || '').match(/\d+/g) || []);
                
                    const supported_nums = extract_numb(pc_case.radiator_support); 
                    const rad_nums = extract_numb(cooler.radiator_size);            
                    if (rad_nums.length > 0 && !rad_nums.every(num => supported_nums.includes(num))) {
                        _status.errors.push({
                            component1: 'coolers', 
                            component2: 'cases',
                            message: `Радиатор ${cooler.radiator_size}мм не поддерживается корпусом (поддержка: ${pc_case.radiator_support || 'нет'})`
                        });
                        _status.valid = false; 
                    }
                } else {
                    const cooler_height = parseInt(cooler.height) || 0;
                    const max_height = parseInt(pc_case.max_cpu_cooler_height) || 0;
                    
                    if (cooler_height && max_height && cooler_height > max_height) {
                        _status.errors.push({
                            component1: 'coolers', 
                            component2: 'cases',
                            message: `Кулер (${cooler_height}мм) не влезает в корпус (макс. ${max_height}мм)`
                        });
                        _status.valid = false; 
                    }
                }
            }
        }

        if (pc_case && mb && mb.form_factor) {
            const mb_ff = mb.form_factor.toUpperCase();
            const case_support = pc_case.supported_motherboards || '';
            const case_ffs = case_support.toUpperCase().split(/[,|]/).map(f => f.trim());
            if (case_ffs.length > 0) {
                let ok = false;
                for (const f of case_ffs) {
                    if (f === mb_ff || (FORM_FACTOR_HIERARCHY[f] && FORM_FACTOR_HIERARCHY[f].includes(mb_ff))) {
                        ok = true; break;
                    }
                }
                if (!ok) {
                    _status.warnings_list.push({
                        component1: 'cases', component2: 'motherboards',
                        message: `Корпус может не поддерживать плату ${mb.form_factor}. Проверьте спецификации.`
                    });
                }
            }
        }

        if (gpu && pc_case && pc_case.max_gpu_length) {
            const gpu_length = parseInt(gpu.length_mm) || 
                            parseInt(gpu.card_length) || 
                            parseInt(gpu.dimensions?.length) ||
                            parseInt(gpu.length);
                            
            if (gpu_length && gpu_length > parseInt(pc_case.max_gpu_length)) {
                _status.warnings_list.push({
                    component1: 'gpus', component2: 'cases',
                    message: `Видеокарта (${gpu_length}мм) может не поместиться в корпус (макс. ${pc_case.max_gpu_length}мм)`
                });
            }
        }

        if (cooler && pc_case && pc_case.max_cpu_cooler_height) {
            const cooler_height = parseInt(cooler.height) || 
                                parseInt(cooler.cooler_height) ||
                                parseInt(cooler.dimensions?.height) || 0;
                                
            if (cooler_height && cooler_height > parseInt(pc_case.max_cpu_cooler_height)) {
                _status.warnings_list.push({
                    component1: 'coolers', component2: 'cases',
                    message: `Кулер (${cooler_height}мм) может не поместиться в корпус (макс. ${pc_case.max_cpu_cooler_height}мм)`
                });
            }
        }

        const total_p = _calc_power();
        if (psu && total_p > 0 && psu.wattage) {
            const pw = parseInt(psu.wattage);
            if (pw < total_p) {
                _status.errors.push({
                    component1: 'psus', component2: 'system',
                    message: `Мощность БП (${pw}W) недостаточна для сборки (требуется минимум ${total_p}W)`
                });
            } else {
                const rec = Math.ceil(total_p * 1.2);
                if (pw < rec) {
                    _status.warnings_list.push({
                        component1: 'psus', component2: 'system',
                        message: `Рекомендуется БП мощностью от ${rec}W для запаса`
                    });
                }
            }
        }

        _status.valid = _status.errors.length === 0;
        _status.warnings = _status.warnings_list.length > 0;
        _render_compat();
        _update_save_btn();
    };

    const _render_compat = () => {
        const bar = document.getElementById('progress-bar');
        const text = document.getElementById('compatibility-text');
        const count = document.getElementById('compatibility-count');
        if (!bar || !text || !count) return;

        count.innerHTML = `${_status.selected}<span>/${_status.total}</span>`;
        bar.style.width = `${_status.progress}%`;
        bar.className = 'progress-fill';
        if (!_status.valid) bar.classList.add('bg-error');
        else if (_status.warnings) bar.classList.add('bg-warning');
        else if (_status.selected > 0) bar.classList.add('bg-success');

        if (_status.selected === 0) {
            text.innerHTML = '<div class="comp-hint">Добавьте компоненты, чтобы проверить совместимость</div>';
            return;
        }

        let html = '<div class="comp-alert">';
        if (_status.errors.length > 0) {
            html += '<div class="alert-group error"><span class="alert-title">Критические ошибки</span><ul class="alert-list">';
            _status.errors.forEach(e => { html += `<li class="alert-item">${e.message}</li>`; });
            html += '</ul></div>';
        }
        if (_status.warnings_list.length > 0) {
            html += '<div class="alert-group warning"><span class="alert-title">Предупреждения</span><ul class="alert-list">';
            _status.warnings_list.forEach(w => { html += `<li class="alert-item">${w.message}</li>`; });
            html += '</ul></div>';
        }
        if (_status.valid && !_status.warnings && _status.selected > 0) {
            html += '<div class="alert-group success">Конфигурация полностью совместима</div>';
        }
        html += '</div>';
        text.innerHTML = html;
    };

    const _update_save_btn = () => {
        const btn = document.getElementById('save-build-btn');
        if (!btn) return;

        const ready = !!_build.cpus && !!_build.motherboards && !!_build.rams;
        
        const hasErrors = _status.errors.length > 0;
        
        const canSave = ready && !hasErrors;

        btn.disabled = !canSave;
        btn.classList.toggle('btn-disabled', !canSave);
        btn.style.opacity = canSave ? '1' : '0.5';
        btn.style.cursor = canSave ? 'pointer' : 'not-allowed';
    };

    const _open_selection = (type) => {
        if (window.ModalManager?.showComponentModal) {
            const filters = _data?.getCompatibilityFilters ? _data.getCompatibilityFilters(_build) : {};
            window.ModalManager.showComponentModal(type, filters);
        } else {
            _show_message('Менеджер не загружен', 'error');
        }
    };

    const _select = (type, data) => {
        if (!type) {
            const map = { 1: 'cpus', 2: 'motherboards', 3: 'rams', 4: 'gpus', 5: 'storages', 6: 'psus', 7: 'cases', 8: 'coolers' };
            type = map[data.category_id] || '';
        }
        if (!type) { _show_message('Тип не определён', 'error'); return; }

        const c = _extract(data);
        if (!c) { _show_message('Неверный формат', 'error'); return; }
        if (!c.id) c.id = Date.now();
        if (!c.name) c.name = `Компонент ${type}`;

        if (type === 'storages') {
            if (!_build.storages) _build.storages = [];
            _build.storages.push(c);
        } else {
            _build[type] = c;
        }

        if (_build.null !== undefined) delete _build.null;
        _render_cards();
        _calc_power();
        _save_storage();
        _show_message(`"${c.name}" добавлен в сборку`, 'success');
    };

    const _remove = (type, index = null) => {
        if (!confirm('Убрать компонент из сборки?')) return;
        if (type === 'storages' && index !== null) {
            if (Array.isArray(_build.storages)) _build.storages.splice(index, 1);
        } else {
            _build[type] = null;
        }
        _status.errors = [];
        _status.warnings_list = [];
        _status.valid = false;
        _status.warnings = false;

        _render_cards();
        _calc_power();
        _check_compat();
        _save_storage();
        _show_message('Компонент удалён из сборки', 'success');
    };

    const _reset = () => {
        if (!confirm('Вы уверены, что хотите сбросить текущую сборку?')) return;
        Object.assign(_build, {
            cpus: null, motherboards: null, rams: null, gpus: null,
            storages: [], psus: null, cases: null, coolers: null
        });
        _render_cards();
        _check_compat();
        _clear_storage();
        _calc_power();
        _show_message('сборка сброшена', 'success');
    };

    const _save_server = async (event) => {
        if (event) { event.preventDefault(); event.stopImmediatePropagation(); }

        if (!_auth || !_auth.isLogged()) {
            _auth?.showModal();
            return;
        }

        const has = Object.values(_build).some(v => Array.isArray(v) ? v.length > 0 : v !== null);
        if (!has) { alert('cборка пуста! выберите хотя бы один компонент.'); return; }
        if (_saving) return;
        _saving = true;
        _show_loader();

        try {
            const comps = {};
            for (const [t, c] of Object.entries(_build)) {
                if (!c || (Array.isArray(c) && c.length === 0)) continue;
                if (t === 'storages' && Array.isArray(c)) {
                    comps[t] = c.map(i => ({ id: i.id || 0, name: i.name || 'Накопитель', price: i.price || 0, image: i.image || '' }));
                } else if (c) {
                    comps[t] = { id: c.id || 0, name: c.name || 'Компонент', price: c.price || 0, image: c.image || '' };
                }
            }

            const name = prompt('Введите название сборки:', `Моя сборка ${new Date().toLocaleDateString('ru-RU')}`);
            if (name === null) { _saving = false; _hide_loader(); return; }

            const is_gaming = confirm('Это игровой компьютер?\n\n(Нажмите "ОК" для Игрового, или "Отмена" для Офисного)');
            const build_type = is_gaming ? 'gaming' : 'office';

            const user = _auth.getUser();
            
            const res = await fetch(`api/builds.php?action=save&user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    total_price: _total_price(), 
                    build_type: build_type, 
                    components: comps 
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'ошибка сервера');
            if (data.success) {
                alert('сборка успешно сохранена!');
                
                if (typeof _load_public_builds === 'function') {
                    _load_public_builds(); 
                }
            } else {
                throw new Error(data.message);
            }
        } catch (e) {
            alert(`ошибка сохранения: ${e.message}`);
        } finally {
            _saving = false;
            _hide_loader();
        }
    };

    const _fetch_component = async (id, type) => {
        try {
            const res = await fetch(`api/components.php?id=${id}&category=${type}`);
            const data = await res.json();
            if (data.success && data.component) {
                const c = data.component;
                if (c.component_id) c.id = c.component_id;
                return _normalize(c, type);
            }
            return null;
        } catch (e) { return null; }
    };

    const _load_saved = async (build_id) => {
        _show_loader();
        try {
            const res = await fetch('api/builds.php?action=get_builds');
            const data = await res.json();

            let build = null;
            if (data.builds) build = data.builds.find(b => b.id == build_id);
            
            if (!build) {
                const pub_res = await fetch('api/builds.php?action=get_public');
                const pub_data = await pub_res.json();
                if (pub_data.builds) build = pub_data.builds.find(b => b.id == build_id);
            }
            
            if (!build) {
                alert('Сборка не найдена');
                _hide_loader();
                return;
            }
            
            if (!confirm(`Загрузить сборку "${build.name}"?`)) {
                _hide_loader();
                return;
            }

            Object.assign(_build, {
                cpus: null, motherboards: null, rams: null, gpus: null,
                storages: [], psus: null, cases: null, coolers: null
            });

            let comps = build.components || {};
            if (!Object.keys(comps).length && build.compatibility_data) {
                try { comps = JSON.parse(build.compatibility_data); } catch (e) { comps = {}; }
            }

            const categories = ['cpus', 'motherboards', 'rams', 'gpus', 'psus', 'cases', 'coolers'];
            
            for (const type of categories) {
                const item = comps[type];
                if (item && item.id) {
                    try {
                        const compRes = await fetch(`api/components.php?id=${item.id}`);
                        const compData = await compRes.json();
                        if (compData.success && compData.component) {
                            _build[type] = compData.component;
                        } else {
                            _build[type] = item; 
                        }
                    } catch (e) { _build[type] = item; }
                }
            }

            if (Array.isArray(comps.storages)) {
                _build.storages = await Promise.all(comps.storages.map(async (s) => {
                    try {
                        const compRes = await fetch(`api/components.php?id=${s.id}`);
                        const compData = await compRes.json();
                        return compData.success ? compData.component : s;
                    } catch (e) { return s; }
                }));
            }

            _save_storage();
            _render_cards();
            _calc_power(); 
            _check_compat();
            
        } catch (e) {
            console.error(e);
            _show_message('Ошибка загрузки сборки', 'error');
        }
        _hide_loader();
    };
    const _show_component_details = (type, id) => {
        window.location.href = `component.html?id=${id}&type=${type}`;
    };

    const _get_build_icons = (comps) => {
        const icon_types = [
            { key: 'cpus', folder: 'cpus', icon: 'cpu_icon.png' },
            { key: 'motherboards', folder: 'motherboards', icon: 'motherboard_icon.png' },
            { key: 'rams', folder: 'rams', icon: 'ram_icon.png' },
            { key: 'gpus', folder: 'gpus', icon: 'gpu_icon.png' },
            { key: 'storages', folder: 'storages', icon: 'hdd_icon.png' },
            { key: 'psus', folder: 'psus', icon: 'power_supply_icon.png' },
            { key: 'cases', folder: 'cases', icon: 'pc_case_icon.png' },
            { key: 'coolers', folder: 'coolers', icon: 'cooler_cpu_icon.png' }
        ];

        let html = '';
        icon_types.forEach(t => {
            let comp = comps[t.key];
            if (!comp) return;
            if (t.key === 'storages' && Array.isArray(comp) && comp.length) comp = comp[0];
            if (!comp || !comp.id) return;
            let img = comp.image || '';
            if (!img) img = `source/icons/${t.icon}`;
            else if (!img.startsWith('http') && !img.startsWith('data:') && !img.startsWith('source/')) img = `source/${t.folder}/${img}`;
            html += `<div class="build-icon" title="${comp.name || ''}"><img src="${img}" onerror="this.src='source/icons/${t.icon}'"></div>`;
        });
        return html;
    };

    const _bind_events = () => {
        const save_btn = document.getElementById('save-build-btn');
        if (save_btn) {
            const new_save = save_btn.cloneNode(true);
            save_btn.parentNode.replaceChild(new_save, save_btn);
            document.getElementById('save-build-btn').addEventListener('click', _save_server);
        }

        const reset_btn = document.getElementById('reset-build-btn');
        if (reset_btn) {
            const new_reset = reset_btn.cloneNode(true);
            reset_btn.parentNode.replaceChild(new_reset, reset_btn);
            document.getElementById('reset-build-btn').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                _reset();
            });
        }

        const power_toggle = document.getElementById('power-toggle');
        const power_widget = document.querySelector('.power-widget');
        const power_details = document.getElementById('power-details');
        if (power_toggle && power_widget && power_details) {
            const new_toggle = power_toggle.cloneNode(true);
            power_toggle.parentNode.replaceChild(new_toggle, power_toggle);
            document.getElementById('power-toggle').addEventListener('click', (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                const active = power_widget.classList.toggle('active');
                power_details.style.maxHeight = active ? '450px' : '0';
                power_details.style.opacity = active ? '1' : '0';
            });
        }

        document.getElementById('overclock-check')?.addEventListener('change', _calc_power);

        const logout_link = document.getElementById('logout-link');
        if (logout_link) {
            const new_logout = logout_link.cloneNode(true);
            logout_link.parentNode.replaceChild(new_logout, logout_link);
            document.getElementById('logout-link').addEventListener('click', (e) => {
                e.preventDefault();
                _auth?.logout();
            });
        }

        const login_link = document.getElementById('login-link');
        if (login_link) {
            const new_login = login_link.cloneNode(true);
            login_link.parentNode.replaceChild(new_login, login_link);
            document.getElementById('login-link').addEventListener('click', (e) => {
                e.preventDefault();
                _auth?.showModal();
            });
        }
    };

    const _init_compat_info = () => {
        const header = document.querySelector('.compatibility-title');
        if (!header || document.getElementById('info-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'info-btn';
        btn.innerHTML = '?';
        btn.style.cssText = 'width:24px;height:24px;border-radius:50%;border:1px solid #d0d5dd;background:white;color:#475467;font-size:14px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:all 0.2s;margin-left:auto;';

        btn.addEventListener('mouseenter', () => { btn.style.background = '#f2f4f7'; btn.style.borderColor = '#98a2b3'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'white'; btn.style.borderColor = '#d0d5dd'; });
        header.appendChild(btn);

        btn.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <h3>Как собрать компьютер</h3>
                    <button id="close_info_modal" class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-desc">
                        Сборка компьютера — это как конструктор. Нужно выбрать детали, которые подходят друг к другу. 
                        Вот на что обращать внимание:
                    </div>
                    
                    <div class="info-block">
                        <div class="info-item"><span>&bull;</span><span><strong>Процессор и материнская плата</strong> — должны иметь одинаковый сокет (разъём). Как пазл: если не подходит, не вставится.</span></div>
                        <div class="info-item"><span>&bull;</span><span><strong>Оперативная память</strong> — смотрите тип (DDR4 или DDR5) и сколько слотов на материнской плате.</span></div>
                        <div class="info-item"><span>&bull;</span><span><strong>Видеокарта</strong> — поместится ли в корпус по длине и хватит ли мощности блока питания.</span></div>
                        <div class="info-item"><span>&bull;</span><span><strong>Блок питания</strong> — должен выдавать достаточно ватт для всех компонентов.</span></div>
                        <div class="info-item"><span>&bull;</span><span><strong>Корпус</strong> — проверьте размеры: влезет ли материнская плата, видеокарта и кулер.</span></div>
                    </div>

                    <div class="status-list">
                        <div class="status-item"><span class="status-badge success">&#10003;</span><span>Зелёный — всё отлично, детали подходят</span></div>
                        <div class="status-item"><span class="status-badge warning">&#9888;</span><span>Жёлтый — есть нюансы, но собрать можно</span></div>
                        <div class="status-item"><span class="status-badge error">&#9888;</span><span>Красный — детали несовместимы, выберите другие</span></div>
                        <div class="status-item"><span class="status-badge disabled">&#9888;</span><span>Серый — компонент временно недоступен</span></div>
                    </div>

                    <div class="required-box">
                        <div class="required-title">Минимальный набор для сборки ПК:</div>
                        <ul class="required-list">
                            <li>Процессор</li>
                            <li>Материнская плата</li>
                            <li>Оперативная память</li>
                        </ul>
                    </div>
                </div>
            </div>`;
            
        document.body.appendChild(modal);

        const _close = () => modal.remove();

        modal.querySelector('#close_info_modal').addEventListener('click', _close);
        modal.addEventListener('click', (e) => { if (e.target === modal) _close(); });
    });
    };

    const _init = (data_manager, auth_manager) => {
        _data = data_manager;
        _auth = auth_manager;

        _load_storage().then(() => {
            window.addEventListener('auth:logout', () => {
                Object.assign(_build, {
                    cpus: null, motherboards: null, rams: null, gpus: null,
                    storages: [], psus: null, cases: null, coolers: null
                });
                _render_cards();
                _calc_power();
                _check_compat();
                _clear_storage();
            });

            const ready = () => {
                _render_cards();
                _calc_power();
                _check_compat();
                _bind_events();
                _init_compat_info();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ready);
            } else {
                setTimeout(ready, 100);
            }
        });
    };

    return Object.freeze({
        init: _init,
        render_cards: _render_cards,
        calc_power: _calc_power,
        check_compat: _check_compat,
        openSelection: _open_selection,
        selectComponent: _select,
        removeComponent: _remove,
        loadSavedBuild: _load_saved,
        showComponentDetails: _show_component_details,
        getBuildIcons: _get_build_icons,
        get build() { return _build; },
        set build(v) { Object.assign(_build, v); }
    });
})();

window.Configurator = Configurator;