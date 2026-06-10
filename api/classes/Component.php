<?php
declare(strict_types=1);

class Component
{
    private PDO $db;
    private string $table = 'components';

    private const TABLE_MAP = [
        'cpus' => 'cpus',
        'motherboards' => 'motherboards',
        'rams' => 'rams',
        'gpus' => 'gpus',
        'storages' => 'storages',
        'psus' => 'psus',
        'cases' => 'cases',
        'coolers' => 'coolers',
    ];

    private const SPEC_FIELDS = [
        'socket', 'cores', 'threads', 'frequency', 'tdp', 'memory_type',
        'chipset', 'form_factor', 'memory_slots', 'max_memory', 'm2_slots',
        'sata_ports', 'pcie_version', 'wifi', 'type', 'capacity', 'speed',
        'modules', 'rgb', 'gpu_chip', 'memory_size', 'recommended_psu',
        'hdmi_ports', 'displayport_ports', 'length', 'chip_manufacturer',
        'interface', 'read_speed', 'write_speed', 'wattage', 'efficiency',
        'modular', 'pcie_connectors', 'sata_connectors', 'radiator_size',
        'fan_size', 'noise_level', 'height', 'led', 'socket_compatibility',
        'supported_motherboards', 'color', 'window', 'max_gpu_length',
        'max_cpu_cooler_height', 'drive_bays', 'fan_slots', 'radiator_support',
        'manufacturer', 'cas_latency', 'description', 'image', 'price', 'name',
        'is_active',
    ];

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getAll(?string $category = null, int $page = 1, int $limit = 10, array $filters = []): array
    {
        $offset = ($page - 1) * $limit;
        $params = [];
        $ref_table = $category ? (self::TABLE_MAP[$category] ?? null) : null;

        if ($ref_table) {
            $query = "SELECT ref.*, c.id, c.id AS component_id, cat.name AS category_name, cat.code AS category_code,
                             c.category_id, c.reference_id, c.reference_table, 
                             c.is_active, c.created_at, c.updated_at
                      FROM {$this->table} c
                      JOIN component_categories cat ON c.category_id = cat.id
                      JOIN {$ref_table} ref ON c.reference_id = ref.id
                      WHERE 1=1";
        } else {
            $query = "SELECT c.*, cat.name AS category_name, cat.code AS category_code
                      FROM {$this->table} c
                      JOIN component_categories cat ON c.category_id = cat.id
                      WHERE 1=1";
        }

        if ($category) {
            $query .= ' AND cat.code = :category';
            $params[':category'] = $category;
        }

        if (isset($filters['is_active'])) {
            $query .= ' AND c.is_active = :is_active';
            $params[':is_active'] = (int) $filters['is_active'];
        }

        if (!empty($filters['search']) && $ref_table) {
            $query .= ' AND ref.name LIKE :search';
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['socket']) && $ref_table) {
            $query .= ' AND ref.socket = :socket';
            $params[':socket'] = $filters['socket'];
        }

        if (!empty($filters['memory_type']) && $ref_table) {
            $query .= ' AND (ref.memory_type = :memory_type OR ref.type = :memory_type)';
            $params[':memory_type'] = $filters['memory_type'];
        }

        if (!empty($filters['form_factor']) && $ref_table) {
            $query .= ' AND ref.form_factor = :form_factor';
            $params[':form_factor'] = $filters['form_factor'];
        }

        if (!empty($filters['min_wattage']) && $ref_table) {
            $query .= ' AND ref.wattage >= :min_wattage';
            $params[':min_wattage'] = (int) $filters['min_wattage'];
        }

        $query .= ' ORDER BY c.id DESC LIMIT :limit OFFSET :offset';
        $stmt = $this->db->prepare($query);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function getById(int $id): array|false
    {
        $query = "SELECT c.*, cat.code AS category_code, cat.name AS category_name
                  FROM {$this->table} c
                  JOIN component_categories cat ON c.category_id = cat.id
                  WHERE c.id = :id LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':id' => $id]);
        $component = $stmt->fetch();

        if (!$component) {
            return false;
        }

        $ref_table = self::TABLE_MAP[$component['category_code']] ?? null;
        if ($ref_table) {
            $detail_query = "SELECT * FROM {$ref_table} WHERE id = :ref_id LIMIT 1";
            $detail_stmt = $this->db->prepare($detail_query);
            $detail_stmt->execute([':ref_id' => $component['reference_id']]);
            $details = $detail_stmt->fetch();

            if ($details) {
                $component_id = $component['id'];
                foreach ($details as $key => $value) {
                    $component[$key] = $value;
                }
                $component['id'] = $component_id;
            }
        }

        return $component;
    }

    public function getCount(?string $category = null, array $filters = []): int
    {
        $query = "SELECT COUNT(*) 
                  FROM {$this->table} c
                  JOIN component_categories cat ON c.category_id = cat.id
                  WHERE 1=1";
        $params = [];

        if ($category) {
            $query .= ' AND cat.code = :category';
            $params[':category'] = $category;
        }

        if (isset($filters['is_active'])) {
            $query .= ' AND c.is_active = :is_active';
            $params[':is_active'] = (int) $filters['is_active'];
        }

        if (!empty($filters['search'])) {
            $ref_table = self::TABLE_MAP[$category] ?? null;
            if ($ref_table) {
                $query .= " AND EXISTS (
                    SELECT 1 FROM {$ref_table} ref 
                    WHERE ref.id = c.reference_id AND ref.name LIKE :search
                )";
                $params[':search'] = '%' . $filters['search'] . '%';
            }
        }

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function create(array $data): int
    {
        $this->db->beginTransaction();

        try {
            $target_table = self::TABLE_MAP[$data['category_code']] ?? null;
            if (!$target_table) {
                throw new RuntimeException('Неизвестная категория');
            }

            $insert_data = [
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'price' => (float) $data['price'],
                'image' => $data['image'] ?? '',
                'is_active' => 1,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            foreach (self::SPEC_FIELDS as $field) {
                if (isset($data[$field]) && $data[$field] !== '') {
                    $insert_data[$field] = $data[$field];
                }
            }

            $fields = implode(', ', array_keys($insert_data));
            $placeholders = ':' . implode(', :', array_keys($insert_data));
            $stmt = $this->db->prepare("INSERT INTO {$target_table} ({$fields}) VALUES ({$placeholders})");
            $stmt->execute($insert_data);
            $reference_id = (int) $this->db->lastInsertId();

            $cat_stmt = $this->db->prepare('SELECT id FROM component_categories WHERE code = :code LIMIT 1');
            $cat_stmt->execute([':code' => $data['category_code']]);
            $category_id = (int) $cat_stmt->fetchColumn();

            $link_stmt = $this->db->prepare(
                "INSERT INTO {$this->table} (category_id, reference_id, reference_table, is_active, created_at, updated_at)
                 VALUES (:cat_id, :ref_id, :ref_table, 1, :created, :updated)"
            );
            $link_stmt->execute([
                ':cat_id' => $category_id,
                ':ref_id' => $reference_id,
                ':ref_table' => $target_table,
                ':created' => date('Y-m-d H:i:s'),
                ':updated' => date('Y-m-d H:i:s'),
            ]);

            $component_id = (int) $this->db->lastInsertId();
            $this->db->commit();

            return $component_id;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update(int $id, array $data): bool
    {
        $component = $this->getById($id);
        if (!$component) {
            throw new RuntimeException('Компонент не найден');
        }

        $this->db->beginTransaction();

        try {
            $target_table = $component['reference_table'];
            $reference_id = $component['reference_id'];

            $update_fields = [];
            $update_params = [];

            foreach (self::SPEC_FIELDS as $field) {
                if (array_key_exists($field, $data)) {
                    $update_fields[] = "{$field} = ?";
                    $update_params[] = $data[$field];
                }
            }

            if (!empty($update_fields)) {
                $update_fields[] = 'updated_at = ?';
                $update_params[] = date('Y-m-d H:i:s');
                $update_params[] = $reference_id;

                $query = "UPDATE {$target_table} SET " . implode(', ', $update_fields) . ' WHERE id = ?';
                $this->db->prepare($query)->execute($update_params);
            }

            if (array_key_exists('is_active', $data)) {
                $stmt = $this->db->prepare(
                    "UPDATE {$this->table} SET is_active = ?, updated_at = ? WHERE id = ?"
                );
                $stmt->execute([(int) $data['is_active'], date('Y-m-d H:i:s'), $id]);
            }

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function softDelete(int $id): bool
    {
        $component = $this->getById($id);
        if (!$component) {
            throw new RuntimeException('Компонент не найден');
        }

        $this->db->beginTransaction();

        try {
            $now = date('Y-m-d H:i:s');
            $target_table = $component['reference_table'];
            $reference_id = $component['reference_id'];

            $this->db->prepare("UPDATE {$target_table} SET is_active = 0, updated_at = ? WHERE id = ?")
                     ->execute([$now, $reference_id]);

            $this->db->prepare("UPDATE {$this->table} SET is_active = 0, updated_at = ? WHERE id = ?")
                     ->execute([$now, $id]);

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function hardDelete(int $id): bool
    {
        $component = $this->getById($id);
        if (!$component) {
            throw new RuntimeException('Компонент не найден');
        }

        $this->db->beginTransaction();

        try {
            $target_table = $component['reference_table'];
            $reference_id = $component['reference_id'];

            $this->db->prepare("DELETE FROM {$target_table} WHERE id = ?")->execute([$reference_id]);
            $this->db->prepare("DELETE FROM {$this->table} WHERE id = ?")->execute([$id]);

            $this->db->commit();
            return true;
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}