import { supabase } from "@/lib/supabase";
import { DataError, type Shipment, type ShipmentEvent } from "@/services/shipments";
import type { ShipmentStatus } from "@/lib/shipping";

/** The single email allowed to reach the operations console. */
export const ADMIN_EMAIL = "zubaidahshuayb000@gmail.com";

export type UserRole = "customer" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type AdminEvent = ShipmentEvent & {
  created_by: string | null;
  shipments: { tracking_number: string } | null;
};

const PROFILE_COLUMNS = "id, full_name, email, avatar_url, role, created_at";

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new DataError("We couldn't verify your account right now.");
  return (data as Profile | null) ?? null;
}

export async function listAllShipments(): Promise<Shipment[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new DataError("We couldn't retrieve the shipment data right now.");
  return (data ?? []) as Shipment[];
}

export async function getAdminShipment(id: string): Promise<Shipment | null> {
  const { data, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
  if (error) throw new DataError("We couldn't load this shipment right now.");
  return (data as Shipment | null) ?? null;
}

export async function listAdminShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
  const { data, error } = await supabase
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  if (error) throw new DataError("We couldn't load the movement history right now.");
  return (data ?? []) as ShipmentEvent[];
}

export async function listRecentEvents(limit = 12): Promise<AdminEvent[]> {
  const { data, error } = await supabase
    .from("shipment_events")
    .select("*, shipments(tracking_number)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new DataError("We couldn't load the movement feed right now.");
  return (data ?? []) as AdminEvent[];
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new DataError("We couldn't retrieve the customer list right now.");
  return (data ?? []) as Profile[];
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new DataError("We couldn't load this customer right now.");
  return (data as Profile | null) ?? null;
}

export type StatusUpdateInput = {
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  occurredAt: Date;
};

/**
 * Updates a shipment's status and records the matching movement event.
 * Both writes are authorised by RLS (`public.is_admin()`), never by the UI.
 */
export async function updateShipmentStatus(input: StatusUpdateInput) {
  const { data: userData } = await supabase.auth.getUser();
  const admin = userData.user;
  if (!admin) throw new DataError("Your session expired. Please sign in again.");

  const { error: shipmentError } = await supabase
    .from("shipments")
    .update({ status: input.status })
    .eq("id", input.shipmentId);

  if (shipmentError) {
    throw new DataError("Something went wrong while updating this shipment. Please try again.");
  }

  const { error: eventError } = await supabase.from("shipment_events").insert({
    shipment_id: input.shipmentId,
    status: input.status,
    location: input.location.trim() || null,
    description: input.description.trim() || null,
    created_at: input.occurredAt.toISOString(),
    created_by: admin.id,
  });

  if (eventError) {
    throw new DataError("The status changed, but we couldn't record the movement event.");
  }
}
