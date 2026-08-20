import { supabase } from "@/lib/supabase";
import type { ShipmentStatus } from "@/lib/shipping";

export type Shipment = {
  id: string;
  user_id: string;
  tracking_number: string;
  sender_name: string;
  sender_phone: string | null;
  sender_address: string | null;
  sender_city: string;
  sender_country: string;
  recipient_name: string;
  recipient_phone: string | null;
  recipient_address: string | null;
  recipient_city: string;
  recipient_country: string;
  package_type: string;
  package_weight: number;
  package_length: number | null;
  package_width: number | null;
  package_height: number | null;
  shipping_method: string;
  price: number;
  status: ShipmentStatus;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
};

export type ShipmentEvent = {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  location: string | null;
  description: string | null;
  created_at: string;
};

/** Public (safe) tracking projection — no phones, no street addresses. */
export type PublicTracking = {
  tracking_number: string;
  status: ShipmentStatus;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  shipping_method: string;
  estimated_delivery: string | null;
  created_at: string;
  events: Pick<ShipmentEvent, "id" | "status" | "location" | "description" | "created_at">[];
};

export class DataError extends Error {}

export type NewShipmentInput = Omit<
  Shipment,
  "id" | "user_id" | "status" | "created_at" | "updated_at"
> & { status?: ShipmentStatus };

export async function createShipment(input: NewShipmentInput) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new DataError("You need to be signed in to create a shipment.");

  const { data, error } = await supabase
    .from("shipments")
    .insert({ ...input, user_id: user.id, status: "created" })
    .select("*")
    .single();

  if (error || !data) throw new DataError("We couldn't create your shipment right now.");

  const shipment = data as Shipment;

  await supabase.from("shipment_events").insert({
    shipment_id: shipment.id,
    status: "created",
    location: `${shipment.sender_city}, ${shipment.sender_country}`,
    description: "Shipment created and awaiting pickup.",
  });

  return shipment;
}

export async function listMyShipments() {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new DataError("We couldn't load your shipments right now.");
  return (data ?? []) as Shipment[];
}

export async function getMyShipment(id: string) {
  const { data, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
  if (error) throw new DataError("We couldn't load this shipment right now.");
  return (data as Shipment | null) ?? null;
}

export async function listShipmentEvents(shipmentId: string) {
  const { data, error } = await supabase
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  if (error) throw new DataError("We couldn't load the tracking timeline right now.");
  return (data ?? []) as ShipmentEvent[];
}

/**
 * Public tracking lookup via security-definer RPCs, which expose only
 * non-sensitive fields (no phone numbers, no street addresses).
 */
export async function trackByNumber(trackingNumber: string): Promise<PublicTracking | null> {
  const code = trackingNumber.trim().toUpperCase();
  if (!code) return null;

  const { data, error } = await supabase
    .rpc("get_public_tracking", { p_tracking_number: code })
    .maybeSingle();

  if (error) throw new DataError("We couldn't reach tracking right now.");
  if (!data) return null;

  const { data: events, error: eventsError } = await supabase.rpc("get_public_tracking_events", {
    p_tracking_number: code,
  });

  if (eventsError) throw new DataError("We couldn't reach tracking right now.");

  return {
    ...(data as Omit<PublicTracking, "events">),
    events: (events ?? []) as PublicTracking["events"],
  };
}
