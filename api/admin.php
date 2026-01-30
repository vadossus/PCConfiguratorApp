<?php
ob_start();
session_start();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");


if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
    exit;
}

include_once __DIR__ . '/../config/database.php';

$database = new Database();
$db = $database->getConnection();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Доступ запрещен']);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);
switch($action) {
    case 'get_count':
        getCount($db);
        break;
    case 'get_components':
        getComponents($db);
        break;
    case 'get_users':
        getUsers($db);
        break;
    case 'get_builds':
        getBuilds($db);
        break;
    case 'add_component':
        addComponent($db, $input);
        break;
    case 'update_user_role':
        updateUserRole($db, $input);
        break;
    case 'delete_component':
        deleteComponent($db, $input);
        break;
    case 'delete_user':
        deleteUser($db, $input);
        break;
    case 'toggle_component':
        toggleComponent($db, $input);
        break;
    case 'update_component':
        updateComponent($db, $input);
        break;
    case 'get_component':
        getComponent($db);
        break;
    case 'delete_build':
        deleteBuild($db, $input);
        break;
    case 'log_activity':
        logActivity($db, $input);
        break;
    case 'get_activities':
        getActivities($db);
        break;
    case 'check_component_activity':
        $componentId = $_GET['id'] ?? 0;      
        if (!$componentId) {
            echo json_encode(['success' => false, 'message' => 'Не указан ID']);
            exit;
        }
        try {
            $stmt = $db->prepare("SELECT is_active FROM components WHERE id = ?");
            $stmt->execute([$componentId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                echo json_encode([
                    'success' => true, 
                    'is_active' => (int)$result['is_active'] === 1
                ]);
            } else {
                echo json_encode(['success' => false, 'is_active' => false, 'message' => 'Компонент не найден']);
            }
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'ошибка БД']);
        }
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'неизвестное действие: ' . $action]);
}

function getCount($pdo) {
    $table = $_GET['table'] ?? '';
    $allowed_tables = ['users', 'components', 'user_builds'];
    
    if (!in_array($table, $allowed_tables)) {
        echo json_encode(['success' => false, 'message' => 'Недопустимая таблица']);
        return;
    }
    
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'count' => (int)$result['count']]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка запроса: ' . $e->getMessage(), 'count' => 0]);
    }
}

function getComponents($pdo) {
     try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'components'");
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => true, 'components' => [], 'message' => 'Таблица components не существует']);
            return;
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM components LIKE 'category_id'");
        if ($stmt->rowCount() > 0) {
            $query = "SELECT c.*, cat.slug as category_slug, cat.name as category_name 
                     FROM components c 
                     LEFT JOIN component_categories cat ON c.category_id = cat.id 
                     ORDER BY c.created_at DESC";
        } else {
            $query = "SELECT *, '' as category_slug, '' as category_name FROM components ORDER BY created_at DESC";
        }
        
        $stmt = $pdo->query($query);
        $components = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($components as &$component) {
            if (isset($component['critical_specs'])) {
                if (empty($component['critical_specs'])) {
                    $component['critical_specs'] = [];
                } else {
                    $decoded = json_decode($component['critical_specs'], true);
                    $component['critical_specs'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                        ? [] 
                        : $decoded;
                }
            } else {
                $component['critical_specs'] = [];
            }
            
            if (isset($component['compatibility_flags'])) {
                if (empty($component['compatibility_flags'])) {
                    $component['compatibility_flags'] = [];
                } else {
                    $decoded = json_decode($component['compatibility_flags'], true);
                    $component['compatibility_flags'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                        ? [] 
                        : $decoded;
                }
            } else {
                $component['compatibility_flags'] = [];
            }
            
            if (isset($component['specs'])) {
                if (empty($component['specs'])) {
                    $component['specs'] = [];
                } else {
                    $decoded = json_decode($component['specs'], true);
                    $component['specs'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                        ? [] 
                        : $decoded;
                }
            } else {
                $component['specs'] = [];
            }
            
            foreach(['socket', 'memory_type', 'form_factor', 'efficiency', 'type'] as $field) {
                if (isset($component[$field]) && $component[$field] === null) {
                    $component[$field] = '';
                }
            }
        }
        
        echo json_encode(['success' => true, 'components' => $components]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка загрузки компонентов: ' . $e->getMessage(), 'components' => []]);
    }
}

function getUsers($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'user_builds'");
        if ($stmt->rowCount() === 0) {
            $stmt = $pdo->query("SELECT *, 0 as builds_count FROM users ORDER BY created_at DESC");
        } else {
            $stmt = $pdo->query("
                SELECT u.*, 
                       (SELECT COUNT(*) FROM user_builds ub WHERE ub.user_id = u.id) as builds_count 
                FROM users u 
                ORDER BY u.created_at DESC
            ");
        }
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($users as &$user) {
            if (isset($user['created_at'])) {
                $user['created_at'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
            }
        }
        
        echo json_encode(['success' => true, 'users' => $users]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка загрузки пользователей: ' . $e->getMessage(), 'users' => []]);
    }
}


function getBuilds($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'user_builds'");
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => true, 'builds' => []]);
            return;
        }
        
        $stmt = $pdo->query("
            SELECT ub.*, u.username
            FROM user_builds ub
            LEFT JOIN users u ON ub.user_id = u.id
            ORDER BY ub.created_at DESC
            LIMIT 20
        ");
        
        $builds = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($builds as &$build) {
            $raw_data = $build['compatibility_data'] ?? '';
            if (!empty($raw_data)) {
                $decoded = json_decode($raw_data, true);
                $components = $decoded['components'] ?? $decoded ?? [];
                
                if (!empty($components)) {
                    $fullComponents = [];
                    foreach ($components as $type => $componentData) {
                        if ($type === 'storages' && is_array($componentData) && !empty($componentData)) {
                            $fullComponents[$type] = [];
                            foreach ($componentData as $storage) {
                                if (isset($storage['id'])) {
                                    $comp = getComponentById($pdo, $storage['id']);
                                    if ($comp) {
                                        $fullComponents[$type][] = $comp;
                                    }
                                }
                            }
                        } elseif (!empty($componentData) && isset($componentData['id'])) {
                            $comp = getComponentById($pdo, $componentData['id']);
                            if ($comp) {
                                $fullComponents[$type] = $comp;
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
        echo json_encode(['success' => true, 'builds' => $builds]);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка загрузки сборок: ' . $e->getMessage(), 'builds' => []]);
    }
}

function getComponentById($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT c.*, cat.slug as category_slug, cat.name as category_name 
            FROM components c 
            LEFT JOIN component_categories cat ON c.category_id = cat.id 
            WHERE c.id = ?
        ");
        $stmt->execute([$id]);
        $component = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($component) {
            $component = processComponentJSON($component);
        }
        
        return $component;
    } catch(Exception $e) {
        return null;
    }
}

function deleteBuild($pdo, $data) {
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID не указан']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM user_builds WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Сборка удалена']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Сборка не найдена']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка удаления: ' . $e->getMessage()]);
    }
}

function addComponent($pdo, $data) {
    if (empty($data['category_slug']) || empty($data['name']) || !isset($data['price'])) {
        echo json_encode(['success' => false, 'message' => 'Не все обязательные поля заполнены']);
        return;
    }
    
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM components");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $category_id = 1; 
        
        if (in_array('category_id', $columns)) {
            $stmt = $pdo->prepare("SELECT id FROM component_categories WHERE slug = ?");
            $stmt->execute([$data['category_slug']]);
            $category = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($category) {
                $category_id = $category['id'];
            } else {
                $categoryMapping = [
                    'cpus' => 1,
                    'motherboards' => 2,
                    'rams' => 3,
                    'gpus' => 4,
                    'storages' => 5,
                    'psus' => 6,
                    'cases' => 7,
                    'coolers' => 8
                ];
                
                if (isset($categoryMapping[$data['category_slug']])) {
                    $category_id = $categoryMapping[$data['category_slug']];
                }
            }
        }
        
        $componentData = [
            'name' => $data['name'],
            'price' => (float)$data['price'],
            'image' => $data['image'] ?? '',
            'is_active' => 1,
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        if (in_array('category_id', $columns)) {
            $componentData['category_id'] = $category_id;
        }
        
        $basicFields = [
            'description', 'socket', 'memory_type', 'form_factor', 
            'wattage', 'efficiency', 'capacity', 'speed', 'tdp', 'type'
        ];
        
        foreach($basicFields as $field) {
            if (in_array($field, $columns) && isset($data[$field]) && $data[$field] !== null && $data[$field] !== '') {
                $componentData[$field] = $data[$field];
            }
        }
        
        if (in_array('critical_specs', $columns) && isset($data['critical_specs'])) {
            if (is_array($data['critical_specs'])) {
                $componentData['critical_specs'] = json_encode($data['critical_specs'], JSON_UNESCAPED_UNICODE);
            } elseif (is_string($data['critical_specs']) && !empty($data['critical_specs'])) {
                $componentData['critical_specs'] = $data['critical_specs'];
            } else {
                $componentData['critical_specs'] = json_encode([]);
            }
        }
        
        if (in_array('compatibility_flags', $columns) && isset($data['compatibility_flags'])) {
            if (is_array($data['compatibility_flags'])) {
                $componentData['compatibility_flags'] = json_encode($data['compatibility_flags'], JSON_UNESCAPED_UNICODE);
            } elseif (is_string($data['compatibility_flags']) && !empty($data['compatibility_flags'])) {
                $componentData['compatibility_flags'] = $data['compatibility_flags'];
            } else {
                $componentData['compatibility_flags'] = json_encode([]);
            }
        }
        
        if (in_array('specs', $columns)) {
            $componentData['specs'] = json_encode([]);
        }
        
        $fields = implode(', ', array_keys($componentData));
        $placeholders = ':' . implode(', :', array_keys($componentData));
        
        $stmt = $pdo->prepare("INSERT INTO components ($fields) VALUES ($placeholders)");
        
        foreach($componentData as $key => $value) {
            if ($value === null) {
                $stmt->bindValue(":$key", null, PDO::PARAM_NULL);
            } else {
                $stmt->bindValue(":$key", $value);
            }
        }
        
        $stmt->execute();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Компонент успешно добавлен', 
            'id' => $pdo->lastInsertId()
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка добавления компонента: ' . $e->getMessage()]);
    }
}

function updateUserRole($pdo, $data) {
    if (empty($data['user_id']) || empty($data['role'])) {
        echo json_encode(['success' => false, 'message' => 'Не все данные предоставлены']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$data['role'], $data['user_id']]);
        
        echo json_encode(['success' => true, 'message' => 'Роль пользователя обновлена']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка обновления роли: ' . $e->getMessage()]);
    }
}

function deleteComponent($pdo, $data) {
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID не указан']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM components WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Компонент полностью удален из базы']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Компонент не найден']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
}

function deleteUser($pdo, $data) {
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID не указан']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role != 'admin'");
        $stmt->execute([$data['id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Пользователь удален']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Нельзя удалить администратора или пользователь не найден']);
        }
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка удаления пользователя: ' . $e->getMessage()]);
    }
}

function toggleComponent($pdo, $data) {
    if (empty($data['id']) || !isset($data['is_active'])) {
        echo json_encode(['success' => false, 'message' => 'Не все данные предоставлены']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE components SET is_active = ? WHERE id = ?");
        $stmt->execute([$data['is_active'] ? 1 : 0, $data['id']]);
        
        echo json_encode(['success' => true, 'message' => 'Статус компонента изменен']);
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка изменения статуса: ' . $e->getMessage()]);
    }
}

function getComponent($pdo) {
    try {
        $category = $_GET['category'] ?? null;
        $search = $_GET['search'] ?? null;
        $isActive = $_GET['is_active'] ?? null; 
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;
        
        $where = " WHERE 1=1";
        $params = [];
        $types = [];

        if ($category && $category !== 'all') {
            $where .= " AND cat.slug = ?";
            $params[] = $category;
            $types[] = 's';
        }
        
        if ($search) {
            $where .= " AND (c.name LIKE ? OR c.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
            $types[] = 's';
            $types[] = 's';
        }

        if ($isActive !== null && $isActive !== '') {
            $where .= " AND c.is_active = ?";
            $params[] = (int)$isActive;
            $types[] = 'i';
        }

        $countQuery = "SELECT COUNT(*) as total FROM components c 
                      LEFT JOIN component_categories cat ON c.category_id = cat.id" . $where;
        $countStmt = $pdo->prepare($countQuery);
        foreach($params as $i => $param) {
            $countStmt->bindValue($i + 1, $param);
        }
        $countStmt->execute();
        $total = (int)($countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0);


        $sortBy = $_GET['sort'] ?? 'c.created_at';
        $sortOrder = $_GET['order'] ?? 'desc';
        
  
        $allowedSort = ['id', 'name', 'price', 'c.created_at', 'is_active'];
        if (!in_array($sortBy, $allowedSort)) $sortBy = 'c.created_at';
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) $sortOrder = 'desc';

        $query = "SELECT c.*, cat.slug as category_slug, cat.name as category_name 
                  FROM components c 
                  LEFT JOIN component_categories cat ON c.category_id = cat.id 
                  $where 
                  ORDER BY $sortBy $sortOrder 
                  LIMIT ? OFFSET ?";
        

        $finalParams = $params;
        $finalParams[] = $limit;
        $finalParams[] = $offset;
        
        $finalTypes = $types;
        $finalTypes[] = 'i';
        $finalTypes[] = 'i';

        $stmt = $pdo->prepare($query);
        foreach($finalParams as $i => $param) {
            $type = $finalTypes[$i] ?? 's';
            $stmt->bindValue($i + 1, $param, $type === 'i' ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        
        $stmt->execute();
        $components = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach($components as &$component) {
            $component = processComponentJSON($component);
        }
        
        echo json_encode([
            'success' => true, 
            'components' => $components,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'message' => 'Ошибка: ' . $e->getMessage(),
            'components' => []
        ]);
    }
}

function updateComponent($pdo, $data) {
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID не указан']);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM components WHERE id = ?");
        $stmt->execute([$data['id']]);
        
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => false, 'message' => 'Компонент не найден']);
            return;
        }
        
        $updateData = [];
        $allowedFields = [
            'name', 'description', 'price', 'image', 'socket', 'memory_type',
            'form_factor', 'wattage', 'efficiency', 'capacity', 'speed', 'tdp', 'type',
            'specs', 'compatibility_flags', 'critical_specs', 'is_active'
        ];
        
        foreach($allowedFields as $field) {
            if (isset($data[$field])) {
                if (in_array($field, ['critical_specs', 'compatibility_flags', 'specs'])) {
                    if (is_array($data[$field])) {
                        $updateData[$field] = json_encode($data[$field], JSON_UNESCAPED_UNICODE);
                    } else {
                        $updateData[$field] = $data[$field];
                    }
                } else {
                    $updateData[$field] = $data[$field];
                }
            }
        }
        
        $updateData['updated_at'] = date('Y-m-d H:i:s');

        $setParts = [];
        $params = [];
        
        foreach($updateData as $field => $value) {
            $setParts[] = "$field = ?";
            $params[] = $value;
        }
        
        $params[] = $data['id']; 
        
        $query = "UPDATE components SET " . implode(', ', $setParts) . " WHERE id = ?";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Компонент успешно обновлен',
            'updated_at' => $updateData['updated_at']
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка обновления компонента: ' . $e->getMessage()]);
    }
}

function processComponentJSON($component) {
    if (isset($component['critical_specs'])) {
        if (empty($component['critical_specs'])) {
            $component['critical_specs'] = [];
        } else {
            $decoded = json_decode($component['critical_specs'], true);
            $component['critical_specs'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                ? [] 
                : $decoded;
        }
    } else {
        $component['critical_specs'] = [];
    }
    
    if (isset($component['compatibility_flags'])) {
        if (empty($component['compatibility_flags'])) {
            $component['compatibility_flags'] = [];
        } else {
            $decoded = json_decode($component['compatibility_flags'], true);
            $component['compatibility_flags'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                ? [] 
                : $decoded;
        }
    } else {
        $component['compatibility_flags'] = [];
    }
    
    if (isset($component['specs'])) {
        if (empty($component['specs'])) {
            $component['specs'] = [];
        } else {
            $decoded = json_decode($component['specs'], true);
            $component['specs'] = ($decoded === null || json_last_error() !== JSON_ERROR_NONE) 
                ? [] 
                : $decoded;
        }
    } else {
        $component['specs'] = [];
    }
    
    foreach(['socket', 'memory_type', 'form_factor', 'efficiency', 'type'] as $field) {
        if (isset($component[$field]) && $component[$field] === null) {
            $component[$field] = '';
        }
    }
    
    return $component;
}

function logActivity($pdo, $data) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'activities'");
        if ($stmt->rowCount() === 0) {
            echo json_encode(['success' => true]);
            return;
        }
        
        $userId = $data['user_id'] ?? 0;
        $actionType = $data['type'] ?? '';
        $description = $data['description'] ?? '';
        
        $actionNames = [
            'user_register' => 'Регистрация пользователя',
            'user_delete' => 'Удаление пользователя',
            'user_role_change' => 'Изменение роли пользователя',
            'build_save' => 'Сохранение сборки',
            'build_delete' => 'Удаление сборки',
            'component_add' => 'Добавление компонента',
            'component_edit' => 'Редактирование компонента',
            'component_delete' => 'Удаление компонента',
            'component_toggle' => 'Изменение статуса компонента',
            'import_components' => 'Импорт компонентов'
        ];
        
        $readableType = $data['readable_type'] ?? ($actionNames[$actionType] ?? $actionType);
        
        $fullDescription = $readableType . ($description ? ": " . $description : "");
        
        $stmt = $pdo->prepare("
            INSERT INTO activities 
            (user_id, action_type, description) 
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([$userId, $actionType, $fullDescription]);
        
        echo json_encode([
            'success' => true, 
            'id' => $pdo->lastInsertId(),
            'message' => 'Активность записана'
        ]);
        
    } catch(Exception $e) {
        echo json_encode(['success' => true]); 
    }
}

function getActivities($pdo) {
    try {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 15;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        $query = "
            SELECT a.*, u.username, u.email 
            FROM activities a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach($activities as &$activity) {
            $activity['timestamp_formatted'] = formatActivityTime($activity['created_at']);
            
            $activity['type_name'] = $activity['description'];
            $activity['description_short'] = '';
            
            if (strpos($activity['description'], ': ') !== false) {
                list($typeName, $desc) = explode(': ', $activity['description'], 2);
                $activity['type_name'] = $typeName;
                $activity['description_short'] = $desc;
            }
            
            $activity['icon'] = getActivityIconFromType($activity['action_type']);
            
            if ($activity['user_id'] == 0) {
                $activity['user_display'] = 'Система';
            } else {
                $activity['user_display'] = $activity['username'] ?: 'Пользователь #' . $activity['user_id'];
            }
        }
        
        $countStmt = $pdo->query("SELECT COUNT(*) as total FROM activities");
        $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
        $total = $totalResult['total'] ?? 0;
        
        echo json_encode([
            'success' => true, 
            'activities' => $activities,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
        
    } catch(Exception $e) {
        echo json_encode([
            'success' => false, 
            'activities' => [], 
            'message' => $e->getMessage()
        ]);
    }
}

function formatActivityTime($timestamp) {
    if (!$timestamp) return 'Недавно';
    
    $now = new DateTime();
    $activityTime = new DateTime($timestamp);
    $interval = $now->diff($activityTime);
    
    if ($interval->d == 0) {
        if ($interval->h == 0) {
            if ($interval->i < 1) return 'только что';
            return $interval->i . ' мин. назад';
        }
        return $interval->h . ' ч. назад';
    } elseif ($interval->d == 1) {
        return 'вчера в ' . $activityTime->format('H:i');
    } elseif ($interval->d < 7) {
        return $interval->d . ' дн. назад';
    } else {
        return $activityTime->format('d.m.Y H:i');
    }
}

function getActivityIconFromType($actionType) {
    $iconMap = [
        'user_register' => '👤',
        'user_delete' => '🗑️',
        'user_role_change' => '🔄',
        'build_save' => '💾',
        'build_delete' => '🗑️',
        'component_add' => '➕',
        'component_edit' => '✏️',
        'component_delete' => '🗑️',
        'component_toggle' => '⚡',
        'import_components' => '📥'
    ];
    
    return $iconMap[$actionType] ?? '📝';
}
ob_end_flush();
?>