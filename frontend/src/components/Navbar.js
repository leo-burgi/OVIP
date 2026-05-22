import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { cartApi } from "@/lib/api";

const OVI_CATEGORIES = [
  { name: "OVI Move", description: "Articulados", color: "#FB8500" },
  { name: "OVI Build", description: "Armables", color: "#219EBC" },
  { name: "OVI Game", description: "Juegos", color: "#FFB703" },
  { name: "OVI Mini", description: "Mini figuras", color: "#10B981" },
  { name: "OVI Learn", description: "Didácticos", color: "#8B5CF6" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const activeCategoria = new URLSearchParams(location.search).get("categoria");

  const getCartCount = async () => {
    try {
      const response = await cartApi.get();
      const total = response.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    getCartCount();
    const handler = () => getCartCount();
    window.addEventListener("cart:updated", handler);
    return () => window.removeEventListener("cart:updated", handler);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    getCartCount();
  }, [location.pathname, location.search]);

  return (
    <nav className="navbar-blur sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center" data-testid="nav-logo">
            <h1 className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
              OVI Play
            </h1>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-base font-medium hover:text-[#FB8500] transition-colors" data-testid="nav-home">
              Inicio
            </Link>
            <Link to="/productos" className="text-base font-medium hover:text-[#FB8500] transition-colors" data-testid="nav-products">
              Productos
            </Link>
            <Link to="/admin" className="text-base font-medium hover:text-[#FB8500] transition-colors" data-testid="nav-admin">
              Admin
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/carrito" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" data-testid="nav-cart">
              <ShoppingCart className="w-6 h-6" style={{ color: "var(--text-main)" }} />
              {cartCount > 0 && <span className="cart-badge" data-testid="cart-count">{cartCount}</span>}
            </Link>
          </div>

          <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} data-testid="mobile-menu-btn">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 slide-in" data-testid="mobile-menu">
            <Link to="/" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>
              Inicio
            </Link>
            <Link to="/productos" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>
              Productos
            </Link>
            <div className="pl-3 border-l-2 border-gray-200 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                Categorías
              </p>
              {OVI_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                  className="flex items-center space-x-2 py-2 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                  data-testid={`mobile-nav-cat-${cat.name.replace(' ', '-').toLowerCase()}`}
                >
                  <span className="w-1 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold">{cat.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>· {cat.description}</span>
                </Link>
              ))}
            </div>
            <Link to="/carrito" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>
              Carrito ({cartCount})
            </Link>
            <Link to="/admin" className="block text-base font-medium py-2" onClick={() => setIsMenuOpen(false)}>
              Admin
            </Link>
          </div>
        )}
      </div>

      <div
        className="hidden md:block border-t border-white/40"
        style={{
          background: "rgba(255, 255, 255, 0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        data-testid="categories-bar"
      >
        <div className="container-custom">
          <div className="flex items-center justify-center space-x-2 py-3 overflow-x-auto">
            <Link
              to="/productos"
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                !activeCategoria && location.pathname === "/productos" ? "text-white shadow-md" : "hover:bg-white/60"
              }`}
              style={!activeCategoria && location.pathname === "/productos" ? { backgroundColor: "var(--text-main)" } : { color: "var(--text-main)" }}
              data-testid="cat-bar-all"
            >
              <span>Todos</span>
            </Link>
            {OVI_CATEGORIES.map((cat) => {
              const isActive = activeCategoria === cat.name;
              return (
                <Link
                  key={cat.name}
                  to={`/productos?categoria=${encodeURIComponent(cat.name)}`}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive ? "text-white shadow-md" : "hover:bg-white/60"
                  }`}
                  style={isActive ? { backgroundColor: cat.color } : { color: "var(--text-main)" }}
                  data-testid={`cat-bar-${cat.name.replace(' ', '-').toLowerCase()}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isActive ? "white" : cat.color }} />
                  <span>{cat.name}</span>
                  <span className="text-xs font-normal" style={{ color: isActive ? "rgba(255,255,255,0.85)" : "var(--text-muted)" }}>
                    · {cat.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
