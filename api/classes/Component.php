<?php
class Component {
    private $conn;
    private $table = "components";
    private $categories_table = "component_categories";
    public $id;
    public $category_id;
    public $name;
    public $description;
    public $price;
    public $image;
    public $socket;
    public $memory_type;
    public $form_factor;
    public $wattage;
    public $efficiency;
    public $capacity;
    public $speed;
    public $tdp;
    public $type;
    public $specs;
    public $compatibility_flags;
    public $critical_specs;
    public $is_active;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }


    public function getAll($category = null, $page = 1, $limit = 5, $filters = []) {
        $offset = ($page - 1) * $limit;
        
        $query = "SELECT c.*, cat.name as category_name, cat.slug as category_slug 
                  FROM " . $this->table . " c
                  INNER JOIN " . $this->categories_table . " cat ON c.category_id = cat.id
                  WHERE c.is_active = 1";  
        
        $params = [];


        if($category) {
            $query .= " AND cat.slug = :category";
            $params[':category'] = $category;
        }


        if(!empty($filters)) {
            foreach($filters as $key => $value) {
                if($value && in_array($key, ['socket', 'memory_type', 'type'])) {
                    $query .= " AND c." . $key . " = :" . $key;
                    $params[':' . $key] = $value;
                }
            }
        }


        if(isset($filters['search']) && $filters['search']) {
            $query .= " AND c.name LIKE :search";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $query .= " ORDER BY c.created_at DESC 
                    LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        

        foreach($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    public function getById($id) {
        $query = "SELECT c.*, cat.name as category_name, cat.slug as category_slug 
                  FROM " . $this->table . " c
                  INNER JOIN " . $this->categories_table . " cat ON c.category_id = cat.id
                  WHERE c.id = :id AND c.is_active = 1";  

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        return false;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
            SET category_id = :category_id,
                name = :name,
                description = :description,
                price = :price,
                image = :image,
                socket = :socket,
                memory_type = :memory_type,
                form_factor = :form_factor,
                wattage = :wattage,
                efficiency = :efficiency,
                capacity = :capacity,
                speed = :speed,
                tdp = :tdp,
                type = :type,
                specs = :specs,
                compatibility_flags = :compatibility_flags,
                critical_specs = :critical_specs,
                is_active = 1";

        $stmt = $this->conn->prepare($query);


        $this->category_id = htmlspecialchars(strip_tags($this->category_id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->image = htmlspecialchars(strip_tags($this->image));
        $this->socket = htmlspecialchars(strip_tags($this->socket));
        $this->memory_type = htmlspecialchars(strip_tags($this->memory_type));
        $this->form_factor = htmlspecialchars(strip_tags($this->form_factor));
        $this->wattage = htmlspecialchars(strip_tags($this->wattage));
        $this->efficiency = htmlspecialchars(strip_tags($this->efficiency));
        $this->capacity = htmlspecialchars(strip_tags($this->capacity));
        $this->speed = htmlspecialchars(strip_tags($this->speed));
        $this->tdp = htmlspecialchars(strip_tags($this->tdp));
        $this->type = htmlspecialchars(strip_tags($this->type));


        $this->specs = json_encode($this->specs);
        $this->compatibility_flags = json_encode($this->compatibility_flags);
        $this->critical_specs = json_encode($this->critical_specs);


        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":socket", $this->socket);
        $stmt->bindParam(":memory_type", $this->memory_type);
        $stmt->bindParam(":form_factor", $this->form_factor);
        $stmt->bindParam(":wattage", $this->wattage);
        $stmt->bindParam(":efficiency", $this->efficiency);
        $stmt->bindParam(":capacity", $this->capacity);
        $stmt->bindParam(":speed", $this->speed);
        $stmt->bindParam(":tdp", $this->tdp);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":specs", $this->specs);
        $stmt->bindParam(":compatibility_flags", $this->compatibility_flags);
        $stmt->bindParam(":critical_specs", $this->critical_specs);

        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }


    public function update() {
        $query = "UPDATE " . $this->table . " 
                  SET category_id = :category_id,
                      name = :name,
                      description = :description,
                      price = :price,
                      image = :image,
                      socket = :socket,
                      memory_type = :memory_type,
                      form_factor = :form_factor,
                      wattage = :wattage,
                      efficiency = :efficiency,
                      capacity = :capacity,
                      speed = :speed,
                      tdp = :tdp,
                      type = :type,
                      specs = :specs,
                      compatibility_flags = :compatibility_flags,
                      critical_specs = :critical_specs
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        $this->category_id = htmlspecialchars(strip_tags($this->category_id));
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->price = htmlspecialchars(strip_tags($this->price));
        $this->image = htmlspecialchars(strip_tags($this->image));
        $this->socket = htmlspecialchars(strip_tags($this->socket));
        $this->memory_type = htmlspecialchars(strip_tags($this->memory_type));
        $this->form_factor = htmlspecialchars(strip_tags($this->form_factor));
        $this->wattage = htmlspecialchars(strip_tags($this->wattage));
        $this->efficiency = htmlspecialchars(strip_tags($this->efficiency));
        $this->capacity = htmlspecialchars(strip_tags($this->capacity));
        $this->speed = htmlspecialchars(strip_tags($this->speed));
        $this->tdp = htmlspecialchars(strip_tags($this->tdp));
        $this->type = htmlspecialchars(strip_tags($this->type));

        $this->specs = json_encode($this->specs);
        $this->compatibility_flags = json_encode($this->compatibility_flags);
        $this->critical_specs = json_encode($this->critical_specs);

        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":price", $this->price);
        $stmt->bindParam(":image", $this->image);
        $stmt->bindParam(":socket", $this->socket);
        $stmt->bindParam(":memory_type", $this->memory_type);
        $stmt->bindParam(":form_factor", $this->form_factor);
        $stmt->bindParam(":wattage", $this->wattage);
        $stmt->bindParam(":efficiency", $this->efficiency);
        $stmt->bindParam(":capacity", $this->capacity);
        $stmt->bindParam(":speed", $this->speed);
        $stmt->bindParam(":tdp", $this->tdp);
        $stmt->bindParam(":type", $this->type);
        $stmt->bindParam(":specs", $this->specs);
        $stmt->bindParam(":compatibility_flags", $this->compatibility_flags);
        $stmt->bindParam(":critical_specs", $this->critical_specs);
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        
        return false;
    }

    public function delete($id) {
        $query = "UPDATE " . $this->table . " 
                  SET is_active = 0  
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);

        return $stmt->execute();
    }

    public function getCount($category = null, $filters = []) {
        $query = "SELECT COUNT(*) as total 
                  FROM " . $this->table . " c
                  INNER JOIN " . $this->categories_table . " cat ON c.category_id = cat.id
                  WHERE c.is_active = 1";  
        
        $params = [];

        if($category) {
            $query .= " AND cat.slug = :category";
            $params[':category'] = $category;
        }

        if(!empty($filters)) {
            foreach($filters as $key => $value) {
                if($value && in_array($key, ['socket', 'memory_type', 'type'])) {
                    $query .= " AND c." . $key . " = :" . $key;
                    $params[':' . $key] = $value;
                }
            }
        }

        if(isset($filters['search']) && $filters['search']) {
            $query .= " AND c.name LIKE :search";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->conn->prepare($query);
        
        foreach($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['total'];
    }
}
?>