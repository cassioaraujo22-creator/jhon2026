import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { StoreCategory, StoreProduct } from "./use-store-data";

// ─── Admin Categories ───
export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin-store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as StoreCategory[];
    },
  });
}

export function useAdminCategoryMutations() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  const upsert = useMutation({
    mutationFn: async (cat: Partial<StoreCategory> & { name: string; slug: string }) => {
      if (!profile?.gym_id) throw new Error("No gym");
      const payload = { ...cat, gym_id: profile.gym_id };
      if (cat.id) {
        const { error } = await supabase.from("store_categories").update(payload).eq("id", cat.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-store-categories"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-store-categories"] }),
  });

  return { upsert, remove };
}

// ─── Admin Products ───
export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*, store_categories(id, name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as StoreProduct[];
    },
  });
}

export function useAdminProductById(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-store-product", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*, store_categories(id, name, slug)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as StoreProduct;
    },
  });
}

export function useAdminProductMutations() {
  const qc = useQueryClient();
  const { profile } = useAuth();

  const upsert = useMutation({
    mutationFn: async (product: Partial<StoreProduct> & { name: string; slug: string; price_cents: number }) => {
      if (!profile?.gym_id) throw new Error("No gym");
      const payload = { ...product, gym_id: profile.gym_id };
      // Remove joined relation data
      delete (payload as any).store_categories;
      if (product.id) {
        const { error } = await supabase.from("store_products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-products"] });
      qc.invalidateQueries({ queryKey: ["admin-store-product"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-store-products"] }),
  });

  return { upsert, remove };
}

// ─── Admin Orders ───
export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin-store-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*, profiles(name, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAdminOrderById(id: string | undefined) {
  return useQuery({
    queryKey: ["admin-store-order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_orders")
        .select("*, profiles(name, email, phone), store_order_items(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("store_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-store-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-store-order"] });
    },
  });
}
