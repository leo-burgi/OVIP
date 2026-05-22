import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { productsApi, categoriesApi } from "@/lib/api";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  nombre: "",
  descripcion: "",
  precio: "",
  edad_minima: "",
  edad_maxima: "",
  categoria: "",
  imagen_url: "",
  stock: "",
};

const Admin = () => {
  const [adminKey, setAdminKey] = useState(localStorage.getItem("OVIP_ADMIN_KEY") || "");
  const [isUnlocked, setIsUnlocked] = useState(Boolean(localStorage.getItem("OVIP_ADMIN_KEY")));
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isUnlocked) {
      fetchProducts();
      fetchCategories();
    }
  }, [isUnlocked]);

  const unlockAdmin = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      toast.error("Ingresá la clave de administración");
      return;
    }
    localStorage.setItem("OVIP_ADMIN_KEY", adminKey.trim());
    setIsUnlocked(true);
  };

  const lockAdmin = () => {
    localStorage.removeItem("OVIP_ADMIN_KEY");
    setAdminKey("");
    setIsUnlocked(false);
    setProducts([]);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre,
        descripcion: product.descripcion,
        precio: String(product.precio),
        edad_minima: String(product.edad_minima),
        edad_maxima: String(product.edad_maxima),
        categoria: product.categoria,
        imagen_url: product.imagen_url,
        stock: String(product.stock),
      });
    } else {
      setEditingProduct(null);
      setFormData(EMPTY_FORM);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio: Number(formData.precio),
      edad_minima: Number(formData.edad_minima),
      edad_maxima: Number(formData.edad_maxima),
      categoria: formData.categoria,
      imagen_url: formData.imagen_url,
      stock: Number(formData.stock),
    };

    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.product_id, productData);
        toast.success("Producto actualizado");
      } else {
        await productsApi.create(productData);
        toast.success("Producto creado");
      }
      handleCloseModal();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo guardar el producto");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    try {
      await productsApi.delete(productId);
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "No se pudo eliminar");
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container-custom py-12 flex-1">
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8">
            <h1 className="text-2xl font-semibold mb-3">Administración</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Ingresá la clave definida en la variable ADMIN_API_KEY del backend. Esto reemplaza el login de Emergent, que no sirve para producción propia.
            </p>
            <form onSubmit={unlockAdmin} className="space-y-4">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Clave de administración"
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
              />
              <button type="submit" className="btn-primary w-full py-3">
                Entrar
              </button>
            </form>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="admin-page">
      <Navbar />

      <div className="container-custom py-8 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold" style={{ color: "var(--text-main)" }}>
              Panel de Productos
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
              Alta, edición y baja básica de catálogo. No es un backoffice completo, pero sirve para poner el MVP en marcha.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleOpenModal()} className="btn-primary flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Agregar</span>
            </button>
            <button onClick={lockAdmin} className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50">
              Salir
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-[#FB8500] border-gray-200"></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="products-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Imagen</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Nombre</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Categoría</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Precio</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Edad</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.product_id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <img src={product.imagen_url} alt={product.nombre} className="w-16 h-16 object-cover rounded-xl" />
                      </td>
                      <td className="px-6 py-4 font-medium">{product.nombre}</td>
                      <td className="px-6 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                        {product.categoria}
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: "var(--primary)" }}>
                        ${product.precio.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {product.edad_minima}-{product.edad_maxima} años
                      </td>
                      <td className="px-6 py-4 text-sm">{product.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                            <Edit className="w-5 h-5 text-blue-600" />
                          </button>
                          <button onClick={() => handleDelete(product.product_id)} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción *</label>
                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} required rows="4" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Precio *</label>
                  <input type="number" name="precio" value={formData.precio} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock *</label>
                  <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required min="0" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Edad mínima *</label>
                  <input type="number" name="edad_minima" value={formData.edad_minima} onChange={handleInputChange} required min="0" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Edad máxima *</label>
                  <input type="number" name="edad_maxima" value={formData.edad_maxima} onChange={handleInputChange} required min="0" className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoría *</label>
                <select name="categoria" value={formData.categoria} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]">
                  <option value="">Seleccionar categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL de Imagen *</label>
                <input type="url" name="imagen_url" value={formData.imagen_url} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FB8500]" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1 py-3">
                  {editingProduct ? "Actualizar" : "Crear"}
                </button>
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border border-gray-300 rounded-full hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Admin;
