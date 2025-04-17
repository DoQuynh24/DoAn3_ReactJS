"use client";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/page";
import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "./styleProduct.css";
import { useSearchParams } from "next/navigation";

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

export default function Product() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [isAccordionVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        }
      })
      .catch((error) => console.error("Lỗi khi lấy danh mục:", error));
  }, []);

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
          setProducts(formattedData);
          setFilteredProducts(formattedData);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
        setProducts([]);
        setFilteredProducts([]);
      });
  }, [categories]);

  const handleFilter = () => {
    let filtered = [...products];

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
  }, [query, selectedMaterial, priceRange, sortOrder, products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);
    return () => clearTimeout(timer);
  }, [showAd]);

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

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
        <div id="content-1">
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={4}
            pagination={{ clickable: true }}
            autoplay={{ delay: 2000 }}
            loop={true}
          >
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/1.png" alt="1" width={230} height={200} />
                <h4 className="text">Best Selling</h4>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/2.png" alt="2" width={230} height={200} />
                <h4 className="text">New Collection</h4>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/3.png" alt="3" width={230} height={200} />
                <h4 className="text">Truyền thống</h4>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/4.png" alt="4" width={230} height={200} />
                <h4 className="text">Hiện đại</h4>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/5.png" alt="5" width={230} height={200} />
                <h4 className="text">Luxury</h4>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className="newP">
                <Image src="/images/6.png" alt="6" width={230} height={200} />
                <h4 className="text">Trendy</h4>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>

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
            <Image src="/images/arranage.png" alt="arranage" width={25} height={25} />
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
                  <div className={`newP ${viewMode}`}>
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
                  : "Không có sản phẩm nào phù hợp với bộ lọc."}
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

        {isAccordionVisible && (
          <div className="accordion">
            {[
              {
                title: "Kinh nghiệm chọn mua nhẫn cưới cho các cặp đôi",
                content: (
                  <>
                    <p>
                      Khi chọn mua nhẫn cưới, các cặp đôi cần lưu ý nhiều yếu tố để đảm bảo chọn được sản phẩm vừa ý,
                      bền bỉ và phù hợp với nhu cầu. Dưới đây là một số kinh nghiệm hữu ích:
                    </p>
                    <p>
                      Ngân sách là một trong những yếu tố quan trọng nhất. Các cặp đôi nên thống nhất một khoản chi phí
                      cụ thể trước khi đi mua nhẫn để tránh việc chi tiêu vượt quá khả năng tài chính.
                    </p>
                    <p>
                      Nhẫn cưới được sử dụng hàng ngày, thiết kế tiện dụng và chất liệu bền bỉ cần được ưu tiên. Những
                      chiếc nhẫn có kiểu dáng đơn giản, ít chi tiết cầu kỳ sẽ phù hợp hơn cho sinh hoạt và công việc
                      thường nhật, đặc biệt đối với những người thường xuyên làm việc tay chân. Chất liệu như vàng hoặc
                      bạch kim là lựa chọn lý tưởng vì không bị oxy hóa và giữ được độ sáng bóng qua thời gian.
                    </p>
                    <p>
                      Kích thước nhẫn cũng là yếu tố không thể bỏ qua. Việc thử nhẫn cẩn thận để đảm bảo vừa tay, không
                      quá chật hoặc rộng, sẽ giúp bạn thoải mái khi đeo.
                    </p>
                    <p>
                      Nếu chọn nhẫn cưới có đính kim cương, cần đặc biệt lưu ý đến chất lượng viên kim cương. Các cặp đôi
                      nên tìm hiểu về các tiêu chí 4C kim cương để đảm bảo viên chủ kim cương có chất lượng tốt. Ngoài
                      ra, nên kiểm tra xem viên kim cương được đính chắc chắn hay không, vì đây là yếu tố quyết định độ
                      bền của chiếc nhẫn khi đeo hàng ngày.
                    </p>
                    <p>
                      Nên tham khảo trước các mẫu nhẫn qua website của các thương hiệu trang sức để tiết kiệm thời gian
                      khi đến cửa hàng. Đồng thời, việc chuẩn bị sớm, từ 2-3 tháng trước ngày cưới, sẽ giúp bạn có thời
                      gian để đặt mẫu thiết kế riêng hoặc điều chỉnh kích thước nếu cần.
                    </p>
                  </>
                ),
              },
              {
                title: "Cách đo kích thước nhẫn cưới chính xác",
                content: (
                  <>
                    <p>
                      Hướng dẫn đo ni tay và so sánh kết quả với bảng size nhẫn chỉ bằng giấy, bút, thước chính xác
                      nhất.
                    </p>
                    <p>Bước 1: Dùng kéo cắt tờ giấy thành sợi dài khoảng 10 cm và rộng 1 cm.</p>
                    <p>Bước 2: Quấn mảnh giấy đã cắt quanh ngón tay cần đo.</p>
                    <p>Bước 3: Dùng bút đánh dấu điểm giao nhau của hai đầu mảnh giấy.</p>
                    <p>Bước 4: Tháo mảnh giấy ra và dùng thước đo chiều dài từ điểm đầu đến điểm đánh dấu.</p>
                    <p>Bước 5: Chia kết quả đo cho 3,14.</p>
                    <p>Bước 6: So sánh kết quả với bảng đo size nhẫn bên dưới để xác định size phù hợp.</p>
                    <Image className="size" src="/images/size.png" alt="size" width={300} height={400} />
                  </>
                ),
              },
              {
                title: "Dịch vụ và chính sách bảo hành dành cho nhẫn cưới",
                content: (
                  <>
                    <p>
                      Khách hàng sẽ không chỉ được trải nghiệm không gian tư vấn riêng tư, thoải mái mà còn dễ dàng chia
                      sẻ những mong muốn của mình thông qua chế độ tư vấn 1-1 tận tình từ đội ngũ tư vấn viên chuyên
                      nghiệp, giúp tìm ra giải pháp tối ưu cho mức ngân sách đề ra.
                    </p>
                    <p>Chính sách bảo hành tại Jewelry:</p>
                    <p>
                      Jewelry cung cấp dịch vụ thâu nới size nhẫn cộng/trừ 2 ni miễn phí nhằm đảm bảo sự vừa vặn khi đeo.
                      Với các thiết kế tiêu chuẩn, bạn có thể điều chỉnh kích thước nhẫn tăng hoặc giảm tối đa 2 ni, giúp
                      nhẫn phù hợp và thoải mái nhất khi đeo. Lưu ý rằng, một số mẫu thiết kế đặc biệt không thể thâu nới
                      do đặc điểm cấu trúc hoặc chi tiết trang trí tinh xảo nhưng đội ngũ Jewelry luôn sẵn sàng tư vấn
                      giải pháp tốt nhất cho từng trường hợp cụ thể.
                    </p>
                    <p>
                      Đối với nhẫn cưới có đá viên tấm kim cương hoặc CZ dưới 2mm ly bị rơi hoặc mất, Jewelry sẽ hỗ trợ
                      thay hoàn toàn miễn phí trong quá trình bảo hành. Jewelry cam kết luôn đảm bảo viên đá được thay thế
                      sẽ có kích thước, màu sắc và độ sáng tương đồng với viên đá ban đầu.
                    </p>
                    <p>
                      Chính sách đánh bóng, xi mạ và làm mới trọn đời miễn phí cho tất cả các sản phẩm nhẫn cưới. Với
                      chính sách này, khách hàng có thể hoàn toàn yên tâm rằng chiếc nhẫn của mình sẽ luôn được duy trì
                      trong trạng thái hoàn hảo nhất mà không bị giới hạn số lần bảo dưỡng. Bất kể khi nào cần, Jewelry sẽ
                      hỗ trợ đánh bóng lại bề mặt, xi mạ vàng hoặc rhodium theo nhu cầu của sản phẩm, giúp chiếc nhẫn luôn
                      sáng đẹp và bền bỉ như ngày đầu. Đây là cam kết trọn đời của chúng tôi nhằm tôn vinh giá trị và ý
                      nghĩa vĩnh cửu của mỗi chiếc nhẫn trong hành trình hạnh phúc của khách hàng.
                    </p>
                    <ul>
                      <li>
                        - Tất cả kim cương của Jewelry (kích thước từ 4.00 mm trở lên) đều được kiểm định và có giấy
                        chứng nhận từ GIA.
                      </li>
                      <li>- Đảm bảo hàm lượng vàng 14k, 18k trong mỗi sản phẩm luôn đạt chuẩn hoặc vượt giá trị công bố.</li>
                      <li>- Cấu trúc đai nhẫn Comfort Fit mang lại cảm giác êm ái, thoải mái khi đeo và dễ dàng tháo ra.</li>
                      <li>
                        - Công nghệ mạ với hai lớp Palladium (Pd) và Rhodium (Rh), loại vật liệu cao cấp có giá trị gấp 20
                        lần vàng. Tránh gây ra các vấn đề về dị ứng da, giúp tăng độ bóng và bền đẹp vượt trội cho nhẫn
                        cưới.
                      </li>
                      <li>
                        - Các thông số kĩ thuật của sản phẩm (cân nặng, hàm lượng vàng, số lượng & kích cỡ kim cương tấm,
                        tiêu chuẩn 4C, …) đều được thể hiện rõ ràng và minh bạch trên Giấy Đảm Bảo.
                      </li>
                      <li>
                        - Dịch vụ BẢO HÀNH & SỬA CHỮA MIỄN PHÍ TRỌN ĐỜI với thân nhẫn và kim cương tấm dưới 2.0mm.
                      </li>
                      <li>
                        - Áp dụng quy trình chế tác khép kín, minh bạch, góp phần nâng tầm thị trường trang sức tại Việt
                        Nam, đặc biệt trong lĩnh vực kim cương tự nhiên. Mỗi sản phẩm đều là sự kết hợp hoàn hảo giữa giá
                        trị tinh thần và vẻ đẹp trường tồn.
                      </li>
                    </ul>
                  </>
                ),
              },
            ].map((item, index) => (
              <div key={index} className="accordion-item">
                <div className="accordion-title" onClick={() => toggleAccordion(index)}>
                  <span>{item.title}</span>
                  {openAccordion === index ? (
                    <Image src="/images/up.png" alt="Arrow Up" width={20} height={20} />
                  ) : (
                    <span className="plus-icon">
                      <Image src="/images/down.png" alt="Arrow Up" width={20} height={20} />
                    </span>
                  )}
                </div>
                <div className={`accordion-content ${openAccordion === index ? "open" : ""}`}>
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}