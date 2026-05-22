import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>
              OVI Play
            </h3>
            <p className="text-base font-semibold italic mb-3" style={{ color: "var(--text-main)", fontFamily: "Fredoka, sans-serif" }}>
              Juguetes para mentes inquietas
            </p>
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
              Crear. Armar. Jugar.
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Piezas articuladas, armables y objetos lúdicos pensados para jugar de verdad. En OVI PLAY jugamos todos.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-[#FB8500] transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="hover:text-[#FB8500] transition-colors">
                  Productos
                </Link>
              </li>
              <li>
                <Link to="/carrito" className="hover:text-[#FB8500] transition-colors">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Líneas OVI Play</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <li>OVI Move - Articulados</li>
              <li>OVI Build - Armables</li>
              <li>OVI Game - Juegos</li>
              <li>OVI Mini - Mini figuras</li>
              <li>OVI Learn - Didácticos</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <li>Email: hola@oviplay.com.ar</li>
              <li>WhatsApp: +54 9 11 1234-5678</li>
              <li>Instagram: @oviplay.ar</li>
              <li>Horario: Lun-Vie 9:00-18:00</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          <p className="mb-2 font-semibold" style={{ color: "var(--text-main)" }}>
            OVI Play, juguetes para mentes inquietas
          </p>
          <p>© 2026 OVI Play. Todos los derechos reservados. Hecho en Argentina.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
