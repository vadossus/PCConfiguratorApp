<?php
include_once 'config/database.php';

if (isset($_SERVER['argv'][1])) {
    $json_file = $_SERVER['argv'][1];
} elseif (isset($_POST['json_file'])) {
    $json_file = $_POST['json_file'];
} else {
    die("укажите путь к JSON файлу");
}

if (!file_exists($json_file)) {
    die("файл не найден: $json_file\n");
}


$json_data = file_get_contents($json_file);
$data = json_decode($json_data, true);

if (!$data) {
    die("ошибка чтения JSON файла\n");
}

$database = new Database();
$db = $database->getConnection();

$category_map = [
    'cpus' => 1,
    'motherboards' => 2,
    'rams' => 3,
    'gpus' => 4,
    'storages' => 5,
    'psus' => 6,
    'cases' => 7,
    'coolers' => 8
];

$total_imported = 0;

foreach ($data['components'] as $category => $components) {
    $category_id = $category_map[$category] ?? null;
    
    if (!$category_id) {
        echo "Пропущена неизвестная категория: $category\n";
        continue;
    }
    
    foreach ($components as $component) {
        $query = "INSERT INTO components (
            category_id, name, price, image, socket, memory_type, 
            form_factor, wattage, efficiency, capacity, speed, tdp, type,
            specs, compatibility_flags, critical_specs
        ) VALUES (
            :category_id, :name, :price, :image, :socket, :memory_type,
            :form_factor, :wattage, :efficiency, :capacity, :speed, :tdp, :type,
            :specs, :compatibility_flags, :critical_specs
        )";

        $stmt = $db->prepare($query);

        $name = $component['name'];
        $price = $component['price'];
        $image = $component['image'] ?? null;
        $socket = $component['socket'] ?? null;
        
        $memory_type = $component['memoryType'] ?? 
                      (in_array($component['type'] ?? '', ['DDR4', 'DDR5']) ? $component['type'] : null);
        
        $form_factor = $component['formFactor'] ?? null;
        $wattage = $component['wattage'] ?? null;
        $efficiency = $component['efficiency'] ?? null;
        $capacity = $component['capacity'] ?? null;
        $speed = $component['speed'] ?? null;
        $tdp = $component['tdp'] ?? null;
        $type = $component['type'] ?? null;
        $specs = json_encode($component['specs'] ?? []);
        $compatibility_flags = json_encode($component['compatibility_flags'] ?? []);
        $critical_specs = json_encode($component['critical_specs'] ?? []);
        
        $stmt->bindParam(':category_id', $category_id);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':price', $price);
        $stmt->bindParam(':image', $image);
        $stmt->bindParam(':socket', $socket);
        $stmt->bindParam(':memory_type', $memory_type);
        $stmt->bindParam(':form_factor', $form_factor);
        $stmt->bindParam(':wattage', $wattage);
        $stmt->bindParam(':efficiency', $efficiency);
        $stmt->bindParam(':capacity', $capacity);
        $stmt->bindParam(':speed', $speed);
        $stmt->bindParam(':tdp', $tdp);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':specs', $specs);
        $stmt->bindParam(':compatibility_flags', $compatibility_flags);
        $stmt->bindParam(':critical_specs', $critical_specs);

        if ($stmt->execute()) {
            $total_imported++;
        } else {
            echo "Ошибка при импорте: {$name}\n";
        }
    }
}

echo "Импортировано $total_imported компонентов из файла: $json_file\n";
?>