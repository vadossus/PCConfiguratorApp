<?php
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/classes/Component.php';

header('Content-Type: application/json; charset=utf-8');
set_cors_headers();

$db = (new Database())->connect();
$component = new Component($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_request($component);
        break;

    case 'POST':
        require_admin();
        handle_create_request($component, get_json_input());
        break;

    case 'PUT':
        require_admin();
        handle_update_request($component, get_json_input());
        break;

    case 'DELETE':
        require_admin();
        handle_delete_request($component, get_json_input());
        break;

    default:
        send_response(false, 'Метод не разрешён', 405);
}

function handle_get_request(Component $component): void
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    if ($id) {
        $result = $component->getById((int) $id);
        if (!$result) {
            send_response(false, 'Компонент не найден', 404);
        }
        send_response(true, '', 200, ['component' => $result]);
    }

    $category = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_SPECIAL_CHARS);
    $page = (int) (filter_input(INPUT_GET, 'page', FILTER_VALIDATE_INT) ?: 1);
    $limit = (int) (filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 10);
    $search = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_SPECIAL_CHARS);
    $is_active = filter_input(INPUT_GET, 'is_active', FILTER_VALIDATE_INT);
    $socket = filter_input(INPUT_GET, 'socket', FILTER_SANITIZE_SPECIAL_CHARS);
    $memory_type = filter_input(INPUT_GET, 'memory_type', FILTER_SANITIZE_SPECIAL_CHARS);
    $form_factor = filter_input(INPUT_GET, 'form_factor', FILTER_SANITIZE_SPECIAL_CHARS);
    $min_wattage = filter_input(INPUT_GET, 'min_wattage', FILTER_VALIDATE_INT);

    $filters = [];
    if ($search !== null && $search !== '') $filters['search'] = $search;
    if ($is_active !== null && $is_active !== '') $filters['is_active'] = $is_active;
    if ($socket !== null && $socket !== '') $filters['socket'] = $socket;
    if ($memory_type !== null && $memory_type !== '') $filters['memory_type'] = $memory_type;
    if ($form_factor !== null && $form_factor !== '') $filters['form_factor'] = $form_factor;
    if ($min_wattage !== null && $min_wattage !== '') $filters['min_wattage'] = $min_wattage;

    $components = $component->getAll($category, $page, $limit, $filters);
    $total = $component->getCount($category, $filters);

    send_response(true, '', 200, [
        'components' => $components ?: [],
        'current_page' => $page,
        'total_pages' => $total > 0 ? (int) ceil($total / $limit) : 0,
        'total_items' => $total,
        'items_per_page' => $limit,
    ]);
}

function handle_create_request(Component $component, array $input): void
{
    $required = ['category_code', 'name', 'price'];

    foreach ($required as $field) {
        if (empty($input[$field])) {
            send_response(false, "Поле '{$field}' обязательно", 400);
        }
    }

    try {
        $id = $component->create($input);
        send_response(true, 'Компонент добавлен', 201, ['id' => $id]);
    } catch (RuntimeException $e) {
        send_response(false, $e->getMessage(), 400);
    } catch (Throwable $e) {
        send_response(false, 'Ошибка сервера', 500);
    }
}

function handle_update_request(Component $component, array $input): void
{
    $id = (int) ($input['id'] ?? 0);

    if (!$id) {
        send_response(false, 'ID компонента не указан', 400);
    }

    try {
        $component->update($id, $input);
        send_response(true, 'Компонент обновлён', 200);
    } catch (RuntimeException $e) {
        send_response(false, $e->getMessage(), 404);
    } catch (Throwable $e) {
        send_response(false, 'Ошибка сервера', 500);
    }
}

function handle_delete_request(Component $component, array $input): void
{
    $id = (int) ($input['id'] ?? 0);

    if (!$id) {
        send_response(false, 'ID компонента не указан', 400);
    }

    $hard_delete = !empty($input['hard_delete']);

    try {
        if ($hard_delete) {
            $component->hardDelete($id);
            send_response(true, 'Компонент удалён полностью', 200);
        } else {
            $component->softDelete($id);
            send_response(true, 'Компонент деактивирован', 200);
        }
    } catch (RuntimeException $e) {
        send_response(false, $e->getMessage(), 404);
    } catch (Throwable $e) {
        send_response(false, 'Ошибка сервера', 500);
    }
}