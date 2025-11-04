export function handleStrongPassword(password: string) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const score = [minLength, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length * 20;

  const errors: string[] = [];
  if (!minLength) errors.push("Password must be at least 8 characters.");
  if (!hasUpper) errors.push("Must contain an uppercase letter (A-Z).");
  if (!hasNumber) errors.push("Must contain at least one digit (0-9).");
  if (!hasSymbol) errors.push("Must contain at least one special character.");

  return { valid: score === 100, errors, score };
}

export function validateRegisterFields(
  name: string,
  email: string,
  phone: string,
  password: string,
  confirmationPassword: string
) {
  const newErrors: Record<string, string> = {};
  if (!name.trim()) newErrors.name = "Full name is required.";
  if (!email.trim()) newErrors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    newErrors.email = "Invalid email format.";
  if (!phone.trim()) newErrors.phone = "Phone number is required.";
  else if (!/^[0-9]{9,12}$/.test(phone))
    newErrors.phone = "Invalid phone number.";
  if (!password.trim()) newErrors.password = "Password is required.";
  if (!confirmationPassword.trim())
    newErrors.confirmationPassword = "Confirm password is required.";
  else if (password !== confirmationPassword)
    newErrors.confirmationPassword = "Passwords do not match.";

  return newErrors;
}
