'use strict';

const UIManager = (() => {
    const _show_loader = () => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.remove('hidden');
    };

    const _hide_loader = () => {
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
    };

    const _show_modal = (modal_id) => {
        const modal = document.getElementById(modal_id);
        if (modal) modal.classList.remove('hidden');
    };

    const _hide_modal = (modal_id) => {
        const modal = document.getElementById(modal_id);
        if (modal) modal.classList.add('hidden');
    };

    const _update_navigation = (auth_manager) => {
        const login_link = document.getElementById('login-link');
        const favorites_link = document.getElementById('favorites-link');
        const admin_link = document.getElementById('admin-link');
        const logout_link = document.getElementById('logout-link');

        if (!auth_manager) return;

        if (auth_manager.isLogged()) {
            if (login_link) login_link.classList.add('hidden');
            if (favorites_link) favorites_link.classList.remove('hidden');
            if (logout_link) logout_link.classList.remove('hidden');

            if (admin_link) {
                admin_link.classList.toggle('hidden', !auth_manager.isAdmin());
            }
        } else {
            if (login_link) login_link.classList.remove('hidden');
            if (favorites_link) favorites_link.classList.add('hidden');
            if (admin_link) admin_link.classList.add('hidden');
            if (logout_link) logout_link.classList.add('hidden');
        }
    };

    const _format_price = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price);
    };

    const _show_notification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        const colors = {
            success: { bg: '#d4edda', color: '#155724', border: '#c3e6cb' },
            error: { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' },
            info: { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' }
        };

        const scheme = colors[type] || colors.info;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${scheme.bg};
            color: ${scheme.color};
            padding: 15px 20px;
            border-radius: 5px;
            border: 1px solid ${scheme.border};
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    };

    const _create_component_card = (type, data) => {
        const has = data !== null;

        return `
            <tr class="component-row" data-component-type="${type}">
                <td class="component-name">${_get_type_name(type)}</td>
                <td class="component-action">
                    <button class="btn-select-component" 
                            onclick="configurator.openComponentSelection('${type}')">
                        ${has ? 'Изменить' : 'Выбрать'}
                    </button>
                    ${has ? `
                        <button class="btn-remove-component" 
                                onclick="configurator.removeComponent('${type}')">
                            Убрать
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    };

    const _get_type_name = (type) => {
        const names = {
            cpus: 'Процессоры',
            motherboards: 'Мат.плата',
            rams: 'Оперативная память',
            gpus: 'Видеокарты',
            storages: 'Накопители',
            psus: 'Блок питания',
            cases: 'Корпус',
            coolers: 'Охлаждение'
        };
        return names[type] || type;
    };

    const _escape_html = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const _get_image_path = (img_name, category) => {
        if (!img_name) return '';

        if (img_name.startsWith('http') || img_name.startsWith('/') || img_name.startsWith('source/')) {
            return img_name;
        }

        const folder_map = {
            cpu: 'cpus', cpus: 'cpus',
            motherboard: 'motherboards', motherboards: 'motherboards',
            ram: 'rams', rams: 'rams',
            gpu: 'gpus', gpus: 'gpus',
            case: 'cases', cases: 'cases',
            psu: 'psus', psus: 'psus',
            storage: 'storages', storages: 'storages'
        };

        const folder = folder_map[category] || 'other';
        return `source/${folder}/${img_name}`;
    };

    const _load_community_builds = async () => {
        const track = document.getElementById('community-builds-track');
        if (!track) return;

        track.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            const res = await fetch('api/builds.php?action=get_public');
            const data = await res.json();

            if (!data.success || !data.builds || !data.builds.length) {
                track.innerHTML = '<div class="no-builds">Нет публичных сборок</div>';
                return;
            }

            window.user_build_data = data.builds;

            let html = '';

            data.builds.forEach(b => {
                let comps = {};
                if (b.compatibility_data) {
                    try { comps = JSON.parse(b.compatibility_data); } catch (e) {}
                }

                const components = [];
                const seen = {};

                if (comps.cpus && comps.cpus.id && !seen[comps.cpus.id]) {
                    seen[comps.cpus.id] = true;
                    components.push({ type: 'cpu', data: comps.cpus });
                }
                if (comps.motherboards && comps.motherboards.id && !seen[comps.motherboards.id]) {
                    seen[comps.motherboards.id] = true;
                    components.push({ type: 'motherboard', data: comps.motherboards });
                }
                if (comps.rams && comps.rams.id && !seen[comps.rams.id]) {
                    seen[comps.rams.id] = true;
                    components.push({ type: 'ram', data: comps.rams });
                }
                if (comps.gpus && comps.gpus.id && !seen[comps.gpus.id]) {
                    seen[comps.gpus.id] = true;
                    components.push({ type: 'gpu', data: comps.gpus });
                }

                const images = [];
                components.forEach(comp => {
                    const img = comp.data.image || comp.data.img || '';
                    if (img) images.push(_get_image_path(img, comp.type));
                });

                const main_img = images.length > 0 ? images[0] : '';
                const previews = images.slice(1, 4);
                const names = components.map(c => c.data.name).filter(Boolean);
                const specs_text = names.join(', ');

                html += '<div class="pc-card">';
                html += '<div class="image-section">';
                html += '<div class="main-image">';

                if (main_img) {
                    html += `<img src="${main_img}" onerror="this.src='source/icons/default.svg'">`;
                } else {
                    html += '<div class="no-image">Нет фото</div>';
                }

                html += '</div>';
                html += '<div class="thumbnails">';

                if (previews.length === 1) {
                    html += `<div class="thumb tall"><img src="${previews[0]}" onerror="this.style.display='none'"></div>`;
                } else if (previews.length === 2) {
                    html += `<div class="thumb tall"><img src="${previews[0]}" onerror="this.style.display='none'"></div>`;
                    html += `<div class="thumb tall"><img src="${previews[1]}" onerror="this.style.display='none'"></div>`;
                } else if (previews.length >= 3) {
                    html += `<div class="thumb tall"><img src="${previews[0]}" onerror="this.style.display='none'"></div>`;
                    html += '<div class="thumb-row">';
                    html += `<div class="thumb small"><img src="${previews[1]}" onerror="this.style.display='none'"></div>`;
                    html += `<div class="thumb small"><img src="${previews[2]}" onerror="this.style.display='none'"></div>`;
                    if (previews.length > 3) {
                        html += `<div class="thumb more">+${previews.length - 3}</div>`;
                    }
                    html += '</div>';
                } else {
                    html += '<div class="thumb tall">Нет фото</div>';
                }

                html += '</div></div>';
                html += '<div class="info-section">';
                html += `<h3 class="title">${_escape_html(b.name || 'Сборка')}</h3>`;
                html += `<div class="specs">${_escape_html(specs_text)}</div>`;
                html += '</div>';
                html += '<div class="footer-section">';
                html += `<div class="component-card-price">${_format_price(b.total_price)} Р</div>`;
                html += '<div class="actions">';
                html += `<button class="btn-config" onclick="load_build(${b.id})">В конфигуратор</button>`;
                html += `<button class="btn-like" onclick="like_build(${b.id})">&#9733; <span id="likes-${b.id}">${b.likes || 0}</span></button>`;
                html += '</div></div></div>';
            });

            track.innerHTML = html;
            _init_carousel();
        } catch (e) {
            track.innerHTML = '<div class="no-builds">Ошибка загрузки</div>';
        }
    };

    const _init_carousel = () => {
        const track = document.getElementById('community-builds-track');
        const next_btn = document.getElementById('next-btn');
        const prev_btn = document.getElementById('prev-btn');

        if (!track || !next_btn || !prev_btn) return;
        if (!track.children.length) return;

        let index = 0;
        const card_width = 420;
        const gap = 20;

        const get_max = () => {
            let visible = 3;
            if (window.innerWidth < 1000) visible = 2;
            if (window.innerWidth < 700) visible = 1;
            return Math.max(0, track.children.length - visible);
        };

        let max = get_max();

        const update = () => {
            track.style.transform = `translateX(-${index * (card_width + gap)}px)`;
            prev_btn.style.opacity = index === 0 ? '0.5' : '1';
            next_btn.style.opacity = index >= max ? '0.5' : '1';
        };

        next_btn.onclick = () => {
            if (index < max) {
                index++;
                update();
            }
        };

        prev_btn.onclick = () => {
            if (index > 0) {
                index--;
                update();
            }
        };

        window.addEventListener('resize', () => {
            max = get_max();
            if (index > max) index = max;
            update();
        });

        update();
    };

    const _like_build = async (id) => {
        try {
            const res = await fetch('api/builds.php?action=like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            const data = await res.json();

            if (data.success) {
                const span = document.getElementById(`likes-${id}`);
                if (span) span.innerText = data.likes;
            } else if (res.status === 401) {
                if (window.AuthManager) {
                    window.AuthManager.showModal();
                } else {
                    alert('Войдите в систему, чтобы оценить сборку');
                }
            }
        } catch (e) {
        }
    };

    const _load_build = (id) => {
        if (!window.user_build_data) return;
        const build = window.user_build_data.find(b => b.id == id);
        if (build && window.Configurator) {
            window.Configurator.loadSavedBuild(id);
        }
    };

    const _init = () => {
        _load_community_builds();

        window.like_build = _like_build;
        window.load_build = _load_build;
    };

    return Object.freeze({
        init: _init,
        showLoader: _show_loader,
        hideLoader: _hide_loader,
        showModal: _show_modal,
        hideModal: _hide_modal,
        updateNavigation: _update_navigation,
        formatPrice: _format_price,
        showNotification: _show_notification,
        createComponentCard: _create_component_card,
        escapeHtml: _escape_html,
        getImagePath: _get_image_path
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    UIManager.init();
});