import img1 from "../assets/img/labial-cherry.jpg";
import img2 from "../assets/img/base-natural.jpg";
import img3 from "../assets/img/rubor-rosa.jpg";
import img4 from "../assets/img/sombras-nude.jpg";
import img5 from "../assets/img/delineador-negro.jpg";
import img6 from "../assets/img/mascara-pestanas.jpg";
import img7 from "../assets/img/brocha-set.jpg";
import img8 from "../assets/img/gloss-labial.jpg";
import img9 from "../assets/img/corrector.jpg";
import img10 from "../assets/img/paleta-especial.jpg";

// Fuente única del catálogo: el carrusel y la página de Productos
// leen de aquí, así que siempre muestran las mismas fotos y datos.
// El "id" debe coincidir con el "slug" del producto en la base de datos.
export const productos = [
  {
    id: "labial-cherry",
    nombre: "Labial Cherry Red",
    titulo: "Labial Cherry Red",
    imagen: img1,
    descripcion: "Labial mate de larga duración en un intenso rojo cereza.",
    precio: "$25.000"
  },
  {
    id: "base-natural",
    nombre: "Base Líquida Natural",
    titulo: "Base Líquida Natural",
    imagen: img2,
    descripcion: "Base de cobertura media con acabado natural para todo tipo de piel.",
    precio: "$45.000"
  },
  {
    id: "rubor-rosa",
    nombre: "Rubor en Polvo Rosa",
    titulo: "Rubor en Polvo Rosa",
    imagen: img3,
    descripcion: "Rubor de textura sedosa que aporta un toque de color fresco a las mejillas.",
    precio: "$22.000"
  },
  {
    id: "sombras-nude",
    nombre: "Paleta de Sombras Nude",
    titulo: "Paleta de Sombras Nude",
    imagen: img4,
    descripcion: "Doce tonos nude y rosados de alta pigmentación para looks de día y de noche.",
    precio: "$38.000"
  },
  {
    id: "delineador-negro",
    nombre: "Delineador Líquido Negro",
    titulo: "Delineador Líquido Negro",
    imagen: img5,
    descripcion: "Trazo preciso y resistente al agua para una mirada definida.",
    precio: "$18.000"
  },
  {
    id: "mascara-pestanas",
    nombre: "Máscara de Pestañas",
    titulo: "Máscara de Pestañas Volumen",
    imagen: img6,
    descripcion: "Fórmula que multiplica el volumen y la curvatura de las pestañas.",
    precio: "$26.000"
  },
  {
    id: "brocha-set",
    nombre: "Set de Brochas",
    titulo: "Set de Brochas Profesionales",
    imagen: img7,
    descripcion: "Kit de 8 brochas esenciales para rostro y ojos, con estuche incluido.",
    precio: "$55.000"
  },
  {
    id: "gloss-labial",
    nombre: "Gloss Labial",
    titulo: "Gloss Labial Brillante",
    imagen: img8,
    descripcion: "Brillo labial no pegajoso con efecto voluminizador y aroma a cereza.",
    precio: "$20.000"
  },
  {
    id: "corrector",
    nombre: "Corrector Líquido",
    titulo: "Corrector Líquido",
    imagen: img9,
    descripcion: "Cobertura total para ojeras e imperfecciones sin marcar líneas de expresión.",
    precio: "$24.000"
  },
  {
    id: "paleta-especial",
    nombre: "Paleta Especial",
    titulo: "Paleta Especial Cherry Edition",
    imagen: img10,
    descripcion: "Edición limitada: sombras, rubor e iluminador en una sola paleta.",
    precio: "$65.000"
  }
];
