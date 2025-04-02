"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/page";
import "./styleFavourite.css";

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

export default function Favourite() {
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedFavourites = typeof window !== "undefined" ? localStorage.getItem("favouriteProducts") : null;
    if (storedFavourites) {
      const parsedFavourites = JSON.parse(storedFavourites);
      if (Array.isArray(parsedFavourites)) {
        const filteredFavourites = parsedFavourites.filter((product: Product) => product.productID);
        setFavouriteProducts(filteredFavourites);

        // Đồng bộ dữ liệu từ API để đảm bảo materials đầy đủ
        filteredFavourites.forEach((product: Product) => {
          fetch(`http://localhost:4000/products/${product.productID}`)
            .then((response) => response.json())
            .then((response) => {
              const data = response.data || response;
              if (data) {
                setFavouriteProducts((prev) =>
                  prev.map((p) =>
                    p.productID === product.productID
                      ? {
                          ...p,
                          materials: data.materials,
                          images: data.images.map((img: Image) => ({
                            ...img,
                            imageURL: img.imageURL
                              ? img.imageURL.startsWith("/")
                                ? `http://localhost:4000${img.imageURL}`
                                : img.imageURL
                              : "/images/addImage.png",
                          })),
                        }
                      : p
                  )
                );
              }
            })
            .catch((error) => {
              console.error("Lỗi khi đồng bộ dữ liệu sản phẩm:", error);
            });
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("favouriteProducts", JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient]);

  const calculateProductPriceRange = (materials: Material[]) => {
    if (!materials || materials.length === 0) return { min: 0, max: 0 };
    const prices = materials.map((material) => material.price).filter((price) => price !== undefined && price !== null);
    if (prices.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  const removeFromFavourite = (productID: string | undefined) => {
    setFavouriteProducts(favouriteProducts.filter((fav) => fav.productID !== productID));
  };

  return (
    <Layout>
      <div id="content">
        <h1 style={{ textAlign: "left", margin: "20px 0 10px 160px" }}>Sản phẩm yêu thích</h1>
        {isClient && favouriteProducts.length > 0 ? (
          <div id="content-2">
            <table className="favourite-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Product name</th>
                  <th>Unit price</th>
                  <th>Stock status</th>
                </tr>
              </thead>
              <tbody>
                {favouriteProducts.map((product, index) => {
                  const priceRange = calculateProductPriceRange(product.materials);
                  if (!product.productID) return null;
                  return (
                    <tr key={index}>
                      <td>
                        <span className="remove-icon" onClick={() => removeFromFavourite(product.productID)}>
                          ✕
                        </span>
                      </td>
                      <td>
                        <div className="product-name">
                          <Image
                            src={
                              product.images.find((img) => img.is_main === 1)?.imageURL ||
                              product.images[0]?.imageURL ||
                              "/images/addImage.png"
                            }
                            alt={product.product_name}
                            width={30}
                            height={30}
                          />
                          <Link href={`/user/details/${product.productID}`}>
                            {product.product_name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        {priceRange.min === 0 && priceRange.max === 0 ? (
                          "Không có giá"
                        ) : priceRange.min === priceRange.max ? (
                          `${priceRange.min.toLocaleString("vi-VN")} đ`
                        ) : (
                          `${priceRange.min.toLocaleString("vi-VN")} đ - ${priceRange.max.toLocaleString("vi-VN")} đ`
                        )}
                      </td>
                      <td className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>Bạn chưa có sản phẩm yêu thích nào.</p>
        )}
      </div>
    </Layout>
  );
}