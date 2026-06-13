<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
set_cors_headers();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$db = (new Database())->connect();
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();

$public_actions = ['get_public', 'like'];

if (!in_array($action, $public_actions, true)) {
    if (empty($_SESSION['user_id'])) {
        send_response(false, 'Требуется авторизация', 401);
    }
}

$user_id = isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : 0;

switch ($action) {
    case 'save':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_save_build($db, $user_id, $input);
        break;

    case 'delete':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_delete_build($db, $user_id, $input);
        break;

    case 'update':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_update_build($db, $user_id, $input);
        break;

    case 'get_builds':
        handle_get_builds($db, $user_id);
        break;

    case 'get_public':
        handle_get_public_builds($db);
        break;

    case 'toggle_public':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_toggle_public($db, $user_id, $input);
        break;

    case 'like':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_like_build($db, $user_id, $input);
        break;

    case 'stats':
        handle_get_stats($db, $user_id);
        break;

    default:
        send_response(false, 'Неизвестное действие', 400);
}

function handle_save_build(PDO $db, int $user_id, array $input): void
{
    $components = $input['components'] ?? [];

    if (is_build_empty($components)) {
        send_response(false, 'Сборка пустая, нужно выбрать компоненты', 400);
    }

    $name = !empty($input['name'])
        ? htmlspecialchars(trim($input['name']))
        : 'Моя сборка ' . date('d.m.Y H:i');

    $total_price = (float) ($input['total_price'] ?? 0);
    $components_json = json_encode($components, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $db->prepare(
        'INSERT INTO user_builds (user_id, name, total_price, compatibility_data, created_at, updated_at)
         VALUES (:user_id, :name, :price, :components, NOW(), NOW())'
    );
    $stmt->execute([
        ':user_id' => $user_id,
        ':name' => $name,
        ':price' => $total_price,
        ':components' => $components_json,
    ]);

    send_response(true, 'Сборка сохранена', 201, [
        'build_id' => (int) $db->lastInsertId(),
        'name' => $name,
        'total_price' => $total_price,
    ]);
}

function handle_delete_build(PDO $db, int $user_id, array $input): void
{
    $build_id = (int) ($input['id'] ?? 0);

    if (!$build_id) {
        send_response(false, 'Не указан ID сборки', 400);
    }

    $is_admin = ($_SESSION['role'] ?? '') === 'admin';
    $query = 'DELETE FROM user_builds WHERE id = :id';
    $params = [':id' => $build_id];

    if (!$is_admin) {
        $query .= ' AND user_id = :user_id';
        $params[':user_id'] = $user_id;
    }

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        send_response(false, 'Сборка не найдена или нет доступа', 404);
    }

    send_response(true, 'Сборка удалена', 200);
}

function handle_update_build(PDO $db, int $user_id, array $input): void
{
    $build_id = (int) ($input['id'] ?? 0);

    if (!$build_id) {
        send_response(false, 'Не указан ID сборки', 400);
    }

    $check = $db->prepare('SELECT id FROM user_builds WHERE id = :id AND user_id = :user_id LIMIT 1');
    $check->execute([':id' => $build_id, ':user_id' => $user_id]);

    if ($check->rowCount() === 0) {
        send_response(false, 'Сборка не найдена или нет доступа', 404);
    }

    $fields = [];
    $params = [];

    if (isset($input['name'])) {
        $fields[] = 'name = :name';
        $params[':name'] = htmlspecialchars(trim($input['name']));
    }

    if (isset($input['total_price'])) {
        $fields[] = 'total_price = :price';
        $params[':price'] = (float) $input['total_price'];
    }

    if (isset($input['components'])) {
        $fields[] = 'compatibility_data = :components';
        $params[':components'] = json_encode($input['components'], JSON_UNESCAPED_UNICODE);
    }

    if (empty($fields)) {
        send_response(false, 'Нет данных для обновления', 400);
    }

    $fields[] = 'updated_at = NOW()';
    $params[':id'] = $build_id;

    $query = 'UPDATE user_builds SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $db->prepare($query)->execute($params);

    send_response(true, 'Сборка обновлена', 200);
}

function handle_get_builds(PDO $db, int $user_id): void
{
    $is_admin = ($_SESSION['role'] ?? '') === 'admin';
    
    $requested_user_id = (int) filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);
    
    if ($requested_user_id > 0) {
        $stmt = $db->prepare(
            'SELECT ub.*, u.username FROM user_builds ub
             LEFT JOIN users u ON ub.user_id = u.id
             WHERE ub.user_id = :user_id
             ORDER BY ub.created_at DESC'
        );
        $stmt->execute([':user_id' => $requested_user_id]);
    } 
    elseif ($is_admin) {
        $stmt = $db->query(
            'SELECT ub.*, u.username FROM user_builds ub
             LEFT JOIN users u ON ub.user_id = u.id
             ORDER BY ub.created_at DESC'
        );
    } 
    else {
        $stmt = $db->prepare(
            'SELECT ub.*, u.username FROM user_builds ub
             LEFT JOIN users u ON ub.user_id = u.id
             WHERE ub.user_id = :user_id
             ORDER BY ub.created_at DESC'
        );
        $stmt->execute([':user_id' => $user_id]);
    }

    $builds = $stmt->fetchAll();

    foreach ($builds as &$build) {
        $build['components'] = !empty($build['compatibility_data'])
            ? json_decode($build['compatibility_data'], true) ?: []
            : [];
    }

    send_response(true, '', 200, [
        'builds' => $builds,
        'user_is_admin' => $is_admin,
    ]);
}

function handle_get_public_builds(PDO $db): void
{
    $stmt = $db->query(
        'SELECT b.*, u.username FROM user_builds b
         LEFT JOIN users u ON b.user_id = u.id
         WHERE b.is_public = 1
         ORDER BY b.likes DESC, b.created_at DESC
         LIMIT 10'
    );

    $builds = $stmt->fetchAll();

    send_response(true, '', 200, ['builds' => $builds]);
}

function handle_toggle_public(PDO $db, int $user_id, array $input): void
{
    $build_id = (int) ($input['id'] ?? 0);
    $is_public = (int) ($input['is_public'] ?? 0);

    $stmt = $db->prepare('SELECT id FROM user_builds WHERE id = :id AND user_id = :user_id LIMIT 1');
    $stmt->execute([':id' => $build_id, ':user_id' => $user_id]);

    if ($stmt->rowCount() === 0) {
        send_response(false, 'Нет доступа', 403);
    }

    $db->prepare('UPDATE user_builds SET is_public = :public WHERE id = :id')
       ->execute([':public' => $is_public, ':id' => $build_id]);

    send_response(true, 'Статус изменён', 200);
}

function handle_like_build(PDO $db, int $user_id, array $input): void
{
    if ($user_id === 0) {
        send_response(false, 'Чтобы оценить сборку, войдите в систему', 401);
    }

    $build_id = (int) ($input['id'] ?? 0);

    $stmt = $db->prepare('SELECT liked_user, likes FROM user_builds WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $build_id]);
    $row = $stmt->fetch();

    if (!$row) {
        send_response(false, 'Сборка не найдена', 404);
    }

    $liked_users = json_decode($row['liked_user'] ?? '[]', true) ?: [];

    if (in_array($user_id, $liked_users, true)) {
        send_response(false, 'Вы уже оценили эту сборку', 409);
    }

    $liked_users[] = $user_id;
    $new_likes = (int) $row['likes'] + 1;

    $db->prepare('UPDATE user_builds SET likes = :likes, liked_user = :users WHERE id = :id')
       ->execute([
           ':likes' => $new_likes,
           ':users' => json_encode($liked_users),
           ':id' => $build_id,
       ]);

    send_response(true, '', 200, ['likes' => $new_likes]);
}

function handle_get_stats(PDO $db, int $user_id): void
{
    $total_stmt = $db->prepare('SELECT COUNT(*) FROM user_builds WHERE user_id = :user_id');
    $total_stmt->execute([':user_id' => $user_id]);
    $total = (int) $total_stmt->fetchColumn();

    $price_stmt = $db->prepare('SELECT COALESCE(SUM(total_price), 0) FROM user_builds WHERE user_id = :user_id');
    $price_stmt->execute([':user_id' => $user_id]);
    $total_price = (float) $price_stmt->fetchColumn();

    $last_stmt = $db->prepare(
        'SELECT name, total_price, created_at FROM user_builds
         WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1'
    );
    $last_stmt->execute([':user_id' => $user_id]);
    $last_build = $last_stmt->fetch();

    send_response(true, '', 200, [
        'stats' => [
            'total_builds' => $total,
            'total_price' => $total_price,
            'last_build' => $last_build ?: null,
        ],
    ]);
}

function is_build_empty(array $components): bool
{
    if (empty($components)) {
        return true;
    }

    foreach ($components as $type => $component) {
        if ($type === 'storages' && is_array($component) && count($component) > 0) {
            return false;
        }
        if (!empty($component)) {
            return false;
        }
    }

    return true;
}