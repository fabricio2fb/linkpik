export function maskCpf(_hashOrValue: string): string {
  return "***.***.**-**"
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  if (!domain) return email
  return `${user.slice(0, 2)}***@${domain}`
}

export function maskSecret(value: string): string {
  if (!value) return ""
  if (value.length <= 4) return "••••••••" + value
  return "••••••••" + value.slice(-4)
}

export function maskBankAccount(value: string): string {
  if (!value) return ""
  if (value.length <= 4) return "****" + value
  return "****" + value.slice(-4)
}
