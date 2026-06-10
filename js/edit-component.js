'use strict';

const EditComponent = (() => {
    const API = 'api/admin.php?action=';
    let _id = null;
    let _is_new = false;
    let _cat = null;
    let _data = null;

    const FIELDS = Object.freeze({
        cpus: [
            { name: 'socket', label: 'Сокет', type: 'text' },
            { name: 'cores', label: 'Ядра', type: 'number', min: 1 },
            { name: 'threads', label: 'Потоки', type: 'number', min: 1 },
            { name: 'frequency', label: 'Частота', type: 'text' },
            { name: 'tdp', label: 'TDP (Вт)', type: 'number', min: 0 },
            { name: 'memory_type', label: 'Тип памяти', type: 'select', options: ['DDR4', 'DDR5'] },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['Intel', 'AMD'] }
        ],
        motherboards: [
            { name: 'socket', label: 'Сокет', type: 'text' },
            { name: 'chipset', label: 'Чипсет', type: 'text' },
            { name: 'form_factor', label: 'Форм-фактор', type: 'select', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] },
            { name: 'memory_type', label: 'Тип памяти', type: 'select', options: ['DDR4', 'DDR5'] },
            { name: 'memory_slots', label: 'Слотов памяти', type: 'number', min: 2, max: 4 },
            { name: 'max_memory', label: 'Макс. память (ГБ)', type: 'number', min: 16 },
            { name: 'm2_slots', label: 'M.2 слотов', type: 'number', min: 0 },
            { name: 'sata_ports', label: 'SATA портов', type: 'number', min: 0 },
            { name: 'pcie_version', label: 'PCI-E', type: 'select', options: ['3.0', '4.0', '5.0'] },
            { name: 'wifi', label: 'Wi-Fi', type: 'checkbox' },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['ASUS', 'MSI', 'Gigabyte', 'ASRock'] }
        ],
        rams: [
            { name: 'type', label: 'Тип памяти', type: 'select', options: ['DDR4', 'DDR5'] },
            { name: 'capacity', label: 'Объем (ГБ)', type: 'number', min: 4 },
            { name: 'modules', label: 'Модулей', type: 'number', min: 1, max: 4 },
            { name: 'speed', label: 'Частота (МГц)', type: 'number', min: 2133 },
            { name: 'cas_latency', label: 'CAS', type: 'text' },
            { name: 'rgb', label: 'RGB', type: 'checkbox' },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['Kingston', 'Corsair', 'G.Skill', 'Crucial'] }
        ],
        gpus: [
            { name: 'gpu_chip', label: 'Чип', type: 'text' },
            { name: 'memory_size', label: 'Память (ГБ)', type: 'number', min: 2 },
            { name: 'memory_type', label: 'Тип памяти', type: 'select', options: ['GDDR5', 'GDDR6', 'GDDR6X'] },
            { name: 'tdp', label: 'TDP (Вт)', type: 'number', min: 0 },
            { name: 'recommended_psu', label: 'Рек. БП (Вт)', type: 'number', min: 300 },
            { name: 'length', label: 'Длина (мм)', type: 'number', min: 150 },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['ASUS', 'MSI', 'Gigabyte', 'EVGA', 'Palit'] },
            { name: 'chip_manufacturer', label: 'Чип', type: 'select', options: ['NVIDIA', 'AMD'] }
        ],
        storages: [
            { name: 'type', label: 'Тип', type: 'select', options: ['HDD', 'SSD', 'NVMe'] },
            { name: 'interface', label: 'Интерфейс', type: 'select', options: ['SATA', 'M.2', 'PCI-E'] },
            { name: 'capacity', label: 'Объем (ГБ)', type: 'number', min: 120 },
            { name: 'form_factor', label: 'Форм-фактор', type: 'select', options: ['2.5"', '3.5"', 'M.2 2280'] },
            { name: 'read_speed', label: 'Чтение (МБ/с)', type: 'number', min: 0 },
            { name: 'write_speed', label: 'Запись (МБ/с)', type: 'number', min: 0 },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['Samsung', 'WD', 'Kingston', 'Crucial', 'Seagate'] }
        ],
        psus: [
            { name: 'wattage', label: 'Мощность (Вт)', type: 'number', min: 300 },
            { name: 'efficiency', label: 'Сертификат', type: 'select', options: ['80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum'] },
            { name: 'form_factor', label: 'Форм-фактор', type: 'select', options: ['ATX', 'SFX'] },
            { name: 'modular', label: 'Модульность', type: 'select', options: ['No', 'Semi', 'Full'] },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['Seasonic', 'Corsair', 'be quiet!', 'Cooler Master', 'DeepCool'] }
        ],
        cases: [
            { name: 'form_factor', label: 'Тип', type: 'select', options: ['Full Tower', 'Mid Tower', 'Mini Tower', 'SFF'] },
            { name: 'supported_motherboards', label: 'Поддержка плат', type: 'text' },
            { name: 'color', label: 'Цвет', type: 'text' },
            { name: 'window', label: 'Окно', type: 'checkbox' },
            { name: 'max_gpu_length', label: 'Макс. GPU (мм)', type: 'number', min: 200 },
            { name: 'max_cpu_cooler_height', label: 'Макс. кулер (мм)', type: 'number', min: 100 },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['NZXT', 'Fractal Design', 'DeepCool', 'Lian Li', 'Cooler Master'] }
        ],
        coolers: [
            { name: 'type', label: 'Тип', type: 'select', options: ['Air', 'AIO'] },
            { name: 'socket_compatibility', label: 'Сокеты', type: 'text' },
            { name: 'tdp', label: 'TDP (Вт)', type: 'number', min: 0 },
            { name: 'height', label: 'Высота (мм)', type: 'number', min: 50 },
            { name: 'led', label: 'Подсветка', type: 'select', options: ['None', 'RGB', 'ARGB'] },
            { name: 'manufacturer', label: 'Производитель', type: 'select', options: ['Noctua', 'be quiet!', 'Corsair', 'Arctic', 'DeepCool'] }
        ]
    });

    const LEFT_COUNT = Object.freeze({ cpus: 3, motherboards: 4, rams: 3, gpus: 4, storages: 3, psus: 3, cases: 4, coolers: 4 });

    const TYPE_NAMES = Object.freeze({
        cpus: 'Процессор', motherboards: 'Материнская плата', rams: 'Оперативная память',
        gpus: 'Видеокарта', storages: 'Накопитель', psus: 'Блок питания', cases: 'Корпус', coolers: 'Охлаждение'
    });

    const _get_param = (name) => new URLSearchParams(window.location.search).get(name);

    const _show_loader = (text = 'Загрузка...') => {
        const loader = document.getElementById('global-loader');
        const span = loader?.querySelector('.loader-text');
        if (span) span.textContent = text;
        loader?.classList.remove('hidden');
    };

    const _hide_loader = () => {
        document.getElementById('global-loader')?.classList.add('hidden');
    };

    const _show_message = (msg, type = 'success') => {
        alert(type === 'error' ? `Ошибка: ${msg}` : msg);
    };

    const _esc = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const _log = async (type, desc) => {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            await fetch(`${API}log_activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, description: desc, user_id: user.id || 0 })
            });
        } catch (e) {}
    };

    const _load = async () => {
        _show_loader();
        try {
            const res = await fetch(`${API}get_component&id=${_id}`);
            const text = await res.text();
            
            if (text.trim().startsWith('<')) {
                throw new Error('Сервер вернул HTML вместо JSON');
            }
            
            const data = JSON.parse(text);
            
            if (data.success && data.component) {
                _data = data.component;
                if (!_cat) {
                    _cat = _data.reference_table || _data.category_code || _data.category || '';
                }
                _update_header();
                _set_badge();
                _fill_form();
                _add_spec_fields();
            } else {
                throw new Error(data.message || 'Компонент не найден');
            }
        } catch (e) {
            _show_message(e.message, 'error');
            setTimeout(() => { window.location.href = 'admin.html#components'; }, 2000);
        }
        _hide_loader();
    };

    const _prepare_new = () => {
        document.getElementById('component-name-display').textContent = 'Новый компонент';
        document.getElementById('component-id-display').textContent = '';
        const cat_input = document.getElementById('category-slug-input');
        if (cat_input) cat_input.value = _cat || '';
        
        const delete_btn = document.getElementById('delete-component-btn');
        if (delete_btn) delete_btn.style.display = 'none';
        
        _data = { category_code: _cat };
        _set_badge();
        _add_spec_fields();
    };

    const _set_badge = () => {
        const badge = document.getElementById('category-badge');
        if (badge) badge.textContent = TYPE_NAMES[_cat] || _cat;
    };

    const _update_header = () => {
        const name_el = document.getElementById('component-name-display');
        const id_el = document.getElementById('component-id-display');
        const cat_input = document.getElementById('category-slug-input');
        const ref_id = document.getElementById('reference-id-input');
        const ref_table = document.getElementById('reference-table-input');
        const comp_id = document.getElementById('component-id-input');
        
        if (name_el) name_el.textContent = _data.name || 'Без названия';
        if (id_el) id_el.textContent = `ID: ${_data.id}`;
        if (cat_input) cat_input.value = _data.category_code || '';
        if (ref_id) ref_id.value = _data.reference_id || '';
        if (ref_table) ref_table.value = _data.reference_table || '';
        if (comp_id) comp_id.value = _data.id || '';
    };

    const _fill_form = () => {
        const name = document.getElementById('name');
        const desc = document.getElementById('description');
        const price = document.getElementById('price');
        const image = document.getElementById('image');
        const is_active = document.getElementById('is_active');
        const preview = document.getElementById('preview-img');
        
        if (name) name.value = _data.name || '';
        if (desc) desc.value = _data.description || '';
        if (price) price.value = _data.price || 0;
        if (image) image.value = _data.image || '';
        if (is_active) is_active.value = _data.is_active ? '1' : '0';
        
        if (preview && _data.image) {
            if (_data.image.startsWith('http') || _data.image.startsWith('source/')) {
                preview.src = _data.image;
            } else {
                preview.src = `source/${_data.category_code || 'components'}/${_data.image}`;
            }
        }
    };

    const _add_spec_fields = () => {
        const cat = _data.category_code || _cat;
        if (!cat) return;
        
        const all = FIELDS[cat] || [];
        const left_count = LEFT_COUNT[cat] || 3;
        const left = all.slice(0, left_count);
        const right = all.slice(left_count);
        
        const photo_column = document.querySelector('.photo-column');
        const dynamic_fields = document.getElementById('dynamic-fields');
        
        if (photo_column && left.length > 0) {
            const existing = photo_column.querySelector('.spec-fields-left');
            if (existing) existing.remove();
            
            let html = '<div class="spec-fields-left">';
            left.forEach(f => {
                html += _make_field(f, false);
            });
            html += '</div>';
            
            const image_group = photo_column.querySelector('.form-group');
            if (image_group) {
                image_group.insertAdjacentHTML('afterend', html);
            } else {
                photo_column.insertAdjacentHTML('beforeend', html);
            }
            
            left.forEach(f => {
                const input = photo_column.querySelector(`[name="${f.name}"]`);
                if (input && _data) {
                    if (input.type === 'checkbox') {
                        input.checked = !!_data[f.name];
                    } else if (_data[f.name] !== undefined && _data[f.name] !== null) {
                        input.value = _data[f.name];
                    }
                }
            });
        }
        
        if (dynamic_fields && right.length > 0) {
            let html = '';
            for (let i = 0; i < right.length; i += 2) {
                html += '<div class="fields-row">';
                html += _make_field(right[i], true);
                html += right[i + 1] ? _make_field(right[i + 1], true) : '<div></div>';
                html += '</div>';
            }
            dynamic_fields.innerHTML = html;
            
            right.forEach(f => {
                const input = dynamic_fields.querySelector(`[name="${f.name}"]`);
                if (input && _data) {
                    if (input.type === 'checkbox') {
                        input.checked = !!_data[f.name];
                    } else if (_data[f.name] !== undefined && _data[f.name] !== null) {
                        input.value = _data[f.name];
                    }
                }
            });
        }
        
        if (dynamic_fields && right.length === 0) {
            dynamic_fields.innerHTML = '';
        }
    };

    const _make_field = (field, half = false) => {
        const val = _data ? (_data[field.name] || '') : '';
        const cls = half ? 'form-group half' : 'form-group';

        if (field.type === 'select') {
            let opts = '<option value="">Выберите...</option>';
            (field.options || []).forEach(o => {
                opts += `<option value="${o}" ${val == o ? 'selected' : ''}>${o}</option>`;
            });
            return `<div class="${cls}"><label for="${field.name}">${field.label}</label><select id="${field.name}" name="${field.name}" class="form-control">${opts}</select></div>`;
        }
        
        if (field.type === 'checkbox') {
            const checked = val ? 'checked' : '';
            return `<div class="${cls}"><label class="checkbox-label"><input type="checkbox" name="${field.name}" ${checked}>${field.label}</label></div>`;
        }
        
        if (field.type === 'number') {
            return `<div class="${cls}"><label for="${field.name}">${field.label}</label><input type="number" id="${field.name}" name="${field.name}" class="form-control" value="${val}" min="${field.min || 0}" max="${field.max || ''}" step="1" placeholder="${field.placeholder || ''}"></div>`;
        }
        
        return `<div class="${cls}"><label for="${field.name}">${field.label}</label><input type="text" id="${field.name}" name="${field.name}" class="form-control" value="${_esc(val)}" placeholder="${field.placeholder || ''}"></div>`;
    };

    const _bind = () => {
        const form = document.getElementById('edit-component-form');
        const delete_btn = document.getElementById('delete-component-btn');
        const confirm_btn = document.getElementById('confirm-delete-btn');
        const price_input = document.getElementById('price');
        const image_input = document.getElementById('image');
        const preview = document.getElementById('preview-img');

        form?.addEventListener('submit', e => { e.preventDefault(); _save(); });
        delete_btn?.addEventListener('click', () => { document.getElementById('delete-modal')?.classList.remove('hidden'); });
        confirm_btn?.addEventListener('click', _delete);

        if (price_input) {
            const container = price_input.closest('.price-wrapper');
            if (container) {
                const btns = container.querySelectorAll('.counter-btn');
                if (btns.length >= 2) {
                    btns[0].addEventListener('click', () => { 
                        price_input.value = Math.max(0, (parseInt(price_input.value) || 0) - 1000); 
                    });
                    btns[1].addEventListener('click', () => { 
                        price_input.value = (parseInt(price_input.value) || 0) + 1000; 
                    });
                }
            }
        }

        image_input?.addEventListener('input', () => {
            const url = image_input.value.trim();
            if (url && preview) {
                preview.src = (url.startsWith('http') || url.startsWith('source/')) ? 
                    url : `source/${_data?.category_code || 'components'}/${url}`;
            } else if (preview) {
                preview.src = 'source/icons/component_placeholder.png';
            }
        });

        document.getElementById('close-delete-modal')?.addEventListener('click', () => {
            document.getElementById('delete-modal')?.classList.add('hidden');
        });
    };

    const _save = async () => {
        const form = document.getElementById('edit-component-form');
        const fd = new FormData(form);

        if (!_validate()) {
            return;
        }
        
        const data = {
            name: fd.get('name'),
            description: fd.get('description') || '',
            price: parseFloat(fd.get('price')) || 0,
            image: fd.get('image') || '',
            is_active: fd.get('is_active') === '1' ? 1 : 0
        };

        if (_is_new) {
            data.category_code = _cat;
        } else {
            data.id = parseInt(_data.id);
        }

        const cat = _is_new ? _cat : _data.category_code;
        const fields = FIELDS[cat] || [];

        fields.forEach(f => {
            const val = fd.get(f.name);
            if (f.type === 'checkbox') {
                data[f.name] = val === 'on' ? 1 : 0;
            } else if (f.type === 'number') {
                data[f.name] = val ? parseInt(val) : null;
            } else {
                data[f.name] = val || '';
            }
        });

        _show_loader('Сохранение...');
        
        try {
            const url = _is_new ? `${API}add_component` : `${API}update_component`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (result.success) {
                const action = _is_new ? 'component_add' : 'component_edit';
                await _log(action, `${_is_new ? 'Добавлен' : 'Изменён'} компонент: ${data.name}`);
                _show_message(_is_new ? 'Компонент создан' : 'Компонент сохранён');
                setTimeout(() => { window.location.href = 'admin.html#components'; }, 1000);
            } else {
                _show_message(result.message || 'Ошибка сохранения', 'error');
            }
        } catch (e) {
            _show_message('Ошибка сохранения', 'error');
        }
        
        _hide_loader();
    };

    const _validate = () => {
        const name = document.getElementById('name')?.value.trim();
        const price = document.getElementById('price')?.value;
        
        if (!name || name.length < 2) {
            _show_message('Название компонента должно содержать минимум 2 символа', 'error');
            return false;
        }
        
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            _show_message('Цена должна быть числом больше или равным 0', 'error');
            return false;
        }
        
        const cat = _is_new ? _cat : _data?.category_code;
        if (!cat) {
            _show_message('Не выбрана категория компонента', 'error');
            return false;
        }
        
        const allowedCategories = ['cpus', 'motherboards', 'rams', 'gpus', 'storages', 'psus', 'cases', 'coolers'];
        if (!allowedCategories.includes(cat)) {
            _show_message('Неверная категория компонента', 'error');
            return false;
        }
        
        return true;
    };

    const _delete = async () => {
        _show_loader('Удаление...');
        
        try {
            const res = await fetch(`${API}delete_component`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: _data.id })
            });
            const result = await res.json();
            
            if (result.success) {
                await _log('component_delete', `Удалён компонент ID: ${_data.id}`);
                _show_message('Компонент удалён');
                setTimeout(() => { window.location.href = 'admin.html#components'; }, 1000);
            } else {
                _show_message(result.message || 'Ошибка удаления', 'error');
            }
        } catch (e) {
            _show_message('Ошибка удаления', 'error');
        }
        
        _hide_loader();
    };

    const _init = () => {
        _id = _get_param('id');
        _is_new = _get_param('new') === '1';
        _cat = _get_param('cat') || _get_param('category');

        if (!_id && !_is_new) {
            _show_message('ID компонента не указан', 'error');
            setTimeout(() => { window.location.href = 'admin.html#components'; }, 2000);
            return;
        }

        _bind();

        if (_is_new) {
            _prepare_new();
        } else {
            _load();
        }
    };

    return Object.freeze({ init: _init });
})();

document.addEventListener('DOMContentLoaded', () => { EditComponent.init(); });