import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cartApi, ordersApi, mpApi, productsApi } from "@/lib/api";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    estado: "",
    codigo_postal: "",
  });

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
          console.error("Error cargando producto:", error);
        }
      }
      setProducts(productDetails);
    } catch (error) {
      toast.error("Error cargando el carrito");
      navigate("/carrito");
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cart.items.reduce((total, item) => {
      const product = products[item.product_id];
      return total + (product ? product.precio * item.quantity : 0);
    }, 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 80000 ? 0 : 8000;
  };

  const calculateTotal = () => calculateSubtotal() + calculateShipping();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const required = ["nombre", "email", "telefono", "direccion", "ciudad", "estado", "codigo_postal"];
    for (const field of required) {
      if (!formData[field]?.trim()) {
        toast.error(`El campo ${field.replace("_", " ")} es requerido`);
        return false;
      }
    }
    return true;
  };

  const createOrder = async () => {
    const orderData = {
      items: cart.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      payment_method: "mercadopago",
      shipping_address: formData,
      guest_email: formData.email,
    };

    const response = await ordersApi.create(orderData);
    return response.data;
  };

  const handleMercadoPagoCheckout = async () => {
    if (!validateForm()) return;
    if (!cart.items?.length) {
      toast.error("El carrito está vacío");
      navigate("/carrito");
      return;
    }

    setProcessingPayment(true);
    try {
      const order = await createOrder();
      const prefResponse = await mpApi.createPreference(order.order_id);
      const checkoutUrl = prefResponse.data.checkout_url;

      if (!checkoutUrl) {
        throw new Error("No se obtuvo URL de checkout de Mercado Pago");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error Mercado Pago:", error);
      toast.error(error.response?.data?.detail || "Error al iniciar el pago con Mercado Pago");
      setProcessingPayment(false);
    }
  };

  useEffect(() => {
    if (!loading && cart.items?.length === 0) {
      navigate("/carrito");
    }
  }, [loading, cart.items, navigate]);

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

  const subtotal = calculateSubtotal();
  const shipping = calculateShipping();
  const total = calculateTotal();

  return (
    <div className="min-h-screen flex flex-col" data-testid="checkout-page">
      <Navbar />

      <div className="container-custom py-8 flex-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold mb-8" style={{ color: "var(--text-main)" }}>
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8" data-testid="shipping-form">
              <h2 className="text-xl font-semibold mb-6">Datos de Contacto y Envío</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre completo *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono / WhatsApp *</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Ciudad *</label>
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Dirección *</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Provincia *</label>
                  <input type="text" name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Código Postal *</label>
                  <input type="text" name="codigo_postal" value={formData.codigo_postal} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8" data-testid="payment-methods">
              <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>
              <div className="rounded-2xl border-2 p-4 mb-6" style={{ borderColor: "#009EE3" }}>
                <p className="font-semibold">Mercado Pago</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Tarjeta, débito, transferencia o dinero en cuenta. El pago se acredita en la cuenta del titular configurada en Mercado Pago.
                </p>
              </div>

              <button
                onClick={handleMercadoPagoCheckout}
                disabled={processingPayment}
                className="w-full py-4 text-lg font-semibold rounded-full transition-all hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-60"
                style={{ backgroundColor: "#009EE3", color: "white" }}
                data-testid="mercadopago-btn"
              >
                {processingPayment ? "Procesando..." : "Pagar con Mercado Pago"}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 sticky top-24" data-testid="order-summary">
              <h2 className="text-xl font-semibold mb-6">Resumen del Pedido</h2>

              <div className="space-y-4 mb-6">
                {cart.items.map((item) => {
                  const product = products[item.product_id];
                  if (!product) return null;

                  return (
                    <div key={item.product_id} className="flex items-center space-x-3">
                      <img src={product.imagen_url} alt={product.nombre} className="w-16 h-16 object-cover rounded-xl" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.nombre}</p>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(product.precio * item.quantity).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                  <span className="font-semibold">${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>Envío</span>
                  <span className="font-semibold">{shipping === 0 ? "Gratis" : `$${shipping.toLocaleString("es-AR")}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-xl">
                  <span className="font-bold">Total</span>
                  <span className="font-bold" style={{ color: "var(--primary)" }} data-testid="checkout-total">
                    ${total.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
