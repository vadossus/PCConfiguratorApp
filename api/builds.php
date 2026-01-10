<?php

session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$action = $_GET['action'] ?? '';
$input = file_get_contents("php://input");
$data = json_decode($input, true);


function isBuildEmpty($components) {
    if (!$components) return true;
    
    foreach ($components as $type => $component) {
        if ($type === 'storages') {
            if (is_array($component) && count($component) > 0) {
                return false;
            }
        } elseif (!empty($component)) {
            return false;
        }
    }
    return true;
}

function getCategoryName($componentType) {
    $categoryNames = [
        'cpus' => 'Процессоры',
        'motherboards' => 'Материнские платы',
        'rams' => 'Оперативная память',
        'gpus' => 'Видеокарты',
        'storages' => 'Накопители',
        'psus' => 'Блоки питания',
        'cases' => 'Корпуса',
        'coolers' => 'Охлаждение'
    ];
    return $categoryNames[$componentType] ?? $componentType;
}


function getFullComponentData($componentId, $componentType, $db) {
    error_log("=== ПОИСК КОМПОНЕНТА ===");
    error_log("ID: $componentId");
    error_log("Тип: $componentType");
    
    if (!$componentId || !$componentType) {
        error_log("Ошибка: нет ID или типа компонента");
        return null;
    }
    
    try {
        $tableMap = [
            'cpus' => 'cpus',
            'motherboards' => 'motherboards',
            'rams' => 'rams',
            'gpus' => 'gpus',
            'storages' => 'storages',
            'psus' => 'psus',
            'cases' => 'cases',
            'coolers' => 'coolers'
        ];
        
        $tableName = $tableMap[$componentType] ?? null;
        
        if (!$tableName) {
            error_log("Ошибка: неизвестный тип компонента '$componentType'");
            return null;
        }
        
        error_log("Ищем в таблице: $tableName");
        
        $checkTable = $db->query("SHOW TABLES LIKE '$tableName'");
        if ($checkTable->rowCount() === 0) {
            error_log("Ошибка: таблица '$tableName' не существует!");
            return null;
        }
        
        $checkQuery = "SELECT COUNT(*) as count FROM $tableName WHERE id = ?";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$componentId]);
        $count = $checkStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        error_log("Найдено записей с ID $componentId: $count");
        
        if ($count == 0) {
            error_log("Ошибка: компонент с ID $componentId не найден в таблице $tableName");
            return null;
        }
        
        $query = "SELECT * FROM $tableName WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$componentId]);
        $component = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($component) {
            error_log("Найден компонент: " . json_encode($component));
            $component['category_slug'] = $componentType;
            $component['category_name'] = getCategoryName($componentType);
            
            if (isset($component['critical_specs']) && is_string($component['critical_specs'])) {
                $decoded = json_decode($component['critical_specs'], true);
                if ($decoded !== null) {
                    $component['critical_specs'] = $decoded;
                }
            }
            
            if (isset($component['compatibility_flags']) && is_string($component['compatibility_flags'])) {
                $decoded = json_decode($component['compatibility_flags'], true);
                if ($decoded !== null) {
                    $component['compatibility_flags'] = $decoded;
                }
            }
            
            return $component;
        }
        
        error_log("Не удалось получить данные компонента");
        return null;
        
    } catch (Exception $e) {
        error_log("Исключение при поиске компонента: " . $e->getMessage());
        error_log("Trace: " . $e->getTraceAsString());
        return null;
    }
}

if ($action === 'save') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false, 
            "message" => "Необходима авторизация. Пожалуйста, войдите в систему."
        ]);
        exit;
    }

    if (!$data) {
        http_response_code(400);
        echo json_encode([
            "success" => false, 
            "message" => "Нет данных для сохранения"
        ]);
        exit;
    }

    if (empty($data['components']) || isBuildEmpty($data['components'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false, 
            "message" => "Сборка пуста. Выберите хотя бы один компонент."
        ]);
        exit;
    }

    try {
        $db->beginTransaction();

        $buildName = isset($data['name']) && !empty($data['name']) 
            ? htmlspecialchars($data['name']) 
            : "Моя сборка " . date('d.m.Y H:i');
        
        $totalPrice = isset($data['total_price']) ? floatval($data['total_price']) : 0;
        
        $componentsForSave = [];
        foreach ($data['components'] as $type => $component) {
            if (!$component || (is_array($component) && empty($component))) {
                continue;
            }
            
            if ($type === 'storages' && is_array($component)) {
                $componentsForSave[$type] = [];
                foreach ($component as $item) {
                    if (is_array($item)) {
                        $storageData = [
                            'id' => $item['id'] ?? 0,
                            'name' => $item['name'] ?? 'Накопитель',
                            'price' => $item['price'] ?? 0
                        ];
                        
                        if (isset($item['image'])) {
                            $storageData['image'] = $item['image'];
                        }
                        
                        $componentsForSave[$type][] = $storageData;
                    }
                }
            } elseif (is_array($component)) {
                // Сохраняем все данные, включая image если есть
                $componentData = [
                    'id' => $component['id'] ?? 0,
                    'name' => $component['name'] ?? 'Компонент',
                    'price' => $component['price'] ?? 0
                ];
                
                // Добавляем image если есть
                if (isset($component['image'])) {
                    $componentData['image'] = $component['image'];
                }
                
                $componentsForSave[$type] = $componentData;
            }
        }
        
        $compData = json_encode($componentsForSave, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
        $queryBuild = "INSERT INTO user_builds 
                       SET user_id = :user_id, 
                           name = :name, 
                           total_price = :total_price, 
                           compatibility_data = :comp_data,
                           created_at = NOW(),
                           updated_at = NOW()";

        $stmtBuild = $db->prepare($queryBuild);
        $stmtBuild->bindParam(":user_id", $_SESSION['user_id']);
        $stmtBuild->bindParam(":name", $buildName);
        $stmtBuild->bindParam(":total_price", $totalPrice);
        $stmtBuild->bindParam(":comp_data", $compData);
        $stmtBuild->execute();
        
        $buildId = $db->lastInsertId();

        $db->commit();
        
        echo json_encode([
            "success" => true, 
            "message" => "Сборка успешно сохранена", 
            "build_id" => $buildId,
            "name" => $buildName,
            "total_price" => $totalPrice
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        error_log("Ошибка сохранения сборки: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false, 
            "message" => "Ошибка сохранения сборки"
        ]);
    }
    exit;
}

if ($action === 'delete') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false, 
            'message' => 'Войдите в систему'
        ]);
        exit;
    }
    
    $id = isset($data['id']) ? intval($data['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Не указан ID сборки'
        ]);
        exit;
    }
    
    try {
        $db->beginTransaction();
        
        $query = "DELETE FROM user_builds WHERE id = ? AND user_id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$id, $_SESSION['user_id']]);
        
        $deleted = $stmt->rowCount() > 0;
        
        $db->commit();
        
        if ($deleted) {
            echo json_encode([
                'success' => true, 
                'message' => 'Сборка успешно удалена'
            ]);
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'Сборка не найдена или нет прав доступа'
            ]);
        }
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Ошибка удаления сборки: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка удаления сборки'
        ]);
    }
    exit;
}

if ($action === 'get_component_single') {
    try {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Требуется авторизация']);
            exit;
        }
        
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        $type = isset($_GET['type']) ? $_GET['type'] : '';
        
        if (!$id || !$type) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Не указаны параметры']);
            exit;
        }
        
        $tableMap = [
            'cpus' => 'cpus',
            'motherboards' => 'motherboards',
            'rams' => 'rams',
            'gpus' => 'gpus',
            'storages' => 'storages',
            'psus' => 'psus',
            'cases' => 'cases',
            'coolers' => 'coolers'
        ];
        
        $tableName = $tableMap[$type] ?? null;
        if (!$tableName) {
            echo json_encode(['success' => false, 'message' => 'Неверный тип компонента']);
            exit;
        }
        
        $query = "SELECT * FROM $tableName WHERE id = ?";
        $stmt = $db->prepare($query);
        $stmt->execute([$id]);
        $component = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($component) {
            echo json_encode([
                'success' => true,
                'component' => $component
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Компонент не найден'
            ]);
        }
        
    } catch (Exception $e) {
        error_log("Ошибка получения компонента: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Ошибка получения компонента'
        ]);
    }
    exit;
}
if ($action === 'get_builds') {
    try {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Требуется авторизация']);
            exit;
        }
        
        $userQuery = "SELECT role FROM users WHERE id = ?";
        $userStmt = $db->prepare($userQuery);
        $userStmt->execute([$_SESSION['user_id']]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Пользователь не найден']);
            exit;
        }
        
        $isAdmin = ($user['role'] === 'admin');
        
        if ($isAdmin) {
            $query = "SELECT ub.*, u.username 
                      FROM user_builds ub 
                      LEFT JOIN users u ON ub.user_id = u.id 
                      ORDER BY ub.created_at DESC";
            $params = [];
        } else {
            $query = "SELECT ub.*, u.username 
                      FROM user_builds ub 
                      LEFT JOIN users u ON ub.user_id = u.id 
                      WHERE ub.user_id = ?
                      ORDER BY ub.created_at DESC";
            $params = [$_SESSION['user_id']];
        }
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $builds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($builds as &$build) {
            if (!empty($build['compatibility_data'])) {
                $decodedData = json_decode($build['compatibility_data'], true);
                if ($decodedData !== null) {
                    $fullComponents = [];
                    foreach ($decodedData as $type => $componentData) {
                        if ($type === 'storages' && is_array($componentData)) {
                            $fullComponents[$type] = [];
                            foreach ($componentData as $storage) {
                                $fullStorage = getFullComponentData($storage['id'], 'storages', $db);
                                if ($fullStorage) {
                                    $fullComponents[$type][] = $fullStorage;
                                }
                            }
                        } else {
                            $fullComponent = getFullComponentData($componentData['id'], $type, $db);
                            if ($fullComponent) {
                                $fullComponents[$type] = $fullComponent;
                            }
                        }
                    }
                    $build['components'] = $fullComponents;
                } else {
                    $build['components'] = [];
                }
            } else {
                $build['components'] = [];
            }
        }
        
        echo json_encode([
            'success' => true,
            'builds' => $builds,
            'user_is_admin' => $isAdmin  
        ]);
        
    } catch (Exception $e) {
        error_log("Ошибка получения сборок: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Ошибка получения сборок'
        ]);
    }
    exit;
}

if ($action === 'update') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Войдите в систему']);
        exit;
    }
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Нет данных для обновления']);
        exit;
    }
    
    $id = isset($data['id']) ? intval($data['id']) : 0;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Не указан ID сборки']);
        exit;
    }
    
    try {
        $db->beginTransaction();

        $checkQuery = "SELECT id FROM user_builds WHERE id = ? AND user_id = ?";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->execute([$id, $_SESSION['user_id']]);
        
        if ($checkStmt->rowCount() === 0) {
            $db->rollBack();
            echo json_encode([
                'success' => false, 
                'message' => 'Сборка не найдена или нет прав доступа'
            ]);
            exit;
        }
        

        $updateFields = [];
        $updateParams = [];
        
        if (isset($data['name'])) {
            $updateFields[] = "name = ?";
            $updateParams[] = htmlspecialchars($data['name']);
        }
        
        if (isset($data['total_price'])) {
            $updateFields[] = "total_price = ?";
            $updateParams[] = floatval($data['total_price']);
        }
        
        if (isset($data['components'])) {
            $componentsJson = json_encode($data['components'], JSON_UNESCAPED_UNICODE);
            $updateFields[] = "compatibility_data = ?";
            $updateParams[] = $componentsJson;
        }
        
        $updateFields[] = "updated_at = NOW()";
        
        if (empty($updateFields)) {
            $db->rollBack();
            echo json_encode(['success' => false, 'message' => 'Нет данных для обновления']);
            exit;
        }
        

        $updateQuery = "UPDATE user_builds SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $updateParams[] = $id;
        
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute($updateParams);
        
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Сборка обновлена'
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log("Ошибка обновления сборки: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка обновления сборки'
        ]);
    }
    exit;
}

if ($action === 'stats') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Войдите в систему']);
        exit;
    }
    
    try {
        $totalQuery = "SELECT COUNT(*) as total FROM user_builds WHERE user_id = ?";
        $totalStmt = $db->prepare($totalQuery);
        $totalStmt->execute([$_SESSION['user_id']]);
        $total = $totalStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $priceQuery = "SELECT COALESCE(SUM(total_price), 0) as total_price FROM user_builds WHERE user_id = ?";
        $priceStmt = $db->prepare($priceQuery);
        $priceStmt->execute([$_SESSION['user_id']]);
        $totalPrice = $priceStmt->fetch(PDO::FETCH_ASSOC)['total_price'];
        
        $lastQuery = "SELECT name, total_price, created_at 
                      FROM user_builds 
                      WHERE user_id = ? 
                      ORDER BY created_at DESC 
                      LIMIT 1";
        $lastStmt = $db->prepare($lastQuery);
        $lastStmt->execute([$_SESSION['user_id']]);
        $lastBuild = $lastStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_builds' => $total,
                'total_price' => floatval($totalPrice),
                'last_build' => $lastBuild
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Ошибка получения статистики: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка получения статистики'
        ]);
    }
    exit;
}


if ($_SERVER['REQUEST_METHOD'] == 'GET' && $action == 'list') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(["success" => false, "builds" => [], "message" => "Не авторизован"]);
        exit;
    }

    try {
        $query = "SELECT * FROM user_builds WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute([$_SESSION['user_id']]);
        $builds = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "builds" => $builds]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "builds" => [], "message" => $e->getMessage()]);
    }
    exit;
}


http_response_code(404);
echo json_encode([
    'success' => false, 
    'message' => 'Неизвестное действие',
    'available_actions' => [
        'get_user_builds', 
        'save', 
        'delete', 
        'get_build', 
        'update', 
        'stats', 
        'list'
    ]
]);
?>