import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { cartApi } from "@/lib/api";
import { toast } from "sonner";

const ProductCard = ({ product, onAddToCart }) => {
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await cartApi.add(product.product_id, 1);
      toast.success(`¡${product.nombre} agregado al carrito!`);
      window.dispatchEvent(new Event("cart:updated"));
      if (onAddToCart) onAddToCart();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("No se pudo agregar al carrito");
      } else {
        toast.error("Error al agregar al carrito");
      }
    }
  };

  return (
    <Link
      to={`/producto/${product.product_id}`}
      className="product-card"
      data-testid={`product-card-${product.product_id}`}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="age-badge" data-testid="product-age-badge">
            {product.edad_minima}-{product.edad_maxima} años
          </span>
          {product.stock < 10 && product.stock > 0 && (
            <span className="text-xs text-red-500 font-semibold">
              ¡Últimas {product.stock} unidades!
            </span>
          )}
        </div>
        <h3
          className="font-semibold text-lg leading-snug"
          style={{ color: "var(--text-main)" }}
          data-testid="product-name"
        >
          {product.nombre}
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {product.categoria}
        </p>
        <div className="flex items-center justify-between">
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--primary)" }}
            data-testid="product-price"
          >
            ${product.precio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <button
            onClick={handleAddToCart}
            className="btn-primary flex items-center space-x-2 py-2 px-4 text-sm"
            disabled={product.stock === 0}
            data-testid="add-to-cart-btn"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{product.stock === 0 ? "Agotado" : "Agregar"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
