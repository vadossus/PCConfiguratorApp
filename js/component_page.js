'use strict';

const ComponentPage = (() => {
    let _id = null;
    let _type = null;
    let _data = null;
    let _store_prices = null;

    const _get_param = (name) => new URLSearchParams(window.location.search).get(name);

    const _esc = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const _format_price = (price) => {
        if (!price && price !== 0) return '0';
        return new Intl.NumberFormat('ru-RU').format(price);
    };

    const _get_image = (component) => {
        if (!component?.image) return `source/icons/${_type}_icon.png`;
        const path = component.image;
        if (path.startsWith('http')) return path;
        if (path.startsWith('source/')) return path;
        return `source/${_type}/${path}`;
    };

    const _parser = async (search_query) => {
        if (!navigator.onLine) {
            return [];
        }
        
        try {
            const response = await fetch(`api/parser.php?q=${encodeURIComponent(search_query)}`);
            const data = await response.json();
            
            if (data.success && data.prices) {
                return data.prices;
            }
            return [
                { name: 'Oldi', price: null, url: null, in_stock: false },
                { name: 'UCT1', price: null, url: null, in_stock: false },
                { name: 'CompDay', price: null, url: null, in_stock: false }
            ];
        } catch (e) {
            return [
                { name: 'Oldi', price: null, url: null, in_stock: false },
                { name: 'UCT1', price: null, url: null, in_stock: false },
                { name: 'CompDay', price: null, url: null, in_stock: false }
            ];
        }
    };

    const _load = async () => {
        document.getElementById('component-content').innerHTML = '<div class="loader_wrap"><div class="loader_spinner"></div><p>Загружаем данные...</p></div>';

        try {
            const res = await fetch(`api/components.php?id=${_id}&category=${_type}`);
            const data = await res.json();
            if (!data.success || !data.component) throw new Error('Компонент не найден');

            _data = data.component;
            if (_data.component_id) {
                _id = _data.component_id;
                _data.id = _data.component_id;
            }

            _store_prices = await _parser(_data.name);

            _render();
        } catch (e) {
            document.getElementById('component-content').innerHTML = `<div class="error_wrap"><h3>Ошибка загрузки</h3><p>${e.message}</p><button class="btn_action btn_primary" onclick="window.location.href='index.html'">Вернуться на главную</button></div>`;
        }
    };

    const _render_store_prices = () => {
        if (!navigator.onLine) {
            return `
                <div class="store_prices_block">
                    <h3 class="store_prices_title">Цены в магазинах</h3>
                    <div class="store_prices_list">
                        <div class="store_pill_item">
                            <span class="store_pill_name">Нет интернета</span>
                        </div>
                    </div>
                </div>`;
        }
        
        if (!_store_prices || _store_prices.length === 0) {
            return `
                <div class="store_prices_block">
                    <h3 class="store_prices_title">Цены в магазинах</h3>
                    <div class="store_prices_list">
                        <div class="store_pill_item">
                            <span class="store_pill_name">Oldi: Нет в наличии</span>
                        </div>
                        <div class="store_pill_item">
                            <span class="store_pill_name">UCT1: Нет в наличии</span>
                        </div>
                    </div>
                </div>`;
        }

        let html = '';
        for (let i = 0; i < _store_prices.length; i++) {
            let shop = _store_prices[i];
            if (shop.in_stock && shop.price) {
                html += `
                    <a href="${shop.url || '#'}" class="store_pill_item" target="_blank">
                        <span class="store_pill_name">${_esc(shop.name)}:</span>
                        <span class="store_pill_price">${_format_price(shop.price)} Р</span>
                    </a>
                `;
            } else {
                html += `
                    <div class="store_pill_item">
                        <span class="store_pill_name">${_esc(shop.name)}:</span>
                        <span class="store_pill_price">Нет в наличии</span>
                    </div>
                `;
            }
        }

        return `
            <div class="store_prices_block">
                <h3 class="store_prices_title">Цены в магазинах</h3>
                <div class="store_prices_list">
                    ${html}
                </div>
            </div>
        `;
    };

    const _render = () => {
        const container = document.getElementById('component-content');
        if (!container) return;

        container.innerHTML = `
            <div class="product_grid">
                <div class="img_block">
                    <div class="img_wrap">
                        <img src="${_get_image(_data)}" alt="${_esc(_data.name)}" class="comp_img" onerror="this.src='source/icons/default_component.png'">
                    </div>
                </div>
                <div class="info_block">
                    <h1 class="comp_name">${_esc(_data.name)}</h1>
                    <div class="comp_article">Артикул: ${_id}</div>
                    <div class="price_card"><div class="price_value">${_format_price(_data.price)} Р</div></div>
                    ${_render_store_prices()}
                </div>
            </div>
            <div class="specs_desc_wrap">
                <div class="specs_section">
                    <h2 class="subsection_title">Характеристики</h2>
                    <div class="specs_list">${_render_specs()}</div>
                </div>
                <div class="desc_section">
                    <h2 class="subsection_title">Описание</h2>
                    <div class="desc_text">${_esc(_data.description || 'Описание отсутствует')}</div>
                </div>
            </div>`;
    };

    const _render_specs = () => {
        const groups = _get_specs();
        if (!groups.length) return '<div class="spec_empty">Характеристики не указаны</div>';

        let html = '';
        groups.forEach(g => {
            html += `<div class="spec_group">${g.group}</div>`;
            g.fields.forEach(f => {
                html += `<div class="spec_row"><span class="spec_label">${f.label}</span><span class="spec_value">${f.value}</span></div>`;
            });
        });
        return html;
    };

    const _get_specs = () => {
        const specs = [];
        const c = _data;

        if (_type === 'cpus') {
            specs.push({ group: 'Основные', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Сокет', value: c.socket || 'Не указан' },
                { label: 'Ядер', value: c.cores ? `${c.cores} шт` : 'Не указано' },
                { label: 'Потоков', value: c.threads ? `${c.threads} шт` : 'Не указано' },
                { label: 'Частота', value: c.frequency || 'Не указана' }
            ]});
            specs.push({ group: 'Память', fields: [
                { label: 'Тип памяти', value: c.memory_type || 'Не указан' },
                { label: 'TDP', value: c.tdp ? `${c.tdp} Вт` : 'Не указан' }
            ]});
        } else if (_type === 'motherboards') {
            specs.push({ group: 'Основные', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Сокет', value: c.socket || 'Не указан' },
                { label: 'Чипсет', value: c.chipset || 'Не указан' },
                { label: 'Форм-фактор', value: c.form_factor || 'Не указан' }
            ]});
            specs.push({ group: 'Память', fields: [
                { label: 'Тип памяти', value: c.memory_type || 'Не указан' },
                { label: 'Слотов', value: c.memory_slots || 'Не указано' },
                { label: 'Макс. объем', value: c.max_memory ? `${c.max_memory} ГБ` : 'Не указан' }
            ]});
            specs.push({ group: 'Разъемы', fields: [
                { label: 'M.2 слотов', value: c.m2_slots || 'Не указано' },
                { label: 'SATA портов', value: c.sata_ports || 'Не указано' },
                { label: 'Wi-Fi', value: c.wifi ? 'Есть' : 'Нет' }
            ]});
        } else if (_type === 'rams') {
            specs.push({ group: 'Параметры', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Тип', value: c.type || 'Не указан' },
                { label: 'Объем', value: c.capacity ? `${c.capacity} ГБ` : 'Не указан' },
                { label: 'Модулей', value: c.modules ? `${c.modules} шт` : 'Не указано' },
                { label: 'Частота', value: c.speed ? `${c.speed} МГц` : 'Не указана' },
                { label: 'RGB', value: c.rgb ? 'Есть' : 'Нет' }
            ]});
        } else if (_type === 'gpus') {
            specs.push({ group: 'Видеокарта', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Чип', value: c.gpu_chip || 'Не указан' },
                { label: 'Память', value: c.memory_size ? `${c.memory_size} ГБ` : 'Не указана' },
                { label: 'Тип памяти', value: c.memory_type || 'Не указан' },
                { label: 'TDP', value: c.tdp ? `${c.tdp} Вт` : 'Не указан' },
                { label: 'Рек. БП', value: c.recommended_psu ? `${c.recommended_psu} Вт` : 'Не указан' }
            ]});
        } else if (_type === 'storages') {
            specs.push({ group: 'Накопитель', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Тип', value: c.type || 'Не указан' },
                { label: 'Интерфейс', value: c.interface || 'Не указан' },
                { label: 'Объем', value: c.capacity ? `${c.capacity} ГБ` : 'Не указан' },
                { label: 'Чтение', value: c.read_speed ? `${c.read_speed} МБ/с` : 'Не указана' },
                { label: 'Запись', value: c.write_speed ? `${c.write_speed} МБ/с` : 'Не указана' }
            ]});
        } else if (_type === 'psus') {
            specs.push({ group: 'Блок питания', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Мощность', value: c.wattage ? `${c.wattage} Вт` : 'Не указана' },
                { label: 'Эффективность', value: c.efficiency || 'Не указана' },
                { label: 'Форм-фактор', value: c.form_factor || 'Не указан' },
                { label: 'Модульность', value: c.modular || 'Не указана' }
            ]});
        } else if (_type === 'cases') {
            specs.push({ group: 'Корпус', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Форм-фактор', value: c.form_factor || 'Не указан' },
                { label: 'Поддержка плат', value: c.supported_motherboards || 'Не указана' },
                { label: 'Макс. длина GPU', value: c.max_gpu_length ? `${c.max_gpu_length} мм` : 'Не указана' },
                { label: 'Макс. высота кулера', value: c.max_cpu_cooler_height ? `${c.max_cpu_cooler_height} мм` : 'Не указана' }
            ]});
        } else if (_type === 'coolers') {
            specs.push({ group: 'Охлаждение', fields: [
                { label: 'Производитель', value: c.manufacturer || 'Не указан' },
                { label: 'Тип', value: c.type || 'Не указан' },
                { label: 'Совместимые сокеты', value: c.socket_compatibility || 'Не указаны' },
                { label: 'Макс. TDP', value: c.tdp ? `${c.tdp} Вт` : 'Не указан' },
                { label: 'Подсветка', value: c.led || 'Нет' }
            ]});
        }

        return specs;
    };

    const _init = () => {
        _id = _get_param('id');
        _type = _get_param('type');

        if (!_id || !_type) {
            document.getElementById('component-content').innerHTML = '<div class="error_wrap"><h3>Ошибка</h3><p>Не указан компонент</p><button class="btn_action btn_primary" onclick="window.location.href=\'index.html\'">Вернуться на главную</button></div>';
            return;
        }

        _load();
    };

    return Object.freeze({ init: _init });
})();

document.addEventListener('DOMContentLoaded', () => { ComponentPage.init(); });