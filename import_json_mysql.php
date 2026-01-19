<?php
include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

$json_data = file_get_contents('data/basic_components.json');
$data = json_decode($json_data, true);

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
    $category_id = $category_map[$category];
    
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
        $image = $component['image'];
        $socket = isset($component['socket']) ? $component['socket'] : null;
        $memory_type = isset($component['memoryType']) ? $component['memoryType'] : 
                      (isset($component['type']) && in_array($component['type'], ['DDR4', 'DDR5']) ? $component['type'] : null);
        $form_factor = isset($component['formFactor']) ? $component['formFactor'] : null;
        $wattage = isset($component['wattage']) ? $component['wattage'] : null;
        $efficiency = isset($component['efficiency']) ? $component['efficiency'] : null;
        $capacity = isset($component['capacity']) ? $component['capacity'] : null;
        $speed = isset($component['speed']) ? $component['speed'] : null;
        $tdp = isset($component['tdp']) ? $component['tdp'] : null;
        $type = isset($component['type']) ? $component['type'] : null;
        $specs = isset($component['specs']) ? json_encode($component['specs']) : json_encode([]);
        $compatibility_flags = isset($component['compatibility_flags']) ? 
                              json_encode($component['compatibility_flags']) : json_encode([]);
        $critical_specs = isset($component['critical_specs']) ? 
                         json_encode($component['critical_specs']) : json_encode([]);
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
        }
    }
}

echo "Импортировано $total_imported компонентов\n";
?>