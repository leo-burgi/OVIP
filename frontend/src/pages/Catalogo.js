import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { productsApi, categoriesApi } from "@/lib/api";
import { Filter, X } from "lucide-react";
import { toast } from "sonner";

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoria") || "");
  const [selectedAgeRange, setSelectedAgeRange] = useState(
    searchParams.get("edad_min") && searchParams.get("edad_max")
      ? `${searchParams.get("edad_min")}-${searchParams.get("edad_max")}`
      : ""
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const ageRanges = [
    { label: "4-6 años", value: "4-6" },
    { label: "7-9 años", value: "7-9" },
    { label: "10-12 años", value: "10-12" },
    { label: "13-16 años", value: "13-16" },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (!Array.isArray(response.data)) {
        console.error("/categories no devolvió un array:", response.data);
        setCategories([]);
        return;
      }
      setCategories(response.data);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (searchParams.get("categoria")) {
        params.categoria = searchParams.get("categoria");
      }
      if (searchParams.get("edad_min") && searchParams.get("edad_max")) {
        params.edad_min = parseInt(searchParams.get("edad_min"));
        params.edad_max = parseInt(searchParams.get("edad_max"));
      }
      if (searchParams.get("search")) {
        params.search = searchParams.get("search");
      }

      const response = await productsApi.getAll(params);
      if (!Array.isArray(response.data)) {
        console.error("/products no devolvió un array:", response.data);
        setProducts([]);
        toast.error("La API de productos no devolvió datos válidos");
        return;
      }
      setProducts(response.data);
    } catch (error) {
      toast.error("Error cargando productos");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    const params = {};
    
    if (selectedCategory) {
      params.categoria = selectedCategory;
    }
    if (selectedAgeRange) {
      const [min, max] = selectedAgeRange.split("-");
      params.edad_min = min;
      params.edad_max = max;
    }
    if (searchQuery) {
      params.search = searchQuery;
    }

    setSearchParams(params);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedAgeRange("");
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="catalogo-page">
      <Navbar />
      
      <div className="container-custom py-8 flex-1">
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            Nuestros Productos
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden btn-primary flex items-center space-x-2"
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } md:block w-full md:w-64 space-y-6`}
            data-testid="filters-sidebar"
          >
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Búsqueda
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                  data-testid="search-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">
                  Edad
                </label>
                <div className="space-y-2">
                  {ageRanges.map((range) => (
                    <label
                      key={range.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="age"
                        value={range.value}
                        checked={selectedAgeRange === range.value}
                        onChange={(e) => setSelectedAgeRange(e.target.value)}
                        className="w-4 h-4 text-[#FB8500] focus:ring-[#FB8500]"
                        data-testid={`age-filter-${range.value}`}
                      />
                      <span className="text-sm">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FB8500]"
                  data-testid="category-select"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleFilterChange}
                  className="btn-primary w-full"
                  data-testid="apply-filters-btn"
                >
                  Aplicar Filtros
                </button>
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  data-testid="clear-filters-btn"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="text-center py-12" data-testid="loading-spinner">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-[#FB8500] border-gray-200"></div>
                <p className="mt-4 text-lg">Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12" data-testid="no-products">
                <p className="text-xl" style={{ color: "var(--text-muted)" }}>
                  No se encontraron productos con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-testid="products-grid"
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    onAddToCart={fetchProducts}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Catalogo;
