-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Янв 10 2026 г., 11:31
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `pc_configurator`
--

-- --------------------------------------------------------

--
-- Структура таблицы `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `activities`
--

INSERT INTO `activities` (`id`, `user_id`, `action_type`, `description`, `created_at`) VALUES
(13, 1, 'user_delete', 'Удаление пользователя: Удалён пользователь ID: 3', '2026-01-08 11:23:33'),
(14, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:80 деактивирован', '2026-01-08 11:23:48'),
(15, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:80 активирован', '2026-01-08 11:23:56'),
(16, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Ryzen 5 1600AF', '2026-01-10 08:28:07'),
(17, 1, 'component_edit', 'Редактирование компонента: Обновлён компонент ID: 81', '2026-01-10 08:28:41');

-- --------------------------------------------------------

--
-- Структура таблицы `build_components`
--

CREATE TABLE `build_components` (
  `id` int(11) NOT NULL,
  `build_id` int(11) NOT NULL,
  `component_id` int(11) NOT NULL,
  `component_type` varchar(50) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `build_components`
--

INSERT INTO `build_components` (`id`, `build_id`, `component_id`, `component_type`, `quantity`, `created_at`) VALUES
(97, 15, 43, 'cpus', 1, '2026-01-08 15:32:19'),
(98, 15, 52, 'motherboards', 1, '2026-01-08 15:32:19'),
(99, 15, 57, 'rams', 1, '2026-01-08 15:32:19');

-- --------------------------------------------------------

--
-- Структура таблицы `components`
--

CREATE TABLE `components` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `socket` varchar(50) DEFAULT NULL,
  `memory_type` varchar(20) DEFAULT NULL,
  `form_factor` varchar(20) DEFAULT NULL,
  `wattage` int(11) DEFAULT NULL,
  `efficiency` varchar(20) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `speed` int(11) DEFAULT NULL,
  `tdp` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `specs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`specs`)),
  `compatibility_flags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`compatibility_flags`)),
  `critical_specs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`critical_specs`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `components`
--

INSERT INTO `components` (`id`, `category_id`, `name`, `description`, `price`, `image`, `socket`, `memory_type`, `form_factor`, `wattage`, `efficiency`, `capacity`, `speed`, `tdp`, `type`, `specs`, `compatibility_flags`, `critical_specs`, `is_active`, `created_at`, `updated_at`) VALUES
(41, 1, 'AMD Ryzen 5 5600X', 'Процессор AMD Ryzen 5 5600X', 25000.00, '5600x.png', 'AM4', NULL, NULL, 65, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM4\",\"DDR4\"]', '[\"6 ядер\",\"12 потоков\",\"3.7 ГГц\"]', 1, '2025-12-12 08:00:34', '2025-12-12 12:00:34'),
(42, 1, 'Intel Core i5-12400F', 'Процессор Intel Core i5-12400F', 18000.00, 'i5_12400f.jpg', 'LGA1700', NULL, NULL, 65, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR4\"]', '[\"6 ядер\",\"12 потоков\",\"2.5 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(43, 1, 'AMD Ryzen 7 5800X3D', 'Процессор AMD Ryzen 7 5800X3D', 35000.00, '5800x3d.jpg', 'AM4', NULL, NULL, 105, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM4\",\"DDR4\"]', '[\"8 ядер\",\"16 потоков\",\"3.4 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(44, 1, 'Intel Core i7-12700K', 'Процессор Intel Core i7-12700K', 32000.00, '12700k.jpg', 'LGA1700', NULL, NULL, 125, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR5\"]', '[\"12 ядер\",\"20 потоков\",\"3.6 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(45, 1, 'AMD Ryzen 5 7600X', 'Процессор AMD Ryzen 5 7600X', 28000.00, '7600x.png', 'AM5', NULL, NULL, 105, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM5\",\"DDR5\"]', '[\"6 ядер\",\"12 потоков\",\"4.7 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(46, 1, 'Intel Core i9-13900K', 'Процессор Intel Core i9-13900K', 45000.00, '13900k.png', 'LGA1700', NULL, NULL, 125, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR5\"]', '[\"24 ядра\",\"32 потока\",\"3.0 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(47, 1, 'AMD Ryzen 9 7950X', 'Процессор AMD Ryzen 9 7950X', 52000.00, '7950x.png', 'AM5', NULL, NULL, 170, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM5\",\"DDR5\"]', '[\"16 ядер\",\"32 потока\",\"4.5 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(48, 1, 'Intel Core i3-12100F', 'Процессор Intel Core i3-12100F', 12000.00, '12100f.png', 'LGA1700', NULL, NULL, 58, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR4\"]', '[\"4 ядра\",\"8 потоков\",\"3.3 ГГц\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(49, 2, 'ASUS ROG Strix B550-F Gaming', 'Материнская плата ASUS ROG Strix B550-F Gaming', 15000.00, 'b550_f.png', 'AM4', 'DDR4', 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM4\",\"DDR4\"]', '[\"Socket AM4\",\"DDR4\",\"2 слота M.2\",\"6 портов SATA\"]', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(50, 2, 'Gigabyte B660M DS3H', 'Материнская плата Gigabyte B660M DS3H', 10000.00, 'ds3h.png', 'LGA1700', 'DDR4', 'Micro-ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR4\"]', '[\"Socket LGA1700\",\"DDR4\",\"1 слот M.2\",\"4 порта SATA\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(51, 2, 'MSI MPG B650 Edge WiFi', 'Материнская плата MSI MPG B650 Edge WiFi', 22000.00, 'b650_edge.png', 'AM5', 'DDR5', 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM5\",\"DDR5\"]', '[\"Socket AM5\",\"DDR5\",\"3 слота M.2\",\"6 портов SATA\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(52, 2, 'ASRock B450M-HDV', 'Материнская плата ASRock B450M-HDV', 8000.00, 'b450m-hdv.png', 'AM4', 'DDR4', 'Micro-ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM4\",\"DDR4\"]', '[\"Socket AM4\",\"DDR4\",\"1 слот M.2\",\"4 порта SATA\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(53, 2, 'ASUS TUF Gaming Z790-Plus', 'Материнская плата ASUS TUF Gaming Z790-Plus', 28000.00, 'z790_plus.jpg', 'LGA1700', 'DDR5', 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"LGA1700\",\"DDR5\"]', '[\"Socket LGA1700\",\"DDR5\",\"4 слота M.2\",\"6 портов SATA\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(54, 2, 'Gigabyte X670 AORUS Elite', 'Материнская плата Gigabyte X670 AORUS Elite', 32000.00, 'x670_aorus.jpg', 'AM5', 'DDR5', 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM5\",\"DDR5\"]', '[\"Socket AM5\",\"DDR5\",\"4 слота M.2\",\"8 портов SATA\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(55, 3, 'Kingston Fury Beast 16GB (2x8GB) DDR4', 'Оперативная память Kingston Fury Beast 16GB (2x8GB) DDR4', 6000.00, 'fury_beast.png', NULL, 'DDR4', NULL, NULL, NULL, 16, 3200, NULL, NULL, '[]', '[\"DDR4\"]', '[\"16 ГБ\",\"DDR4\",\"3200 МГц\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(56, 3, 'Corsair Vengeance RGB 32GB (2x16GB) DDR5', 'Оперативная память Corsair Vengeance RGB 32GB (2x16GB) DDR5', 12000.00, 'corsair_vengeance.png', NULL, 'DDR5', NULL, NULL, NULL, 32, 5600, NULL, NULL, '[]', '[\"DDR5\"]', '[\"32 ГБ\",\"DDR5\",\"5600 МГц\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(57, 3, 'G.Skill Trident Z 16GB (2x8GB) DDR4', 'Оперативная память G.Skill Trident Z 16GB (2x8GB) DDR4', 7000.00, 'trident_z.jpg', NULL, 'DDR4', NULL, NULL, NULL, 16, 3600, NULL, NULL, '[]', '[\"DDR4\"]', '[\"16 ГБ\",\"DDR4\",\"3600 МГц\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(58, 3, 'Crucial Ballistix 32GB (2x16GB) DDR4', 'Оперативная память Crucial Ballistix 32GB (2x16GB) DDR4', 9000.00, 'ballistic_32.jpg', NULL, 'DDR4', NULL, NULL, NULL, 32, 3200, NULL, NULL, '[]', '[\"DDR4\"]', '[\"32 ГБ\",\"DDR4\",\"3200 МГц\"]', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(59, 3, 'Team Group T-Force Delta 64GB (2x32GB) DDR5', 'Оперативная память Team Group T-Force Delta 64GB (2x32GB) DDR5', 18000.00, 'delta_teamgroup.jpg', NULL, 'DDR5', NULL, NULL, NULL, 64, 6000, NULL, NULL, '[]', '[\"DDR5\"]', '[\"64 ГБ\",\"DDR5\",\"6000 МГц\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(60, 4, 'NVIDIA GeForce RTX 3060 12GB', 'Видеокарта NVIDIA GeForce RTX 3060 12GB', 35000.00, 'rtx_3060_asus.jpg', NULL, NULL, NULL, 170, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"12 ГБ GDDR6\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(61, 4, 'AMD Radeon RX 6600 XT 8GB', 'Видеокарта AMD Radeon RX 6600 XT 8GB', 32000.00, 'rx6600xt_powercolor.jpg', NULL, NULL, NULL, 160, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"8 ГБ GDDR6\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(62, 4, 'NVIDIA GeForce RTX 4070 12GB', 'Видеокарта NVIDIA GeForce RTX 4070 12GB', 65000.00, 'rtx4070_asus.jpg', NULL, NULL, NULL, 200, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"12 ГБ GDDR6X\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(63, 4, 'AMD Radeon RX 7800 XT 16GB', 'Видеокарта AMD Radeon RX 7800 XT 16GB', 58000.00, 'rx7800xt_asus.jpg', NULL, NULL, NULL, 263, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"16 ГБ GDDR6\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(64, 4, 'NVIDIA GeForce RTX 4060 Ti 8GB', 'Видеокарта NVIDIA GeForce RTX 4060 Ti 8GB', 45000.00, '4060_msi.png', NULL, NULL, NULL, 160, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"8 ГБ GDDR6\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(65, 4, 'AMD Radeon RX 7600 8GB', 'Видеокарта AMD Radeon RX 7600 8GB', 28000.00, 'rx7600_biostar.png', NULL, NULL, NULL, 165, NULL, NULL, NULL, NULL, NULL, '[]', '[\"PCIe\"]', '[\"8 ГБ GDDR6\",\"PCIe 4.0\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(66, 5, 'Samsung 980 1TB M.2 NVMe', 'Накопитель Samsung 980 1TB M.2 NVMe', 8000.00, 'samsung980.jpg', NULL, NULL, NULL, NULL, NULL, 1000, NULL, NULL, 'M.2', '[]', '[\"M.2\"]', '[\"1 ТБ\",\"M.2 NVMe\",\"3500 МБ\\/с\"]', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(67, 5, 'WD Blue 1TB HDD', 'Накопитель WD Blue 1TB HDD', 3000.00, 'wdblue1tb.jpg', NULL, NULL, NULL, NULL, NULL, 2000, NULL, NULL, 'SATA', '[]', '[\"SATA\"]', '[\"1 ТБ\",\"SATA III\",\"7200 об\\/мин\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(68, 5, 'Crucial P5 Plus 2TB M.2 NVMe', 'Накопитель Crucial P5 Plus 2TB M.2 NVMe', 12000.00, 'crucialp5plus.jpg', NULL, NULL, NULL, NULL, NULL, 2000, NULL, NULL, 'M.2', '[]', '[\"M.2\"]', '[\"2 ТБ\",\"M.2 NVMe\",\"6600 МБ\\/с\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(69, 5, 'Seagate BarraCuda 4TB HDD', 'Накопитель Seagate BarraCuda 4TB HDD', 7000.00, 'seagate_4tb.jpg', NULL, NULL, NULL, NULL, NULL, 4000, NULL, NULL, 'SATA', '[]', '[\"SATA\"]', '[\"4 ТБ\",\"SATA III\",\"5400 об\\/мин\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(70, 6, 'Seasonic Focus GX-750', 'Блок питания Seasonic Focus GX-750', 9000.00, 'seasonic_gx750.jpg', NULL, NULL, 'ATX', 750, '80+ Gold', NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"750 Вт\",\"80+ Gold\",\"Полумодульный\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(71, 6, 'Corsair RM850x', 'Блок питания Corsair RM850x', 12000.00, 'corsair_rm850x.jpg', NULL, NULL, 'ATX', 850, '80+ Gold', NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"850 Вт\",\"80+ Gold\",\"Полностью модульный\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(72, 6, 'be quiet! Straight Power 11 650W', 'Блок питания be quiet! Straight Power 11 650W', 8000.00, 'bequiet_sp11.png', NULL, NULL, 'ATX', 650, '80+ Platinum', NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"650 Вт\",\"80+ Platinum\",\"Полностью модульный\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(73, 6, 'Cooler Master MWE Gold 850', 'Блок питания Cooler Master MWE Gold 850', 9500.00, 'coolermaster_mwe_gold.png', NULL, NULL, 'ATX', 850, '80+ Gold', NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"850 Вт\",\"80+ Gold\",\"Полностью модульный\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(74, 7, 'NZXT H510 Flow', 'Корпус NZXT H510 Flow', 7000.00, 'nzxt_h510_flow.jpg', NULL, NULL, 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"Mid-Tower\",\"ATX\",\"Tempered Glass\"]', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(75, 7, 'Lian Li PC-O11 Dynamic', 'Корпус Lian Li PC-O11 Dynamic', 12000.00, 'lian_li_dynamic.jpg', NULL, NULL, 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"Mid-Tower\",\"ATX\",\"Двойное стекло\"]', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(76, 7, 'Fractal Design Meshify C', 'Корпус Fractal Design Meshify C', 8500.00, 'fd_meshify.jpg', NULL, NULL, 'ATX', NULL, NULL, NULL, NULL, NULL, NULL, '[]', '[\"ATX\"]', '[\"Mid-Tower\",\"ATX\",\"Сетчатая передняя панель\"]', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(77, 8, 'Noctua NH-D15', 'Охлаждение Noctua NH-D15', 8000.00, 'noctua_nh_d15.jpg', 'AM4, AM5, LGA1700, LGA1200', NULL, NULL, NULL, NULL, NULL, NULL, 250, 'Air', '[]', '[\"Universal\"]', '[\"Воздушное охлаждение\",\"Две башни\",\"140mm вентиляторы\"]', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(78, 8, 'Corsair iCUE H150i Elite', 'Охлаждение Corsair iCUE H150i Elite', 12000.00, 'corsair_icue_h150i.jpg', 'AM4, AM5, LGA1700, LGA1200', NULL, NULL, NULL, NULL, NULL, NULL, 300, 'AIO', '[]', '[\"Universal\"]', '[\"Жидкостное охлаждение\",\"360mm радиатор\",\"RGB\"]', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(79, 8, 'be quiet! Dark Rock Pro 4', 'Охлаждение be quiet! Dark Rock Pro 4', 7000.00, 'bq_darkrockpro4.jpg', 'AM4, AM5, LGA1700, LGA1200', NULL, NULL, NULL, NULL, NULL, NULL, 250, 'Air', '[]', '[\"Universal\"]', '[\"Воздушное охлаждение\",\"Две башни\",\"Тихое\"]', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(80, 8, 'Arctic Liquid Freezer II 240', 'Охлаждение Arctic Liquid Freezer II 240', 6000.00, 'arctic_liquid_freezer_2_240.jpg', 'AM4, AM5, LGA1700, LGA1200', NULL, NULL, NULL, NULL, NULL, NULL, 280, 'AIO', '[]', '[\"Universal\"]', '[\"Жидкостное охлаждение\",\"240mm радиатор\",\"Эффективное\"]', 1, '2025-12-12 08:00:39', '2026-01-08 11:23:55'),
(81, 1, 'Ryzen 5 1600AF', 'Процессор Ryzen 5 1600AF', 5500.00, 'https://amd.news/wp-content/uploads/2020/06/R5-1600-AF-1.jpg', 'AM4', NULL, NULL, 65, NULL, NULL, NULL, NULL, NULL, '[]', '[\"AM4\",\"DDR4\"]', '[\"6 ядер\",\"12 потоков\",\"3.2 ГГц\"]', 1, '2026-01-10 04:28:06', '2026-01-10 04:28:40');

-- --------------------------------------------------------

--
-- Структура таблицы `component_categories`
--

CREATE TABLE `component_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `icon` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `component_categories`
--

INSERT INTO `component_categories` (`id`, `name`, `slug`, `icon`) VALUES
(1, 'Процессоры', 'cpus', NULL),
(2, 'Материнские платы', 'motherboards', NULL),
(3, 'Оперативная память', 'rams', NULL),
(4, 'Видеокарты', 'gpus', NULL),
(5, 'Накопители', 'storages', NULL),
(6, 'Блоки питания', 'psus', NULL),
(7, 'Корпуса', 'cases', NULL),
(8, 'Охлаждение', 'coolers', NULL);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'vadim', 'vados123@gmail.com', '$2y$10$LyuycbGEV3fKxi8T7sMXReZVNDozfzKouf7V4.W03sqJAdATTXYsO', 'admin', '2025-12-12 09:53:31', '2025-12-12 09:54:24'),
(2, 'test', 'test@gmail.com', '$2y$10$u.F1xKX6LqFG5IRvH1pQDeK8qQduleivJakuCC5Vj.0Na448WMXGa', 'admin', '2025-12-12 09:54:56', '2025-12-12 09:55:04');

-- --------------------------------------------------------

--
-- Структура таблицы `user_builds`
--

CREATE TABLE `user_builds` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `compatibility_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`compatibility_data`)),
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `user_builds`
--

INSERT INTO `user_builds` (`id`, `user_id`, `name`, `total_price`, `compatibility_data`, `is_public`, `created_at`, `updated_at`) VALUES
(15, 1, 'Моя сборка 08.01.2026', 35000.01, '{\n    \"cpus\": {\n        \"id\": 43,\n        \"name\": \"AMD Ryzen 7 5800X3D\",\n        \"price\": \"35000.00\"\n    },\n    \"motherboards\": {\n        \"id\": 52,\n        \"name\": \"ASRock B450M-HDV\",\n        \"price\": \"8000.00\"\n    },\n    \"rams\": {\n        \"id\": 57,\n        \"name\": \"G.Skill Trident Z 16GB (2x8GB) DDR4\",\n        \"price\": \"7000.00\"\n    }\n}', 0, '2026-01-08 15:32:19', '2026-01-08 15:32:19'),
(16, 1, 'Моя сборка 10.01.2026', 18000.00, '{\n    \"cpus\": {\n        \"id\": 42,\n        \"name\": \"Intel Core i5-12400F\",\n        \"price\": \"18000.00\",\n        \"image\": \"i5_12400f.jpg\"\n    },\n    \"motherboards\": {\n        \"id\": 50,\n        \"name\": \"Gigabyte B660M DS3H\",\n        \"price\": \"10000.00\",\n        \"image\": \"ds3h.png\"\n    },\n    \"rams\": {\n        \"id\": 58,\n        \"name\": \"Crucial Ballistix 32GB (2x16GB) DDR4\",\n        \"price\": \"9000.00\",\n        \"image\": \"ballistic_32.jpg\"\n    }\n}', 0, '2026-01-09 20:26:04', '2026-01-09 20:26:04'),
(17, 1, 'Моя сборка 10.01.2026', 35000.00, '{\n    \"cpus\": {\n        \"id\": 43,\n        \"name\": \"AMD Ryzen 7 5800X3D\",\n        \"price\": \"35000.00\",\n        \"image\": \"5800x3d.jpg\"\n    },\n    \"motherboards\": {\n        \"id\": 49,\n        \"name\": \"ASUS ROG Strix B550-F Gaming\",\n        \"price\": \"15000.00\",\n        \"image\": \"b550_f.png\"\n    },\n    \"rams\": {\n        \"id\": 55,\n        \"name\": \"Kingston Fury Beast 16GB (2x8GB) DDR4\",\n        \"price\": \"6000.00\",\n        \"image\": \"fury_beast.png\"\n    },\n    \"gpus\": {\n        \"id\": 61,\n        \"name\": \"AMD Radeon RX 6600 XT 8GB\",\n        \"price\": \"32000.00\",\n        \"image\": \"rx6600xt_powercolor.jpg\"\n    },\n    \"storages\": [\n        {\n            \"id\": 68,\n            \"name\": \"Crucial P5 Plus 2TB M.2 NVMe\",\n            \"price\": \"12000.00\",\n            \"image\": \"crucialp5plus.jpg\"\n        }\n    ],\n    \"psus\": {\n        \"id\": 73,\n        \"name\": \"Cooler Master MWE Gold 850\",\n        \"price\": \"9500.00\",\n        \"image\": \"coolermaster_mwe_gold.png\"\n    },\n    \"cases\": {\n        \"id\": 76,\n        \"name\": \"Fractal Design Meshify C\",\n        \"price\": \"8500.00\",\n        \"image\": \"fd_meshify.jpg\"\n    },\n    \"coolers\": {\n        \"id\": 77,\n        \"name\": \"Noctua NH-D15\",\n        \"price\": \"8000.00\",\n        \"image\": \"noctua_nh_d15.jpg\"\n    }\n}', 0, '2026-01-09 21:51:01', '2026-01-09 21:51:01'),
(18, 1, 'Моя сборка 10.01.2026', 35000.00, '{\n    \"cpus\": {\n        \"id\": 43,\n        \"name\": \"AMD Ryzen 7 5800X3D\",\n        \"price\": \"35000.00\",\n        \"image\": \"5800x3d.jpg\"\n    },\n    \"motherboards\": {\n        \"id\": 49,\n        \"name\": \"ASUS ROG Strix B550-F Gaming\",\n        \"price\": \"15000.00\",\n        \"image\": \"b550_f.png\"\n    },\n    \"rams\": {\n        \"id\": 55,\n        \"name\": \"Kingston Fury Beast 16GB (2x8GB) DDR4\",\n        \"price\": \"6000.00\",\n        \"image\": \"fury_beast.png\"\n    },\n    \"gpus\": {\n        \"id\": 61,\n        \"name\": \"AMD Radeon RX 6600 XT 8GB\",\n        \"price\": \"32000.00\",\n        \"image\": \"rx6600xt_powercolor.jpg\"\n    },\n    \"storages\": [\n        {\n            \"id\": 68,\n            \"name\": \"Crucial P5 Plus 2TB M.2 NVMe\",\n            \"price\": \"12000.00\",\n            \"image\": \"crucialp5plus.jpg\"\n        }\n    ],\n    \"psus\": {\n        \"id\": 73,\n        \"name\": \"Cooler Master MWE Gold 850\",\n        \"price\": \"9500.00\",\n        \"image\": \"coolermaster_mwe_gold.png\"\n    },\n    \"cases\": {\n        \"id\": 76,\n        \"name\": \"Fractal Design Meshify C\",\n        \"price\": \"8500.00\",\n        \"image\": \"fd_meshify.jpg\"\n    },\n    \"coolers\": {\n        \"id\": 77,\n        \"name\": \"Noctua NH-D15\",\n        \"price\": \"8000.00\",\n        \"image\": \"noctua_nh_d15.jpg\"\n    }\n}', 0, '2026-01-09 21:51:04', '2026-01-09 21:51:04');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `build_components`
--
ALTER TABLE `build_components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `build_id` (`build_id`),
  ADD KEY `component_id` (`component_id`);

--
-- Индексы таблицы `components`
--
ALTER TABLE `components`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Индексы таблицы `component_categories`
--
ALTER TABLE `component_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `user_builds`
--
ALTER TABLE `user_builds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT для таблицы `build_components`
--
ALTER TABLE `build_components`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT для таблицы `components`
--
ALTER TABLE `components`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT для таблицы `component_categories`
--
ALTER TABLE `component_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `user_builds`
--
ALTER TABLE `user_builds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Ограничения внешнего ключа таблицы `build_components`
--
ALTER TABLE `build_components`
  ADD CONSTRAINT `build_components_ibfk_1` FOREIGN KEY (`build_id`) REFERENCES `user_builds` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `build_components_ibfk_2` FOREIGN KEY (`component_id`) REFERENCES `components` (`id`);

--
-- Ограничения внешнего ключа таблицы `components`
--
ALTER TABLE `components`
  ADD CONSTRAINT `components_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `component_categories` (`id`);

--
-- Ограничения внешнего ключа таблицы `user_builds`
--
ALTER TABLE `user_builds`
  ADD CONSTRAINT `user_builds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
