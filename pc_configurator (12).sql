-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Хост: MySQL-8.0:3306
-- Время создания: Июн 14 2026 г., 22:30
-- Версия сервера: 8.0.43
-- Версия PHP: 8.2.29

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
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `activities`
--

INSERT INTO `activities` (`id`, `user_id`, `action_type`, `description`, `created_at`) VALUES
(13, 1, 'user_delete', 'Удаление пользователя: Удалён пользователь ID: 3', '2026-01-08 11:23:33'),
(14, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:80 деактивирован', '2026-01-08 11:23:48'),
(15, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:80 активирован', '2026-01-08 11:23:56'),
(16, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Ryzen 5 1600AF', '2026-01-10 08:28:07'),
(17, 1, 'component_edit', 'Редактирование компонента: Обновлён компонент ID: 81', '2026-01-10 08:28:41'),
(18, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:54:02'),
(19, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 15:54:03'),
(20, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:54:06'),
(21, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 15:54:08'),
(22, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:56:35'),
(23, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 15:56:36'),
(24, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:56:38'),
(25, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 15:56:39'),
(26, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:57:04'),
(27, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 15:57:05'),
(28, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 15:57:07'),
(29, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 16:12:06'),
(30, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-27 16:30:29'),
(31, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-27 16:30:30'),
(32, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 деактивирован', '2026-01-29 14:21:07'),
(33, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-29 14:36:15'),
(34, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 деактивирован', '2026-01-29 14:37:00'),
(35, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 активирован', '2026-01-29 14:38:29'),
(36, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 активирован', '2026-01-29 14:53:10'),
(37, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 деактивирован', '2026-01-29 14:53:26'),
(38, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 активирован', '2026-01-29 15:24:15'),
(39, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 деактивирован', '2026-01-29 15:24:30'),
(40, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:43 активирован', '2026-01-29 16:09:24'),
(41, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:10:31'),
(42, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:11:23'),
(43, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:11:30'),
(44, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:11:45'),
(45, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:81 активирован', '2026-01-29 16:16:47'),
(46, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:16:50'),
(47, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 81', '2026-01-29 16:21:19'),
(48, 1, 'import_components', 'Импорт компонентов: Импортировано 40 компонентов', '2026-01-29 16:32:09'),
(49, 1, 'import_components', 'Импорт компонентов: Импортировано 40 компонентов', '2026-01-29 16:33:18'),
(50, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:41 деактивирован', '2026-01-29 16:49:51'),
(51, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:160 деактивирован', '2026-01-29 16:56:22'),
(52, 1, 'component_add', 'Добавление компонента: добавлен компонент: DEEPCOOL DF500', '2026-01-30 14:22:32'),
(53, 1, 'component_edit', 'Редактирование компонента: Обновлён компонент ID: 162', '2026-01-30 14:22:48'),
(54, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:153 деактивирован', '2026-01-30 14:25:52'),
(55, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:162 деактивирован', '2026-01-30 14:26:28'),
(56, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:162 активирован', '2026-01-30 14:28:14'),
(57, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:162 деактивирован', '2026-01-30 14:28:37'),
(58, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:162 активирован', '2026-01-30 16:19:27'),
(59, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:162 деактивирован', '2026-01-30 16:19:36'),
(60, 1, 'import_components', 'Импорт компонентов: Импортировано 8 компонентов', '2026-01-30 18:12:01'),
(61, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:165 деактивирован', '2026-01-30 21:43:11'),
(62, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 165', '2026-01-30 21:43:25'),
(63, 1, 'import_components', 'Импорт компонентов: Импортировано 8 компонентов', '2026-01-30 22:06:28'),
(64, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-11 18:04:45'),
(65, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-11 18:07:08'),
(66, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-11 18:08:00'),
(67, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-11 18:11:26'),
(68, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-12 05:33:55'),
(69, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-12 05:36:30'),
(70, 1, 'import_components', 'Импорт компонентов: Импорт: 6 успешно, 2 ошибок', '2026-02-12 05:37:58'),
(71, 1, 'user_delete', 'Удаление пользователя: Удалён пользователь ID: 13', '2026-02-12 16:20:01'),
(72, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 223', '2026-02-12 16:47:34'),
(73, 1, 'component_toggle', 'Изменение статуса компонента: Компонент ID:216 деактивирован', '2026-02-12 16:47:36'),
(74, 1, 'user_delete', 'Удаление пользователя: Удалён пользователь ID: 12', '2026-02-12 16:48:21'),
(75, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 44', '2026-03-14 21:20:07'),
(76, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 43', '2026-03-14 21:20:09'),
(77, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 40', '2026-03-14 21:20:11'),
(78, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 36', '2026-03-14 21:20:13'),
(79, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 35', '2026-03-14 21:20:16'),
(80, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 32', '2026-03-14 21:20:19'),
(81, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 26', '2026-03-14 21:20:21'),
(82, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 24', '2026-03-14 21:20:24'),
(83, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 22', '2026-03-14 21:20:27'),
(84, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 27', '2026-03-14 21:20:31'),
(85, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 25', '2026-03-14 21:20:33'),
(86, 2, 'component_edit', 'Редактирование компонента: Обновлён компонент ID: 183', '2026-03-15 10:11:34'),
(87, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:7 деактивирован', '2026-03-15 15:39:41'),
(88, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:7 деактивирован', '2026-03-15 15:39:50'),
(89, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:7 деактивирован', '2026-03-15 15:39:53'),
(90, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 16', '2026-03-16 22:01:32'),
(91, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 16', '2026-03-16 22:05:34'),
(92, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 7', '2026-03-16 22:15:33'),
(93, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 16', '2026-03-16 22:21:13'),
(94, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 31', '2026-03-16 22:21:24'),
(95, 2, 'component_delete', 'Удаление компонента: Удалён компонент ID: 24', '2026-03-16 22:21:26'),
(96, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:6 деактивирован (через редактирование)', '2026-03-16 22:29:36'),
(97, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:6 деактивирован', '2026-03-16 22:32:59'),
(98, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:6 деактивирован', '2026-03-16 22:42:12'),
(99, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:6 деактивирован', '2026-03-16 22:45:36'),
(100, 2, 'component_toggle', 'Изменение статуса компонента: Компонент ID:6 активирован', '2026-03-16 22:45:51'),
(101, 2, 'build_delete', 'Удаление сборки: Удалена сборка ID: 50', '2026-03-18 18:28:31'),
(102, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 23', '2026-03-18 18:28:59'),
(103, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 21', '2026-03-18 18:29:02'),
(104, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 19', '2026-03-18 18:29:04'),
(105, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 18', '2026-03-18 18:29:06'),
(106, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 17', '2026-03-18 18:29:08'),
(107, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 16', '2026-03-18 18:29:11'),
(108, 1, 'build_delete', 'Удаление сборки: Удалена сборка ID: 15', '2026-03-18 18:29:13'),
(109, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-05-17 06:21:29'),
(110, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-05-17 06:22:32'),
(111, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-05-17 06:24:51'),
(112, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-05-17 06:30:57'),
(113, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: NZXT H5 Flow', '2026-05-27 08:37:12'),
(114, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: NZXT H5 Flow', '2026-05-27 08:44:05'),
(115, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: AMD Ryzen 5 3500', '2026-05-27 08:44:16'),
(116, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: AMD Ryzen 5 3500', '2026-05-27 08:45:26'),
(117, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: AMD Ryzen 7 8700G', '2026-05-27 08:45:52'),
(118, 2, 'user_role_change', 'Изменение роли пользователя: ID: 1, роль: user', '2026-05-27 09:15:25'),
(119, 2, 'user_role_change', 'Изменение роли пользователя: ID: 1, роль: admin', '2026-05-27 09:15:27'),
(120, 2, 'build_delete', 'Удаление сборки: ID: 59', '2026-05-27 09:22:02'),
(121, 2, 'build_delete', 'Удаление сборки: ID: 60', '2026-05-27 09:22:13'),
(122, 2, 'build_delete', 'Удаление сборки: ID: 64', '2026-05-27 09:25:45'),
(123, 2, 'build_delete', 'Удаление сборки: ID: 66', '2026-05-27 09:26:50'),
(124, 2, 'build_delete', 'Удаление сборки: ID: 61', '2026-05-27 09:27:05'),
(125, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: AMD Ryzen 5 3500', '2026-06-10 07:01:56'),
(126, 2, 'component_edit', 'Редактирование компонента: Изменён компонент: NZXT H5 Flow', '2026-06-10 09:40:22'),
(127, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-06-13 06:46:38'),
(128, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: Ryzen 5 1600AF', '2026-06-13 06:47:54'),
(129, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Intel Core i3 10105F', '2026-06-13 08:34:33'),
(130, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Gigabyte A620M H', '2026-06-13 08:37:21'),
(131, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Kingston Fury Renegade RGB DIMM 16Gb DDR4 4600 MHz', '2026-06-13 08:39:52'),
(132, 1, 'component_add', 'Добавление компонента: Добавлен компонент: NVIDIA GeForce RTX 5070 Ti ASUS TUF Gaming OC 16Gb', '2026-06-13 08:43:52'),
(133, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Patriot P300 256 Gb', '2026-06-13 08:50:21'),
(134, 1, 'component_add', 'Добавление компонента: Добавлен компонент: Блок питания Deepcool PF600 600 Вт', '2026-06-13 08:53:09'),
(135, 1, 'component_add', 'Добавление компонента: Добавлен компонент: ID-Cooling SE-224-XTS MINI', '2026-06-13 09:08:54'),
(136, 1, 'component_add', 'Добавление компонента: Добавлен компонент: ADATA XPG DEFENDER DEFENDER белый Mid-Tower', '2026-06-13 13:10:42'),
(137, 1, 'component_add', 'Добавление компонента: Добавлен компонент: AMD Ryzen 5 7500F', '2026-06-13 13:22:20'),
(138, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: ADATA XPG DEFENDER DEFENDER белый Mid-Tower', '2026-06-13 14:13:45'),
(139, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: NZXT H5 Flow', '2026-06-14 09:26:21'),
(140, 1, 'component_edit', 'Редактирование компонента: Изменён компонент: DeepCool CH510', '2026-06-14 09:26:37'),
(141, 1, 'component_add', 'Добавление компонента: Добавлен компонент: test', '2026-06-14 09:27:18'),
(142, 1, 'component_delete', 'Удаление компонента: Удалён компонент ID: 74', '2026-06-14 09:27:27');

-- --------------------------------------------------------

--
-- Структура таблицы `cases`
--

CREATE TABLE `cases` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `form_factor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Full Tower, Mid Tower, Mini Tower',
  `supported_motherboards` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ATX, Micro-ATX, Mini-ITX',
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `window` tinyint(1) DEFAULT '0' COMMENT 'Окно',
  `max_gpu_length` int DEFAULT NULL COMMENT 'Макс. длина видеокарты в мм',
  `max_cpu_cooler_height` int DEFAULT NULL COMMENT 'Макс. высота кулера в мм',
  `drive_bays` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '2.5"/3.5" отсеки',
  `fan_slots` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Кол-во вентиляторов',
  `radiator_support` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '120/240/360мм',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `cases`
--

INSERT INTO `cases` (`id`, `name`, `description`, `price`, `image`, `form_factor`, `supported_motherboards`, `color`, `window`, `max_gpu_length`, `max_cpu_cooler_height`, `drive_bays`, `fan_slots`, `radiator_support`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NZXT H510 Flow', 'Корпус NZXT H510 Flow', 7000.00, 'nzxt_h510_flow.jpg', 'ATX', 'ATX, Micro-ATX, Mini-ITX', 'Black', 0, 350, 165, '2x 3.5\", 2x 2.5\"', '3x front, 2x top, 1x rear', '120/240/360mm', 'NZXT', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(2, 'Lian Li PC-O11 Dynamic', 'Корпус Lian Li PC-O11 Dynamic', 12000.00, 'lian_li_dynamic.jpg', 'ATX', 'ATX, Micro-ATX, Mini-ITX', 'Black', 1, 350, 165, '2x 3.5\", 2x 2.5\"', '3x front, 2x top, 1x rear', '120/240/360mm', 'Lian Li', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(3, 'Fractal Design Meshify C', 'Корпус Fractal Design Meshify C', 8500.00, 'fd_meshify.jpg', 'ATX', 'ATX, Micro-ATX, Mini-ITX', 'Black', 0, 350, 165, '2x 3.5\", 2x 2.5\"', '3x front, 2x top, 1x rear', '120/240/360mm', 'Fractal Design', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(4, 'DeepCool CH510', 'Корпус DeepCool CH510', 6500.00, 'https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CH510/Gallery/800X800/01.jpg?fm=webp&q=60', 'Mid Tower', 'ATX, Micro-ATX, Mini-ITX', 'Black', 1, 350, 165, '2x 3.5\", 2x 2.5\"', '3x front, 2x top, 1x rear', '120mm, 240mm, 360mm', 'DeepCool', 1, '2026-01-30 18:11:58', '2026-06-14 09:26:36'),
(5, 'NZXT H5 Flow', 'Корпус NZXT H5 Flow', 7000.00, 'https://cdn.3dnews.ru/assets/external/illustrations/2024/08/20/1109748/GSiVz7OVEs6fdy2U.jpg', 'Mid Tower', 'ATX, Micro-ATX, Mini-ITX', 'Black', 0, 350, 165, '2x 3.5\", 2x 2.5\"', '3x front, 2x top, 1x rear', '120mm, 240mm, 360mm', 'NZXT', 1, '2026-02-11 18:04:43', '2026-06-14 09:26:21'),
(8, 'ADATA XPG DEFENDER DEFENDER белый Mid-Tower', 'Корпус ADATA XPG DEFENDER DEFENDER белый Mid-Tower', 3400.00, 'https://www.oldi.ru/xl_pics/02027503.jpg', 'Mid Tower', 'ATX, Micro-ATX, Mini-ITX', 'White', 1, 240, 260, '2x 3.5', '2x front, 1x top', '120mm, 240mm, 360mm', 'be quiet!', 1, '2026-06-13 13:10:42', '2026-06-13 14:13:45');

-- --------------------------------------------------------

--
-- Структура таблицы `components`
--

CREATE TABLE `components` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `reference_id` int NOT NULL,
  `reference_table` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `components`
--

INSERT INTO `components` (`id`, `category_id`, `reference_id`, `reference_table`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'cpus', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(2, 1, 2, 'cpus', 1, '2025-12-12 08:00:35', '2026-01-29 16:09:23'),
(3, 1, 3, 'cpus', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(4, 1, 4, 'cpus', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(5, 1, 5, 'cpus', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(6, 1, 6, 'cpus', 1, '2025-12-12 08:00:35', '2026-03-16 22:45:51'),
(8, 1, 8, 'cpus', 1, '2026-01-30 18:11:57', '2026-05-27 08:45:52'),
(9, 1, 9, 'cpus', 1, '2026-02-11 18:04:42', '2026-06-10 07:01:56'),
(10, 2, 1, 'motherboards', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(11, 2, 2, 'motherboards', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(12, 2, 3, 'motherboards', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(13, 2, 4, 'motherboards', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(14, 2, 5, 'motherboards', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(15, 2, 6, 'motherboards', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(17, 2, 8, 'motherboards', 1, '2026-02-11 18:04:42', '2026-03-21 18:39:25'),
(18, 3, 1, 'rams', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(19, 3, 2, 'rams', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(20, 3, 3, 'rams', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(21, 3, 4, 'rams', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(22, 3, 5, 'rams', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(23, 3, 6, 'rams', 1, '2026-01-30 22:06:27', '2026-01-30 22:06:27'),
(25, 4, 1, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(26, 4, 2, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(27, 4, 3, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(28, 4, 4, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(29, 4, 5, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(30, 4, 6, 'gpus', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(32, 4, 8, 'gpus', 1, '2026-02-11 18:04:43', '2026-02-11 18:04:43'),
(33, 5, 1, 'storages', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(34, 5, 2, 'storages', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(35, 5, 3, 'storages', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(36, 5, 4, 'storages', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(37, 5, 5, 'storages', 1, '2026-01-30 18:11:57', '2026-01-30 18:11:57'),
(38, 6, 1, 'psus', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(39, 6, 2, 'psus', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(40, 6, 3, 'psus', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(41, 6, 4, 'psus', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(42, 6, 5, 'psus', 1, '2026-01-30 18:11:57', '2026-01-30 18:11:57'),
(43, 6, 6, 'psus', 1, '2026-02-11 18:04:43', '2026-03-15 10:11:33'),
(44, 7, 1, 'cases', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(45, 7, 2, 'cases', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(46, 7, 3, 'cases', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(47, 7, 4, 'cases', 1, '2026-01-30 18:11:58', '2026-06-14 09:26:36'),
(48, 7, 5, 'cases', 1, '2026-02-11 18:04:43', '2026-06-14 09:26:21'),
(49, 8, 1, 'coolers', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(50, 8, 2, 'coolers', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(51, 8, 3, 'coolers', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(52, 8, 4, 'coolers', 1, '2025-12-12 08:00:39', '2026-01-08 11:23:55'),
(53, 8, 5, 'coolers', 1, '2026-01-30 18:11:58', '2026-01-30 18:11:58'),
(54, 8, 6, 'coolers', 1, '2026-02-11 18:04:43', '2026-03-16 21:42:33'),
(64, 1, 17, 'cpus', 0, '2026-03-18 19:01:13', '2026-06-13 06:47:54'),
(65, 1, 18, 'cpus', 1, '2026-06-13 08:34:33', '2026-06-13 08:34:33'),
(66, 2, 16, 'motherboards', 1, '2026-06-13 08:37:21', '2026-06-13 08:37:21'),
(67, 3, 8, 'rams', 1, '2026-06-13 08:39:52', '2026-06-13 08:39:52'),
(68, 4, 16, 'gpus', 1, '2026-06-13 08:43:52', '2026-06-13 08:43:52'),
(69, 5, 8, 'storages', 1, '2026-06-13 08:50:21', '2026-06-13 08:50:21'),
(70, 6, 8, 'psus', 1, '2026-06-13 08:53:09', '2026-06-13 08:53:09'),
(71, 8, 8, 'coolers', 1, '2026-06-13 09:08:54', '2026-06-13 09:08:54'),
(72, 7, 8, 'cases', 1, '2026-06-13 13:10:42', '2026-06-13 14:13:45'),
(73, 1, 19, 'cpus', 1, '2026-06-13 13:22:20', '2026-06-13 13:22:20');

-- --------------------------------------------------------

--
-- Структура таблицы `component_categories`
--

CREATE TABLE `component_categories` (
  `id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `icon` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `component_categories`
--

INSERT INTO `component_categories` (`id`, `name`, `code`, `icon`) VALUES
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
-- Структура таблицы `coolers`
--

CREATE TABLE `coolers` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Air, AIO',
  `socket_compatibility` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'AM4, LGA1700 и т.д.',
  `tdp` int DEFAULT NULL COMMENT 'Макс. рассеиваемая мощность',
  `radiator_size` int DEFAULT NULL COMMENT 'Размер радиатора в мм (для AIO)',
  `fan_size` int DEFAULT NULL COMMENT 'Размер вентилятора в мм',
  `noise_level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Уровень шума',
  `height` int DEFAULT NULL COMMENT 'Высота в мм (для воздуха)',
  `led` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'RGB, None',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `coolers`
--

INSERT INTO `coolers` (`id`, `name`, `description`, `price`, `image`, `type`, `socket_compatibility`, `tdp`, `radiator_size`, `fan_size`, `noise_level`, `height`, `led`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Noctua NH-D15', 'Охлаждение Noctua NH-D15', 8000.00, 'noctua_nh_d15.jpg', 'Air', 'AM4, AM5, LGA1700, LGA1200', 250, NULL, 140, '18-24 dBA', 165, 'None', 'Noctua', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(2, 'Corsair iCUE H150i Elite', 'Охлаждение Corsair iCUE H150i Elite', 12000.00, 'corsair_icue_h150i.jpg', 'AIO', 'AM4, AM5, LGA1700, LGA1200', 300, 360, 120, '22-32 dBA', NULL, 'RGB', 'Corsair', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(3, 'be quiet! Dark Rock Pro 4', 'Охлаждение be quiet! Dark Rock Pro 4', 7000.00, 'bq_darkrockpro4.jpg', 'Air', 'AM4, AM5, LGA1700, LGA1200', 250, NULL, 120, '15-25 dBA', 163, 'None', 'be quiet!', 1, '2025-12-12 08:00:39', '2025-12-12 12:00:39'),
(4, 'Arctic Liquid Freezer II 240', 'Охлаждение Arctic Liquid Freezer II 240', 6000.00, 'arctic_liquid_freezer_2_240.jpg', 'AIO', 'AM4, AM5, LGA1700, LGA1200', 280, 240, 120, '20-28 dBA', NULL, 'None', 'Arctic', 1, '2025-12-12 08:00:39', '2026-01-08 11:23:55'),
(5, 'DeepCool AK620', 'Охлаждение DeepCool AK620', 5500.00, 'https://static.onlinetrade.ru/img/items/m/deepcool_ak620_1937508_1.jpg', 'Air', 'AM4, AM5, LGA1700, LGA1200', 260, NULL, 120, '22-30 dBA', 160, 'None', 'DeepCool', 1, '2026-01-30 18:11:58', '2026-01-30 18:11:58'),
(6, 'DeepCool GAMMAXX 400', 'Охлаждение DeepCool GAMMAXX 400', 3000.00, 'https://ir.ozone.ru/s3/multimedia-z/c1000/6864558983.jpg', 'Air', 'AM4, LGA1700, LGA1200', 200, 120, 120, '22-30 dBA', 155, 'None', 'DeepCool', 1, '2026-02-11 18:04:43', '2026-03-16 21:42:33'),
(8, 'ID-Cooling SE-224-XTS MINI', 'Охлаждение ID-Cooling SE-224-XTS MINI', 2000.00, 'https://www.oldi.ru/xl_pics/02055688.jpg', 'Air', 'AM4, AM5, LGA1700, LGA1200', 230, NULL, NULL, NULL, 100, 'None', 'Arctic', 1, '2026-06-13 09:08:54', '2026-06-13 09:08:54');

-- --------------------------------------------------------

--
-- Структура таблицы `cpus`
--

CREATE TABLE `cpus` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `socket` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `cores` int DEFAULT NULL,
  `threads` int DEFAULT NULL,
  `frequency` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Частота (например, 3.7 ГГц)',
  `tdp` int DEFAULT NULL,
  `memory_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'DDR4, DDR5',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `cpus`
--

INSERT INTO `cpus` (`id`, `name`, `description`, `price`, `image`, `socket`, `cores`, `threads`, `frequency`, `tdp`, `memory_type`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Intel Core i5-12400F', 'Процессор Intel Core i5-12400F', 18000.00, 'i5_12400f.jpg', 'LGA1700', 6, 12, '2.5 ГГц', NULL, 'DDR4', 'Intel', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(2, 'AMD Ryzen 7 5800X3D', 'Процессор AMD Ryzen 7 5800X3D', 35000.00, '5800x3d.jpg', 'AM4', 8, 16, '3.4 ГГц', NULL, 'DDR4', 'AMD', 1, '2025-12-12 08:00:35', '2026-01-29 16:09:23'),
(3, 'Intel Core i7-12700K', 'Процессор Intel Core i7-12700K', 32000.00, '12700k.jpg', 'LGA1700', 12, 20, '3.6 ГГц', NULL, 'DDR5', 'Intel', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(4, 'AMD Ryzen 5 7600X', 'Процессор AMD Ryzen 5 7600X', 28000.00, '7600x.png', 'AM5', 6, 12, '4.7 ГГц', NULL, 'DDR5', 'AMD', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(5, 'Intel Core i9-13900K', 'Процессор Intel Core i9-13900K', 45000.00, '13900k.png', 'LGA1700', 24, 32, '3.0 ГГц', NULL, 'DDR5', 'Intel', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(6, 'AMD Ryzen 9 7950X', 'Процессор AMD Ryzen 9 7950X', 52000.00, '7950x.png', 'AM5', 6, 32, '4.5 ГГц', NULL, 'DDR5', 'AMD', 1, '2025-12-12 08:00:35', '2026-03-16 22:45:51'),
(8, 'AMD Ryzen 7 8700G', 'Процессор AMD Ryzen 7 8700G', 38000.00, 'https://c.dns-shop.ru/thumb/st1/fit/300/300/906a6547c44e5a4095e3f28e018ab5d2/b84ba09423d25151745364c43b1bfa28a3fa325d639f01d86fb6479ded831564.jpg', 'AM5', 8, 16, '4.2 ГГц', NULL, 'DDR5', 'AMD', 1, '2026-01-30 18:11:57', '2026-05-27 08:45:52'),
(9, 'AMD Ryzen 5 3500', 'Процессор AMD Ryzen 5 3500', 6000.00, 'https://c.dns-shop.ru/thumb/st4/fit/300/300/e9549bb9589ce8dae4c46c6edcb6403e/2ee51743b3c1d7a80ddbe9ec77f7c96c4809e47e14be6a9ea3215e18e1b6a622.jpg', 'AM4', 6, 12, '3.7 ГГц', NULL, 'DDR4', 'AMD', 1, '2026-02-11 18:04:42', '2026-06-10 07:01:56'),
(17, 'Ryzen 5 1600AF', 'Ryzen 5 1600AF', 4500.00, 'https://amd.news/wp-content/uploads/2020/06/R5-1600-AF-1.jpg', 'AM4', 6, 12, '', 65, 'DDR4', 'AMD', 0, '2026-03-18 19:01:13', '2026-06-13 06:47:54'),
(18, 'Intel Core i3 10105F', 'Процессор Intel Core i3 10105F', 6400.00, 'https://cdn.kns.ru/linkpics/intel-core-i3-10105f-oem-0-v2.jpg', 'LGA1200', 4, 8, '3.7 ГГц', 65, 'DDR4', 'Intel', 1, '2026-06-13 08:34:33', '2026-06-13 08:34:33'),
(19, 'AMD Ryzen 5 7500F', 'Процессор AMD Ryzen 5 7500F', 18000.00, 'https://c.dns-shop.ru/thumb/st4/fit/300/300/4aa8e1fcad21fabf357756f06d66b0c1/e6293f21cc6d64c505e37405fa55d329827db7f8cd863e254841198e037f2386.jpg', 'AM5', 6, 12, '3.7 ГГц', 65, 'DDR5', 'AMD', 1, '2026-06-13 13:22:20', '2026-06-13 13:22:20');

-- --------------------------------------------------------

--
-- Структура таблицы `gpus`
--

CREATE TABLE `gpus` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gpu_chip` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `memory_size` int NOT NULL COMMENT 'Объем памяти в ГБ',
  `memory_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'GDDR5, GDDR6',
  `tdp` int DEFAULT NULL,
  `recommended_psu` int DEFAULT NULL COMMENT 'Рекомендуемый БП в Вт',
  `pcie_version` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `hdmi_ports` int DEFAULT '0',
  `displayport_ports` int DEFAULT '0',
  `length` int DEFAULT NULL COMMENT 'Длина в мм',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `chip_manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'NVIDIA, AMD',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `gpus`
--

INSERT INTO `gpus` (`id`, `name`, `description`, `price`, `image`, `gpu_chip`, `memory_size`, `memory_type`, `tdp`, `recommended_psu`, `pcie_version`, `hdmi_ports`, `displayport_ports`, `length`, `manufacturer`, `chip_manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'NVIDIA GeForce RTX 3060 12GB', 'Видеокарта NVIDIA GeForce RTX 3060 12GB', 35000.00, 'rtx_3060_asus.jpg', 'RTX 3060', 12, 'GDDR6', NULL, 650, '4.0', 1, 3, 280, 'NVIDIA', 'NVIDIA', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(2, 'AMD Radeon RX 6600 XT 8GB', 'Видеокарта AMD Radeon RX 6600 XT 8GB', 32000.00, 'rx6600xt_powercolor.jpg', 'RX 6600', 8, 'GDDR6', NULL, 650, '4.0', 1, 3, 280, 'Other', 'AMD', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(3, 'NVIDIA GeForce RTX 4070 12GB', 'Видеокарта NVIDIA GeForce RTX 4070 12GB', 65000.00, 'rtx4070_asus.jpg', 'RTX 4070', 12, 'GDDR6X', NULL, 700, '4.0', 1, 3, 280, 'NVIDIA', 'NVIDIA', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(4, 'AMD Radeon RX 7800 XT 16GB', 'Видеокарта AMD Radeon RX 7800 XT 16GB', 58000.00, 'rx7800xt_asus.jpg', 'RX 7800 XT', 16, 'GDDR6', NULL, 750, '4.0', 1, 3, 280, 'Other', 'AMD', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(5, 'NVIDIA GeForce RTX 4060 Ti 8GB', 'Видеокарта NVIDIA GeForce RTX 4060 Ti 8GB', 45000.00, '4060_msi.png', 'RTX 4060', 8, 'GDDR6', NULL, 550, '4.0', 1, 3, 280, 'NVIDIA', 'NVIDIA', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(6, 'AMD Radeon RX 7600 8GB', 'Видеокарта AMD Radeon RX 7600 8GB', 28000.00, 'rx7600_biostar.png', 'RX 7600', 8, 'GDDR6', NULL, 550, '4.0', 1, 3, 280, 'Other', 'AMD', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(8, 'Palit NVIDIA GeForce RTX 3060', 'Видеокарта Palit NVIDIA GeForce RTX 3060', 42000.00, 'https://3logic.ru/pimg/pim/1000/1032149.jpg', 'RTX 3060', 12, 'GDDR6', NULL, 650, '4.0', 1, 3, 280, 'Palit', 'NVIDIA', 1, '2026-02-11 18:04:43', '2026-02-11 18:04:43'),
(16, 'NVIDIA GeForce RTX 5070 Ti ASUS TUF Gaming OC 16Gb', 'Видеокарта NVIDIA GeForce RTX 5070 Ti ASUS TUF Gaming OC 16Gb', 108900.00, 'https://compday.ru/files/reg/6284423.png', 'Nvidia', 16, 'GDDR6X', 300, 700, NULL, 0, 0, 150, 'ASUS', 'NVIDIA', 1, '2026-06-13 08:43:52', '2026-06-13 08:43:52');

-- --------------------------------------------------------

--
-- Структура таблицы `motherboards`
--

CREATE TABLE `motherboards` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `socket` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `chipset` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `form_factor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ATX, Micro-ATX, Mini-ITX',
  `memory_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'DDR4, DDR5',
  `memory_slots` int DEFAULT '2' COMMENT 'Кол-во слотов RAM',
  `max_memory` int DEFAULT NULL COMMENT 'Макс. объем RAM в ГБ',
  `m2_slots` int DEFAULT '0' COMMENT 'Кол-во M.2 слотов',
  `sata_ports` int DEFAULT '0' COMMENT 'Кол-во SATA портов',
  `pcie_version` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `wifi` tinyint(1) DEFAULT '0',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `motherboards`
--

INSERT INTO `motherboards` (`id`, `name`, `description`, `price`, `image`, `socket`, `chipset`, `form_factor`, `memory_type`, `memory_slots`, `max_memory`, `m2_slots`, `sata_ports`, `pcie_version`, `wifi`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'ASUS ROG Strix B550-F Gaming', 'Материнская плата ASUS ROG Strix B550-F Gaming', 15000.00, 'b550_f.png', 'AM4', 'B550', 'ATX', 'DDR4', 2, 64, 2, 6, '4.0', 0, 'ASUS', 1, '2025-12-12 08:00:35', '2025-12-12 12:00:35'),
(2, 'Gigabyte B660M DS3H', 'Материнская плата Gigabyte B660M DS3H', 10000.00, 'ds3h.png', 'LGA1700', 'B660', 'Micro-ATX', 'DDR4', 4, 64, 1, 4, '4.0', 0, 'Gigabyte', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(3, 'MSI MPG B650 Edge WiFi', 'Материнская плата MSI MPG B650 Edge WiFi', 22000.00, 'b650_edge.png', 'AM5', 'B650', 'ATX', 'DDR5', 4, 128, 3, 6, '4.0', 1, 'MSI', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(4, 'ASRock B450M-HDV', 'Материнская плата ASRock B450M-HDV', 8000.00, 'b450m-hdv.png', 'AM4', 'B450', 'Micro-ATX', 'DDR4', 4, 64, 1, 4, '4.0', 0, 'ASRock', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(5, 'ASUS TUF Gaming Z790-Plus', 'Материнская плата ASUS TUF Gaming Z790-Plus', 28000.00, 'z790_plus.jpg', 'LGA1700', 'Z790', 'ATX', 'DDR5', 4, 128, 4, 6, '4.0', 0, 'ASUS', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(6, 'Gigabyte X670 AORUS Elite', 'Материнская плата Gigabyte X670 AORUS Elite', 32000.00, 'x670_aorus.jpg', 'AM5', 'X670', 'ATX', 'DDR5', 4, 128, 4, 8, '4.0', 0, 'Gigabyte', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(8, 'ASUS B550-F Gaming', 'Материнская плата ASUS B550-F Gaming', 15000.00, 'https://www.regard.ru/api/photo/goods/186815.png', 'AM4', 'B550', 'ATX', 'DDR4', 4, 64, 2, 6, '4.0', 0, 'ASUS', 1, '2026-02-11 18:04:42', '2026-03-21 18:39:25'),
(16, 'Gigabyte A620M H', 'Материнская плата GigaByte A620M H', 7800.00, 'https://www.oldi.ru/xl_pics/02053709.jpg', 'AM5', 'A620M', 'Micro-ATX', 'DDR5', 2, 64, 1, 4, '4.0', 0, 'Gigabyte', 1, '2026-06-13 08:37:21', '2026-06-13 08:37:21');

-- --------------------------------------------------------

--
-- Структура таблицы `psus`
--

CREATE TABLE `psus` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `wattage` int NOT NULL COMMENT 'Мощность в Вт',
  `efficiency` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '80+ Bronze, Gold',
  `form_factor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'ATX',
  `modular` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'No' COMMENT 'No, Semi, Full',
  `pcie_connectors` int DEFAULT '0' COMMENT 'Кол-во PCIe кабелей',
  `sata_connectors` int DEFAULT '0',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `psus`
--

INSERT INTO `psus` (`id`, `name`, `description`, `price`, `image`, `wattage`, `efficiency`, `form_factor`, `modular`, `pcie_connectors`, `sata_connectors`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Seasonic Focus GX-750', 'Блок питания Seasonic Focus GX-750', 9000.00, 'seasonic_gx750.jpg', 750, '80+ Gold', 'ATX', 'Semi', 3, 6, 'Seasonic', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(2, 'Corsair RM850x', 'Блок питания Corsair RM850x', 12000.00, 'corsair_rm850x.jpg', 850, '80+ Gold', 'ATX', 'Full', 4, 8, 'Corsair', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(3, 'be quiet! Straight Power 11 650W', 'Блок питания be quiet! Straight Power 11 650W', 8000.00, 'bequiet_sp11.png', 650, '80+ Platinum', 'ATX', 'No', 2, 4, 'be quiet!', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(4, 'Cooler Master MWE Gold 850', 'Блок питания Cooler Master MWE Gold 850', 9500.00, 'coolermaster_mwe_gold.png', 850, '80+ Gold', 'ATX', 'No', 4, 8, 'Cooler Master', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(5, 'DeepCool PQ850M', 'Блок питания DeepCool PQ850M', 8500.00, 'https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/PowerSupplyUnits/PQ850M/Gallery/800X800/03.jpg?fm=webp&q=60', 850, '80+ Gold', 'ATX', 'No', 4, 8, 'DeepCool', 1, '2026-01-30 18:11:57', '2026-01-30 18:11:57'),
(6, 'Corsair RM550', 'Блок питания Corsair RM550', 9000.00, 'https://cdn.mos.cms.futurecdn.net/9RpGusYLxjwG6mkMtdy9Tm.jpg', 550, '80+ Gold', 'ATX', 'Full', 1, 3, 'Corsair', 1, '2026-02-11 18:04:43', '2026-03-15 10:11:33'),
(8, 'Блок питания Deepcool PF600 600 Вт', 'Блок питания Deepcool PF600 600 Вт', 3100.00, 'https://www.oldi.ru/xl_pics/01991742.jpg', 600, NULL, 'ATX', 'No', 0, 0, 'DeepCool', 1, '2026-06-13 08:53:09', '2026-06-13 08:53:09');

-- --------------------------------------------------------

--
-- Структура таблицы `rams`
--

CREATE TABLE `rams` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'DDR4, DDR5',
  `capacity` int NOT NULL COMMENT 'Объем в ГБ',
  `modules` int DEFAULT '1' COMMENT 'Количество модулей',
  `speed` int NOT NULL COMMENT 'Частота в МГц',
  `cas_latency` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rgb` tinyint(1) DEFAULT '0',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `rams`
--

INSERT INTO `rams` (`id`, `name`, `description`, `price`, `image`, `type`, `capacity`, `modules`, `speed`, `cas_latency`, `rgb`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Kingston Fury Beast 16GB (2x8GB) DDR4', 'Оперативная память Kingston Fury Beast 16GB (2x8GB) DDR4', 6000.00, 'fury_beast.png', 'DDR4', 16, 2, 3200, NULL, 1, 'Kingston', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(2, 'Corsair Vengeance RGB 32GB (2x16GB) DDR5', 'Оперативная память Corsair Vengeance RGB 32GB (2x16GB) DDR5', 12000.00, 'corsair_vengeance.png', 'DDR5', 32, 2, 5600, NULL, 1, 'Corsair', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(3, 'G.Skill Trident Z 16GB (2x8GB) DDR4', 'Оперативная память G.Skill Trident Z 16GB (2x8GB) DDR4', 7000.00, 'trident_z.jpg', 'DDR4', 16, 2, 3600, NULL, 1, 'G.Skill', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(4, 'Crucial Ballistix 32GB (2x16GB) DDR4', 'Оперативная память Crucial Ballistix 32GB (2x16GB) DDR4', 9000.00, 'ballistic_32.jpg', 'DDR4', 32, 2, 3200, NULL, 0, 'Crucial', 1, '2025-12-12 08:00:36', '2025-12-12 12:00:36'),
(5, 'Team Group T-Force Delta 64GB (2x32GB) DDR5', 'Оперативная память Team Group T-Force Delta 64GB (2x32GB) DDR5', 18000.00, 'delta_teamgroup.jpg', 'DDR5', 64, 2, 6000, NULL, 0, 'Team Group', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(6, 'ADATA XPG Lancer 32GB (2x16GB) DDR5', 'Оперативная память ADATA XPG Lancer 32GB (2x16GB) DDR5', 11000.00, 'https://avatars.mds.yandex.net/get-mpic/1565610/2a00000190733a95f4f8ac34c29af4ae9bc7/orig', 'DDR5', 32, 2, 6000, NULL, 0, 'ADATA', 1, '2026-01-30 22:06:27', '2026-01-30 22:06:27'),
(8, 'Kingston Fury Renegade RGB DIMM 16Gb DDR4 4600 MHz', 'Оперативная память Kingston Fury Renegade RGB DIMM 16Gb DDR4 4600 MHz', 18000.00, 'https://www.oldi.ru/xl_pics/02096405.jpg', 'DDR4', 16, 2, 4800, '19', 1, 'Kingston', 1, '2026-06-13 08:39:52', '2026-06-13 08:39:52');

-- --------------------------------------------------------

--
-- Структура таблицы `storages`
--

CREATE TABLE `storages` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'HDD, SSD, NVMe',
  `interface` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'SATA, M.2',
  `capacity` int NOT NULL COMMENT 'Объем в ГБ',
  `form_factor` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '2.5", 3.5", M.2',
  `read_speed` int DEFAULT NULL COMMENT 'Скорость чтения в МБ/с',
  `write_speed` int DEFAULT NULL COMMENT 'Скорость записи в МБ/с',
  `manufacturer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `storages`
--

INSERT INTO `storages` (`id`, `name`, `description`, `price`, `image`, `type`, `interface`, `capacity`, `form_factor`, `read_speed`, `write_speed`, `manufacturer`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Samsung 980 1TB M.2 NVMe', 'Накопитель Samsung 980 1TB M.2 NVMe', 8000.00, 'samsung980.jpg', 'NVMe', 'M.2', 1000, 'M.2 2280', 3500, 3000, 'Samsung', 1, '2025-12-12 08:00:37', '2025-12-12 12:00:37'),
(2, 'WD Blue 1TB HDD', 'Накопитель WD Blue 1TB HDD', 3000.00, 'wdblue1tb.jpg', 'HDD', 'SATA', 2000, '3.5\"', 150, 150, 'WD', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(3, 'Crucial P5 Plus 2TB M.2 NVMe', 'Накопитель Crucial P5 Plus 2TB M.2 NVMe', 12000.00, 'crucialp5plus.jpg', 'NVMe', 'M.2', 2000, 'M.2 2280', 3500, 3000, 'Crucial', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(4, 'Seagate BarraCuda 4TB HDD', 'Накопитель Seagate BarraCuda 4TB HDD', 7000.00, 'seagate_4tb.jpg', 'HDD', 'SATA', 4000, '3.5\"', 150, 150, 'Seagate', 1, '2025-12-12 08:00:38', '2025-12-12 12:00:38'),
(5, 'Kingston NV2 2TB M.2 NVMe', 'Накопитель Kingston NV2 2TB M.2 NVMe', 9500.00, 'https://www.regard.ru/api/photo/goods/1004781.jpg', 'NVMe', 'M.2', 2000, 'M.2 2280', 3500, 3000, 'Kingston', 1, '2026-01-30 18:11:57', '2026-01-30 18:11:57'),
(8, 'Patriot P300 256 Gb', 'Накопитель формата M.2 Patriot P300 256 Gb', 5400.00, 'https://www.oldi.ru/xl_pics/0725275.jpg', 'SSD', 'PCI-E', 256, 'M.2 2280', 1100, 1700, 'Crucial', 1, '2026-06-13 08:50:21', '2026-06-13 08:50:21');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_general_ci DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `updated_at`) VALUES
(1, 'vadim', 'vados123@gmail.com', '$2y$10$LyuycbGEV3fKxi8T7sMXReZVNDozfzKouf7V4.W03sqJAdATTXYsO', 'admin', '2025-12-12 09:53:31', '2026-05-27 09:15:26'),
(2, 'test', 'test@gmail.com', '$2y$10$8.T2PsTy9GiWkD4X6s52bOWL6UfSqoTj6rzg.fueaFKovZeTD5EA6', 'admin', '2025-12-12 09:54:56', '2026-03-27 15:08:00'),
(4, 'testo', 'test2333@test.com', '$2y$10$yR7txMr2H22tYIO5FqVuve7zyryNrw5Ff7c/y.9hx3/Y4aWEHxymO', 'user', '2026-01-30 18:23:03', '2026-06-14 09:25:45'),
(5, 'proverka', 'tetet@test.com', '$2y$10$Dy7lQFVBdvaBe0XWWpTCAuZbbasajPj7EetYOt.McWIJfTgQ17hRK', 'user', '2026-01-30 20:49:49', '2026-01-30 20:49:49'),
(6, 'dadada', 'ewtew@test.com', '$2y$10$f/xIJfZ8Xhe12b3nZCoqauuf.6af83aw22TF5U0eXVnnPSql9u8J.', 'user', '2026-01-30 20:56:46', '2026-01-30 20:56:46'),
(7, 'test2', 'test@tew.test', '$2y$10$WKnh4YhafDu91f0TWGT5yewOIpp7eX3T1NpMAkM.u.yB5sa3Cyydy', 'user', '2026-01-30 21:07:22', '2026-01-30 21:07:22'),
(8, 'pro', 'va@gmail.com', '$2y$10$FYfWQgfEftLG/97tpaLT0uNtJnbcZg25z8Go1ERdChVqzUf5Ug23W', 'user', '2026-01-30 21:09:29', '2026-01-30 21:09:29'),
(9, 'pross', 'dsa@re.co', '$2y$10$jUAWff6smd6/2rhDxYgUveoDwX/Lee41Vsk4iRkxuGpLzfwcIWy0m', 'user', '2026-01-30 21:14:19', '2026-01-30 21:14:19'),
(10, 'rerer', 'asdasd@rere.c', '$2y$10$joO2k0oXDI5V.WSODt.jjOWPGBPbjZ8hNP8jNNOxBMZTEpxqP7YV.', 'user', '2026-01-30 21:16:01', '2026-01-30 21:16:01'),
(11, 'reeed', 'erer@rewr.com', '$2y$10$xQUEI0DESxxwIvOP.8ZliOfMszJtjYMpNWXODY2D32NpenJwpvjT2', 'user', '2026-02-11 17:45:06', '2026-02-11 17:45:06');

-- --------------------------------------------------------

--
-- Структура таблицы `user_builds`
--

CREATE TABLE `user_builds` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `compatibility_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `likes` int NOT NULL DEFAULT '0',
  `liked_user` text COLLATE utf8mb4_general_ci
) ;

--
-- Дамп данных таблицы `user_builds`
--

INSERT INTO `user_builds` (`id`, `user_id`, `name`, `total_price`, `compatibility_data`, `is_public`, `created_at`, `updated_at`, `likes`, `liked_user`) VALUES
(56, 2, 'Сборка', 23000.00, '{\n    \"cpus\": {\n        \"id\": 9,\n        \"name\": \"AMD Ryzen 5 3500\",\n        \"price\": \"6000.00\",\n        \"image\": \"https:\\/\\/static.nix.ru\\/images\\/amd-ryzen-5-3500-4431423159.jpg?good_id=443142&width=500&height=500&view_id=3159\"\n    },\n    \"motherboards\": {\n        \"id\": 13,\n        \"name\": \"ASRock B450M-HDV\",\n        \"price\": \"8000.00\",\n        \"image\": \"b450m-hdv.png\"\n    },\n    \"rams\": {\n        \"id\": 21,\n        \"name\": \"Crucial Ballistix 32GB (2x16GB) DDR4\",\n        \"price\": \"9000.00\",\n        \"image\": \"ballistic_32.jpg\"\n    }\n}', 1, '2026-03-23 19:03:00', '2026-03-29 12:33:04', 1, '[2]'),
(57, 2, 'Моя сборка 28.03.2026', 84000.00, '{\n    \"cpus\": {\n        \"id\": 9,\n        \"name\": \"AMD Ryzen 5 3500\",\n        \"price\": \"6000.00\",\n        \"image\": \"https:\\/\\/static.nix.ru\\/images\\/amd-ryzen-5-3500-4431423159.jpg?good_id=443142&width=500&height=500&view_id=3159\"\n    },\n    \"motherboards\": {\n        \"id\": 13,\n        \"name\": \"ASRock B450M-HDV\",\n        \"price\": \"8000.00\",\n        \"image\": \"b450m-hdv.png\"\n    },\n    \"rams\": {\n        \"id\": 21,\n        \"name\": \"Crucial Ballistix 32GB (2x16GB) DDR4\",\n        \"price\": \"9000.00\",\n        \"image\": \"ballistic_32.jpg\"\n    },\n    \"gpus\": {\n        \"id\": 30,\n        \"name\": \"AMD Radeon RX 7600 8GB\",\n        \"price\": \"28000.00\",\n        \"image\": \"rx7600_biostar.png\"\n    },\n    \"storages\": [\n        {\n            \"id\": 36,\n            \"name\": \"Seagate BarraCuda 4TB HDD\",\n            \"price\": \"7000.00\",\n            \"image\": \"seagate_4tb.jpg\"\n        }\n    ],\n    \"psus\": {\n        \"id\": 42,\n        \"name\": \"DeepCool PQ850M\",\n        \"price\": \"8500.00\",\n        \"image\": \"https:\\/\\/cdn.deepcool.com\\/public\\/ProductFile\\/DEEPCOOL\\/PowerSupplyUnits\\/PQ850M\\/Gallery\\/800X800\\/03.jpg?fm=webp&q=60\"\n    },\n    \"cases\": {\n        \"id\": 45,\n        \"name\": \"Lian Li PC-O11 Dynamic\",\n        \"price\": \"12000.00\",\n        \"image\": \"lian_li_dynamic.jpg\"\n    },\n    \"coolers\": {\n        \"id\": 53,\n        \"name\": \"DeepCool AK620\",\n        \"price\": \"5500.00\",\n        \"image\": \"https:\\/\\/static.onlinetrade.ru\\/img\\/items\\/m\\/deepcool_ak620_1937508_1.jpg\"\n    }\n}', 1, '2026-03-27 19:50:34', '2026-03-29 12:32:57', 1, '[2]'),
(58, 2, 'Proverka', 133000.00, '{\n    \"cpus\": {\n        \"id\": 8,\n        \"name\": \"AMD Ryzen 7 8700G\",\n        \"price\": \"38000.00\",\n        \"image\": \"https:\\/\\/static.nix.ru\\/images\\/amd-ryzen-7-8700g-7816953159.jpg?good_id=781695&width=draft&height=draft&view_id=3159\"\n    },\n    \"motherboards\": {\n        \"id\": 15,\n        \"name\": \"Gigabyte X670 AORUS Elite\",\n        \"price\": \"32000.00\",\n        \"image\": \"x670_aorus.jpg\"\n    },\n    \"rams\": {\n        \"id\": 22,\n        \"name\": \"Team Group T-Force Delta 64GB (2x32GB) DDR5\",\n        \"price\": \"18000.00\",\n        \"image\": \"delta_teamgroup.jpg\"\n    },\n    \"gpus\": {\n        \"id\": 29,\n        \"name\": \"NVIDIA GeForce RTX 4060 Ti 8GB\",\n        \"price\": \"45000.00\",\n        \"image\": \"4060_msi.png\"\n    }\n}', 1, '2026-03-29 12:37:34', '2026-03-29 12:38:04', 0, NULL),
(62, 2, 'Моя сборка 20.04.2026', 28500.00, '{\n    \"cpus\": {\n        \"id\": 64,\n        \"name\": \"Ryzen 5 1600AF\",\n        \"price\": \"4500.00\",\n        \"image\": \"https:\\/\\/amd.news\\/wp-content\\/uploads\\/2020\\/06\\/R5-1600-AF-1.jpg\"\n    },\n    \"motherboards\": {\n        \"id\": 17,\n        \"name\": \"ASUS B550-F Gaming\",\n        \"price\": \"15000.00\",\n        \"image\": \"https:\\/\\/www.regard.ru\\/api\\/photo\\/goods\\/186815.png\"\n    },\n    \"rams\": {\n        \"id\": 21,\n        \"name\": \"Crucial Ballistix 32GB (2x16GB) DDR4\",\n        \"price\": \"9000.00\",\n        \"image\": \"ballistic_32.jpg\"\n    }\n}', 0, '2026-04-20 09:02:10', '2026-04-20 09:02:10', 0, NULL),
(63, 2, 'Моя сборка 20.04.2026', 68500.00, '{\n    \"cpus\": {\n        \"id\": 64,\n        \"name\": \"Ryzen 5 1600AF\",\n        \"price\": \"4500.00\",\n        \"image\": \"https:\\/\\/amd.news\\/wp-content\\/uploads\\/2020\\/06\\/R5-1600-AF-1.jpg\"\n    },\n    \"motherboards\": {\n        \"id\": 17,\n        \"name\": \"ASUS B550-F Gaming\",\n        \"price\": \"15000.00\",\n        \"image\": \"https:\\/\\/www.regard.ru\\/api\\/photo\\/goods\\/186815.png\"\n    },\n    \"rams\": {\n        \"id\": 20,\n        \"name\": \"G.Skill Trident Z 16GB (2x8GB) DDR4\",\n        \"price\": \"7000.00\",\n        \"image\": \"trident_z.jpg\"\n    },\n    \"gpus\": {\n        \"id\": 32,\n        \"name\": \"Palit NVIDIA GeForce RTX 3060\",\n        \"price\": \"42000.00\",\n        \"image\": \"https:\\/\\/3logic.ru\\/pimg\\/pim\\/1000\\/1032149.jpg\"\n    }\n}', 1, '2026-04-20 09:03:01', '2026-06-10 09:27:39', 0, NULL),
(65, 2, 'Моя сборка 20.04.2026', 157500.00, '{\n    \"cpus\": {\n        \"id\": 8,\n        \"name\": \"AMD Ryzen 7 8700G\",\n        \"price\": \"38000.00\",\n        \"image\": \"https:\\/\\/static.nix.ru\\/images\\/amd-ryzen-7-8700g-7816953159.jpg?good_id=781695&width=draft&height=draft&view_id=3159\"\n    },\n    \"motherboards\": {\n        \"id\": 15,\n        \"name\": \"Gigabyte X670 AORUS Elite\",\n        \"price\": \"32000.00\",\n        \"image\": \"x670_aorus.jpg\"\n    },\n    \"rams\": {\n        \"id\": 22,\n        \"name\": \"Team Group T-Force Delta 64GB (2x32GB) DDR5\",\n        \"price\": \"18000.00\",\n        \"image\": \"delta_teamgroup.jpg\"\n    },\n    \"gpus\": {\n        \"id\": 30,\n        \"name\": \"AMD Radeon RX 7600 8GB\",\n        \"price\": \"28000.00\",\n        \"image\": \"rx7600_biostar.png\"\n    },\n    \"storages\": [\n        {\n            \"id\": 37,\n            \"name\": \"Kingston NV2 2TB M.2 NVMe\",\n            \"price\": \"9500.00\",\n            \"image\": \"https:\\/\\/www.regard.ru\\/api\\/photo\\/goods\\/1004781.jpg\"\n        },\n        {\n            \"id\": 36,\n            \"name\": \"Seagate BarraCuda 4TB HDD\",\n            \"price\": \"7000.00\",\n            \"image\": \"seagate_4tb.jpg\"\n        },\n        {\n            \"id\": 37,\n            \"name\": \"Kingston NV2 2TB M.2 NVMe\",\n            \"price\": \"9500.00\",\n            \"image\": \"https:\\/\\/www.regard.ru\\/api\\/photo\\/goods\\/1004781.jpg\"\n        },\n        {\n            \"id\": 36,\n            \"name\": \"Seagate BarraCuda 4TB HDD\",\n            \"price\": \"7000.00\",\n            \"image\": \"seagate_4tb.jpg\"\n        }\n    ],\n    \"psus\": {\n        \"id\": 42,\n        \"name\": \"DeepCool PQ850M\",\n        \"price\": \"8500.00\",\n        \"image\": \"https:\\/\\/cdn.deepcool.com\\/public\\/ProductFile\\/DEEPCOOL\\/PowerSupplyUnits\\/PQ850M\\/Gallery\\/800X800\\/03.jpg?fm=webp&q=60\"\n    }\n}', 0, '2026-04-20 10:17:53', '2026-04-20 10:17:53', 0, NULL),
(68, 1, 'Моя сборка 10.06.2026', 176500.00, '{\"cpus\":{\"id\":8,\"name\":\"AMD Ryzen 7 8700G\",\"price\":\"38000.00\",\"image\":\"https://c.dns-shop.ru/thumb/st1/fit/300/300/906a6547c44e5a4095e3f28e018ab5d2/b84ba09423d25151745364c43b1bfa28a3fa325d639f01d86fb6479ded831564.jpg\"},\"motherboards\":{\"id\":15,\"name\":\"Gigabyte X670 AORUS Elite\",\"price\":\"32000.00\",\"image\":\"x670_aorus.jpg\"},\"rams\":{\"id\":22,\"name\":\"Team Group T-Force Delta 64GB (2x32GB) DDR5\",\"price\":\"18000.00\",\"image\":\"delta_teamgroup.jpg\"},\"gpus\":{\"id\":30,\"name\":\"AMD Radeon RX 7600 8GB\",\"price\":\"28000.00\",\"image\":\"rx7600_biostar.png\"},\"storages\":[{\"id\":37,\"name\":\"Kingston NV2 2TB M.2 NVMe\",\"price\":\"9500.00\",\"image\":\"https://www.regard.ru/api/photo/goods/1004781.jpg\"},{\"id\":36,\"name\":\"Seagate BarraCuda 4TB HDD\",\"price\":\"7000.00\",\"image\":\"seagate_4tb.jpg\"},{\"id\":37,\"name\":\"Kingston NV2 2TB M.2 NVMe\",\"price\":\"9500.00\",\"image\":\"https://www.regard.ru/api/photo/goods/1004781.jpg\"},{\"id\":36,\"name\":\"Seagate BarraCuda 4TB HDD\",\"price\":\"7000.00\",\"image\":\"seagate_4tb.jpg\"}],\"psus\":{\"id\":42,\"name\":\"DeepCool PQ850M\",\"price\":\"8500.00\",\"image\":\"https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/PowerSupplyUnits/PQ850M/Gallery/800X800/03.jpg?fm=webp&q=60\"},\"cases\":{\"id\":48,\"name\":\"NZXT H5 Flow\",\"price\":\"7000.00\",\"image\":\"https://cdn.3dnews.ru/assets/external/illustrations/2024/08/20/1109748/GSiVz7OVEs6fdy2U.jpg\"},\"coolers\":{\"id\":50,\"name\":\"Corsair iCUE H150i Elite\",\"price\":\"12000.00\",\"image\":\"corsair_icue_h150i.jpg\"}}', 0, '2026-06-10 08:06:28', '2026-06-10 08:06:28', 0, NULL),
(69, 1, 'Моя сборка 13.06.2026', 110500.00, '{\"cpus\":{\"id\":64,\"name\":\"Ryzen 5 1600AF\",\"price\":\"4500.00\",\"image\":\"https://amd.news/wp-content/uploads/2020/06/R5-1600-AF-1.jpg\"},\"motherboards\":{\"id\":15,\"name\":\"Gigabyte X670 AORUS Elite\",\"price\":\"32000.00\",\"image\":\"x670_aorus.jpg\"},\"rams\":{\"id\":22,\"name\":\"Team Group T-Force Delta 64GB (2x32GB) DDR5\",\"price\":\"18000.00\",\"image\":\"delta_teamgroup.jpg\"},\"gpus\":{\"id\":30,\"name\":\"AMD Radeon RX 7600 8GB\",\"price\":\"28000.00\",\"image\":\"rx7600_biostar.png\"},\"storages\":[{\"id\":36,\"name\":\"Seagate BarraCuda 4TB HDD\",\"price\":\"7000.00\",\"image\":\"seagate_4tb.jpg\"}],\"psus\":{\"id\":43,\"name\":\"Corsair RM550\",\"price\":\"9000.00\",\"image\":\"https://cdn.mos.cms.futurecdn.net/9RpGusYLxjwG6mkMtdy9Tm.jpg\"},\"cases\":{\"id\":47,\"name\":\"DeepCool CH510\",\"price\":\"6500.00\",\"image\":\"https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CH510/Gallery/800X800/01.jpg?fm=webp&q=60\"},\"coolers\":{\"id\":53,\"name\":\"DeepCool AK620\",\"price\":\"5500.00\",\"image\":\"https://static.onlinetrade.ru/img/items/m/deepcool_ak620_1937508_1.jpg\"}}', 0, '2026-06-13 06:48:10', '2026-06-13 06:48:10', 0, NULL),
(70, 1, 'Моя сборка 13.06.2026', 184300.00, '{\"cpus\":{\"id\":8,\"name\":\"AMD Ryzen 7 8700G\",\"price\":\"38000.00\",\"image\":\"https://c.dns-shop.ru/thumb/st1/fit/300/300/906a6547c44e5a4095e3f28e018ab5d2/b84ba09423d25151745364c43b1bfa28a3fa325d639f01d86fb6479ded831564.jpg\"},\"motherboards\":{\"id\":66,\"name\":\"Gigabyte A620M H\",\"price\":\"7800.00\",\"image\":\"https://www.oldi.ru/xl_pics/02053709.jpg\"},\"rams\":{\"id\":23,\"name\":\"ADATA XPG Lancer 32GB (2x16GB) DDR5\",\"price\":\"11000.00\",\"image\":\"https://avatars.mds.yandex.net/get-mpic/1565610/2a00000190733a95f4f8ac34c29af4ae9bc7/orig\"},\"gpus\":{\"id\":68,\"name\":\"NVIDIA GeForce RTX 5070 Ti ASUS TUF Gaming OC 16Gb\",\"price\":\"108900.00\",\"image\":\"https://compday.ru/files/reg/6284423.png\"},\"storages\":[{\"id\":36,\"name\":\"Seagate BarraCuda 4TB HDD\",\"price\":\"7000.00\",\"image\":\"seagate_4tb.jpg\"}],\"psus\":{\"id\":70,\"name\":\"Блок питания Deepcool PF600 600 Вт\",\"price\":\"3100.00\",\"image\":\"https://www.oldi.ru/xl_pics/01991742.jpg\"},\"cases\":{\"id\":47,\"name\":\"DeepCool CH510\",\"price\":\"6500.00\",\"image\":\"https://cdn.deepcool.com/public/ProductFile/DEEPCOOL/Cases/CH510/Gallery/800X800/01.jpg?fm=webp&q=60\"},\"coolers\":{\"id\":71,\"name\":\"ID-Cooling SE-224-XTS MINI\",\"price\":\"2000.00\",\"image\":\"https://www.oldi.ru/xl_pics/02055688.jpg\"}}', 0, '2026-06-13 09:10:03', '2026-06-13 09:10:03', 0, NULL),
(71, 1, 'Сборка TEST', 90300.00, '{\"cpus\":{\"id\":73,\"name\":\"AMD Ryzen 5 7500F\",\"price\":\"18000.00\",\"image\":\"https://c.dns-shop.ru/thumb/st4/fit/300/300/4aa8e1fcad21fabf357756f06d66b0c1/e6293f21cc6d64c505e37405fa55d329827db7f8cd863e254841198e037f2386.jpg\"},\"motherboards\":{\"id\":66,\"name\":\"Gigabyte A620M H\",\"price\":\"7800.00\",\"image\":\"https://www.oldi.ru/xl_pics/02053709.jpg\"},\"rams\":{\"id\":23,\"name\":\"ADATA XPG Lancer 32GB (2x16GB) DDR5\",\"price\":\"11000.00\",\"image\":\"https://avatars.mds.yandex.net/get-mpic/1565610/2a00000190733a95f4f8ac34c29af4ae9bc7/orig\"},\"gpus\":{\"id\":30,\"name\":\"AMD Radeon RX 7600 8GB\",\"price\":\"28000.00\",\"image\":\"rx7600_biostar.png\"},\"storages\":[{\"id\":36,\"name\":\"Seagate BarraCuda 4TB HDD\",\"price\":\"7000.00\",\"image\":\"seagate_4tb.jpg\"}],\"psus\":{\"id\":41,\"name\":\"Cooler Master MWE Gold 850\",\"price\":\"9500.00\",\"image\":\"coolermaster_mwe_gold.png\"},\"cases\":{\"id\":48,\"name\":\"NZXT H5 Flow\",\"price\":\"7000.00\",\"image\":\"https://cdn.3dnews.ru/assets/external/illustrations/2024/08/20/1109748/GSiVz7OVEs6fdy2U.jpg\"},\"coolers\":{\"id\":71,\"name\":\"ID-Cooling SE-224-XTS MINI\",\"price\":\"2000.00\",\"image\":\"https://www.oldi.ru/xl_pics/02055688.jpg\"}}', 1, '2026-06-13 13:22:55', '2026-06-14 11:57:10', 0, NULL);

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
-- Индексы таблицы `cases`
--
ALTER TABLE `cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_form_factor` (`form_factor`);

--
-- Индексы таблицы `components`
--
ALTER TABLE `components`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_reference` (`reference_table`,`reference_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_reference` (`reference_table`,`reference_id`),
  ADD KEY `idx_reference_id` (`reference_id`);

--
-- Индексы таблицы `component_categories`
--
ALTER TABLE `component_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`code`);

--
-- Индексы таблицы `coolers`
--
ALTER TABLE `coolers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`);

--
-- Индексы таблицы `cpus`
--
ALTER TABLE `cpus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_socket` (`socket`);

--
-- Индексы таблицы `gpus`
--
ALTER TABLE `gpus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_memory_size` (`memory_size`);

--
-- Индексы таблицы `motherboards`
--
ALTER TABLE `motherboards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_socket` (`socket`),
  ADD KEY `idx_form_factor` (`form_factor`);

--
-- Индексы таблицы `psus`
--
ALTER TABLE `psus`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wattage` (`wattage`);

--
-- Индексы таблицы `rams`
--
ALTER TABLE `rams`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`);

--
-- Индексы таблицы `storages`
--
ALTER TABLE `storages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_interface` (`interface`);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=143;

--
-- AUTO_INCREMENT для таблицы `cases`
--
ALTER TABLE `cases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `components`
--
ALTER TABLE `components`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT для таблицы `component_categories`
--
ALTER TABLE `component_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `coolers`
--
ALTER TABLE `coolers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `cpus`
--
ALTER TABLE `cpus`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT для таблицы `gpus`
--
ALTER TABLE `gpus`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `motherboards`
--
ALTER TABLE `motherboards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT для таблицы `psus`
--
ALTER TABLE `psus`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `rams`
--
ALTER TABLE `rams`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `storages`
--
ALTER TABLE `storages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT для таблицы `user_builds`
--
ALTER TABLE `user_builds`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

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
