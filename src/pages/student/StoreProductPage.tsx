import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ShoppingBag, ShoppingCart, Minus, Plus, Package, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useProductBySlug, useCartMutations } from "@/hooks/use-store-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

function formatPrice(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function StoreProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProductBySlug(slug);
  const { addToCart } = useCartMutations();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 pb-32 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto text-center">
        <p className="text-muted-foreground">Produto não encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/store")}>Voltar à loja</Button>
      </div>
    );
  }

  const images = (product.images as string[]) || [];
  const benefits = (product.benefits as string[]) || [];
  const ingredients = (product.ingredients_or_materials as string[]) || [];
  const stockLow = product.stock_quantity > 0 && product.stock_quantity <= 5;

  const handleAdd = () => {
    addToCart.mutate({ productId: product.id, quantity: qty }, {
      onSuccess: () => toast.success("Adicionado ao carrinho!"),
    });
  };

  return (
    <div className="pb-32 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary/60 border border-border">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <p className="text-sm text-muted-foreground truncate">{(product as any).store_categories?.name}</p>
      </div>

      {/* Image Gallery */}
      <div className="mt-4 px-4">
        <motion.div
          className="w-full aspect-square rounded-2xl bg-secondary/30 border border-border overflow-hidden flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {images[activeImage] ? (
            <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
          )}
        </motion.div>
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 justify-center">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                  i === activeImage ? "border-primary" : "border-border"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 mt-5 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{product.short_description}</p>
        </div>

        {/* Price Card */}
        <div className="p-4 rounded-2xl bg-gradient-card border border-border space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">{formatPrice(product.price_cents)}</span>
            {product.compare_at_price_cents && (
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price_cents)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-muted-foreground" />
            <span className={`text-xs font-medium ${product.stock_quantity <= 0 ? "text-destructive" : stockLow ? "text-warning" : "text-success"}`}>
              {product.stock_quantity <= 0 ? "Esgotado" : stockLow ? `Últimas ${product.stock_quantity} unidades` : "Em estoque"}
            </span>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Qtd:</span>
          <div className="flex items-center gap-2 bg-secondary/60 rounded-xl border border-border">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2 text-muted-foreground hover:text-foreground"><Minus className="w-4 h-4" /></button>
            <span className="text-sm font-semibold text-foreground w-6 text-center">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="p-2 text-muted-foreground hover:text-foreground"><Plus className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </section>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Benefícios</h3>
            <ul className="space-y-1.5">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Usage */}
        {product.usage_instructions && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Como usar</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.usage_instructions}</p>
          </section>
        )}

        {/* Ingredients */}
        {ingredients.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Ingredientes / Material</h3>
            <div className="flex flex-wrap gap-1.5">
              {ingredients.map((ing, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-secondary/60 text-xs text-muted-foreground border border-border">{ing}</span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-24 left-0 right-0 z-40 px-4 max-w-lg mx-auto">
        <div
          className="flex gap-3 p-3 rounded-2xl"
          style={{
            background: "hsl(225 25% 8% / 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={product.stock_quantity <= 0 || addToCart.isPending}
            onClick={handleAdd}
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Carrinho
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={product.stock_quantity <= 0}
            onClick={() => {
              handleAdd();
              navigate("/app/cart");
            }}
          >
            Comprar agora
          </Button>
        </div>
      </div>
    </div>
  );
}
