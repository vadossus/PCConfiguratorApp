<?php
class Database {
    private $host = "localhost"; // OSPanel - MySQL-8.0
    private $db_name = "pc_configurator";
    private $username = "root";
    private $password = "";
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                //;port=3306 - при запуске OSPanel, если XAMPP можно удалить порт
                "mysql:host=" . $this->host . ";port=3306;dbname=" . $this->db_name, 

                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>
