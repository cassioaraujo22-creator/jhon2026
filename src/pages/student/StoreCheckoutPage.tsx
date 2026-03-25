import { useNavigate } from "react-router-dom";
import { ChevronLeft, CreditCard } from "lucide-react";
import { useCart, useCartMutations } from "@/hooks/use-store-data";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function StoreCheckoutPage() {
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const { clearCart } = useCartMutations();
  const { user, profile } = useAuth();

  const subtotal = cart?.reduce((sum, item) => {
    const price = (item.store_products as any)?.price_cents ?? 0;
    return sum + price * item.quantity;
  }, 0) ?? 0;

  const handleCheckout = async () => {
    if (!user || !profile?.gym_id || !cart?.length) return;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        gym_id: profile.gym_id,
        member_id: user.id,
        status: "pending",
        total_cents: subtotal,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      toast.error("Erro ao criar pedido");
      return;
    }

    // Create order items
    const items = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      name_snapshot: (item.store_products as any)?.name ?? "",
      price_cents_snapshot: (item.store_products as any)?.price_cents ?? 0,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from("store_order_items").insert(items);

    if (itemsError) {
      toast.error("Erro ao salvar itens do pedido");
      return;
    }

    // Clear cart
    clearCart.mutate();
    toast.success("Pedido realizado com sucesso!");
    navigate("/app/store");
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/cart")} className="p-2 rounded-xl bg-secondary/60 border border-border">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Checkout</h1>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-card border border-border space-y-3">
        <p className="text-sm text-muted-foreground">{cart?.length ?? 0} itens</p>
        {cart?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-foreground truncate flex-1">{(item.store_products as any)?.name} ×{item.quantity}</span>
            <span className="text-muted-foreground ml-2">
              {formatPrice(((item.store_products as any)?.price_cents ?? 0) * item.quantity)}
            </span>
          </div>
        ))}
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-primary">{formatPrice(subtotal)}</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-gradient-card border border-border space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="w-4 h-4" />
          <span className="text-sm">Pagamento</span>
        </div>
        <p className="text-xs text-muted-foreground">O pagamento será processado pela recepção da academia.</p>
      </div>

      <Button size="lg" className="w-full" onClick={handleCheckout} disabled={!cart?.length}>
        Confirmar pedido · {formatPrice(subtotal)}
      </Button>
    </div>
  );
}
