"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../components/page";
import "./styleDetails.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

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

export default function Details() {
  const params = useParams();
  const router = useRouter();
  const productID = params?.productID;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedFavourites = typeof window !== "undefined" ? localStorage.getItem("favouriteProducts") : null;
    if (storedFavourites) {
      setFavouriteProducts(JSON.parse(storedFavourites));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("favouriteProducts", JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient]);

  useEffect(() => {
    if (productID) {
      fetch(`http://localhost:4000/products/${productID}`)
        .then((response) => response.json())
        .then((response) => {
          const data = response.data || response;
          if (data) {
            const formattedData: Product = {
              ...data,
              images: data.images.map((img: Image) => ({
                ...img,
                imageURL: img.imageURL
                  ? img.imageURL.startsWith("/")
                    ? `http://localhost:4000${img.imageURL}`
                    : img.imageURL
                  : "/images/addImage.png",
              })),
            };
            setProduct(formattedData);
            const mainImage = formattedData.images.find((img: Image) => img.is_main === 1) || formattedData.images[0];
            setSelectedImage(mainImage?.imageURL || "/images/addImage.png");

            if (formattedData.materials && formattedData.materials.length > 0) {
              const defaultMaterial = formattedData.materials.reduce((min: Material, material: Material) =>
                material.price < min.price ? material : min
              );
              setSelectedMaterial(defaultMaterial);
            }
          } else {
            console.error("Không tìm thấy sản phẩm:", data);
            setProduct(null);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi tải chi tiết sản phẩm:", error);
          setProduct(null);
        });
    }
  }, [productID]);

  useEffect(() => {
    if (product) {
      fetch(`http://localhost:4000/products?categoryID=${product.categoryID}`)
        .then((response) => response.json())
        .then((response) => {
          const data = response.data || response || [];
          if (Array.isArray(data)) {
            const formattedData = data
              .map((prod: Product) => ({
                ...prod,
                images: prod.images.map((img: Image) => ({
                  ...img,
                  imageURL: img.imageURL
                    ? img.imageURL.startsWith("/")
                      ? `http://localhost:4000${img.imageURL}`
                      : img.imageURL
                    : "/images/addImage.png",
                })),
              }))
              .filter((prod: Product) => prod.productID !== productID)
              .slice(0, 4);
            setRelatedProducts(formattedData);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi tải sản phẩm liên quan:", error);
          setRelatedProducts([]);
        });
    }
  }, [product, productID]);

  const getCurrentPrice = () => {
    if (selectedMaterial) {
      return selectedMaterial.price;
    }
    if (product && product.materials && product.materials.length > 0) {
      return Math.min(...product.materials.map((material: Material) => material.price));
    }
    return 0;
  };

  const toggleFavourite = (product: Product) => {
    const isFavourited = favouriteProducts.some((fav) => fav.productID === product.productID);
    if (isFavourited) {
      setFavouriteProducts(favouriteProducts.filter((fav) => fav.productID !== product.productID));
    } else {
      setFavouriteProducts([...favouriteProducts, product]);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    const storedUserInfo = localStorage.getItem("userInfo");
    if (!storedUserInfo) {
      alert("Vui lòng đăng nhập để đặt hàng!");
      router.push("/auth/login");
      return;
    }

    const orderData = {
      productID: product.productID,
      product_name: product.product_name,
      price: getCurrentPrice().toString(),
      selectedMaterial: JSON.stringify(selectedMaterial || product.materials[0]),
      imageURL: selectedImage || product.images[0]?.imageURL,
    };

    const query = new URLSearchParams(orderData as any).toString();
    router.push(`/user/orders?${query}`);
  };

  if (!product) {
    return <div>Đang tải sản phẩm...</div>;
  }

  return (
    <Layout>
      <div id="content">
        <div id="details">
          <div id="details-left">
            <Swiper
              modules={[Mousewheel]}
              direction="vertical"
              slidesPerView={2}
              mousewheel={true}
              className="swiper-container"
            >
              {product.images.map((img, index) => (
                <SwiperSlide key={index} onClick={() => setSelectedImage(img.imageURL)}>
                  <div className="thumb">
                    <Image
                      src={img.imageURL}
                      alt={`thumb-${index}`}
                      width={160}
                      height={150}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          <div id="details-center">
            <Image className="selected" src={selectedImage} alt="selected" width={450} height={450} />
          </div>

          <div id="details-right">
            <p className="name-product">{product.product_name}</p>
            <span className="price">{getCurrentPrice().toLocaleString("vi-VN")} ₫</span>
            <p className="original-price">{(getCurrentPrice() * 1.05).toLocaleString("vi-VN")} ₫</p>

            <div className="detail-row">
              <span>Mã sản phẩm</span>
              <span>{product.productID}</span>
            </div>
            <div className="detail-row">
              <span>Kiểu dáng</span>
              <span>{product.style}</span>
            </div>
            <div className="detail-row">
              <span>Số lượng</span>
              <span>{product.stock}</span>
            </div>
            <div className="detail-row">
              <span>Chất liệu</span>
              <div className="material-container">
                {product.materials.map((material: Material, index: number) => (
                  <span
                    key={index}
                    className={`material-box ${selectedMaterial?.materialID === material.materialID ? "selected" : ""}`}
                    onClick={() => setSelectedMaterial(material)}
                  >
                    {material.material_name}
                  </span>
                ))}
              </div>
            </div>
            <div id="description-container">
              <p className="description">{product.description}</p>
            </div>
            <button className="buy-now" onClick={handleBuyNow}>
              MUA NGAY
            </button>
            <p>
              📞<u>0364 554 001</u>
            </p>
            <div className="detail-row">
              <span style={{ fontSize: "13px", color: "gray", fontStyle: "italic" }}>
                (*) Giá niêm yết trên đây là GIÁ THAM KHẢO dành cho vỏ nhẫn kim cương thiên nhiên với các thông số tiêu
                chuẩn. Giá chưa bao gồm giá viên chủ kim cương nếu có và có thể thay đổi trên thực tế tùy thuộc vào thông
                số cụ thể theo ni tay và yêu cầu riêng của từng khách hàng.
              </span>
            </div>
          </div>
        </div>

        <div id="other-1">
          <p className="text-other">Chính sách của Jewelry</p>
          <div id="other-detail">
            <Image src="/images/other1.png" alt="other1" width={260} height={220} />
            <Image src="/images/other2.png" alt="other2" width={260} height={220} />
            <Image src="/images/other3.png" alt="other3" width={260} height={220} />
          </div>
        </div>

        <div id="other-2">
          <p className="text-other">Có thể bạn quan tâm</p>
          <div id="content-2" className="grid">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((prod, index) => (
                <Link key={index} href={`/user/details/${prod.productID}`}>
                  <div className="new">
                    <span
                      className="heart-icon1"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavourite(prod);
                      }}
                    >
                      <Image
                        src={
                          isClient && favouriteProducts.some((fav) => fav.productID === prod.productID)
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
                        prod.images.find((img) => img.is_main === 1)?.imageURL ||
                        prod.images[0]?.imageURL ||
                        "/images/addImage.png"
                      }
                      alt={prod.product_name || "Hình ảnh sản phẩm"}
                      width={250}
                      height={250}
                    />
                    <div className="product-info">
                      <p className="product-name">{prod.product_name}</p>
                      <p className="product-price">
                        {(prod.materials && prod.materials.length > 0
                          ? Math.min(...prod.materials.map((material: Material) => material.price))
                          : 0
                        ).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p>Không có sản phẩm liên quan.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}