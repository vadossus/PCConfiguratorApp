<?php
declare(strict_types=1);

class User
{
    private PDO $db;
    private string $table = 'users';

    public int $id;
    public string $username;
    public string $email;
    public string $password;
    public string $role = 'user';

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function register(): bool
    {
        $query = "INSERT INTO {$this->table} (username, email, password, role) 
                  VALUES (:username, :email, :password, :role)";
        $stmt = $this->db->prepare($query);

        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->role = htmlspecialchars(strip_tags($this->role));
        $hashed = password_hash($this->password, PASSWORD_BCRYPT);

        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':password', $hashed);
        $stmt->bindParam(':role', $this->role);

        if ($stmt->execute()) {
            $this->id = (int) $this->db->lastInsertId();
            return true;
        }
        return false;
    }

    public function login(): array|false
    {
        $query = "SELECT id, username, email, password, role, created_at 
                  FROM {$this->table} 
                  WHERE username = :login_name OR email = :login_email 
                  LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':login_name' => $this->username,
            ':login_email' => $this->username,
        ]);
        $row = $stmt->fetch();

        if ($row && password_verify($this->password, $row['password'])) {
            unset($row['password']);
            $this->id = (int) $row['id'];
            $this->username = $row['username'];
            $this->email = $row['email'];
            $this->role = $row['role'];
            return $row;
        }
        return false;
    }

    public function exists(): bool
    {
        $query = "SELECT id FROM {$this->table} 
                  WHERE username = :username OR email = :email 
                  LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':username' => $this->username,
            ':email' => $this->email,
        ]);
        return $stmt->rowCount() > 0;
    }

    public function findById(int $id): array|false
    {
        $query = "SELECT id, username, email, role, created_at 
                  FROM {$this->table} WHERE id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }
}