<?php
declare(strict_types=1);

class Database
{
    private string $host = 'localhost';
    private string $name = 'pc_configurator';
    private string $user = 'root';
    private string $pass = '';
    private ?PDO $connection = null;

    public function connect(): PDO
    {
        if ($this->connection === null) {
            $dsn = "mysql:host={$this->host};port=3306;dbname={$this->name};charset=utf8";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $this->connection = new PDO($dsn, $this->user, $this->pass, $options);
        }
        return $this->connection;
    }
}