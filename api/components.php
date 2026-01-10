<?php

ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");


function sendError($message, $code = 500) {
    http_response_code($code);
    echo json_encode([
        "success" => false,
        "message" => $message
    ]);
    exit();
}


function sendSuccess($data = [], $code = 200) {
    http_response_code($code);
    echo json_encode(array_merge(["success" => true], $data));
    exit();
}

try {
    include_once '../config/database.php';
    include_once 'classes/Component.php';

    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        sendError("Не удалось подключиться к базе данных", 500);
    }
    
    $component = new Component($db);

    function checkAdminAuth() {
        @session_start();
        if(!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
            sendError("Доступ запрещен. Требуются права администратора.", 401);
        }
    }

    if($_SERVER['REQUEST_METHOD'] == 'GET') {
        $category = isset($_GET['category']) ? $_GET['category'] : null;
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
        
        $filters = [];
        if(isset($_GET['socket'])) $filters['socket'] = $_GET['socket'];
        if(isset($_GET['memory_type'])) $filters['memory_type'] = $_GET['memory_type'];
        if(isset($_GET['type'])) $filters['type'] = $_GET['type'];
        if(isset($_GET['search'])) $filters['search'] = $_GET['search'];

        if(isset($_GET['id'])) {
            $id = intval($_GET['id']);
            if ($id <= 0) {
                sendError("Неверный ID компонента", 400);
            }
            
            $component_data = $component->getById($id);
            
            if($component_data) {
                if(!empty($component_data['specs'])) {
                    $component_data['specs'] = json_decode($component_data['specs'], true);
                }
                if(!empty($component_data['compatibility_flags'])) {
                    $component_data['compatibility_flags'] = json_decode($component_data['compatibility_flags'], true);
                }
                if(!empty($component_data['critical_specs'])) {
                    $component_data['critical_specs'] = json_decode($component_data['critical_specs'], true);
                }
                
                sendSuccess(["component" => $component_data]);
            } else {
                sendError("Компонент не найден.", 404);
            }
        } 
        else {
            $components = $component->getAll($category, $page, $limit, $filters);
            $total = $component->getCount($category, $filters);
            $total_pages = $total > 0 ? ceil($total / $limit) : 0;

            if (is_array($components)) {
                foreach($components as &$comp) {
                    if(!empty($comp['specs'])) {
                        $comp['specs'] = json_decode($comp['specs'], true);
                    }
                    if(!empty($comp['compatibility_flags'])) {
                        $comp['compatibility_flags'] = json_decode($comp['compatibility_flags'], true);
                    }
                    if(!empty($comp['critical_specs'])) {
                        $comp['critical_specs'] = json_decode($comp['critical_specs'], true);
                    }
                }
            }

            sendSuccess([
                "components" => $components ?: [],
                "current_page" => $page,
                "total_pages" => $total_pages,
                "total_items" => $total,
                "items_per_page" => $limit
            ]);
        }
    }
    elseif($_SERVER['REQUEST_METHOD'] == 'POST') {
        checkAdminAuth();
        
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if(!empty($data->category_id) && !empty($data->name) && !empty($data->price)) {
            $component->category_id = $data->category_id;
            $component->name = $data->name;
            $component->description = isset($data->description) ? $data->description : null;
            $component->price = $data->price;
            $component->image = isset($data->image) ? $data->image : null;
            $component->socket = isset($data->socket) ? $data->socket : null;
            $component->memory_type = isset($data->memory_type) ? $data->memory_type : null;
            $component->form_factor = isset($data->form_factor) ? $data->form_factor : null;
            $component->wattage = isset($data->wattage) ? $data->wattage : null;
            $component->efficiency = isset($data->efficiency) ? $data->efficiency : null;
            $component->capacity = isset($data->capacity) ? $data->capacity : null;
            $component->speed = isset($data->speed) ? $data->speed : null;
            $component->tdp = isset($data->tdp) ? $data->tdp : null;
            $component->type = isset($data->type) ? $data->type : null;
            $component->specs = isset($data->specs) ? (array)$data->specs : [];
            $component->compatibility_flags = isset($data->compatibility_flags) ? (array)$data->compatibility_flags : [];
            $component->critical_specs = isset($data->critical_specs) ? (array)$data->critical_specs : [];

            $component_id = $component->create();
            
            if($component_id) {
                sendSuccess([
                    "message" => "Компонент успешно добавлен.",
                    "id" => $component_id
                ], 201);
            } else {
                sendError("Ошибка при добавлении компонента.", 503);
            }
        } else {
            sendError("Не все обязательные поля заполнены.", 400);
        }
    }
    elseif($_SERVER['REQUEST_METHOD'] == 'PUT') {
        checkAdminAuth();
        
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if(!empty($data->id)) {
            $component->id = $data->id;
            $component->category_id = $data->category_id;
            $component->name = $data->name;
            $component->description = $data->description;
            $component->price = $data->price;
            $component->image = $data->image;
            $component->socket = $data->socket;
            $component->memory_type = $data->memory_type;
            $component->form_factor = $data->form_factor;
            $component->wattage = $data->wattage;
            $component->efficiency = $data->efficiency;
            $component->capacity = $data->capacity;
            $component->speed = $data->speed;
            $component->tdp = $data->tdp;
            $component->type = $data->type;
            $component->specs = $data->specs;
            $component->compatibility_flags = $data->compatibility_flags;
            $component->critical_specs = $data->critical_specs;

            if($component->update()) {
                sendSuccess(["message" => "Компонент успешно обновлен."]);
            } else {
                sendError("Ошибка при обновлении компонента.", 503);
            }
        } else {
            sendError("Не указан ID компонента.", 400);
        }
    }
    elseif($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        checkAdminAuth();
        
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        if(!empty($data->id)) {
            if($component->delete($data->id)) {
                sendSuccess(["message" => "Компонент успешно удален."]);
            } else {
                sendError("Ошибка при удалении компонента.", 503);
            }
        } else {
            sendError("Не указан ID компонента.", 400);
        }
    } else {
        sendError("Метод не поддерживается.", 405);
    }
    
} catch (Exception $e) {
    sendError("Ошибка сервера: " . $e->getMessage());
} catch (PDOException $e) {
    sendError("Ошибка базы данных: " . $e->getMessage());
}
?>