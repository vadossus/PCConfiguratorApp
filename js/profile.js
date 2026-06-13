'use strict';

const ProfilePage = (() => {
    let _auth = null;
    let _user = null;
    let _price_cache = new Map();

    const _esc = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const _show_loader = (t = 'Загрузка...') => {
        const l = document.getElementById('global-loader');
        const s = l?.querySelector('.loader-text');
        if (s) s.textContent = t;
        l?.classList.remove('hidden');
    };

    const _hide_loader = () => document.getElementById('global-loader')?.classList.add('hidden');

    const _load_builds = async () => {
        const container = document.getElementById('builds-list');
        if (!container) return;
        
        _show_loader('Загрузка сборок...');
        
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const res = await fetch(`api/builds.php?action=get_builds&user_id=${user.id}`);
            const data = await res.json();

            if (!data.success || !data.builds?.length) {
                container.innerHTML = '<div class="no-data">У вас нет сохранённых сборок</div>';
                _hide_loader();
                return;
            }

            container.innerHTML = '';
            
            const hasInternet = navigator.onLine;
            
            for (const build of data.builds) {
                let comps = build.components || {};
                if (typeof comps === 'string') {
                    try { comps = JSON.parse(comps); } catch (e) { comps = {}; }
                }
                if (!Object.keys(comps).length && build.compatibility_data) {
                    try { comps = JSON.parse(build.compatibility_data); } catch (e) { comps = {}; }
                }
                
                const specs = [];
                if (comps.cpus?.name) specs.push(comps.cpus.name);
                if (comps.gpus?.name) specs.push(comps.gpus.name);
                if (comps.rams?.name) specs.push(comps.rams.name);
                if (comps.motherboards?.name) specs.push(comps.motherboards.name);
                
                const base_price = Number(build.total_price || 0);
                const price = base_price.toLocaleString('ru-RU');

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

                let icons = '';
                icon_types.forEach(t => {
                    let comp = comps[t.key];
                    if (!comp) return;
                    if (t.key === 'storages' && Array.isArray(comp) && comp.length) comp = comp[0];
                    if (!comp || !comp.name) return;
                    let img = comp.image;
                    if (!img || img === '') img = `source/icons/${t.icon}`;
                    else if (!img.startsWith('http') && !img.startsWith('data:') && !img.startsWith('source/')) {
                        img = `source/${t.folder}/${img}`;
                    }
                    icons += `<div class="build-icon" title="${_esc(comp.name)}"><img src="${img}" onerror="this.src='source/icons/${t.icon}'"></div>`;
                });

                let actual_price_html = '';
                
                if (hasInternet) {
                    actual_price_html = `
                        <div class="actual-price-placeholder" data-build-id="${build.id}">
                            <span class="actual-price-loading">Загрузка актуальной цены...</span>
                        </div>`;
                } else {
                    actual_price_html = `<div class="text-muted actual-price-offline">Цены временно недоступны (нет интернета)</div>`;
                }

                const card = document.createElement('div');
                card.className = 'pc-build-card';
                card.dataset.id = build.id;
                card.innerHTML = `
                    <div class="card-info-side">
                        <div class="icons-container">${icons || '<span class="empty-list">Нет компонентов</span>'}</div>
                        <div class="details-container">
                            <div class="build-label">Сборка: ${_esc(build.name || 'Без названия')}</div>
                            <div class="build-price">Цена в базе: ${price} Р</div>
                            ${actual_price_html}
                            <div class="specs-summary">${specs.join(' | ') || 'Конфигурация пуста'}</div>
                            <div class="build-meta">
                                <div class="build-date">${build.created_at ? new Date(build.created_at).toLocaleDateString('ru-RU') : ''}</div>
                            </div>
                            <div class="status-row">
                                <div class="like">&#9733; <span>${build.likes || 0}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-price-side">
                        <div class="controls-row">
                            <div class="settings-dropdown-container">
                                <button class="btn-settings" data-id="${build.id}">...</button>
                                <div class="settings-dropdown hidden" id="dropdown-${build.id}">
                                    <label class="dropdown-item">
                                        <input type="checkbox" class="public-checkbox" data-id="${build.id}" ${build.is_public == '1' ? 'checked' : ''}>
                                        <span>Сделать публичной</span>
                                    </label>
                                </div>
                            </div>
                            <button class="btn-primary-action btn-load" data-id="${build.id}">Загрузить</button>
                        </div>
                        <button class="btn-text-delete btn-delete" data-id="${build.id}">Удалить сборку</button>
                    </div>`;
                container.appendChild(card);
            }
            
            _bind_build_buttons(data.builds);
            _hide_loader();
            
            if (hasInternet) {
                for (const build of data.builds) {
                    let comps = build.components || {};
                    if (typeof comps === 'string') {
                        try { comps = JSON.parse(comps); } catch (e) { comps = {}; }
                    }
                    if (!Object.keys(comps).length && build.compatibility_data) {
                        try { comps = JSON.parse(build.compatibility_data); } catch (e) { comps = {}; }
                    }
                    
                    const build_with_comps = { ...build, components: comps };
                    
                    try {
                        const price_info = await _fetch_all_prices_for_build(build_with_comps);
                        const actual_total = price_info.total_actual_price;
                        
                        const placeholder = document.querySelector(`.actual-price-placeholder[data-build-id="${build.id}"]`);
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
                        const placeholder = document.querySelector(`.actual-price-placeholder[data-build-id="${build.id}"]`);
                        if (placeholder) {
                            placeholder.innerHTML = '<span class="text-muted">Цены временно недоступны</span>';
                        }
                    }
                }
            }
            
        } catch (e) {
            container.innerHTML = '<div class="no-data">Ошибка загрузки сборок</div>';
            _hide_loader();
        }
    };

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
            console.error('Ошибка получения цены для', component_name, error);
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

    const _bind_build_buttons = (builds) => {
        document.querySelectorAll('.btn-settings').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                document.querySelectorAll('.settings-dropdown').forEach(d => {
                    if (d.id !== `dropdown-${id}`) d.classList.add('hidden');
                });
                document.getElementById(`dropdown-${id}`).classList.toggle('hidden');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.settings-dropdown-container')) {
                document.querySelectorAll('.settings-dropdown').forEach(d => d.classList.add('hidden'));
            }
        });

        document.querySelectorAll('.public-checkbox').forEach(cb => {
            cb.addEventListener('change', async () => {
                const id = cb.dataset.id;
                const pub = cb.checked ? 1 : 0;
                cb.style.opacity = '0.5';
                cb.disabled = true;
                try {
                    const res = await fetch('api/builds.php?action=toggle_public', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, is_public: pub })
                    });
                    const data = await res.json();
                    if (!data.success) cb.checked = !cb.checked;
                } catch (e) {
                    cb.checked = !cb.checked;
                }
                cb.style.opacity = '1';
                cb.disabled = false;
            });
        });

        document.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', () => {
                const build = builds.find(b => b.id == btn.dataset.id);
                if (build) {
                    window.location.href = `index.html?load_build_id=${build.id}`;
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить сборку?')) return;
                const res = await fetch('api/builds.php?action=delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: btn.dataset.id })
                });
                const data = await res.json();
                if (data.success) _load_builds();
                else alert(data.message || 'Ошибка удаления');
            });
        });
    };

    const _bind = () => {
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                link.classList.add('active');
                document.getElementById(link.dataset.target).classList.add('active');
                 if (link.dataset.target === 'tab-favorites') {
                    _load_builds();
                }
            });
        });

        document.getElementById('form-settings').addEventListener('submit', async (e) => {
        e.preventDefault();
        const login = document.getElementById('login-input').value.trim();
        const email = document.getElementById('email-input').value.trim();
        const old_pass = document.getElementById('old-pass').value;
        const new_pass = document.getElementById('new-pass').value;

        if (!login || !email) { alert('Заполните логин и email'); return; }

        const body = { username: login, email };

        if (old_pass && new_pass) {
            if (new_pass.length < 6) { alert('Новый пароль должен быть минимум 6 символов'); return; }
            body.old_password = old_pass;
            body.new_password = new_pass;
        } else if (old_pass || new_pass) {
            alert('Для смены пароля заполните оба поля');
            return;
        }

        try {
            const res = await fetch('api/profile.php?action=update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (data.success) {
                alert('Профиль обновлён');
                _user.username = login;
                _user.email = email;
                document.getElementById('old-pass').value = '';
                document.getElementById('new-pass').value = '';
                _auth?.updateUI();
            } else {
                if (data.message && data.message.includes('email уже используется')) {
                    alert('этот email уже зарегистрирован');
                } else if (data.message && data.message.includes('логин уже занят')) {
                    alert('этот логин уже занят');
                } else {
                    alert(data.message || 'Ошибка обновления');
                }
            }
        } catch (e) {
            alert('Ошибка соединения');
        }
    });

        document.getElementById('logout-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            _auth?.logout();
            window.location.href = 'index.html';
        });
    };

    const _init = () => {
        _auth = window.AuthManager;
        if (!_auth?.isLogged()) { window.location.href = 'index.html'; return; }

        _user = _auth.getUser();
        document.getElementById('login-input').value = _user.username;
        document.getElementById('email-input').value = _user.email;

        _bind();
    };

    return Object.freeze({ init: _init });
})();

document.addEventListener('DOMContentLoaded', () => { ProfilePage.init(); });