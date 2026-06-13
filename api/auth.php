<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/classes/User.php';

header('Content-Type: application/json; charset=utf-8');
set_cors_headers();

$db = (new Database())->connect();
$user = new User($db);

$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = get_json_input();

switch ($action) {
    case 'register':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_register($user, $input);
        break;

    case 'login':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_login($user, $input);
        break;

    case 'logout':
        handle_logout();
        break;

    case 'validate':
        handle_validate_session($db);
        break;

    case 'restore_session':
        if ($method !== 'POST') send_response(false, 'Метод не разрешён', 405);
        handle_restore_session($db, $input);
        break;

    default:
        send_response(false, 'Неизвестное действие', 400);
}

function handle_register(User $user, array $input): void
{
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($username) || empty($email) || empty($password)) {
        send_response(false, 'Заполните все поля', 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        send_response(false, 'Некорректный email', 400);
    }

    if (strlen($password) < 6) {
        send_response(false, 'Пароль должен содержать минимум 6 символов', 400);
    }

    $user->username = $username;
    $user->email = $email;
    $user->password = $password;
    $user->role = $input['role'] ?? 'user';

    if ($user->exists()) {
        send_response(false, 'Пользователь уже существует', 409);
    }

    if (!$user->register()) {
        send_response(false, 'Ошибка регистрации', 500);
    }

    $user_data = $user->findById($user->id);
    if (!$user_data) {
        send_response(false, 'Ошибка получения данных', 500);
    }

    start_user_session($user_data);
    send_response(true, 'Регистрация успешна', 201, [
        'user' => $user_data,
        'session_id' => session_id(),
    ]);
}

function handle_login(User $user, array $input): void
{
    $login = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (empty($login) || empty($password)) {
        send_response(false, 'Заполните все поля', 400);
    }

    $user->username = $login;
    $user->password = $password;
    $user_data = $user->login();

    if (!$user_data) {
        send_response(false, 'Неверное имя пользователя или пароль', 401);
    }

    start_user_session($user_data);
    send_response(true, 'Вход выполнен', 200, [
        'user' => $user_data,
        'session_id' => session_id(),
    ]);
}

function handle_logout(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]
        );
    }

    session_destroy();
    send_response(true, 'Выход выполнен', 200);
}

function handle_validate_session(PDO $db): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (empty($_SESSION['user_id'])) {
        send_response(true, '', 200, ['valid' => false]);
    }

    $stmt = $db->prepare('SELECT id, username, email, role, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user_data = $stmt->fetch();

    if ($user_data) {
        send_response(true, '', 200, ['valid' => true, 'user' => $user_data]);
    } else {
        session_destroy();
        send_response(true, '', 200, ['valid' => false]);
    }
}

function handle_restore_session(PDO $db, array $input): void
{
    $user_id = (int) ($input['user_id'] ?? 0);
    $username = trim($input['username'] ?? '');

    if (!$user_id || empty($username)) {
        send_response(false, 'Недостаточно данных', 400);
    }

    $stmt = $db->prepare(
        'SELECT id, username, email, role, created_at FROM users WHERE id = :id AND username = :username LIMIT 1'
    );
    $stmt->execute([':id' => $user_id, ':username' => $username]);
    $user_data = $stmt->fetch();

    if (!$user_data) {
        send_response(false, 'Пользователь не найден', 401);
    }

    start_user_session($user_data);
    send_response(true, '', 200, [
        'user' => $user_data,
        'session_id' => session_id(),
    ]);
}

function start_user_session(array $user): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    session_regenerate_id(true);
}