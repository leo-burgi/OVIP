import React from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Gift, Truck, Shield } from "lucide-react";

const Home = () => {
  const categories = [
    {
      name: "OVI Move",
      description: "Articulados que se mueven y coleccionan",
      image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=600&q=80",
      link: "/productos?categoria=OVI Move",
    },
    {
      name: "OVI Build",
      description: "Para armar, encastrar y construir",
      image: "https://images.unsplash.com/photo-1631106254201-ffbee2305c5b?w=600",
      link: "/productos?categoria=OVI Build",
    },
    {
      name: "OVI Game",
      description: "Juegos para toda la familia",
      image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=600",
      link: "/productos?categoria=OVI Game",
    },
    {
      name: "OVI Mini",
      description: "Figuras pequeñas y accesorios",
      image: "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600",
      link: "/productos?categoria=OVI Mini",
    },
    {
      name: "OVI Learn",
      description: "Aprender jugando",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600",
      link: "/productos?categoria=OVI Learn",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Navbar />
      
      <section
        className="hero-gradient py-20 md:py-32 fade-in"
        style={{
          background: "linear-gradient(135deg, rgba(251,133,0,0.18), rgba(33,158,188,0.10), rgba(255,183,3,0.14))",
          position: 'relative',
        }}
        data-testid="hero-section"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(250, 250, 250, 0.18)',
          }}
        />
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold mb-3 text-shadow"
              style={{ color: "var(--text-main)" }}
            >
              Crear. Armar. Jugar.
            </h1>
            <p
              className="text-xl sm:text-2xl lg:text-3xl mb-6 font-medium italic"
              style={{ color: "var(--primary)", fontFamily: "Fredoka, sans-serif" }}
              data-testid="hero-tagline"
            >
              Juguetes para mentes inquietas
            </p>
            <p
              className="text-lg sm:text-xl mb-8"
              style={{ color: "var(--text-muted)" }}
            >
              Piezas articuladas, armables y objetos lúdicos pensados para jugar de verdad. En OVI PLAY jugamos todos.
            </p>
            <Link
              to="/productos"
              className="btn-primary inline-flex items-center space-x-2 text-lg"
              data-testid="explore-products-btn"
            >
              <span>Explorar Productos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold text-center mb-12"
            style={{ color: "var(--text-main)" }}
          >
            Nuestras Líneas de Juego
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6" data-testid="category-grid">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={category.link}
                className="category-card"
                data-testid={`category-card-${index}`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 hero-gradient">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6" data-testid="feature-quality">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "rgba(251, 133, 0, 0.1)" }}
              >
                <Gift className="w-8 h-8" style={{ color: "var(--primary)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Juego Real</h3>
              <p style={{ color: "var(--text-muted)" }}>
                No imprimimos cualquier cosa: seleccionamos y desarrollamos objetos que realmente invitan a jugar
              </p>
            </div>
            
            <div className="text-center p-6" data-testid="feature-shipping">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "rgba(33, 158, 188, 0.1)" }}
              >
                <Truck className="w-8 h-8" style={{ color: "var(--secondary)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Envío a Todo el País</h3>
              <p style={{ color: "var(--text-muted)" }}>
                En compras mayores a $80.000. Entrega en 3-5 días hábiles
              </p>
            </div>
            
            <div className="text-center p-6" data-testid="feature-security">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ backgroundColor: "rgba(255, 183, 3, 0.1)" }}
              >
                <Shield className="w-8 h-8" style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pago Seguro</h3>
              <p style={{ color: "var(--text-muted)" }}>
                Múltiples métodos de pago con encriptación de datos
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
