'use strict';

const DataManager = (() => {
    const API = 'api/';
    const _details_cache = new Map();
    const _all_cache = new Map();

    const CATEGORY_MAP = Object.freeze({
        cpus: 'cpus', motherboards: 'motherboards', rams: 'rams',
        gpus: 'gpus', storages: 'storages', psus: 'psus',
        cases: 'cases', coolers: 'coolers'
    });

    const ALLOWED_FILTERS = Object.freeze({
        cpus: ['search', 'socket'],
        motherboards: ['search', 'socket', 'memory_type', 'form_factor'],
        rams: ['search', 'memory_type'],
        gpus: ['search', 'max_length'],
        storages: ['search'],
        psus: ['search', 'min_wattage'],
        cases: ['search', 'form_factor', 'max_gpu_length', 'max_cpu_cooler_height'],
        coolers: ['search', 'socket', 'tdp']
    });

    const COMPAT_RULES = Object.freeze({
        sockets: {
            'AM4': ['AM4'], 'LGA1700': ['LGA1700'],
            'AM5': ['AM5'], 'LGA1200': ['LGA1200'],
            'LGA1151': ['LGA1151'], 'TR4': ['TR4']
        },
        memory_types: {
            'DDR4': ['DDR4'], 'DDR5': ['DDR5'], 'DDR3': ['DDR3']
        },
        form_factors: {
            'ATX': ['ATX', 'E-ATX', 'Micro-ATX'],
            'Micro-ATX': ['ATX', 'Micro-ATX', 'Mini-ITX'],
            'Mini-ITX': ['ATX', 'Micro-ATX', 'Mini-ITX']
        }
    });

    const getComponentsPage = async (type, page = 1, filters = {}) => {
        const api_cat = CATEGORY_MAP[type] || type.replace(/s$/, '');
        const params = new URLSearchParams();
        params.append('category', api_cat);
        params.append('page', String(page));
        params.append('limit', '5');
        params.append('is_active', '1');

        if (filters.search) params.append('search', filters.search);
        if (_can_filter(type, 'socket', filters.socket)) params.append('socket', filters.socket);
        if (_can_filter(type, 'memory_type', filters.memory_type)) params.append('memory_type', filters.memory_type);
        if (_can_filter(type, 'min_wattage', filters.min_wattage)) params.append('min_wattage', filters.min_wattage);
        if (_can_filter(type, 'form_factor', filters.form_factor)) params.append('form_factor', filters.form_factor);
        if (_can_filter(type, 'max_gpu_length', filters.max_gpu_length)) params.append('max_gpu_length', filters.max_gpu_length);
        if (_can_filter(type, 'max_cpu_cooler_height', filters.max_cpu_cooler_height)) params.append('max_cpu_cooler_height', filters.max_cpu_cooler_height);

        try {
            const res = await fetch(`api/components.php?${params.toString()}`);
            const text = await res.text();

            if (text.trim().startsWith('<')) {
                throw new Error('Сервер вернул HTML вместо JSON');
            }

            const data = JSON.parse(text);

            let components = [];
            let total_pages = 1;
            let total_items = 0;

            if (data.success && Array.isArray(data.components)) {
                components = data.components;
                total_pages = data.total_pages || 1;
                total_items = data.total_items || components.length;
            } else if (data.success && data.data && Array.isArray(data.data)) {
                components = data.data;
                total_pages = data.total_pages || 1;
                total_items = data.total_items || components.length;
            } else if (Array.isArray(data)) {
                components = data;
                total_items = data.length;
            } else if (data.components && Array.isArray(data.components)) {
                components = data.components;
                total_pages = data.total_pages || 1;
                total_items = data.total_items || components.length;
            }

            components = components.map(c => ({
                ...c,
                category: c.category || c.category_code || api_cat
            }));

            return {
                components,
                currentPage: page,
                totalPages: total_pages,
                totalItems: total_items,
                hasNext: page < total_pages,
                hasPrev: page > 1,
                itemsPerPage: 5
            };
        } catch (e) {
            return {
                components: [],
                currentPage: page,
                totalPages: 0,
                totalItems: 0,
                hasNext: false,
                hasPrev: false,
                itemsPerPage: 5
            };
        }
    };

    const _can_filter = (type, filter_name, filter_value) => {
        if (!filter_value) return false;
        const allowed = ALLOWED_FILTERS[type] || ['search'];
        return allowed.includes(filter_name);
    };

    const getComponentDetails = async (id, type) => {
        const key = `${type}_${id}`;
        if (_details_cache.has(key)) return _details_cache.get(key);

        try {
            const res = await fetch(`${API}components.php?id=${id}&category=${type}`);
            const text = await res.text();
            if (text.trim().startsWith('<')) throw new Error('Сервер вернул HTML');
            const data = JSON.parse(text);

            let component = null;
            if (data.success && data.component) component = data.component;
            else if (data.component) component = data.component;
            else if (data.id && data.name) component = data;

            if (component) {
                _details_cache.set(key, component);
                return component;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const getCompatibilityFilters = (build) => {
        const filters = {};

        if (build.cpus?.socket) {
            filters.socket = build.cpus.socket;
        }

        if (build.motherboards) {
            if (build.motherboards.memory_type) {
                filters.memory_type = build.motherboards.memory_type;
            }
            if (build.motherboards.form_factor) {
                filters.form_factor = build.motherboards.form_factor;
            }
        }

        if (build.cpus || build.gpus || build.rams) {
            const total = _calc_total_wattage(build);
            if (total > 0) {
                filters.min_wattage = Math.ceil(total * 0.8);
            }
        }

        return filters;
    };

    const _calc_total_wattage = (build) => {
        let total = 0;

        if (build.cpus?.wattage) {
            total += parseInt(build.cpus.wattage) || 0;
        } else if (build.cpus?.tdp) {
            total += parseInt(build.cpus.tdp) || 0;
        } else {
            total += 65;
        }

        if (build.gpus?.wattage) {
            total += parseInt(build.gpus.wattage) || 0;
        } else if (build.gpus?.tdp) {
            total += parseInt(build.gpus.tdp) || 0;
        } else {
            total += 150;
        }

        if (build.rams?.wattage) {
            total += parseInt(build.rams.wattage) || 0;
        } else {
            total += 5;
        }

        if (build.motherboards?.wattage) {
            total += parseInt(build.motherboards.wattage) || 0;
        } else {
            total += 50;
        }

        if (build.coolers?.wattage) {
            total += parseInt(build.coolers.wattage) || 0;
        } else if (build.coolers?.tdp) {
            total += parseInt(build.coolers.tdp) || 0;
        } else {
            total += 8;
        }

        if (build.cases?.wattage) {
            total += parseInt(build.cases.wattage) || 0;
        } else {
            total += 10;
        }

        if (Array.isArray(build.storages)) {
            build.storages.forEach(s => {
                if (s?.wattage) {
                    total += parseInt(s.wattage) || 0;
                } else {
                    total += 5;
                }
            });
        }

        return Math.ceil(total * 1.2);
    };

    const validateCompatibility = (build) => {
        const errors = [];
        const warnings = [];
        let score = 0;
        let max_score = 0;

        const check_items = [
            { type: 'cpus', name: 'Процессор', required: true },
            { type: 'motherboards', name: 'Материнская плата', required: true },
            { type: 'rams', name: 'Оперативная память', required: true },
            { type: 'gpus', name: 'Видеокарта', required: false },
            { type: 'storages', name: 'Накопитель', required: false, is_array: true },
            { type: 'psus', name: 'Блок питания', required: false },
            { type: 'cases', name: 'Корпус', required: false },
            { type: 'coolers', name: 'Охлаждение', required: false }
        ];

        check_items.forEach(item => {
            const component = build[item.type];
            if (item.is_array) {
                if (Array.isArray(component) && component.length > 0) { max_score++; score++; }
            } else if (component) { max_score++; score++; }
        });

        const cpu = build.cpus;
        const mb = build.motherboards;

        if (cpu && mb) {
            if (cpu.socket && mb.socket && cpu.socket !== mb.socket) {
                errors.push({
                    component1: 'cpus',
                    component2: 'motherboards',
                    message: `Процессор ${cpu.name} (сокет ${cpu.socket}) не совместим с платой ${mb.name} (сокет ${mb.socket})`
                });
                score--;
            }
        }

        if (build.rams && mb) {
            const ram_type = build.rams.type || build.rams.memory_type;
            const mb_type = mb.memory_type;

            if (ram_type && mb_type && ram_type !== mb_type) {
                errors.push({
                    component1: 'rams',
                    component2: 'motherboards',
                    message: `Память ${build.rams.name} (${ram_type}) не совместима с платой ${mb.name} (${mb_type})`
                });
                score--;
            }
        }

        if (build.cases && mb) {
            const case_ff = build.cases.supported_motherboards || '';
            const case_ffs = case_ff.toUpperCase().split(/[,|]/).map(f => f.trim());
            const mb_ff = mb.form_factor;

            if (mb_ff && case_ffs.length > 0) {
                const hierarchy = {
                    'E-ATX': ['E-ATX', 'ATX', 'MICRO-ATX', 'MINI-ITX'],
                    'ATX': ['ATX', 'MICRO-ATX', 'MINI-ITX'],
                    'MICRO-ATX': ['MICRO-ATX', 'MINI-ITX'],
                    'MINI-ITX': ['MINI-ITX']
                };
                
                let ok = false;
                for (const f of case_ffs) {
                    if (f === mb_ff.toUpperCase() || (hierarchy[f] && hierarchy[f].includes(mb_ff.toUpperCase()))) {
                        ok = true;
                        break;
                    }
                }
                
                if (!ok) {
                    errors.push({
                        component1: 'motherboards',
                        component2: 'cases',
                        message: `Плата ${mb.name} (${mb_ff}) не поместится в корпус ${build.cases.name} (поддерживает: ${case_ff})`
                    });
                    score--;
                }
            }
        }

        if (Array.isArray(build.storages) && mb) {
            const m2_slots = mb.m2_slots || 1;
            const sata_ports = mb.sata_ports || 4;
            let m2_count = 0;
            let sata_count = 0;

            build.storages.forEach(storage => {
                if (storage.type?.toUpperCase().includes('M.2') || storage.type?.toUpperCase().includes('NVME')) {
                    m2_count++;
                } else {
                    sata_count++;
                }
            });

            if (m2_count > m2_slots) {
                errors.push({
                    component1: 'storages',
                    component2: 'motherboards',
                    message: `Недостаточно M.2 слотов: выбрано ${m2_count}, доступно ${m2_slots}`
                });
                score--;
            }

            if (sata_count > sata_ports) {
                errors.push({
                    component1: 'storages',
                    component2: 'motherboards',
                    message: `Недостаточно SATA портов: выбрано ${sata_count}, доступно ${sata_ports}`
                });
                score--;
            }
        }

        const total_w = _calc_total_wattage(build);
        if (build.psus) {
            if (total_w > build.psus.wattage) {
                warnings.push({
                    component1: 'psus',
                    component2: 'system',
                    message: `Мощность БП ${build.psus.wattage}W может быть недостаточной (расчетная: ${total_w}W)`
                });
            }
        }

        if (build.gpus && build.cases) {
            const gpu_len = build.gpus.length_mm || build.gpus.card_length || 300;
            const case_max = build.cases.max_gpu_length || 350;

            if (gpu_len > case_max) {
                warnings.push({
                    component1: 'gpus',
                    component2: 'cases',
                    message: `Видеокарта может не поместиться в корпус. Длина: ${gpu_len}mm, макс. в корпусе: ${case_max}mm`
                });
            }
        }

        if (build.coolers && cpu) {
            const cooler_sockets = build.coolers.socket_compatibility || '';
            const cooler_sockets_list = cooler_sockets.toUpperCase().split(/[,|]/).map(s => s.trim());
            const cpu_socket = cpu.socket;

            if (cpu_socket && cooler_sockets_list.length > 0 && !cooler_sockets_list.includes(cpu_socket.toUpperCase())) {
                errors.push({
                    component1: 'coolers',
                    component2: 'cpus',
                    message: `Охлаждение ${build.coolers.name} не совместимо с процессором ${cpu.name} (сокет ${cpu_socket})`
                });
                score--;
            }
        }

        const selected = check_items.reduce((count, item) => {
            const component = build[item.type];
            if (item.is_array) return count + (Array.isArray(component) && component.length > 0 ? 1 : 0);
            return count + (component ? 1 : 0);
        }, 0);

        const progress = max_score > 0 ? Math.max(0, (score / max_score) * 100) : 0;

        return {
            valid: errors.length === 0,
            has_warnings: warnings.length > 0,
            errors,
            warnings,
            total_wattage: total_w,
            progress,
            selected,
            total: check_items.length
        };
    };

    const getComponentImagePath = (component) => {
        if (!component?.image) return 'source/icons/default_component.png';

        let path = component.image;
        let folder = _get_folder(component);

        const paths = [];
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
            paths.push(path);
        }
        paths.push(`source/${folder}/${path}`);
        if (path.includes('/')) {
            paths.push(`source/${path}`);
            paths.push(path);
        } else {
            paths.push(`source/images/${folder}/${path}`);
            paths.push(`images/${folder}/${path}`);
            paths.push(`components/${folder}/${path}`);
        }
        paths.push(`source/${path}`);
        paths.push('source/icons/default_component.png');

        return paths[0];
    };

    const _get_folder = (component) => {
        if (!component?.category) return 'components';
        const cat = component.category.toLowerCase();
        const map = {
            'cpu': 'cpus', 'processor': 'cpus',
            'motherboard': 'motherboards',
            'ram': 'rams', 'memory': 'rams',
            'gpu': 'gpus', 'videocard': 'gpus',
            'storage': 'storages', 'ssd': 'storages', 'hdd': 'storages',
            'psu': 'psus', 'power supply': 'psus',
            'case': 'cases',
            'cooler': 'coolers'
        };
        return map[cat] || cat;
    };

    const clearCache = () => {
        _details_cache.clear();
        _all_cache.clear();
    };

    return Object.freeze({
        getComponentsPage,
        getComponentDetails,
        getCompatibilityFilters,
        validateCompatibility,
        getComponentImagePath,
        clearCache
    });
})();

window.DataManager = DataManager;