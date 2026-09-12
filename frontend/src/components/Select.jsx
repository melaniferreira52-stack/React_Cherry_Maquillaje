/**
 * Select reutilizable con el mismo lenguaje visual que Input.
 * options: [{ value, label }]
 */
function Select({
  id,
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = "Selecciona una opción",
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

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={`w-full appearance-none rounded-2xl border bg-cream-soft bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%237a5a4c%22%20d%3D%22M5.5%207.5l4.5%205%204.5-5z%22/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat px-4 py-3 text-[15px] text-caramel-deep outline-none transition-colors focus:border-caramel focus:ring-4 focus:ring-caramel-soft ${
          error ? "border-strawberry-deep" : "border-border-soft"
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-sm font-semibold text-strawberry-deep">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;