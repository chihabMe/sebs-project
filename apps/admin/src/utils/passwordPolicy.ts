export const passwordRules = [
  'At least 12 characters',
  'At least one uppercase letter',
  'At least one lowercase letter',
  'At least one number',
  'At least one symbol',
  'No spaces',
];

export function validateStrongPassword(password: string) {
  const failures: string[] = [];
  if (password.length < 12) failures.push(passwordRules[0]);
  if (!/[A-Z]/.test(password)) failures.push(passwordRules[1]);
  if (!/[a-z]/.test(password)) failures.push(passwordRules[2]);
  if (!/[0-9]/.test(password)) failures.push(passwordRules[3]);
  if (!/[^A-Za-z0-9\s]/.test(password)) failures.push(passwordRules[4]);
  if (/\s/.test(password)) failures.push(passwordRules[5]);
  return failures;
}
