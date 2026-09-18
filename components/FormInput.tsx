import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const fieldClasses =
  "focus-gold w-full rounded-lg border border-ink/15 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 disabled:bg-ink/5";

export const FormInput = forwardRef<
  HTMLInputElement,
  FieldWrapperProps & InputHTMLAttributes<HTMLInputElement>
>(function FormInput({ label, id, error, hint, required, className, ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <input
        id={id}
        ref={ref}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(fieldClasses, error && "border-red-500", className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink/45">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  FieldWrapperProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function FormTextarea({ label, id, error, hint, required, className, ...rest }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <textarea
        id={id}
        ref={ref}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(fieldClasses, "min-h-[120px] resize-y", error && "border-red-500", className)}
        {...rest}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink/45">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
