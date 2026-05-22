import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cartApi, productsApi } from "@/lib/api";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const Carrito = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);


  const fetchCart = async () => {
    setLoading(true);
    try {
      const response = await cartApi.get();
      setCart(response.data);
      
      const productDetails = {};
      for (const item of response.data.items || []) {
        try {
          const productResponse = await productsApi.getById(item.product_id);
          productDetails[item.product_id] = productResponse.data;
        } catch (error) {
          console.error("Error fetching product:", error);
        }
      }
      setProducts(productDetails);
    } catch (error) {
      if (error.response?.status === 401) {
        setCart({ items: [] });
      } else {
        toast.error("Error cargando el carrito");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await cartApi.update(productId, newQuantity);
      fetchCart();
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Cantidad actualizada");
    } catch (error) {
      toast.error("Error actualizando cantidad");
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      await cartApi.remove(productId);
      fetchCart();
      window.dispatchEvent(new Event("cart:updated"));
      toast.success("Producto eliminado del carrito");
    } catch (error) {
      toast.error("Error eliminando producto");
    }
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      const product = products[item.product_id];
      return total + (product ? product.precio * item.quantity : 0);
    }, 0);
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

  const itemCount = cart.items?.length || 0;
  const total = calculateTotal();

  return (
    <div className="min-h-screen flex flex-col" data-testid="carrito-page">
      <Navbar />
      
      <div className="container-custom py-8 flex-1">
        <h1
          className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold mb-8"
          style={{ color: "var(--text-main)" }}
        >
          Tu Carrito
        </h1>

        {itemCount === 0 ? (
          <div className="text-center py-16" data-testid="empty-cart">
            <ShoppingBag
              className="w-24 h-24 mx-auto mb-6"
              style={{ color: "var(--text-muted)" }}
            />
            <h2 className="text-2xl font-semibold mb-4">Tu carrito está vacío</h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-muted)" }}>
              ¡Añade algunos productos para empezar!
            </p>
            <Link to="/productos" className="btn-primary inline-block">
              Explorar Productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items">
              {cart.items.map((item) => {
                const product = products[item.product_id];
                if (!product) return null;

                return (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-3xl p-6 flex items-center space-x-6"
                    data-testid={`cart-item-${item.product_id}`}
                  >
                    <img
                      src={product.imagen_url}
                      alt={product.nombre}
                      className="w-24 h-24 object-cover rounded-2xl"
                    />
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">
                        {product.nombre}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                        {product.categoria}
                      </p>
                      <p
                        className="text-xl font-bold mt-2"
                        style={{ color: "var(--primary)" }}
                      >
                        ${product.precio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product_id,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-[#FB8500] transition-colors"
                        data-testid={`decrease-quantity-${item.product_id}`}
                      >
                        <Minus className="w-4 h-4 mx-auto" />
                      </button>
                      <span
                        className="text-lg font-semibold w-8 text-center"
                        data-testid={`item-quantity-${item.product_id}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.product_id, item.quantity + 1)
                        }
                        className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-[#FB8500] transition-colors"
                        disabled={item.quantity >= product.stock}
                        data-testid={`increase-quantity-${item.product_id}`}
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="p-2 hover:bg-red-50 rounded-full transition-colors"
                      data-testid={`remove-item-${item.product_id}`}
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-6 sticky top-24" data-testid="cart-summary">
                <h2 className="text-xl font-semibold mb-6">Resumen de Compra</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                    <span className="font-semibold" data-testid="cart-subtotal">
                      ${total.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Envío</span>
                    <span className="font-semibold">
                      {total >= 80000 ? "Gratis" : "$8.000"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-xl">
                    <span className="font-bold">Total</span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--primary)" }}
                      data-testid="cart-total"
                    >
                      ${(total + (total >= 80000 ? 0 : 8000)).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="btn-primary w-full py-4 text-lg"
                  data-testid="checkout-btn"
                >
                  Proceder al Pago
                </button>

                {total >= 80000 && (
                  <p
                    className="text-sm text-center mt-4"
                    style={{ color: "var(--success)" }}
                  >
                    ¡Felicidades! Tienes envío gratis
                  </p>
                )}
                {total < 80000 && total > 0 && (
                  <p
                    className="text-sm text-center mt-4"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Agrega ${(80000 - total).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} más para envío gratis
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Carrito;
