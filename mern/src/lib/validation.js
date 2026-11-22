export function requiredString(value, field, maxLength = 200) {
  if (typeof value !== "string") throw new TypeError(`${field} must be text.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new TypeError(`${field} is invalid.`);
  return normalized;
}

export function safeHttpUrl(value, field = "URL") {
  const url = new URL(requiredString(value, field, 2048));
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new TypeError(`${field} must be a trusted HTTPS URL.`);
  }
  return url.href;
}

export function safeDateRange(checkIn, checkOut) {
  const validDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn) {
    throw new TypeError("Check-out must be a valid date after check-in.");
  }
  return { checkIn, checkOut };
}
