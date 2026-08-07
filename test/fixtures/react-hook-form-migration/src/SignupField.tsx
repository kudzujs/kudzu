type SignupFieldProps = {
  id: string
  label: string
  minLength?: number
  name: string
  status: string
  type: "email" | "password"
}

export function SignupField({ id, label, minLength, name, status, type }: SignupFieldProps) {
  return <label htmlFor={id}>
    <span>{label}</span>
    <input
      id={id}
      name={name}
      type={type}
      required
      minLength={minLength}
      aria-invalid={status === "error" ? "true" : "false"}
      aria-describedby={status === "error" ? "signup-error" : undefined}
    />
  </label>
}
