<?php
class User {
    private $conn;
    private $table = "users";

    public $id;
    public $username;
    public $email;
    public $password;
    public $role;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }


    public function register() {
        $query = "INSERT INTO " . $this->table . " 
                  SET username = :username, 
                      email = :email, 
                      password = :password,
                      role = :role";

        $stmt = $this->conn->prepare($query);


        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));
        

        $this->password = password_hash($this->password, PASSWORD_BCRYPT);


        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password", $this->password);
        $stmt->bindParam(":role", $this->role);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }


    public function login() {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE username = :username OR email = :username 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if(password_verify($this->password, $row['password'])) {
                unset($row['password']);
                
                $this->id = $row['id'];
                $this->username = $row['username'];
                $this->email = $row['email'];
                $this->role = $row['role'];
                $this->created_at = $row['created_at'];
                
                return $row;
            }
        }
        
        return false;
    }

   
    public function userExists() {
        $query = "SELECT id FROM " . $this->table . " 
                  WHERE username = :username OR email = :email 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

   
    public function getUserById($id) {
        $query = "SELECT id, username, email, role, created_at 
                  FROM " . $this->table . " 
                  WHERE id = :id 
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return false;
    }
}
?>