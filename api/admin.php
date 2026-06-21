<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/classes/Component.php';

header('Content-Type: application/json; charset=utf-8');
set_cors_headers();
require_admin();

$db = (new Database())->connect();
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
$input = get_json_input();

switch ($action) {
    case 'get_count':
        handle_get_count($db);
        break;

    case 'get_components':
        handle_get_components($db);
        break;

    case 'get_users':
        handle_get_users($db);
        break;

    case 'get_builds':
        header('Location: builds.php?action=get_builds');
        exit;

    case 'add_component':
        handle_add_component($db, $input);
        break;

    case 'update_component':
        handle_update_component($db, $input);
        break;

    case 'delete_component':
        handle_delete_component($db, $input);
        break;

    case 'toggle_component':
        handle_toggle_component($db, $input);
        break;

    case 'get_component':
        handle_get_component($db);
        break;

    case 'update_user_role':
        handle_update_user_role($db, $input);
        break;

    case 'delete_user':
        handle_delete_user($db, $input);
        break;

    case 'delete_build':
        handle_delete_build($db, $input);
        break;

    case 'log_activity':
        handle_log_activity($db, $input);
        break;

    case 'get_activities':
        handle_get_activities($db);
        break;

    case 'check_component_activity':
        handle_check_component_activity($db);
        break;

    default:
        send_response(false, 'Неизвестное действие: ' . $action, 400);
}

function handle_get_count(PDO $db): void
{
    $table = filter_input(INPUT_GET, 'table', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
    $allowed = ['users', 'components', 'user_builds'];

    if (!in_array($table, $allowed, true)) {
        send_response(false, 'Недопустимая таблица', 400);
    }

    $stmt = $db->query("SELECT COUNT(*) FROM {$table}");
    $count = (int) $stmt->fetchColumn();

    send_response(true, '', 200, ['count' => $count]);
}

function handle_get_components(PDO $db): void
{
    $has_categories = $db->query("SHOW TABLES LIKE 'component_categories'")->rowCount() > 0;
    $has_category_column = $db->query("SHOW COLUMNS FROM components LIKE 'category_id'")->rowCount() > 0;

    if ($has_category_column && $has_categories) {
        $query = "SELECT c.id, c.category_id, c.reference_id, c.reference_table,
                         c.is_active, c.created_at, c.updated_at,
                         cat.code AS category_code, cat.name AS category_name
                  FROM components c
                  LEFT JOIN component_categories cat ON c.category_id = cat.id
                  ORDER BY c.created_at DESC";
    } else {
        $query = 'SELECT * FROM components ORDER BY created_at DESC';
    }

    $stmt = $db->query($query);
    $components = $stmt->fetchAll();

    foreach ($components as &$comp) {
        foreach (['critical_specs', 'compatibility_flags', 'specs'] as $field) {
            $comp[$field] = normalize_json_field($comp[$field] ?? null);
        }
        foreach (['socket', 'memory_type', 'form_factor', 'efficiency', 'type'] as $field) {
            if (isset($comp[$field]) && $comp[$field] === null) {
                $comp[$field] = '';
            }
        }
    }

    send_response(true, '', 200, ['components' => $components]);
}

function handle_get_users(PDO $db): void
{
    $has_builds = $db->query("SHOW TABLES LIKE 'user_builds'")->rowCount() > 0;

    if ($has_builds) {
        $query = "SELECT u.*, COUNT(ub.id) AS builds_count
                  FROM users u
                  LEFT JOIN user_builds ub ON ub.user_id = u.id
                  GROUP BY u.id
                  ORDER BY u.created_at DESC";
    } else {
        $query = 'SELECT *, 0 AS builds_count FROM users ORDER BY created_at DESC';
    }

    $users = $db->query($query)->fetchAll();

    foreach ($users as &$user) {
        if (isset($user['created_at'])) {
            $user['created_at'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
        }
    }

    send_response(true, '', 200, ['users' => $users]);
}

function handle_add_component(PDO $db, array $input): void
{
    if (empty($input['category_code']) || empty($input['name']) || !isset($input['price'])) {
        send_response(false, 'Переданы не все обязательные поля', 400);
        return;
    }

    $map = [
        'cpus' => 'cpus', 'motherboards' => 'motherboards', 'rams' => 'rams',
        'gpus' => 'gpus', 'storages' => 'storages', 'psus' => 'psus',
        'cases' => 'cases', 'coolers' => 'coolers',
    ];

    $table = $map[$input['category_code']] ?? null;
    if (!$table) {
        send_response(false, 'Неверная категория', 400);
        return;
    }

    try {
        $db->beginTransaction();

        $child_data = [
            'name' => $input['name'],
            'description' => $input['description'] ?? null,
            'price' => (float)$input['price'],
            'image' => $input['image'] ?? null,
            'is_active' => isset($input['is_active']) ? (int)$input['is_active'] : 1,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];

        $specs = [
            'cpus'         => ['socket', 'cores', 'threads', 'frequency', 'tdp', 'memory_type', 'manufacturer'],
            'motherboards' => ['socket', 'chipset', 'form_factor', 'memory_type', 'memory_slots', 'max_memory', 'm2_slots', 'sata_ports', 'pcie_version', 'wifi', 'manufacturer'],
            'rams'         => ['type', 'capacity', 'modules', 'speed', 'cas_latency', 'rgb', 'manufacturer'],
            'gpus'         => ['gpu_chip', 'memory_size', 'memory_type', 'tdp', 'recommended_psu', 'length', 'manufacturer', 'chip_manufacturer', 'pcie_version', 'hdmi_ports', 'displayport_ports'],
            'storages'     => ['type', 'interface', 'capacity', 'form_factor', 'read_speed', 'write_speed', 'manufacturer'],
            'psus'         => ['wattage', 'efficiency', 'form_factor', 'modular', 'manufacturer', 'pcie_connectors', 'sata_connectors'],
            'cases'        => ['form_factor', 'supported_motherboards', 'color', 'window', 'max_gpu_length', 'max_cpu_cooler_height', 'drive_bays', 'fan_slots', 'radiator_support', 'manufacturer'],
            'coolers'      => ['type', 'socket_compatibility', 'tdp', 'height', 'radiator_size', 'fan_size', 'noise_level', 'led', 'manufacturer']
        ];

        $allowed = $specs[$table] ?? [];

        foreach ($input as $k => $v) {
            $db_key = $k;
            if ($table === 'coolers') {
                if ($k === 'fan_diameter') { $db_key = 'fan_size'; }
                if ($k === 'noise') { $db_key = 'noise_level'; }
            }

            if (in_array($db_key, $allowed, true)) {
                $child_data[$db_key] = ($v === '' || $v === null) ? null : $v;
            }
        }

        $cols = array_keys($child_data);
        $res = ['window', 'order', 'group', 'key', 'index', 'type', 'value'];
        $esc_cols = array_map(function($c) use ($res) {
            return in_array($c, $res, true) ? "`{$c}`" : $c;
        }, $cols);

        $fields_str = implode(', ', $esc_cols);
        $params_str = ':' . implode(', :', $cols);

        $stmt = $db->prepare("INSERT INTO {$table} ({$fields_str}) VALUES ({$params_str})");
        $stmt->execute($child_data);
        
        $ref_id = (int)$db->lastInsertId();
        $cat_stmt = $db->prepare('SELECT id FROM component_categories WHERE code = :code LIMIT 1');
        $cat_stmt->execute([':code' => $input['category_code']]);
        $cat_id = (int)$cat_stmt->fetchColumn();

        $link_stmt = $db->prepare(
            'INSERT INTO components (category_id, reference_id, reference_table, is_active, created_at, updated_at)
             VALUES (:cat_id, :ref_id, :ref_table, :is_active, :created, :updated)'
        );
        $link_stmt->execute([
            ':cat_id'    => $cat_id,
            ':ref_id'    => $ref_id,
            ':ref_table' => $table,
            ':is_active' => $child_data['is_active'],
            ':created'   => $child_data['created_at'],
            ':updated'   => $child_data['updated_at']
        ]);

        $db->commit();
        send_response(true, 'Компонент добавлен', 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) { $db->rollBack(); }
        send_response(false, 'Ошибка добавления: ' . $e->getMessage(), 500);
    }
}

function handle_update_component(PDO $db, array $input): void
{
    $id = (int)($input['id'] ?? 0);
    if (!$id) {
        send_response(false, 'ID не указан', 400);
        return;
    }

    $stmt = $db->prepare("SELECT * FROM components WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $comp = $stmt->fetch();

    if (!$comp) {
        send_response(false, 'Компонент не найден', 404);
        return;
    }

    $table = $comp['reference_table'];
    $ref_id = $comp['reference_id'];

    try {
        $db->beginTransaction();

        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : $comp['is_active'];
        $db->prepare("UPDATE components SET is_active = ?, updated_at = ? WHERE id = ?")
           ->execute([$is_active, date('Y-m-d H:i:s'), $id]);

        $child_data = [];
        
        $base_fields = ['name', 'description', 'price', 'image', 'is_active'];
        foreach ($base_fields as $f) {
            if (array_key_exists($f, $input)) {
                $child_data[$f] = ($f === 'price') ? (float)$input[$f] : $input[$f];
            }
        }

        $specs = [
            'cpus'         => ['socket', 'cores', 'threads', 'frequency', 'tdp', 'memory_type', 'manufacturer'],
            'motherboards' => ['socket', 'chipset', 'form_factor', 'memory_type', 'memory_slots', 'max_memory', 'm2_slots', 'sata_ports', 'pcie_version', 'wifi', 'manufacturer'],
            'rams'         => ['type', 'capacity', 'modules', 'speed', 'cas_latency', 'rgb', 'manufacturer'],
            'gpus'         => ['gpu_chip', 'memory_size', 'memory_type', 'tdp', 'recommended_psu', 'length', 'manufacturer', 'chip_manufacturer', 'pcie_version', 'hdmi_ports', 'displayport_ports'],
            'storages'     => ['type', 'interface', 'capacity', 'form_factor', 'read_speed', 'write_speed', 'manufacturer'],
            'psus'         => ['wattage', 'efficiency', 'form_factor', 'modular', 'manufacturer', 'pcie_connectors', 'sata_connectors'],
            'cases'        => ['form_factor', 'supported_motherboards', 'color', 'window', 'max_gpu_length', 'max_cpu_cooler_height', 'drive_bays', 'fan_slots', 'radiator_support', 'manufacturer'],
            'coolers'      => ['type', 'socket_compatibility', 'tdp', 'height', 'radiator_size', 'fan_size', 'noise_level', 'led', 'manufacturer']
        ];

        $allowed = $specs[$table] ?? [];

        foreach ($input as $k => $v) {
            if (in_array($k, ['id', 'category_code'], true)) continue;

            $db_key = $k;
            if ($table === 'coolers') {
                if ($k === 'fan_diameter') { $db_key = 'fan_size'; }
                if ($k === 'noise') { $db_key = 'noise_level'; }
            }

            if (in_array($db_key, $allowed, true)) {
                $child_data[$db_key] = ($v === '' || $v === null) ? null : $v;
            }
        }

        $child_data['updated_at'] = date('Y-m-d H:i:s');

        $set = [];
        $params = [];
        $res = ['window', 'order', 'group', 'key', 'index', 'type', 'value'];

        foreach ($child_data as $field => $val) {
            $esc_f = in_array($field, $res, true) ? "`{$field}`" : $field;
            $set[] = "{$esc_f} = ?";
            $params[] = $val;
        }

        $params[] = $ref_id;

        $query = "UPDATE {$table} SET " . implode(', ', $set) . " WHERE id = ?";
        $db->prepare($query)->execute($params);

        $db->commit();
        send_response(true, 'Компонент обновлён', 200);
    } catch (Throwable $e) {
        if ($db->inTransaction()) { $db->rollBack(); }
        send_response(false, 'Ошибка обновления: ' . $e->getMessage(), 500);
    }
}

function handle_delete_component(PDO $db, array $input): void
{
    $id = (int) ($input['id'] ?? 0);
    if (!$id) {
        send_response(false, 'ID не указан', 400);
    }

    $stmt = $db->prepare('SELECT reference_table, reference_id FROM components WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $comp = $stmt->fetch();

    if (!$comp) {
        send_response(false, 'Компонент не найден', 404);
    }

    $db->prepare("DELETE FROM {$comp['reference_table']} WHERE id = ?")->execute([$comp['reference_id']]);
    $db->prepare('DELETE FROM components WHERE id = ?')->execute([$id]);

    send_response(true, 'Компонент удалён', 200);
}

function handle_toggle_component(PDO $db, array $input): void
{
    $id = (int) ($input['id'] ?? 0);
    $is_active = (int) ($input['is_active'] ?? 0);

    if (!$id) {
        send_response(false, 'ID не указан', 400);
    }

    $stmt = $db->prepare('SELECT reference_table, reference_id FROM components WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $comp = $stmt->fetch();

    if (!$comp) {
        send_response(false, 'Компонент не найден', 404);
    }

    $db->prepare("UPDATE {$comp['reference_table']} SET is_active = ? WHERE id = ?")
       ->execute([$is_active, $comp['reference_id']]);

    $db->prepare('UPDATE components SET is_active = ? WHERE id = ?')
       ->execute([$is_active, $id]);

    send_response(true, 'Статус изменён', 200);
}

function handle_get_component(PDO $db): void
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    if ($id) {
        $stmt = $db->prepare(
            "SELECT c.id, c.category_id, c.reference_id, c.reference_table, c.is_active,
                    cat.name AS category_name, cat.code AS category_code
             FROM components c
             INNER JOIN component_categories cat ON c.category_id = cat.id
             WHERE c.id = :id LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $comp = $stmt->fetch();

        if (!$comp) {
            send_response(false, 'Компонент не найден', 404);
        }

        $detail = $db->prepare("SELECT * FROM {$comp['reference_table']} WHERE id = :ref_id LIMIT 1");
        $detail->execute([':ref_id' => $comp['reference_id']]);
        $details = $detail->fetch();

        if ($details) {
            $main_id = $comp['id'];
            foreach ($details as $key => $value) {
                if ($key !== 'id') $comp[$key] = $value;
            }
            $comp['id'] = $main_id;
        }

        send_response(true, '', 200, ['component' => $comp]);
    }

    $page = (int) (filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?: 1);
    $limit = (int) (filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 10);
    $category = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_SPECIAL_CHARS);
    $is_active = filter_input(INPUT_GET, 'is_active', FILTER_VALIDATE_INT);
    $search = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_SPECIAL_CHARS);
    $sort_by = filter_input(INPUT_GET, 'sort_by', FILTER_SANITIZE_SPECIAL_CHARS) ?? 'created_at';
    $sort_order = filter_input(INPUT_GET, 'sort_order', FILTER_SANITIZE_SPECIAL_CHARS) ?? 'desc';

    $offset = ($page - 1) * $limit;
    $where = ' WHERE 1=1';
    $params = [];

    if ($category && $category !== 'all') {
        $where .= ' AND cat.code = :category';
        $params[':category'] = $category;
    }

    if ($is_active !== null && $is_active !== '') {
        $where .= ' AND c.is_active = :is_active';
        $params[':is_active'] = (int) $is_active;
    }

    if ($search && $search !== '') {
        $where .= ' AND EXISTS (
            SELECT 1 FROM cpus ref WHERE ref.id = c.reference_id AND ref.name LIKE :search
        )';
        $params[':search'] = '%' . $search . '%';
    }

    $count_stmt = $db->prepare(
        "SELECT COUNT(*) FROM components c
         INNER JOIN component_categories cat ON c.category_id = cat.id" . $where
    );
    $count_stmt->execute($params);
    $total = (int) $count_stmt->fetchColumn();

    $query = "SELECT c.*, cat.name AS category_name, cat.code AS category_code
              FROM components c
              INNER JOIN component_categories cat ON c.category_id = cat.id
              {$where}
              ORDER BY c.{$sort_by} {$sort_order}
              LIMIT {$limit} OFFSET {$offset}";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $components = $stmt->fetchAll();

    send_response(true, '', 200, [
        'components' => $components,
        'pagination' => [
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'pages' => (int) ceil($total / $limit),
        ],
    ]);
}

function handle_update_user_role(PDO $db, array $input): void
{
    $target_user_id = (int) ($input['user_id'] ?? 0);
    $new_role = $input['role'] ?? '';
    $current_user_id = (int) ($_SESSION['user_id'] ?? 0);
    $current_user_role = $_SESSION['role'] ?? '';

    $allowed_roles = ['user', 'admin', 'sadmin'];
    if (!in_array($new_role, $allowed_roles, true)) {
        send_response(false, 'Недопустимая роль', 400);
    }

    if ($target_user_id === $current_user_id) {
        send_response(false, 'Нельзя менять роль самому себе', 400);
    }

    $stmt = $db->prepare("SELECT role FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $target_user_id]);
    $target_user = $stmt->fetch();
    
    if (!$target_user) {
        send_response(false, 'Пользователь не найден', 404);
    }

    $target_role = $target_user['role'];

    if ($current_user_role === 'admin') {
        if ($target_role === 'sadmin') {
            send_response(false, 'Нельзя изменять роль супер-администратора', 403);
        }
        
        if ($target_role === 'admin') {
            send_response(false, 'Нельзя изменять роль другого администратора', 403);
        }
        
        if ($new_role === 'sadmin') {
            send_response(false, 'Нельзя назначить супер-администратора', 403);
        }
    }
    

    $stmt = $db->prepare("UPDATE users SET role = :role WHERE id = :id");
    $stmt->execute([':role' => $new_role, ':id' => $target_user_id]);

    send_response(true, 'Роль успешно обновлена', 200);
}

function handle_delete_user(PDO $db, array $input): void
{
    $id = (int) ($input['id'] ?? 0);
    if (!$id) {
        send_response(false, 'ID не указан', 400);
    }

    $current_user_id = (int) ($_SESSION['user_id'] ?? 0);
    $current_user_role = $_SESSION['role'] ?? '';

    if ($current_user_role !== 'sadmin') {
        send_response(false, 'Только супер-администратор может удалять пользователей', 403);
    }

    if ($id === $current_user_id) {
        send_response(false, 'Нельзя удалить самого себя', 400);
    }

    $stmt = $db->prepare("SELECT role FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $target_user = $stmt->fetch();

    if (!$target_user) {
        send_response(false, 'Пользователь не найден', 404);
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        send_response(false, 'Пользователь не найден', 404);
    }

    send_response(true, 'Пользователь удалён', 200);
}

function handle_delete_build(PDO $db, array $input): void
{
    $id = (int) ($input['id'] ?? 0);
    if (!$id) {
        send_response(false, 'ID не указан', 400);
    }

    $stmt = $db->prepare('DELETE FROM user_builds WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        send_response(false, 'Сборка не найдена', 404);
    }

    send_response(true, 'Сборка удалена', 200);
}

function handle_log_activity(PDO $db, array $input): void
{
    $has_table = $db->query("SHOW TABLES LIKE 'activities'")->rowCount() > 0;
    if (!$has_table) {
        send_response(true, 'Таблица активностей не найдена', 200);
    }

    $user_id = (int) ($input['user_id'] ?? 0);
    $action_type = $input['type'] ?? '';
    $description = $input['description'] ?? '';

    $action_names = [
        'user_register' => 'Регистрация',
        'user_delete' => 'Удаление пользователя',
        'user_role_change' => 'Изменение роли',
        'build_save' => 'Сохранение сборки',
        'build_delete' => 'Удаление сборки',
        'component_add' => 'Добавление компонента',
        'component_edit' => 'Редактирование компонента',
        'component_delete' => 'Удаление компонента',
        'component_toggle' => 'Изменение статуса',
    ];

    $readable_type = $input['readable_type'] ?? ($action_names[$action_type] ?? $action_type);
    $full_description = $readable_type . ($description ? ': ' . $description : '');

    $stmt = $db->prepare(
        'INSERT INTO activities (user_id, action_type, description) VALUES (:user_id, :type, :desc)'
    );
    $stmt->execute([
        ':user_id' => $user_id,
        ':type' => $action_type,
        ':desc' => $full_description,
    ]);

    send_response(true, 'Активность записана', 200, ['id' => (int) $db->lastInsertId()]);
}

function handle_get_activities(PDO $db): void
{
    $limit = (int) (filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 15);
    $offset = (int) (filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT) ?: 0);

    $stmt = $db->prepare(
        'SELECT a.*, u.username, u.email
         FROM activities a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT :limit OFFSET :offset'
    );
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll();

    foreach ($activities as &$act) {
        $act['timestamp_formatted'] = format_activity_time($act['created_at']);

        if (str_contains($act['description'], ': ')) {
            [$type_name, $desc] = explode(': ', $act['description'], 2);
            $act['type_name'] = $type_name;
            $act['description_short'] = $desc;
        } else {
            $act['type_name'] = $act['description'];
            $act['description_short'] = '';
        }

        $act['user_display'] = $act['user_id'] == 0
            ? 'Система'
            : ($act['username'] ?: 'Пользователь #' . $act['user_id']);
    }

    $total = (int) $db->query('SELECT COUNT(*) FROM activities')->fetchColumn();

    send_response(true, '', 200, [
        'activities' => $activities,
        'pagination' => ['total' => $total, 'limit' => $limit, 'offset' => $offset],
    ]);
}

function handle_check_component_activity(PDO $db): void
{
    $component_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT) ?? 0;

    if (!$component_id) {
        send_response(false, 'Не указан ID', 400);
    }

    try {
        $stmt = $db->prepare("SELECT is_active FROM components WHERE id = ?");
        $stmt->execute([$component_id]);
        $result = $stmt->fetch();

        if ($result) {
            send_response(true, '', 200, ['is_active' => (int) $result['is_active'] === 1]);
        } else {
            send_response(false, 'Компонент не найден', 404);
        }
    } catch (PDOException $e) {
        send_response(false, 'Ошибка БД', 500);
    }
}

function normalize_json_field($value): array
{
    if (empty($value)) {
        return [];
    }

    $decoded = json_decode($value, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
        return [];
    }

    return $decoded;
}

function format_activity_time(?string $timestamp): string
{
    if (!$timestamp) {
        return 'Недавно';
    }

    $now = new DateTime();
    $activity_time = new DateTime($timestamp);
    $interval = $now->diff($activity_time);

    if ($interval->d === 0) {
        if ($interval->h === 0) {
            return $interval->i < 1 ? 'только что' : $interval->i . ' мин. назад';
        }
        return $interval->h . ' ч. назад';
    }

    if ($interval->d === 1) {
        return 'вчера в ' . $activity_time->format('H:i');
    }

    if ($interval->d < 7) {
        return $interval->d . ' дн. назад';
    }

    return $activity_time->format('d.m.Y H:i');
}