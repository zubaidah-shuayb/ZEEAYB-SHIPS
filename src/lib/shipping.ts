export type ShipmentStatus =
  | "pending"
  | "created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  created: "Shipment created",
  picked_up: "Package picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const TIMELINE_STEPS: ShipmentStatus[] = [
  "created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export type ShippingMethod = "standard" | "express";

export const SHIPPING_METHODS: {
  id: ShippingMethod;
  name: string;
  eta: string;
  days: number;
}[] = [
  { id: "standard", name: "Standard", eta: "3–5 business days", days: 5 },
  { id: "express", name: "Express", eta: "1–2 business days", days: 2 },
];

export const PACKAGE_TYPES = ["Document", "Parcel", "Box", "Pallet"] as const;

/** Simple mock pricing: base + weight component; express costs 65% more. */
export function calculatePrice(weightKg: number, method: ShippingMethod) {
  const safeWeight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  const base = 12 + safeWeight * 3.5;
  const total = method === "express" ? base * 1.65 : base;
  return Math.round(total * 100) / 100;
}

export function estimatedDelivery(method: ShippingMethod) {
  const { days } = SHIPPING_METHODS.find((m) => m.id === method)!;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function generateTrackingNumber() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let block = "";
  for (let i = 0; i < 4; i++) {
    block += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ZBY-${block}-NG`;
}

export function formatMoney(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}
