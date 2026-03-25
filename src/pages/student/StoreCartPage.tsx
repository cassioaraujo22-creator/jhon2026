import { useNavigate } from "react-router-dom";
import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, useCartMutations } from "@/hooks/use-store-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function StoreCartPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const { updateQuantity, clearCart } = useCartMutations();

  const subtotal = cart?.reduce((sum, item) => {
    const price = (item.store_products as any)?.price_cents ?? 0;
    return sum + price * item.quantity;
  }, 0) ?? 0;

  return (
    <div className="px-4 pt-4 pb-32 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/store")} className="p-2 rounded-xl bg-secondary/60 border border-border">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Carrinho</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : !cart || cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio</p>
          <Button variant="outline" onClick={() => navigate("/app/store")}>Explorar loja</Button>
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            {cart.map((item) => {
              const product = item.store_products as any;
              const image = product?.images?.[0];
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-3 p-3 rounded-2xl bg-gradient-card border border-border"
                >
                  <div className="w-20 h-20 rounded-xl bg-secondary/40 shrink-0 overflow-hidden flex items-center justify-center">
                    {image ? (
                      <img src={image} alt={product?.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{product?.name}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(product?.price_cents ?? 0)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        className="p-1.5 rounded-lg bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
                      >
                        {item.quantity <= 1 ? <Trash2 className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-sm font-semibold text-foreground w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        className="p-1.5 rounded-lg bg-secondary/60 border border-border text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Summary */}
          <div className="p-4 rounded-2xl bg-gradient-card border border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
            </div>
          </div>

          {/* Fixed CTA */}
          <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
            <div
              className="p-3 rounded-2xl"
              style={{
                background: "hsl(225 25% 8% / 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <Button size="lg" className="w-full" onClick={() => navigate("/app/checkout")}>
                Finalizar compra · {formatPrice(subtotal)}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
