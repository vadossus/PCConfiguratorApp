<?php
declare(strict_types=1);

function set_cors_headers(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Credentials: true');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}

function get_json_input(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        send_response(false, 'Некорректный JSON', 400);
    }

    return $data ?? [];
}

function send_response(bool $success, string $message, int $code = 200, array $extra = []): void
{
    http_response_code($code);
    $response = array_merge(['success' => $success, 'message' => $message], $extra);
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function require_auth(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (empty($_SESSION['user_id'])) {
        send_response(false, 'Требуется авторизация', 401);
    }
}

function require_admin(): void
{
    require_auth();

    $role = $_SESSION['role'] ?? '';
    if ($role !== 'admin' && $role !== 'sadmin') {
        send_response(false, 'Доступ запрещен', 403);
    }
}