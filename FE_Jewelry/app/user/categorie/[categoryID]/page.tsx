"use client";
import Image from "next/image";
import Link from "next/link";
import Layout from "../../components/page";
import React, { useState, useEffect } from "react";
import "./styleCategory.css";
import { useSearchParams, useParams } from "next/navigation";

interface Province {
  code: number;
  name: string;
}

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface Image {
  imageURL: string;
  is_main: number;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: Material[];
  images: Image[];
}

interface Category {
  categoryID: number;
  category_name: string;
}

export default function CategoryPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const query = searchParams.get("query") || "";
  const categoryID = Number(params.categoryID);
  const materialFilter = searchParams.get("material") || null;
  const diamondType = searchParams.get("type") || null;

  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(
    materialFilter ? Number(materialFilter) : null
  );
  const [priceRange, setPriceRange] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categoryName, setCategoryName] = useState<string>("");
  const [userPerID, setUserPerID] = useState<number | null>(null);

  useEffect(() => {
    setIsClient(true);

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserPerID(parsedUserInfo.perID);

      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        setFavouriteProducts(JSON.parse(storedFavourites));
      } else {
        setFavouriteProducts([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && userPerID) {
      const userFavouritesKey = `favouriteProducts_${userPerID}`;
      localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient, userPerID]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/")
      .then((response) => response.json())
      .then((data: Province[]) => {
        setProvinces(data);
      })
      .catch((error) => console.error("Lỗi khi tải danh sách tỉnh thành:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/materials")
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          setMaterials(data);
        }
      })
      .catch((error) => console.error("Lỗi khi lấy chất liệu:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/categories")
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          setCategories(data);
          const currentCategory = data.find((cat: Category) => cat.categoryID === categoryID);
          if (currentCategory) {
            setCategoryName(currentCategory.category_name);
          }
        }
      })
      .catch((error) => console.error("Lỗi khi lấy danh mục:", error));
  }, [categoryID]);

  useEffect(() => {
    fetch("http://localhost:4000/products")
      .then((response) => response.json())
      .then((response) => {
        const data = response.data || response || [];
        if (Array.isArray(data)) {
          const formattedData = data.map((product: Product) => ({
            ...product,
            images: product.images.map((img: Image) => ({
              ...img,
              imageURL: img.imageURL
                ? img.imageURL.startsWith("/")
                  ? `http://localhost:4000${img.imageURL}`
                  : img.imageURL
                : "/images/addImage.png",
            })),
          }));

          const filteredByCategory = formattedData.filter((product: Product) => product.categoryID === categoryID);
          setProducts(formattedData);
          setFilteredProducts(filteredByCategory);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
        setProducts([]);
        setFilteredProducts([]);
      });
  }, [categoryID]);

  const handleFilter = () => {
    let filtered = [...products].filter((product) => product.categoryID === categoryID);

    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.product_name.toLowerCase().includes(query.toLowerCase()) ||
          product.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedMaterial) {
      filtered = filtered.filter((product) =>
        product.materials.some((m) => m.materialID === selectedMaterial)
      );
    }

    if (diamondType && categoryName === "Kim Cương") {
      filtered = filtered.filter((product) => product.style === diamondType);
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => {
        const price = calculateProductPrice(product.materials);
        return price >= min && (max ? price <= max : true);
      });
    }

    if (sortOrder) {
      filtered.sort((a, b) => {
        const priceA = calculateProductPrice(a.materials);
        const priceB = calculateProductPrice(b.materials);
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [query, selectedMaterial, priceRange, sortOrder, products, diamondType, categoryID]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);
    return () => clearTimeout(timer);
  }, [showAd]);

  const calculateProductPrice = (materials: Material[]) => {
    if (!materials || materials.length === 0) return 0;
    return Math.min(...materials.map((material) => material.price));
  };

  const toggleFavourite = (product: Product) => {
    const isFavourited = favouriteProducts.some((fav) => fav.productID === product.productID);
    if (isFavourited) {
      setFavouriteProducts(favouriteProducts.filter((fav) => fav.productID !== product.productID));
    } else {
      setFavouriteProducts([...favouriteProducts, product]);
    }
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return (
    <Layout>
      {showAd && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowAd(false)}>
              ×
            </button>
            <Image className="img-modal" src="/images/modal.png" alt="Quảng cáo" width={500} height={300} />
            <div className="form-modal">
              <input className="text-modal" type="text" placeholder="Họ và tên" />
              <input className="text-modal" type="text" placeholder="Số điện thoại" />
              <select className="text-modal">
                <option value="">Chọn tỉnh thành</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
              <button className="btn-modal">TƯ VẤN NGAY</button>
            </div>
          </div>
        </div>
      )}

      <div id="content">
        <Image src="/images/banner4.png" alt="Banner 4" width={1920} height={600} className="banner-image" />
        <div id="tools">
          <div className="left">
            <Image src="/images/filter.png" alt="filter" width={25} height={25} />
            <span>Bộ lọc</span>
            <select onChange={(e) => setSelectedMaterial(Number(e.target.value) || null)}>
              <option value="">Chọn chất liệu</option>
              {materials.map((material) => (
                <option key={material.materialID} value={material.materialID}>
                  {material.material_name}
                </option>
              ))}
            </select>
            <select onChange={(e) => setPriceRange(e.target.value)}>
              <option value="">Chọn mức giá</option>
              <option value="0-5000000">Dưới 5 triệu</option>
              <option value="5000000-10000000">5 triệu - 10 triệu</option>
              <option value="10000000-20000000">10 triệu - 20 triệu</option>
              <option value="20000000">Trên 20 triệu</option>
            </select>
            <Image src="/images/arranage.png" alt="arrange" width={25} height={25} />
            <span>Sắp xếp</span>
            <select onChange={(e) => setSortOrder(e.target.value as "asc" | "desc" | null)}>
              <option value="">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
          <div className="right">
            <div className="view-mode">
              <Image
                src={viewMode === "grid" ? "/images/grid-active.png" : "/images/grid.png"}
                alt="grid view"
                width={25}
                height={25}
                onClick={() => setViewMode("grid")}
              />
              <Image
                src={viewMode === "list" ? "/images/list-active.png" : "/images/list.png"}
                alt="list view"
                width={25}
                height={25}
                onClick={() => setViewMode("list")}
              />
            </div>
          </div>
        </div>

        <div className="all-products">
          {query && <p>Kết quả tìm kiếm cho: "{query}"</p>}
          <p className="product-count">{filteredProducts.length} product</p>
          <div id="content-2" className={viewMode}>
            {currentProducts.length > 0 ? (
              currentProducts.map((product, index) => (
                <Link key={index} href={`/user/details/${product.productID}`}>
                  <div className={`new ${viewMode}`}>
                    <span
                      className="heart-icon1"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavourite(product);
                      }}
                    >
                      <Image
                        src={
                          isClient && favouriteProducts.some((fav) => fav.productID === product.productID)
                            ? "/images/heart-filled.png"
                            : "/images/heart.png"
                        }
                        alt="heart"
                        width={23}
                        height={23}
                      />
                    </span>
                    <Image
                      src={
                        product.images.find((img) => img.is_main === 1)?.imageURL ||
                        product.images[0]?.imageURL ||
                        "/images/addImage.png"
                      }
                      alt={product.product_name || "Hình ảnh sản phẩm"}
                      width={viewMode === "grid" ? 250 : 150}
                      height={viewMode === "grid" ? 250 : 150}
                    />
                    <div className="product-info">
                      <p className="product-name" style={{ textDecoration: "none" }}>
                        {product.product_name}
                      </p>
                      <p className="product-price">
                        {calculateProductPrice(product.materials).toLocaleString("vi-VN")} ₫
                      </p>
                      {viewMode === "list" && (
                        <p className="product-description">{product.description.slice(0, 100)}...</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p>
                {query
                  ? `Không tìm thấy sản phẩm nào khớp với từ khóa "${query}".`
                  : "Không có sản phẩm nào trong danh mục này."}
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                Sau
              </button>
            </div>
          )}
        </div>
        <div className="img-container">
          <Image className="img-poster" src="/images/poster.png" alt="poster" width={500} height={150} />
        </div>
      </div>
    </Layout>
  );
}