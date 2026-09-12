/**
 * Botón reutilizable de Cherry Beauty.
 *
 * variant: "primary" | "secondary" | "ghost"
 * Todas las variantes usan únicamente clases de Tailwind CSS.
 */
function Button({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";

  const variantes = {
    primary:
      "bg-caramel text-white shadow-soft hover:bg-caramel-deep hover:-translate-y-0.5 hover:shadow-lift",
    secondary:
      "bg-strawberry text-white shadow-soft hover:bg-strawberry-deep hover:-translate-y-0.5 hover:shadow-lift",
    ghost:
      "bg-transparent text-caramel-deep border border-border-soft hover:bg-cream-soft",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;