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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
    throw new TypeError("Travel dates must be valid calendar dates.");
  }
  const start = new Date(`${checkIn}T00:00:00Z`);
  const end = new Date(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new TypeError("Check-out must be after check-in.");
  }
  return { checkIn, checkOut };
}
