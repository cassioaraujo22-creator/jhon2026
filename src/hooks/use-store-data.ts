import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ───
export interface StoreCategory {
  id: string;
  gym_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  banner_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface StoreProduct {
  id: string;
  gym_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  benefits: string[];
  ingredients_or_materials: string[];
  usage_instructions: string | null;
  images: string[];
  price_cents: number;
  compare_at_price_cents: number | null;
  stock_quantity: number;
  sku: string | null;
  is_featured: boolean;
  is_active: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  store_categories?: Partial<StoreCategory> | null;
}

export interface CartItem {
  id: string;
  gym_id: string;
  member_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  store_products?: StoreProduct;
}

// ─── Categories ───
export function useStoreCategories() {
  return useQuery({
    queryKey: ["store-categories"],
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

export function useCategoryBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["store-category", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_categories")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data as StoreCategory;
    },
  });
}

// ─── Products ───
export function useStoreProducts(filters?: { categorySlug?: string; featured?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["store-products", filters],
    queryFn: async () => {
      let q = supabase
        .from("store_products")
        .select("*, store_categories(id, name, slug)")
        .order("created_at", { ascending: false });

      if (filters?.featured) q = q.eq("is_featured", true);
      if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
      if (filters?.categorySlug) {
        const { data: cat } = await supabase
          .from("store_categories")
          .select("id")
          .eq("slug", filters.categorySlug)
          .single();
        if (cat) q = q.eq("category_id", cat.id);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as StoreProduct[];
    },
  });
}

export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["store-product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_products")
        .select("*, store_categories(id, name, slug)")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data as StoreProduct;
    },
  });
}

// ─── Cart ───
export function useCart() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["store-cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_cart_items")
        .select("*, store_products(*)")
        .eq("member_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data as CartItem[];
    },
  });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!user || !profile?.gym_id) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("store_cart_items")
        .select("id, quantity")
        .eq("member_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("store_cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("store_cart_items")
          .insert({ member_id: user.id, gym_id: profile.gym_id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-cart"] }),
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("store_cart_items").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_cart_items").update({ quantity }).eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("store_cart_items").delete().eq("member_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store-cart"] }),
  });

  return { addToCart, updateQuantity, clearCart };
}

// ─── Cart count helper ───
export function useCartCount() {
  const { data: cart } = useCart();
  return cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
