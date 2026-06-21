'use strict';

const srav_page = (() => {
    let builds = [];
    let left_build = null;
    let right_build = null;
    let only_diff = false;
    let price_cache = new Map();

    const escape_html = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const format_price = (price) => {
        if (!price && price !== 0) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    };

    const fetch_actual_price = async (component_name) => {
        if (!component_name) return null;
        
        const cache_key = component_name.toLowerCase().trim();
        if (price_cache.has(cache_key)) {
            return price_cache.get(cache_key);
        }

        try {
            const response = await fetch(`api/parser.php?q=${encodeURIComponent(component_name)}`);
            const data = await response.json();
            
            if (data.success && data.prices) {
                const available = data.prices.filter(p => p.price !== null && p.price > 0 && p.in_stock === true);
                if (available.length > 0) {
                    available.sort((a, b) => a.price - b.price);
                    const result = {
                        best_price: available[0].price,
                        best_shop: available[0].name,
                        best_url: available[0].url,
                        all_prices: available.map(p => ({
                            name: p.name,
                            price: p.price,
                            url: p.url,
                            in_stock: p.in_stock
                        }))
                    };
                    price_cache.set(cache_key, result);
                    return result;
                }
            }
            price_cache.set(cache_key, null);
            return null;
        } catch (error) {
            console.error('Ошибка получения цены для', component_name, error);
            price_cache.set(cache_key, null);
            return null;
        }
    };

    const fetch_all_prices_for_build = async (build) => {
        if (!build || !build.components) return { prices: {}, total_actual_price: null };
        
        const components = build.components;
        const price_results = {};
        let total_actual_price = 0;
        
        const component_list = [];
        
        if (components.cpus && components.cpus.name) component_list.push({ type: 'cpus', name: components.cpus.name });
        if (components.motherboards && components.motherboards.name) component_list.push({ type: 'motherboards', name: components.motherboards.name });
        if (components.gpus && components.gpus.name) component_list.push({ type: 'gpus', name: components.gpus.name });
        if (components.rams && components.rams.name) component_list.push({ type: 'rams', name: components.rams.name });
        if (components.psus && components.psus.name) component_list.push({ type: 'psus', name: components.psus.name });
        if (components.cases && components.cases.name) component_list.push({ type: 'cases', name: components.cases.name });
        if (components.coolers && components.coolers.name) component_list.push({ type: 'coolers', name: components.coolers.name });
        
        if (components.storages && Array.isArray(components.storages)) {
            components.storages.forEach((storage, idx) => {
                if (storage && storage.name) {
                    component_list.push({ type: `storage_${idx}`, name: storage.name });
                }
            });
        }
        
        const price_promises = component_list.map(async (comp) => {
            const price_data = await fetch_actual_price(comp.name);
            return { type: comp.type, price_data: price_data };
        });
        
        const results = await Promise.all(price_promises);
        
        results.forEach(result => {
            price_results[result.type] = result.price_data;
            if (result.price_data && result.price_data.best_price) {
                total_actual_price += result.price_data.best_price;
            }
        });
        
        return { prices: price_results, total_actual_price: total_actual_price };
    };

    const fetch_component = async (id) => {
        try {
            const response = await fetch(`api/components.php?id=${id}`);
            const data = await response.json();
            if (data.success && data.component) {
                return data.component;
            }
            return null;
        } catch (e) {
            return null;
        }
    };

    const load_full_builds = async (builds_list) => {
        const hasInternet = navigator.onLine;
        
        const full_builds = await Promise.all(builds_list.map(async (build) => {
            let comps = {};
            
            if (build.compatibility_data) {
                if (typeof build.compatibility_data === 'string') {
                    try {
                        let cleaned = build.compatibility_data
                            .replace(/\\n/g, '')
                            .replace(/\\"/g, '"')
                            .replace(/"{/g, '{')
                            .replace(/}"/g, '}');
                        comps = JSON.parse(cleaned);
                    } catch (e) {
                        try {
                            let cleaned = build.compatibility_data.replace(/\\/g, '');
                            comps = JSON.parse(cleaned);
                        } catch (e2) {
                            try {
                                comps = JSON.parse(build.compatibility_data);
                            } catch (e3) {
                                comps = {};
                            }
                        }
                    }
                } else if (typeof build.compatibility_data === 'object') {
                    comps = build.compatibility_data;
                }
            }
            
            if (!Object.keys(comps).length && build.components) {
                if (typeof build.components === 'string') {
                    try {
                        comps = JSON.parse(build.components);
                    } catch (e) {
                        comps = {};
                    }
                } else {
                    comps = build.components;
                }
            }
            
            const full_components = {};
            
            for (const [type, item] of Object.entries(comps)) {
                if (!item) continue;
                
                if (type === 'storages' && Array.isArray(item)) {
                    full_components.storages = await Promise.all(
                        item.map(async (s) => {
                            if (s && s.id) {
                                try {
                                    const comp = await fetch_component(s.id);
                                    return comp || s;
                                } catch (e) {
                                    return s;
                                }
                            }
                            return s;
                        })
                    );
                } else if (item && item.id) {
                    try {
                        const comp = await fetch_component(item.id);
                        full_components[type] = comp || item;
                    } catch (e) {
                        full_components[type] = item;
                    }
                } else {
                    full_components[type] = item;
                }
            }
            
            let price_info = { prices: {}, total_actual_price: null };
            
            // Если есть интернет - загружаем цены, если нет - пропускаем
            if (hasInternet) {
                price_info = await fetch_all_prices_for_build({ components: full_components });
            }
            
            return {
                ...build,
                components: full_components,
                actual_prices: price_info.prices,
                total_actual_price: price_info.total_actual_price,
                no_internet: !hasInternet
            };
        }));
        
        return full_builds;
    };

    const load_builds = async () => {
        const hasInternet = navigator.onLine;
        
        // Если нет интернета - показываем быструю загрузку без парсинга
        if (!hasInternet) {
            console.log('Нет интернета, загружаем только базовые данные');
        }
        
        try {
            const response = await fetch('api/builds.php?action=get_public');
            const data = await response.json();
            
            if (data.success && data.builds && data.builds.length > 0) {
                builds = await load_full_builds(data.builds);
                console.log('Загружено сборок:', builds.length);
            }
            
            fill_selects();
        } catch (error) {
            console.error('Ошибка загрузки сборок:', error);
            const select1 = document.getElementById('build_1');
            const select2 = document.getElementById('build_2');
            if (select1) select1.innerHTML = '<option value="">Ошибка загрузки</option>';
            if (select2) select2.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    };

    const fill_selects = () => {
        const select1 = document.getElementById('build_1');
        const select2 = document.getElementById('build_2');
        if (!select1 || !select2) return;

        let html = '<option value="">Выберите сборку</option>';
        builds.forEach(b => {
            let total;
            if (b.no_internet) {
                total = b.total_price || 0;
            } else {
                total = b.total_actual_price || b.total_price || 0;
            }
            const price = format_price(total);
            const name = b.name || 'Без названия';
            
            html += `<option value="${b.id}">${escape_html(name)} — ${price} Р</option>`;
        });

        select1.innerHTML = html;
        select2.innerHTML = html;
    };

    const find_build = (id) => builds.find(b => b.id == id) || null;

    const get_price_with_shop = (build, component_type) => {
        if (!build || build.no_internet) return null;
        if (!build.actual_prices) return null;
        return build.actual_prices[component_type] || null;
    };

    const format_price_string = (price_data) => {
        if (!price_data || !price_data.best_price) return '—';
        
        let all_shops_html = '';
        if (price_data.all_prices && price_data.all_prices.length > 0) {
            const shop_items = price_data.all_prices.map(p => 
                `<span class="price-shop-item">${escape_html(p.name)}: ${format_price(p.price)} Р</span>`
            ).join(', ');
            all_shops_html = `<div class="all-shops-prices">(${shop_items})</div>`;
        }
        
        return `${format_price(price_data.best_price)} Р <span class="price-shop">(${escape_html(price_data.best_shop)})</span>${all_shops_html}`;
    };

    const get_component_value = (build, type, field) => {
        if (!build) return '—';
        const comps = build.components || {};
        if (!comps || !comps[type]) return '—';
        
        let item = comps[type];
        if (Array.isArray(item)) {
            if (item.length === 0) return '—';
            item = item[0];
        }
        if (!item) return '—';
        
        const value = item[field];
        return (value !== undefined && value !== null && value !== '') ? value : '—';
    };

    const get_storages = (build) => {
        if (!build) return [];
        const comps = build.components || {};
        if (!comps || !comps.storages) return [];
        let items = comps.storages;
        if (!Array.isArray(items)) {
            items = items ? [items] : [];
        }
        return items.filter(s => s !== null);
    };

    const get_component_obj = (build, type) => {
        if (!build) return null;
        const comps = build.components || {};
        if (!comps || !comps[type]) return null;
        let item = comps[type];
        if (Array.isArray(item)) {
            item = item[0] || null;
        }
        return item;
    };

    const get_component_image = (component, type) => {
        if (!component) {
            return '<div class="comp-placeholder"></div>';
        }
        if (!component.image) {
            return '<div class="comp-placeholder"></div>';
        }
        let url = component.image.trim();
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return `<img src="${url}" alt="${escape_html(component.name || '')}" onerror="this.src='source/icons/component_placeholder.png'">`;
        }
        if (url.startsWith('/')) {
            return `<img src="${url}" alt="${escape_html(component.name || '')}" onerror="this.src='source/icons/component_placeholder.png'">`;
        }
        if (url.startsWith('source/')) {
            return `<img src="${url}" alt="${escape_html(component.name || '')}" onerror="this.src='source/icons/component_placeholder.png'">`;
        }
        const folder_map = {
            cpus: 'cpus', motherboards: 'motherboards', gpus: 'gpus',
            rams: 'rams', storages: 'storages', psus: 'psus',
            cases: 'cases', coolers: 'coolers'
        };
        const folder = folder_map[type] || 'components';
        url = `source/${folder}/${url}`;
        return `<img src="${url}" alt="${escape_html(component.name || '')}" onerror="this.src='source/icons/component_placeholder.png'">`;
    };

    const make_row = (label, value1, value2) => {
        const is_diff = value1 !== value2;
        return `<div class="srav-row ${is_diff ? 'is-diff' : ''}"><div class="srav-cell">${label}</div><div class="srav-cell">${value1}</div><div class="srav-cell">${value2}</div></div>`;
    };

    const render_comparison = () => {
        const container = document.getElementById('srav_result');
        if (!left_build || !right_build) {
            container.innerHTML = '<div class="empty-msg">Выберите две сборки для сравнения</div>';
            return;
        }

        let html = '<div class="srav-grid">';
        
        html += '<div class="srav-category">Общее</div>';
        html += make_row('Итоговая стоимость (фиксированная)', `${format_price(left_build.total_price || 0)} Р`, `${format_price(right_build.total_price || 0)} Р`);
        
        const left_actual = left_build.total_actual_price;
        const right_actual = right_build.total_actual_price;
        const left_no_internet = left_build.no_internet;
        const right_no_internet = right_build.no_internet;
        
        let left_actual_text = '—';
        let right_actual_text = '—';
        
        if (left_no_internet) {
            left_actual_text = '<span class="price-note">(нет интернета)</span>';
        } else if (left_actual) {
            left_actual_text = `<strong>${format_price(left_actual)} Р</strong> <span class="price-note">(сумма по актуальным ценам)</span>`;
        }
        
        if (right_no_internet) {
            right_actual_text = '<span class="price-note">(нет интернета)</span>';
        } else if (right_actual) {
            right_actual_text = `<strong>${format_price(right_actual)} Р</strong> <span class="price-note">(сумма по актуальным ценам)</span>`;
        }
        
        html += make_row('Актуальная цена (сумма)', left_actual_text, right_actual_text);
        
        const left_date = left_build.created_at ? new Date(left_build.created_at).toLocaleDateString('ru-RU') : '—';
        const right_date = right_build.created_at ? new Date(right_build.created_at).toLocaleDateString('ru-RU') : '—';
        html += make_row('Дата создания', left_date, right_date);

        const component_types = [
            { type: 'cpus', name: 'Процессор', specs: ['manufacturer', 'socket', 'cores', 'threads', 'frequency', 'tdp', 'memory_type'] },
            { type: 'motherboards', name: 'Материнская плата', specs: ['manufacturer', 'socket', 'chipset', 'form_factor', 'memory_type', 'memory_slots', 'max_memory', 'm2_slots', 'sata_ports', 'pcie_version', 'wifi'] },
            { type: 'gpus', name: 'Видеокарта', specs: ['manufacturer', 'gpu_chip', 'memory_size', 'memory_type', 'tdp', 'recommended_psu', 'length', 'hdmi_ports', 'displayport_ports'] },
            { type: 'rams', name: 'Оперативная память', specs: ['manufacturer', 'type', 'capacity', 'modules', 'speed', 'cas_latency', 'rgb'] },
            { type: 'psus', name: 'Блок питания', specs: ['manufacturer', 'wattage', 'efficiency', 'form_factor', 'modular', 'pcie_connectors', 'sata_connectors'] },
            { type: 'cases', name: 'Корпус', specs: ['manufacturer', 'form_factor', 'supported_motherboards', 'color', 'window', 'max_gpu_length', 'max_cpu_cooler_height', 'drive_bays', 'fan_slots', 'radiator_support'] },
            { type: 'coolers', name: 'Охлаждение', specs: ['manufacturer', 'type', 'socket_compatibility', 'tdp', 'fan_size', 'noise_level', 'height', 'radiator_size', 'led'] }
        ];

        for (const ct of component_types) {
            const comp1 = get_component_obj(left_build, ct.type);
            const comp2 = get_component_obj(right_build, ct.type);
            
            const has_comp1 = comp1 !== null;
            const has_comp2 = comp2 !== null;
            
            if (!has_comp1 && !has_comp2) continue;
            
            html += `<div class="srav-category">${ct.name}</div>`;
            
            const price_data1 = get_price_with_shop(left_build, ct.type);
            const price_data2 = get_price_with_shop(right_build, ct.type);
            
            let left_model_html = '—';
            let right_model_html = '—';
            
            if (has_comp1) {
                const db_price = comp1.price ? `${format_price(comp1.price)} Р` : '—';
                let actual_prices_html = '';
                
                if (!left_no_internet && price_data1 && price_data1.all_prices && price_data1.all_prices.length > 0) {
                    actual_prices_html = '<div class="actual-prices">';
                    for (const shop_price of price_data1.all_prices) {
                        if (shop_price.price && shop_price.in_stock) {
                            actual_prices_html += `<span class="price-item">${escape_html(shop_price.name)}: ${format_price(shop_price.price)} Р</span>`;
                        }
                    }
                    actual_prices_html += '</div>';
                }
                
                left_model_html = `
                    <div class="comp-item">${get_component_image(comp1, ct.type)}<span>${escape_html(comp1.name || '—')}</span></div>
                    <div class="db-price">Цена в базе: ${db_price}</div>
                    ${actual_prices_html}
                `;
            }
            
            if (has_comp2) {
                const db_price = comp2.price ? `${format_price(comp2.price)} Р` : '—';
                let actual_prices_html = '';
                
                if (!right_no_internet && price_data2 && price_data2.all_prices && price_data2.all_prices.length > 0) {
                    actual_prices_html = '<div class="actual-prices">';
                    for (const shop_price of price_data2.all_prices) {
                        if (shop_price.price && shop_price.in_stock) {
                            actual_prices_html += `<span class="price-item">${escape_html(shop_price.name)}: ${format_price(shop_price.price)} Р</span>`;
                        }
                    }
                    actual_prices_html += '</div>';
                }
                
                right_model_html = `
                    <div class="comp-item">${get_component_image(comp2, ct.type)}<span>${escape_html(comp2.name || '—')}</span></div>
                    <div class="db-price">Цена в базе: ${db_price}</div>
                    ${actual_prices_html}
                `;
            }
            
            const is_model_diff = left_model_html !== right_model_html;
            if (!only_diff || is_model_diff) {
                html += make_row('Модель', left_model_html, right_model_html);
            }
            
            for (const spec of ct.specs) {
                let left_val = '—';
                let right_val = '—';
                
                if (has_comp1 && comp1[spec] !== undefined && comp1[spec] !== null && comp1[spec] !== '') {
                    left_val = comp1[spec];
                    if (spec === 'cores' || spec === 'threads') left_val = `${left_val} шт`;
                    if (spec === 'tdp' || spec === 'recommended_psu' || spec === 'wattage') left_val = `${left_val} Вт`;
                    if (spec === 'memory_size' || spec === 'capacity' || spec === 'max_memory') left_val = `${left_val} ГБ`;
                    if (spec === 'speed') left_val = `${left_val} МГц`;
                    if (spec === 'length' || spec === 'max_gpu_length' || spec === 'max_cpu_cooler_height' || spec === 'height') left_val = `${left_val} мм`;
                    if (spec === 'wifi' || spec === 'rgb' || spec === 'window') left_val = left_val == 1 ? 'Да' : (left_val == 0 ? 'Нет' : left_val);
                }
                
                if (has_comp2 && comp2[spec] !== undefined && comp2[spec] !== null && comp2[spec] !== '') {
                    right_val = comp2[spec];
                    if (spec === 'cores' || spec === 'threads') right_val = `${right_val} шт`;
                    if (spec === 'tdp' || spec === 'recommended_psu' || spec === 'wattage') right_val = `${right_val} Вт`;
                    if (spec === 'memory_size' || spec === 'capacity' || spec === 'max_memory') right_val = `${right_val} ГБ`;
                    if (spec === 'speed') right_val = `${right_val} МГц`;
                    if (spec === 'length' || spec === 'max_gpu_length' || spec === 'max_cpu_cooler_height' || spec === 'height') right_val = `${right_val} мм`;
                    if (spec === 'wifi' || spec === 'rgb' || spec === 'window') right_val = right_val == 1 ? 'Да' : (right_val == 0 ? 'Нет' : right_val);
                }
                
                const spec_label = {
                    'manufacturer': 'Производитель', 'socket': 'Сокет', 'cores': 'Ядра', 'threads': 'Потоки',
                    'frequency': 'Частота', 'tdp': 'TDP', 'memory_type': 'Тип памяти', 'chipset': 'Чипсет',
                    'form_factor': 'Форм-фактор', 'memory_slots': 'Слотов памяти', 'max_memory': 'Макс. память',
                    'm2_slots': 'M.2 слоты', 'sata_ports': 'SATA порты', 'pcie_version': 'PCIe',
                    'wifi': 'Wi-Fi', 'gpu_chip': 'Чип', 'memory_size': 'Память', 'recommended_psu': 'Рек. БП',
                    'length': 'Длина', 'hdmi_ports': 'HDMI', 'displayport_ports': 'DisplayPort',
                    'type': 'Тип', 'capacity': 'Объем', 'modules': 'Модулей', 'speed': 'Частота',
                    'cas_latency': 'CAS', 'rgb': 'RGB', 'wattage': 'Мощность', 'efficiency': 'Сертификат',
                    'modular': 'Модульность', 'pcie_connectors': 'PCIe разъемы', 'sata_connectors': 'SATA разъемы',
                    'supported_motherboards': 'Поддержка плат', 'color': 'Цвет', 'window': 'Окно',
                    'max_gpu_length': 'Макс. GPU', 'max_cpu_cooler_height': 'Макс. кулер', 'drive_bays': 'Отсеки',
                    'fan_slots': 'Вентиляторы', 'radiator_support': 'Радиаторы', 'socket_compatibility': 'Сокеты',
                    'fan_size': 'Вентилятор', 'noise_level': 'Шум', 'height': 'Высота', 'radiator_size': 'Радиатор',
                    'led': 'Подсветка'
                }[spec] || spec;
                
                const is_diff = left_val !== right_val;
                if (only_diff && !is_diff) continue;
                
                html += make_row(spec_label, left_val, right_val);
            }
        }

        const drives1 = get_storages(left_build);
        const drives2 = get_storages(right_build);
        const max_drives = Math.max(drives1.length, drives2.length);

        if (max_drives > 0) {
            html += '<div class="srav-category">Накопители</div>';
            for (let i = 0; i < max_drives; i++) {
                const drive1 = drives1[i] || null;
                const drive2 = drives2[i] || null;
                
                let left_drive_html = '—';
                let right_drive_html = '—';
                
                if (drive1) {
                    const price_data1 = get_price_with_shop(left_build, `storage_${i}`);
                    const db_price = drive1.price ? `${format_price(drive1.price)} Р` : '—';
                    let actual_prices_html = '';
                    
                    if (!left_no_internet && price_data1 && price_data1.all_prices && price_data1.all_prices.length > 0) {
                        actual_prices_html = '<div class="actual-prices">';
                        for (const shop_price of price_data1.all_prices) {
                            if (shop_price.price && shop_price.in_stock) {
                                actual_prices_html += `<span class="price-item">${escape_html(shop_price.name)}: ${format_price(shop_price.price)} Р</span>`;
                            }
                        }
                        actual_prices_html += '</div>';
                    }
                    
                    left_drive_html = `
                        <div class="comp-item">${get_component_image(drive1, 'storages')}<span>${escape_html(drive1.name || '—')}</span></div>
                        <div class="db-price">Цена в базе: ${db_price}</div>
                        ${actual_prices_html}
                    `;
                }
                
                if (drive2) {
                    const price_data2 = get_price_with_shop(right_build, `storage_${i}`);
                    const db_price = drive2.price ? `${format_price(drive2.price)} Р` : '—';
                    let actual_prices_html = '';
                    
                    if (!right_no_internet && price_data2 && price_data2.all_prices && price_data2.all_prices.length > 0) {
                        actual_prices_html = '<div class="actual-prices">';
                        for (const shop_price of price_data2.all_prices) {
                            if (shop_price.price && shop_price.in_stock) {
                                actual_prices_html += `<span class="price-item">${escape_html(shop_price.name)}: ${format_price(shop_price.price)} Р</span>`;
                            }
                        }
                        actual_prices_html += '</div>';
                    }
                    
                    right_drive_html = `
                        <div class="comp-item">${get_component_image(drive2, 'storages')}<span>${escape_html(drive2.name || '—')}</span></div>
                        <div class="db-price">Цена в базе: ${db_price}</div>
                        ${actual_prices_html}
                    `;
                }
                
                const is_diff = left_drive_html !== right_drive_html;
                if (!only_diff || is_diff) {
                    html += make_row(`Накопитель ${i + 1}`, left_drive_html, right_drive_html);
                    
                    const drive_specs = [
                        { label: 'Тип', field: 'type' },
                        { label: 'Интерфейс', field: 'interface' },
                        { label: 'Объем', field: 'capacity', suffix: ' ГБ' },
                        { label: 'Скорость чтения', field: 'read_speed', suffix: ' МБ/с' },
                        { label: 'Скорость записи', field: 'write_speed', suffix: ' МБ/с' }
                    ];
                    
                    for (const spec of drive_specs) {
                        let spec_val1 = '—';
                        let spec_val2 = '—';
                        if (drive1 && drive1[spec.field]) spec_val1 = drive1[spec.field] + (spec.suffix || '');
                        if (drive2 && drive2[spec.field]) spec_val2 = drive2[spec.field] + (spec.suffix || '');
                        const spec_diff = spec_val1 !== spec_val2;
                        if (!only_diff || spec_diff) {
                            html += make_row(spec.label, spec_val1, spec_val2);
                        }
                    }
                }
            }
        }

        html += '</div>';
        container.innerHTML = html;
    };

    const bind_events = () => {
        const select1 = document.getElementById('build_1');
        const select2 = document.getElementById('build_2');
        
        if (select1) {
            select1.onchange = (e) => { 
                left_build = find_build(e.target.value); 
                render_comparison(); 
            };
        }
        
        if (select2) {
            select2.onchange = (e) => { 
                right_build = find_build(e.target.value); 
                render_comparison(); 
            };
        }
        
        const diff_checkbox = document.getElementById('show_only_diff');
        if (diff_checkbox) {
            diff_checkbox.onchange = (e) => { 
                only_diff = e.target.checked; 
                render_comparison(); 
            };
        }
    };

    const init = async () => {
        await load_builds();
        bind_events();
    };

    return Object.freeze({ init: init });
})();

document.addEventListener('DOMContentLoaded', () => { srav_page.init(); });