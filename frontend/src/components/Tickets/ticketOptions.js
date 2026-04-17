export const TICKET_CATEGORIES = [
  "ELECTRICAL",
  "NETWORK",
  "PROJECTOR",
  "LAB_EQUIPMENT",
  "FURNITURE",
  "SOFTWARE",
  "CLEANING",
  "SECURITY",
  "OTHER",
];

export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TECHNICIAN_STATUS_OPTIONS = ["IN_PROGRESS", "RESOLVED", "CLOSED"];

export const ADMIN_STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export function labelize(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
