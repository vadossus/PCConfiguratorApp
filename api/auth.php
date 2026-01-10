<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once 'classes/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($_GET['action'])) {
        $action = $_GET['action'];
        
        if($action == 'register') {
            if(!empty($data->username) && !empty($data->email) && !empty($data->password)) {
                $user->username = $data->username;
                $user->email = $data->email;
                $user->password = $data->password;
                $user->role = isset($data->role) ? $data->role : 'user';

                if($user->userExists()) {
                    http_response_code(400);
                    echo json_encode(array("message" => "Пользователь с таким именем или email уже существует."));
                } else {
                    if($user->register()) {
                        http_response_code(201);
                        echo json_encode(array(
                            "message" => "Пользователь успешно зарегистрирован.",
                            "user" => array(
                                "id" => $user->id,
                                "username" => $user->username,
                                "email" => $user->email,
                                "role" => $user->role
                            )
                        ));
                    } else {
                        http_response_code(503);
                        echo json_encode(array("message" => "Ошибка при регистрации пользователя."));
                    }
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Не все обязательные поля заполнены."));
            }
        } 
        elseif($action == 'login') {
            if(!empty($data->username) && !empty($data->password)) {
                $user->username = $data->username;
                $user->password = $data->password;

                $user_data = $user->login();

                if($user_data) {
                    session_start();
                    $_SESSION['user_id'] = $user_data['id'];
                    $_SESSION['username'] = $user_data['username'];
                    $_SESSION['role'] = $user_data['role'];

                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "Вход выполнен успешно.",
                        "user" => $user_data,
                        "token" => session_id() 
                    ));
                } else {
                    http_response_code(401);
                    echo json_encode(array("message" => "Неверное имя пользователя или пароль."));
                }
            } else {
                http_response_code(400);
                echo json_encode(array("message" => "Не все обязательные поля заполнены."));
            }
        }
        elseif($action == 'logout') {
            session_start();
            session_destroy();
            echo json_encode(array("message" => "Выход выполнен успешно."));
        }
    }
}
?>