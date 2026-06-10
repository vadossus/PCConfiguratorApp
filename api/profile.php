<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json; charset=utf-8');
set_cors_headers();
require_auth();

$db = (new Database())->connect();
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

if ($action !== 'update') {
    send_response(false, 'Неизвестное действие', 400);
}

$input = get_json_input();
$user_id = (int) $_SESSION['user_id'];

$new_username = trim($input['username'] ?? '');
$new_email = trim($input['email'] ?? '');
$old_password = $input['old_password'] ?? '';
$new_password = $input['new_password'] ?? '';

if (empty($new_username) || empty($new_email)) {
    send_response(false, 'Логин и email обязательны', 400);
}

if (!filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
    send_response(false, 'Некорректный email', 400);
}

$current_user = get_user_by_id($db, $user_id);
if (!$current_user) {
    send_response(false, 'Пользователь не найден', 404);
}

if ($new_username !== $current_user['username'] && is_field_taken($db, 'username', $new_username, $user_id)) {
    send_response(false, 'Логин уже занят', 409);
}

if ($new_email !== $current_user['email'] && is_field_taken($db, 'email', $new_email, $user_id)) {
    send_response(false, 'Email уже используется', 409);
}

$update_query = 'UPDATE users SET username = :username, email = :email';
$params = [':username' => $new_username, ':email' => $new_email];

if (!empty($old_password) && !empty($new_password)) {
    if (!password_verify($old_password, $current_user['password'])) {
        send_response(false, 'Неверный старый пароль', 400);
    }

    if (strlen($new_password) < 6) {
        send_response(false, 'Пароль должен содержать минимум 6 символов', 400);
    }

    $update_query .= ', password = :password';
    $params[':password'] = password_hash($new_password, PASSWORD_BCRYPT);
}

$update_query .= ' WHERE id = :id';
$params[':id'] = $user_id;

$stmt = $db->prepare($update_query);
$stmt->execute($params);

$_SESSION['username'] = $new_username;

send_response(true, 'Профиль обновлён', 200, [
    'user' => [
        'id' => $user_id,
        'username' => $new_username,
        'email' => $new_email,
    ],
]);

function get_user_by_id(PDO $db, int $id): array|false
{
    $stmt = $db->prepare('SELECT id, username, email, password FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    return $stmt->fetch();
}

function is_field_taken(PDO $db, string $field, string $value, int $exclude_id): bool
{
    $stmt = $db->prepare("SELECT id FROM users WHERE {$field} = :value AND id != :id LIMIT 1");
    $stmt->execute([':value' => $value, ':id' => $exclude_id]);
    return $stmt->rowCount() > 0;
}