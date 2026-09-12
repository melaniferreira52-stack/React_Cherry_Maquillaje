/**
 * Input reutilizable con etiqueta, mensaje de error en tiempo real
 * y estilos únicamente con Tailwind CSS.
 */
function Input({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  autoComplete,
  rightSlot,
}) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-bold text-caramel-deep"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-2xl border bg-cream-soft px-4 py-3 text-[15px] text-caramel-deep outline-none placeholder:text-choco-soft/70 transition-colors focus:border-caramel focus:ring-4 focus:ring-caramel-soft ${
            error ? "border-strawberry-deep" : "border-border-soft"
          } ${rightSlot ? "pr-11" : ""}`}
        />

        {rightSlot && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm font-semibold text-strawberry-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;