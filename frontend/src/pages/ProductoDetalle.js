import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { productsApi, cartApi } from "@/lib/api";
import { ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";

const ProductoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getById(id);
      setProduct(response.data);
    } catch (error) {
      toast.error("Error cargando el producto");
      navigate("/productos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      await cartApi.add(product.product_id, quantity);
      toast.success(`¡${quantity} ${product.nombre} agregado(s) al carrito!`);
      window.dispatchEvent(new Event("cart:updated"));
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("No se pudo agregar al carrito");
      } else {
        toast.error("Error al agregar al carrito");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center" data-testid="loading-spinner">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-[#FB8500] border-gray-200"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="product-detail-page">
      <Navbar />
      
      <div className="container-custom py-8 flex-1">
        <button
          onClick={() => navigate("/productos")}
          className="flex items-center space-x-2 mb-6 text-sm hover:text-[#FB8500] transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Productos</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-3xl overflow-hidden">
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="w-full h-full object-cover"
              data-testid="product-image"
            />
          </div>

          <div className="space-y-6">
            <div>
              <span className="age-badge" data-testid="product-age-badge">
                {product.edad_minima}-{product.edad_maxima} años
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold"
              style={{ color: "var(--text-main)" }}
              data-testid="product-name"
            >
              {product.nombre}
            </h1>

            <div className="flex items-baseline space-x-4">
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--primary)" }}
                data-testid="product-price"
              >
                ${product.precio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="py-6 border-y border-gray-200">
              <p
                className="text-lg leading-relaxed"
                style={{ color: "var(--text-muted)" }}
                data-testid="product-description"
              >
                {product.descripcion}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-semibold">Categoría:</span>
                <span
                  className="text-sm px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: "rgba(251, 133, 0, 0.1)",
                    color: "var(--primary)",
                  }}
                  data-testid="product-category"
                >
                  {product.categoria}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <Package className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {product.stock > 0 ? (
                    <span data-testid="product-stock">
                      {product.stock} unidades disponibles
                    </span>
                  ) : (
                    <span className="text-red-500" data-testid="product-out-of-stock">
                      Agotado
                    </span>
                  )}
                </span>
              </div>
            </div>

            {product.stock > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-semibold">Cantidad:</label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-[#FB8500] transition-colors"
                      data-testid="decrease-quantity-btn"
                    >
                      -
                    </button>
                    <span
                      className="text-xl font-semibold w-12 text-center"
                      data-testid="product-quantity"
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-[#FB8500] transition-colors"
                      data-testid="increase-quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary w-full py-4 flex items-center justify-center space-x-2 text-lg"
                  data-testid="add-to-cart-btn"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>Agregar al Carrito</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductoDetalle;
