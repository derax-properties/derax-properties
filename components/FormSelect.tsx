import { forwardRef, type SelectHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  error?: string;
  required?: boolean;
  options: Array<string | { value: string; label: string }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(function FormSelect(
  { label, id, error, required, options, placeholder = "Select an option", className, ...rest },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <select
        id={id}
        ref={ref}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cx(
          "focus-gold w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink",
          error && "border-red-500",
          className
        )}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const label2 = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={value} value={value}>
              {label2}
            </option>
          );
        })}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <label
              key={opt}
              className={cx(
                "focus-within:ring-2 focus-within:ring-gold cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors",
                active
                  ? "border-gold bg-gold text-ink font-semibold"
                  : "border-ink/15 bg-white text-ink/70 hover:border-gold/60"
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={active}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {opt}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="focus-gold h-4 w-4 rounded border-ink/30 text-gold-dark accent-[#c9a24b]"
      />
      {label}
    </label>
  );
}
