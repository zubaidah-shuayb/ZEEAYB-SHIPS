import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, type Profile } from "@/services/admin";

/**
 * Resolves the signed-in user's profile role.
 * Authorization is ultimately enforced by Supabase RLS — this only drives UI.
 */
export function useAdmin() {
  const { user, loading: authLoading, signOut } = useAuth();

  const query = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: getMyProfile,
    enabled: !!user,
    staleTime: 60_000,
  });

  const profile = (query.data ?? null) as Profile | null;

  return {
    user,
    profile,
    isAdmin: profile?.role === "admin",
    loading: authLoading || (!!user && query.isPending),
    failed: query.isError,
    signOut,
  };
}
