import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { colors } from "../tokens/colors";

interface BaseFieldProps {
  label?: string;
  error?: string;
}

type InputFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaFieldProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

const fieldStyle = {
  width: "100%",
  borderRadius: 12,
  border: `1px solid ${colors.border}`,
  padding: "10px 12px"
} as const;

const errorStyle = {
  color: colors.red,
  fontSize: 12,
  marginTop: 4
} as const;

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(function InputField(
  { label, error, ...props },
  ref
) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      {label ? <span style={{ color: colors.textMid, fontSize: 13 }}>{label}</span> : null}
      <input ref={ref} {...props} style={{ ...fieldStyle, ...(props.style ?? {}) }} />
      {error ? <span style={errorStyle}>{error}</span> : null}
    </label>
  );
});

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ label: string; value: string }>;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, options, ...props },
  ref
) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      {label ? <span style={{ color: colors.textMid, fontSize: 13 }}>{label}</span> : null}
      <select ref={ref} {...props} style={{ ...fieldStyle, ...(props.style ?? {}) }}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span style={errorStyle}>{error}</span> : null}
    </label>
  );
});

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, error, ...props }, ref) {
    return (
      <label style={{ display: "grid", gap: 4 }}>
        {label ? <span style={{ color: colors.textMid, fontSize: 13 }}>{label}</span> : null}
        <textarea
          ref={ref}
          {...props}
          style={{ ...fieldStyle, minHeight: 90, resize: "vertical", ...(props.style ?? {}) }}
        />
        {error ? <span style={errorStyle}>{error}</span> : null}
      </label>
    );
  }
);
