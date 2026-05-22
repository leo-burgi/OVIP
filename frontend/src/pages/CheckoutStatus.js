import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { mpApi } from "@/lib/api";
import { CheckCircle2, XCircle, Clock, ShoppingBag, Home as HomeIcon } from "lucide-react";

const CheckoutStatus = ({ statusType }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("order_id") || searchParams.get("external_reference");
  const mpStatus = searchParams.get("status") || searchParams.get("collection_status");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    fetchOrderStatus();
    
    // Re-fetch después de 3 segundos (por si el webhook tarda)
    const timer = setTimeout(fetchOrderStatus, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const fetchOrderStatus = async () => {
    try {
      const response = await mpApi.getOrderStatus(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error("Error obteniendo estado:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = () => {
    const realStatus = order?.payment_status || mpStatus || statusType;
    
    if (statusType === "success" || realStatus === "completed" || realStatus === "approved") {
      return {
        icon: <CheckCircle2 className="w-24 h-24" style={{ color: "var(--success)" }} />,
        title: "¡Pago Exitoso!",
        message: "Tu pedido fue procesado correctamente. Recibirás un email con los detalles.",
        bgColor: "rgba(16, 185, 129, 0.05)",
      };
    }
    
    if (statusType === "failure" || realStatus === "rejected") {
      return {
        icon: <XCircle className="w-24 h-24" style={{ color: "var(--destructive)" }} />,
        title: "Pago Rechazado",
        message: "No pudimos procesar tu pago. Por favor, intentá nuevamente o usá otro método.",
        bgColor: "rgba(239, 68, 68, 0.05)",
      };
    }
    
    return {
      icon: <Clock className="w-24 h-24" style={{ color: "var(--accent)" }} />,
      title: "Pago Pendiente",
      message: "Tu pago está siendo procesado. Te avisaremos cuando se confirme.",
      bgColor: "rgba(255, 183, 3, 0.05)",
    };
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen flex flex-col" data-testid="checkout-status-page">
      <Navbar />
      
      <div className="container-custom py-12 flex-1">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-12 text-center"
          style={{ backgroundColor: config.bgColor, border: "1px solid var(--border)" }}
        >
          <div className="flex justify-center mb-6">{config.icon}</div>
          
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold mb-4"
            style={{ color: "var(--text-main)" }}
            data-testid="status-title"
          >
            {config.title}
          </h1>
          
          <p
            className="text-lg mb-8"
            style={{ color: "var(--text-muted)" }}
            data-testid="status-message"
          >
            {config.message}
          </p>

          {orderId && (
            <div className="bg-white rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold mb-3">Detalles del Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-muted)" }}>N° de Pedido:</span>
                  <span className="font-mono font-medium" data-testid="order-id">
                    {orderId}
                  </span>
                </div>
                {order && (
                  <>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Estado:</span>
                      <span className="font-medium capitalize" data-testid="order-status">
                        {order.payment_status || "Pendiente"}
                      </span>
                    </div>
                    {order.total && (
                      <div className="flex justify-between">
                        <span style={{ color: "var(--text-muted)" }}>Total:</span>
                        <span className="font-bold" style={{ color: "var(--primary)" }}>
                          ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="mb-6" data-testid="loading-status">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-[#FB8500] border-gray-200"></div>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Confirmando pago...
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 px-6 py-3 border-2 border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
              data-testid="back-home-btn"
            >
              <HomeIcon className="w-5 h-5" />
              <span>Volver al Inicio</span>
            </Link>
            <Link
              to="/productos"
              className="btn-primary flex items-center justify-center space-x-2"
              data-testid="continue-shopping-btn"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Seguir Comprando</span>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutStatus;
