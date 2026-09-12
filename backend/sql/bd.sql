-- phpMyAdmin SQL Dump
-- Proyecto: Cherry Beauty
-- Importa este archivo dentro de la base de datos `cherry_maquillaje`
-- (créala antes en phpMyAdmin / XAMPP, ver README del backend)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `cherry_maquillaje`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carritos`
--

CREATE TABLE `carritos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carrito_items`
--

CREATE TABLE `carrito_items` (
  `id` int(11) NOT NULL,
  `carrito_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `agregado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `tipo_documento` enum('CC','TI','CE','PA') NOT NULL,
  `numero_documento` varchar(20) NOT NULL,
  `direccion` varchar(150) NOT NULL,
  `telefono` varchar(15) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `estado` enum('pendiente','en_proceso','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  `total` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_items`
--

CREATE TABLE `pedido_items` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `nombre_producto` varchar(60) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_servicios`
--

CREATE TABLE `pedido_servicios` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(11) NOT NULL,
  `slug` varchar(40) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
-- (catálogo inicial de ejemplo — edítalo o bórralo desde el panel de administrador)
--

INSERT INTO `productos` (`id`, `slug`, `nombre`, `descripcion`, `precio`, `imagen_url`, `disponible`, `creado_en`) VALUES
(1, 'labial-cherry', 'Labial Cherry Red', 'Labial mate de larga duración en un intenso rojo cereza.', 25000.00, '/img/labial-cherry.jpg', 1, current_timestamp()),
(2, 'base-natural', 'Base Líquida Natural', 'Base de cobertura media con acabado natural para todo tipo de piel.', 45000.00, '/img/base-natural.jpg', 1, current_timestamp()),
(3, 'rubor-rosa', 'Rubor en Polvo Rosa', 'Rubor de textura sedosa que aporta un toque de color fresco a las mejillas.', 22000.00, '/img/rubor-rosa.jpg', 1, current_timestamp()),
(4, 'sombras-nude', 'Paleta de Sombras Nude', 'Doce tonos nude y rosados de alta pigmentación para looks de día y de noche.', 38000.00, '/img/sombras-nude.jpg', 1, current_timestamp()),
(5, 'delineador-negro', 'Delineador Líquido Negro', 'Trazo preciso y resistente al agua para una mirada definida.', 18000.00, '/img/delineador-negro.jpg', 1, current_timestamp()),
(6, 'mascara-pestanas', 'Máscara de Pestañas Volumen', 'Fórmula que multiplica el volumen y la curvatura de las pestañas.', 26000.00, '/img/mascara-pestanas.jpg', 1, current_timestamp()),
(7, 'brocha-set', 'Set de Brochas Profesionales', 'Kit de 8 brochas esenciales para rostro y ojos, con estuche incluido.', 55000.00, '/img/brocha-set.jpg', 1, current_timestamp()),
(8, 'gloss-labial', 'Gloss Labial Brillante', 'Brillo labial no pegajoso con efecto voluminizador y aroma a cereza.', 20000.00, '/img/gloss-labial.jpg', 1, current_timestamp()),
(9, 'corrector', 'Corrector Líquido', 'Cobertura total para ojeras e imperfecciones sin marcar líneas de expresión.', 24000.00, '/img/corrector.jpg', 1, current_timestamp()),
(10, 'paleta-especial', 'Paleta Especial Cherry Edition', 'Edición limitada: sombras, rubor e iluminador en una sola paleta.', 65000.00, '/img/paleta-especial.jpg', 1, current_timestamp());

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

CREATE TABLE `servicios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `precio` decimal(10,2) DEFAULT 0.00,
  `disponible` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `servicios`
--

INSERT INTO `servicios` (`id`, `nombre`, `descripcion`, `precio`, `disponible`, `creado_en`) VALUES
(1, 'Domicilio', 'Entrega a domicilio de tu pedido de maquillaje.', 3000.00, 1, current_timestamp()),
(2, 'Asesoría de imagen y maquillaje', 'Recomendación personalizada de tonos y productos según tu tipo de piel.', 0.00, 1, current_timestamp()),
(3, 'Maquillaje para eventos', 'Servicio de maquillaje a domicilio para fiestas, sesiones de fotos y eventos especiales.', 0.00, 1, current_timestamp());

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('cliente','empleado','administrador') NOT NULL DEFAULT 'cliente',
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expira` datetime DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nota: no se incluyen usuarios de ejemplo aquí. Crea tu primer administrador
-- ejecutando "python crear_admin.py" (ver README del backend) — así el
-- password queda cifrado correctamente en lugar de copiarlo en texto plano.

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_producto_por_carrito` (`carrito_id`,`producto_id`),
  ADD KEY `fk_items_producto` (`producto_id`);

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `numero_documento` (`numero_documento`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pedidos_usuario` (`usuario_id`);

--
-- Indices de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_items_pedido` (`pedido_id`),
  ADD KEY `fk_items_producto_pedido` (`producto_id`);

--
-- Indices de la tabla `pedido_servicios`
--
ALTER TABLE `pedido_servicios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unico_servicio_por_pedido` (`pedido_id`,`servicio_id`),
  ADD KEY `fk_pedido_servicios_servicio` (`servicio_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `servicios`
--
ALTER TABLE `servicios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

ALTER TABLE `carritos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `carrito_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `pedidos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `pedido_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `pedido_servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `productos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

ALTER TABLE `servicios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `carritos`
--
ALTER TABLE `carritos`
  ADD CONSTRAINT `fk_carritos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `carrito_items`
--
ALTER TABLE `carrito_items`
  ADD CONSTRAINT `fk_items_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_producto_pedido` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`);

--
-- Filtros para la tabla `pedido_servicios`
--
ALTER TABLE `pedido_servicios`
  ADD CONSTRAINT `fk_pedido_servicios_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pedido_servicios_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicios` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
