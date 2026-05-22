import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import Home from "@/pages/Home";
import Catalogo from "@/pages/Catalogo";
import ProductoDetalle from "@/pages/ProductoDetalle";
import Carrito from "@/pages/Carrito";
import Checkout from "@/pages/Checkout";
import CheckoutStatus from "@/pages/CheckoutStatus";
import Admin from "@/pages/Admin";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Catalogo />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutStatus statusType="success" />} />
          <Route path="/checkout/failure" element={<CheckoutStatus statusType="failure" />} />
          <Route path="/checkout/pending" element={<CheckoutStatus statusType="pending" />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}

export default App;
