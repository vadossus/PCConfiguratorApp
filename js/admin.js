'use strict';

const AdminPanel = (() => {
    const API = 'api/admin.php?action=';
    const _state = { section: 'dashboard', activity_page: 1, activity_limit: 15, has_more: true, search_timer: null };
    const _list = { components: [], users: [], builds: [], activities: [] };
    const _filters = { category: 'all', search: '', sort: 'created_at', order: 'desc', status: 'all', page: 1, limit: 10 };

    // название типов
    const TYPE_NAMES = Object.freeze({
        cpus: 'Процессоры', motherboards: 'Материнские платы', rams: 'Оперативная память',
        gpus: 'Видеокарты', storages: 'Накопители', psus: 'Блоки питания',
        cases: 'Корпуса', coolers: 'Охлаждение'
    });

    // логирование под запись
    const ACTIVITY_NAMES = Object.freeze({
        user_register: 'Регистрация пользователя', user_delete: 'Удаление пользователя',
        user_role_change: 'Изменение роли пользователя', build_save: 'Сохранение сборки',
        build_delete: 'Удаление сборки', component_add: 'Добавление компонента',
        component_edit: 'Редактирование компонента', component_delete: 'Удаление компонента',
        component_toggle: 'Изменение статуса компонента'
    });

    const ICONS = Object.freeze({
        cpus: 'cpu_icon.png', motherboards: 'motherboard_icon.png', rams: 'ram_icon.png',
        gpus: 'gpu_icon.png', storages: 'hdd_icon.png', psus: 'power_supply_icon.png',
        cases: 'pc_case_icon.png', coolers: 'cooler_cpu_icon.png'
    });

    // TODO: XSS - уязвимость устранить, добавление экранирования
    const _esc = (text) => { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; };
    const _format_price = (p) => new Intl.NumberFormat('ru-RU').format(p || 0);

    // лоадер загрузки
    const _show_loader = (t = 'Загрузка...') => {
        const l = document.getElementById('global-loader');
        const s = l?.querySelector('.loader-text');
        if (s) s.textContent = t;
        l?.classList.remove('hidden');
    };

    // сокрытие лоудера
    const _hide_loader = () => document.getElementById('global-loader')?.classList.add('hidden');
    const _msg = (m, t = 'success') => alert(t === 'error' ? `Ошибка: ${m}` : m);

    // получение текущего пользователя
    const _check_access = () => {
        const s = localStorage.getItem('currentUser');
        if (!s) { window.location.href = 'index.html'; return false; }
        try { 
            const user = JSON.parse(s);
            if (user.role !== 'admin' && user.role !== 'sadmin') { 
                window.location.href = 'index.html'; 
                return false; 
            } 
            return true; 
        }
        catch (e) { 
            window.location.href = 'index.html'; 
            return false; 
        }
    };

    // навигация
    const _prepare_nav = () => {
        document.querySelectorAll('.admin-nav-link').forEach(l => {
            l.addEventListener('click', e => { e.preventDefault(); _switch_section(l.dataset.section); });
        });
    };

    // смена секции
    const _switch_section = (name) => {
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
        const sec = document.getElementById(`${name}-section`);
        const link = document.querySelector(`[data-section="${name}"]`);
        if (sec) { sec.classList.add('active'); _state.section = name; _load_section(name); }
        if (link) link.classList.add('active');
    };

    const _show_section = (name) => { const el = document.getElementById(`${name}-section`); if (el) _switch_section(name); };

    const _load_section = (name) => {
        const m = { dashboard: _load_dashboard, components: _load_components, users: _load_users, builds: _load_builds };
        if (m[name]) m[name]();
    };

    // категории 
    const _fill_cat_select = () => {
        const s = document.getElementById('component-category');
        if (!s) return;
        s.innerHTML = '<option value="">Выберите категорию</option>';
        for (const [k, v] of Object.entries(TYPE_NAMES)) { const o = document.createElement('option'); o.value = k; o.textContent = v; s.appendChild(o); }
    };

    const _bind_events = () => {
        document.getElementById('refresh-dashboard')?.addEventListener('click', _load_dashboard);
        document.getElementById('refresh-components')?.addEventListener('click', _load_components);
        document.getElementById('refresh-users')?.addEventListener('click', _load_users);
        document.getElementById('refresh-builds')?.addEventListener('click', _load_builds);
        document.getElementById('add-component')?.addEventListener('click', e => { e.stopPropagation(); _show_add_menu(e.target); });
        _bind_filters();
        document.getElementById('logout-link')?.addEventListener('click', e => { e.preventDefault(); localStorage.removeItem('currentUser'); window.location.href = 'index.html'; });
    };

    // биндинг фильтров сортировки поиска по элементам
    const _bind_filters = () => {
        const catFilter = document.getElementById('component-type-filter');
        const searchInput = document.getElementById('component-search');
        const sortFilter = document.getElementById('component-sort');
        const statusFilter = document.getElementById('component-status');

        if (catFilter) _filters.category = catFilter.value || 'all';
        if (searchInput) _filters.search = searchInput.value || '';
        if (statusFilter) _filters.status = statusFilter.value || 'all';
        if (sortFilter) {
            const val = sortFilter.value || 'created_at-desc';
            const [f, o] = val.split('-');
            _filters.sort = f || 'created_at';
            _filters.order = o || 'desc';
        }

        catFilter?.addEventListener('change', e => { 
            _filters.category = e.target.value; 
            _filters.page = 1; 
            _load_components(); 
        });

        searchInput?.addEventListener('input', e => { 
            _filters.search = e.target.value; 
            clearTimeout(_state.search_timer); 
            _state.search_timer = setTimeout(() => { 
                _filters.page = 1; 
                _load_components(); 
            }, 500); 
        });

        sortFilter?.addEventListener('change', e => { 
            const val = e.target.value || 'created_at-desc';
            const [f, o] = val.split('-'); 
            _filters.sort = f || 'created_at'; 
            _filters.order = o || 'desc'; 
            _filters.page = 1; 
            _load_components(); 
        });

        statusFilter?.addEventListener('change', e => { 
            _filters.status = e.target.value; 
            _filters.page = 1; 
            _load_components(); 
        });
    };

    const _log_action = async (type, desc = '') => {
        try {
            const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
            await fetch(`${API}log_activity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, readable_type: ACTIVITY_NAMES[type] || type, description: desc, user_id: u.id || 0 }) });
            _refresh_activities();
        } catch (e) {}
    };

    const _fetch_count = async (t) => { try { const r = await fetch(`${API}get_count&table=${t}`); const d = await r.json(); return d.count || 0; } catch (e) { return 0; } };

    const _load_dashboard = async () => {
        _show_loader();
        try {
            const [u, c, b] = await Promise.all([_fetch_count('users'), _fetch_count('components'), _fetch_count('user_builds')]);
            _update_stats({ users: u, components: c, builds: b });
            await _load_activities();
        } catch (e) { _msg('Ошибка загрузки', 'error'); }
        _hide_loader();
    };

    const _update_stats = (s) => {
        const m = { 'stat-users': s.users, 'stat-components': s.components, 'stat-builds': s.builds, 'total-users': s.users, 'total-builds': s.builds };
        for (const [id, v] of Object.entries(m)) { const el = document.getElementById(id); if (el) el.textContent = v; }
    };

    const _load_activities = async (page = 1, refresh = false) => {
        try {
            if (refresh) { _state.activity_page = 1; _state.has_more = true; _list.activities = []; }
            const off = (page - 1) * _state.activity_limit;
            const r = await fetch(`${API}get_activities&limit=${_state.activity_limit}&offset=${off}`);
            const d = await r.json();
            if (d.success) {
                const items = d.activities || [];
                _list.activities = page === 1 ? items : [..._list.activities, ...items];
                _state.has_more = items.length === _state.activity_limit;
                _state.activity_page = page;
                _render_activities();
            } else { _show_empty_activity(); }
        } catch (e) { _show_empty_activity(); }
    };

    const _refresh_activities = () => _load_activities(1, true);
    const _load_more_activities = () => _load_activities(_state.activity_page + 1);

    // отрисовка активностей
    const _render_activities = () => {
        const c = document.getElementById('activity-list');
        if (!c) return;
        if (!_list.activities.length) { c.innerHTML = _empty_activity_html(); return; }
        let h = _list.activities.map(a => _activity_row(a)).join('');
        if (_state.has_more) h += '<div class="load-more-activities"><button class="btn-load-more" onclick="AdminPanel.load_more_activities()">Показать еще</button></div>';
        c.innerHTML = h;
    };

    const _activity_row = (a) => {
        const t = a.timestamp_formatted || _format_time(a.created_at);
        const u = a.user_display || (a.username || 'Система');
        let d = a.description_short || '';
        if (!d && a.description) { const p = a.description.split(': '); d = p.length > 1 ? p.slice(1).join(': ') : ''; }
        return `<div class="activity-item"><div class="activity-content"><div class="activity-header"><span class="activity-user">${u}</span><span class="activity-time">${t}</span></div><p class="activity-description"><strong>${a.type_name || a.action_type || 'Действие'}</strong>${d ? `: ${d}` : ''}</p></div></div>`;
    };

    const _empty_activity_html = () => '<div class="no-activity"><div class="no-activity-content"><p>История активности пуста</p><small>Совершите действия в админ-панели</small></div></div>';
    const _show_empty_activity = () => { const c = document.getElementById('activity-list'); if (c) c.innerHTML = '<div class="no-activity"><div class="no-activity-content"><p>Не удалось загрузить</p><small>Проверьте подключение</small></div></div>'; };

    const _format_time = (s) => {
        if (!s) return 'Недавно';
        const n = new Date(), t = new Date(s), m = Math.floor((n - t) / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
        if (m < 1) return 'только что'; if (m < 60) return `${m} мин. назад`; if (h < 24) return `${h} ч. назад`; if (d < 7) return `${d} дн. назад`;
        return t.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    let _lastRequestId = 0; 

    const _load_components = async () => {
        _lastRequestId++; 
        const currentRequestId = _lastRequestId;
        
        _show_loader('Загрузка компонентов...');
        
        try {   
            const p = new URLSearchParams({ 
                page: _filters.page, 
                limit: _filters.limit, 
                sort_by: _filters.sort, 
                sort_order: _filters.order 
            });

            if (_filters.category && _filters.category !== 'all') {
                p.append('category', _filters.category);
            }

            if (_filters.status && _filters.status !== 'all') {
                const isActive = (_filters.status === 'active' || _filters.status === '1') ? '1' : '0';
                p.append('is_active', isActive);
            }

            if (_filters.search && _filters.search.trim()) {
                p.append('search', _filters.search.trim());
            }
            
            const r = await fetch(`${API}get_component&${p.toString()}`);
            const d = await r.json();
            
            if (currentRequestId !== _lastRequestId) return;

            if (d.success && d.components && d.components.length > 0) {
                const full_components = await Promise.all(
                    d.components.map(async (c) => {
                        try {
                            const res = await fetch(`${API}get_component&id=${c.id}`);
                            const data = await res.json();
                            return (data.success && data.component) ? { ...c, ...data.component } : c;
                        } catch (e) {
                            return c;
                        }
                    })
                );
                
                if (currentRequestId !== _lastRequestId) return;
                
                _list.components = full_components;
            } else {
                _list.components = [];
            }
            
            _render_components_table(d.pagination?.total || 0);
            
        } catch (e) { 
            if (currentRequestId === _lastRequestId) {
                _render_components_table(0); 
            }
        }
        
        if (currentRequestId === _lastRequestId) {
            _hide_loader();
        }
    };

    const _render_components_table = (total) => {
        const tbody = document.getElementById('components-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!_list.components.length) { 
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Компоненты не найдены</td></tr>'; 
            _render_pagination(0); 
            return; 
        }
        
        _list.components.forEach(c => {
            const category_code = c.reference_table || c.category_code || c.category || '';
            const category_name = TYPE_NAMES[category_code] || category_code || 'Неизвестно';
            
            let image_path = 'source/icons/component_placeholder.png';
            if (c.image) {
                if (c.image.startsWith('http://') || c.image.startsWith('https://')) {
                    image_path = c.image;
                } else if (c.image.startsWith('source/')) {
                    image_path = c.image;
                } else {
                    image_path = `source/${category_code}/${c.image}`;
                }
            }
            
            let specs = [];
            if (c.socket) specs.push(`Сокет: ${c.socket}`);
            if (c.memory_type) specs.push(c.memory_type);
            if (c.type) specs.push(c.type);
            if (c.cores) specs.push(`${c.cores} ядер`);
            if (c.memory_size) specs.push(`${c.memory_size} ГБ`);
            if (c.wattage) specs.push(`${c.wattage}W`);
            if (c.form_factor) specs.push(c.form_factor);
            if (c.chipset) specs.push(c.chipset);
            if (c.capacity) specs.push(`${c.capacity} ГБ`);
            if (c.tdp) specs.push(`TDP: ${c.tdp}W`);
            if (c.speed) specs.push(`${c.speed} МГц`);
            if (c.frequency) specs.push(c.frequency);
            const specs_html = specs.length > 0 ? specs.slice(0, 2).join(' | ') : '—';
            
            const name = c.name || 'Без названия';
            const price = c.price || 0;
            const is_active = c.is_active == 1;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${c.id}</td>
                <td>
                    <div class="component-info">
                        <img src="${image_path}" class="component-thumb" onerror="this.src='source/icons/component_placeholder.png'">
                        <div>
                            <strong>${_esc(name)}</strong>
                            <div class="text-muted small">${_esc(c.description || '').substring(0, 50)}</div>
                        </div>
                    </div>
                </td>
                <td>${category_name}</td>
                <td><div class="component-specs">${specs_html}</div></td>
                <td class="text-right">${_format_price(price)} Р</td>
                <td>
                    <span class="status-badge ${is_active ? 'active' : 'inactive'}">
                        ${is_active ? 'Активен' : 'Скрыт'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="AdminPanel.edit_component(${c.id}, '${category_code}')">Редактировать</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="AdminPanel.delete_component(${c.id})">Удалить</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
        _render_pagination(total);
    };

    const _render_pagination = (total) => {
        const c = document.getElementById('components-pagination');
        if (!c) return;
        const pages = Math.ceil(total / _filters.limit);
        if (pages <= 1) { c.innerHTML = ''; return; }
        let h = '<div class="pagination">';
        h += _page_btn(_filters.page - 1, '«', _filters.page === 1);
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= _filters.page - 2 && i <= _filters.page + 2)) h += _page_btn(i, i, false, i === _filters.page);
            else if (i === _filters.page - 3 || i === _filters.page + 3) h += '<span class="page-dots">...</span>';
        }
        h += _page_btn(_filters.page + 1, '»', _filters.page === pages);
        h += '</div>';
        c.innerHTML = h;
    };

    const _page_btn = (p, t, dis, act = false) => `<button class="page-btn${dis ? ' disabled' : ''}${act ? ' active' : ''}" onclick="AdminPanel.go_to_page(${p})" ${dis ? 'disabled' : ''}>${t}</button>`;
    const _go_to_page = (p) => { _filters.page = p; _load_components(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const _edit_component = async (id, category) => {
        if (category) {
            window.location.href = `edit-component.html?id=${id}&category=${category}`;
            return;
        }
        
        try {
            const r = await fetch(`${API}get_component&id=${id}`);
            const d = await r.json();
            if (d.success && d.component) {
                const cat = d.component.reference_table || d.component.category_code || d.component.category || '';
                window.location.href = `edit-component.html?id=${id}&category=${cat}`;
            } else {
                _msg('Не удалось загрузить компонент', 'error');
            }
        } catch (e) { 
            _msg('Ошибка загрузки', 'error'); 
        }
    };

    let _price_cache = new Map();

    const _fetch_actual_price = async (component_name) => {
        if (!component_name) return null;
        
        const cache_key = component_name.toLowerCase().trim();
        if (_price_cache.has(cache_key)) {
            return _price_cache.get(cache_key);
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
                    _price_cache.set(cache_key, result);
                    return result;
                }
            }
            _price_cache.set(cache_key, null);
            return null;
        } catch (error) {
            _price_cache.set(cache_key, null);
            return null;
        }
    };

    const _fetch_all_prices_for_build = async (build) => {
        if (!build || !build.components) return { prices: {}, total_actual_price: null };
        
        let comps = build.components;
        if (typeof comps === 'string') {
            try { comps = JSON.parse(comps); } catch (e) { comps = {}; }
        }
        if (!Object.keys(comps).length && build.compatibility_data) {
            try { comps = JSON.parse(build.compatibility_data); } catch (e) { comps = {}; }
        }
        
        const price_results = {};
        let total_actual_price = 0;
        
        const component_list = [];
        
        if (comps.cpus && comps.cpus.name) component_list.push({ type: 'cpus', name: comps.cpus.name });
        if (comps.motherboards && comps.motherboards.name) component_list.push({ type: 'motherboards', name: comps.motherboards.name });
        if (comps.gpus && comps.gpus.name) component_list.push({ type: 'gpus', name: comps.gpus.name });
        if (comps.rams && comps.rams.name) component_list.push({ type: 'rams', name: comps.rams.name });
        if (comps.psus && comps.psus.name) component_list.push({ type: 'psus', name: comps.psus.name });
        if (comps.cases && comps.cases.name) component_list.push({ type: 'cases', name: comps.cases.name });
        if (comps.coolers && comps.coolers.name) component_list.push({ type: 'coolers', name: comps.coolers.name });
        
        if (comps.storages && Array.isArray(comps.storages)) {
            comps.storages.forEach((storage, idx) => {
                if (storage && storage.name) {
                    component_list.push({ type: `storage_${idx}`, name: storage.name });
                }
            });
        }
        
        const price_promises = component_list.map(async (comp) => {
            const price_data = await _fetch_actual_price(comp.name);
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

    const _delete_component = async (id) => {
        if (!confirm('Удалить компонент?')) return;
        _show_loader('Удаление...');
        try {
            const r = await fetch(`${API}delete_component`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const d = await r.json();
            if (d.success) {
                _msg('Компонент удалён');
                await _log_action('component_delete', `Удалён компонент ID: ${id}`);
                if (_list.components.length <= 1 && _filters.page > 1) _filters.page--;
                await _load_components();
            } else _msg(d.message || 'Ошибка', 'error');
        } catch (e) { _msg('Ошибка', 'error'); }
        _hide_loader();
    };

    const _load_users = async () => {
        _show_loader('Загрузка пользователей...');
        try { const r = await fetch(`${API}get_users`); const d = await r.json(); _list.users = d.users || []; _render_users_table(); }
        catch (e) { _msg('Ошибка загрузки', 'error'); }
        _hide_loader();
    };

    const _render_users_table = () => {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!_list.users.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Нет пользователей</td></tr>';
            return;
        }
        
        const current_user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const is_sadmin = (current_user.role === 'sadmin');
        
        _list.users.forEach(u => {
            const tr = document.createElement('tr');
            
            const is_self = (u.id == current_user.id);
            const is_target_sadmin = (u.role === 'sadmin'); 
            
            const can_change_role = is_sadmin && !is_self && !is_target_sadmin;
            const can_delete = is_sadmin && !is_self && !is_target_sadmin;
            
            let role_html = '';
            if (can_change_role) {
                role_html = `<select class="role-select" data-user-id="${u.id}" data-current-role="${u.role}">
                                <option value="user" ${u.role === 'user' ? 'selected' : ''}>Пользователь</option>
                                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Администратор</option>
                                <option value="sadmin" ${u.role === 'sadmin' ? 'selected' : ''}>Супер-админ</option>
                            </select>`;
            } else {
                let roleName = u.role === 'sadmin' ? 'Супер-админ' : (u.role === 'admin' ? 'Администратор' : 'Пользователь');
                role_html = `<span class="role-badge ${u.role}">${roleName}</span>`;
            }
            
            let delete_html = can_delete ? `<button class="btn-action btn-delete" data-user-id="${u.id}">Удалить</button>` : '<span class="text-muted">—</span>';
            
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${_esc(u.username)}</td>
                <td>${_esc(u.email)}</td>
                <td>${role_html}</td>
                <td>${new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                <td>${u.builds_count || 0}</td>
                <td><span class="badge badge-success">Активен</span></td>
                <td>${delete_html}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.querySelectorAll('.role-select').forEach(select => {
            select.addEventListener('change', async () => {
                const userId = select.dataset.userId;
                const newRole = select.value;
                
                if (!confirm('Изменить роль пользователя?')) {
                    _load_users();
                    return;
                }
                
                try {
                    const res = await fetch('api/admin.php?action=update_user_role', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, role: newRole })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert('Роль изменена');
                        await _log_action('user_role_change', `ID: ${userId}, роль: ${newRole}`);
                        _load_users();
                    } else {
                        alert(data.message || 'Ошибка');
                        _load_users();
                    }
                } catch (err) {
                    alert('Ошибка соединения');
                    _load_users();
                }
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.userId;
                const user = _list.users.find(u => u.id == userId);
                if (!user) return;
                
                if (!confirm(`Удалить пользователя ${user.username}?`)) return;
                
                try {
                    const res = await fetch('api/admin.php?action=delete_user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: userId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert('Пользователь удалён');
                        await _log_action('user_delete', `ID: ${userId}`);
                        _load_users();
                    } else {
                        alert(data.message || 'Ошибка');
                    }
                } catch (err) {
                    alert('Ошибка соединения');
                }
            });
        });
    };

    const _change_role = async (uid, role) => {
        try {
            const r = await fetch(`${API}update_user_role`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid, role }) });
            const d = await r.json();
            if (d.success) {
                _msg(`Роль изменена на "${role === 'admin' ? 'Администратор' : 'Пользователь'}"`);
                await _log_action('user_role_change', `ID: ${uid}, роль: ${role}`);
                const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
                if (cu.id === uid) { cu.role = role; localStorage.setItem('currentUser', JSON.stringify(cu)); }
                _load_users();
            } else _msg(d.message || 'Ошибка', 'error');
        } catch (e) { _msg('Ошибка', 'error'); }
    };

    const _remove_user = async (id) => {
        if (!confirm('Удалить пользователя?')) return;
        try {
            const r = await fetch(`${API}delete_user`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const d = await r.json();
            if (d.success) { _msg('Пользователь удалён'); await _log_action('user_delete', `ID: ${id}`); _load_users(); }
            else _msg(d.message || 'Ошибка', 'error');
        } catch (e) { _msg('Ошибка', 'error'); }
    };

    const _load_builds = async () => {
        const c = document.getElementById('builds-grid');
        if (!c) return;
        
        _show_loader('Загрузка сборок...');
        
        try {
            const r = await fetch('api/builds.php?action=get_builds');
            const d = await r.json();
            
            if (!d.success || !d.builds?.length) { 
                c.innerHTML = '<div class="no-data">Сборок пока нет</div>'; 
                _hide_loader();
                return; 
            }
            
            c.innerHTML = '<div class="builds-list-container"><div class="builds-horizontal-list" id="builds-horizontal-list"></div></div>';
            const list = document.getElementById('builds-horizontal-list');
            
            const hasInternet = navigator.onLine;
            
            for (const b of d.builds) {
                let comps = b.components || {};
                if (typeof comps === 'string') {
                    try { comps = JSON.parse(comps); } catch (e) { comps = {}; }
                }
                if (!Object.keys(comps).length && b.compatibility_data) {
                    try { comps = JSON.parse(b.compatibility_data); } catch (e) { comps = {}; }
                }
                
                const specs = [];
                if (comps.cpus?.name) specs.push(comps.cpus.name);
                if (comps.gpus?.name) specs.push(comps.gpus.name);
                if (comps.rams?.name) specs.push(comps.rams.name);
                if (comps.motherboards?.name) specs.push(comps.motherboards.name);
                
                const base_price = Number(b.total_price || 0);
                const price = base_price.toLocaleString('ru-RU');
                const icons = _build_icons(comps);
                
                let actual_price_html = '';
                
                if (hasInternet) {
                    actual_price_html = `
                        <div class="actual-price-placeholder" data-build-id="${b.id}">
                            <span class="actual-price-loading">Загрузка актуальной цены...</span>
                        </div>`;
                } else {
                    actual_price_html = `<div class="text-muted" style="font-size:13px;margin-top:4px;">Цены временно недоступны (нет интернета)</div>`;
                }
                
                const card = document.createElement('div');
                card.className = 'pc-build-card';
                card.dataset.id = b.id;
                card.innerHTML = `
                    <div class="card-info-side">
                        <div class="icons-container">${icons || '<span class="empty-list">Нет компонентов</span>'}</div>
                        <div class="details-container">
                            <div class="build-label">Сборка: ${_esc(b.name || 'Без названия')}</div>
                            <div class="build-price">Цена в базе: ${price} Р</div>
                            ${actual_price_html}
                            <div class="specs-summary">${specs.join(' | ') || 'Конфигурация пуста'}</div>
                            <div class="build-meta">
                                <div class="build-user">Пользователь: ${_esc(b.username || 'Пользователь')}</div>
                                <div class="build-date">${b.created_at ? new Date(b.created_at).toLocaleDateString('ru-RU') : ''}</div>
                            </div>
                            <div class="status-row">
                                <div class="like">&#9733; <span>${b.likes || 0}</span></div>
                                ${b.is_public == 1 ? '<span class="public-badge">Публичная</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="card-price-side">
                        <div class="controls-row">
                            <button class="btn-primary-action btn-load" data-id="${b.id}">Загрузить</button>
                        </div>
                        <button class="btn-text-delete btn-delete" data-id="${b.id}">Удалить сборку</button>
                    </div>`;
                list.appendChild(card);
            }
            
            _bind_build_buttons(d.builds);
            _hide_loader();
            
            if (hasInternet) {
                for (const b of d.builds) {
                    let comps = b.components || {};
                    if (typeof comps === 'string') {
                        try { comps = JSON.parse(comps); } catch (e) { comps = {}; }
                    }
                    if (!Object.keys(comps).length && b.compatibility_data) {
                        try { comps = JSON.parse(b.compatibility_data); } catch (e) { comps = {}; }
                    }
                    
                    const build_with_comps = { ...b, components: comps };
                    
                    try {
                        const price_info = await _fetch_all_prices_for_build(build_with_comps);
                        const actual_total = price_info.total_actual_price;
                        
                        const placeholder = document.querySelector(`.actual-price-placeholder[data-build-id="${b.id}"]`);
                        if (placeholder) {
                            if (actual_total) {
                                placeholder.innerHTML = `
                                    <span class="text-success">Актуальная цена: ${actual_total.toLocaleString('ru-RU')} Р</span>
                                    <span class="text-muted"> (по данным магазинов)</span>
                                `;
                            } else {
                                placeholder.innerHTML = '<span class="text-muted">Не удалось получить актуальную цену</span>';
                            }
                        }
                    } catch (e) {
                        const placeholder = document.querySelector(`.actual-price-placeholder[data-build-id="${b.id}"]`);
                        if (placeholder) {
                            placeholder.innerHTML = '<span class="text-muted">Цены временно недоступны</span>';
                        }
                    }
                }
            }
            
        } catch (e) { 
            c.innerHTML = '<div class="no-data">Ошибка загрузки сборок</div>'; 
            _hide_loader();
        }
    };

    const _build_icons = (comps) => {
        const types = [{ k: 'cpus', f: 'cpus', i: 'cpu_icon.png' }, { k: 'motherboards', f: 'motherboards', i: 'motherboard_icon.png' }, { k: 'rams', f: 'rams', i: 'ram_icon.png' }, { k: 'gpus', f: 'gpus', i: 'gpu_icon.png' }, { k: 'storages', f: 'storages', i: 'hdd_icon.png' }, { k: 'psus', f: 'psus', i: 'power_supply_icon.png' }, { k: 'cases', f: 'cases', i: 'pc_case_icon.png' }, { k: 'coolers', f: 'coolers', i: 'cooler_cpu_icon.png' }];
        let h = '';
        types.forEach(t => { let c = comps[t.k]; if (!c) return; if (t.k === 'storages' && c.length) c = c[0]; let img = c.image; if (!img || img === '') img = `source/icons/${t.i}`; else if (!img.startsWith('http') && !img.startsWith('data:') && !img.startsWith('source/')) img = `source/${t.f}/${img}`; h += `<div class="build-icon" title="${_esc(c.name)}"><img src="${img}" onerror="this.src='source/icons/${t.i}'"></div>`; });
        return h;
    };

    const _bind_build_buttons = (builds) => {
        document.querySelectorAll('.btn-load').forEach(b => { 
        b.addEventListener('click', () => { 
            const build = builds.find(x => x.id == b.dataset.id); 
            if (build) {
                window.location.href = `index.html?load_build_id=${build.id}`;
            } 
        }); 
    });
        
        document.querySelectorAll('.btn-delete').forEach(b => { 
            b.addEventListener('click', async () => { 
                if (!confirm('Удалить сборку?')) return; 
                
                const r = await fetch(`${API}delete_build`, {  
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ id: b.dataset.id }) 
                }); 
                const d = await r.json(); 
                
                if (d.success) { 
                    await _log_action('build_delete', `ID: ${b.dataset.id}`); 
                    _load_builds(); 
                } else {
                    alert(d.message || 'Ошибка'); 
                }
            }); 
        });
    };

    const _show_build_details = (id) => {};

    const _show_add_menu = (btn) => {
        const old = document.querySelector('.add-component-menu');
        if (old) { old.remove(); return; }
        const menu = document.createElement('div');
        menu.className = 'add-component-menu';
        let items = '';
        for (const [slug, name] of Object.entries(TYPE_NAMES)) items += `<div class="menu-item" data-cat="${slug}"><img src="source/icons/${ICONS[slug]}" onerror="this.src='source/icons/error_icon.png'"><span>${name}</span></div>`;
        menu.innerHTML = `<div class="menu-header">Выберите категорию</div><div class="menu-items">${items}</div>`;
        menu.style.cssText = 'position:fixed;z-index:10000;';
        document.body.appendChild(menu);
        const place = () => { const r = btn.getBoundingClientRect(); let t = r.bottom + 5, l = r.left; const mr = menu.getBoundingClientRect(); if (l + mr.width > window.innerWidth) l = window.innerWidth - mr.width - 10; if (t + mr.height > window.innerHeight) t = r.top - mr.height - 5; menu.style.top = t + 'px'; menu.style.left = Math.max(l, 10) + 'px'; };
        place();
        window.addEventListener('resize', place);
        window.addEventListener('scroll', place, true);
        menu.querySelectorAll('.menu-item').forEach(item => { item.addEventListener('click', () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); menu.remove(); window.location.href = `edit-component.html?new=1&cat=${item.dataset.cat}`; }); });
        setTimeout(() => { const close = e => { if (!menu.contains(e.target) && e.target !== btn) { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); document.removeEventListener('click', close); menu.remove(); } }; document.addEventListener('click', close); }, 100);
    };

    const _init = () => {
        if (!_check_access()) return;
        _prepare_nav();
        _show_section(_state.section);
        _load_dashboard();
        _bind_events();
        _fill_cat_select();
    };

    return Object.freeze({
        init: _init,
        load_more_activities: _load_more_activities,
        go_to_page: _go_to_page,
        edit_component: _edit_component,
        delete_component: _delete_component,
        change_role: _change_role,
        remove_user: _remove_user,
        show_build_details: _show_build_details
    });
})();

document.addEventListener('DOMContentLoaded', () => { window.AdminPanel = AdminPanel; AdminPanel.init(); });