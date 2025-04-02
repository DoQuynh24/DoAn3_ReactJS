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

export default function Product() {
  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false); // Thêm trạng thái để kiểm tra client

  // Đảm bảo chỉ chạy trên client
  useEffect(() => {
    setIsClient(true); // Đánh dấu rằng mã đang chạy trên client
    const storedFavourites = typeof window !== "undefined" ? localStorage.getItem("favouriteProducts") : null;
    if (storedFavourites) {
      setFavouriteProducts(JSON.parse(storedFavourites));
    }
  }, []);

  // Cập nhật localStorage mỗi khi danh sách yêu thích thay đổi
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("favouriteProducts", JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient]);

  // Lấy danh sách tỉnh thành
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/")
      .then((response) => response.json())
      .then((data: Province[]) => {
        console.log("Dữ liệu tỉnh:", data);
        setProvinces(data);
      })
      .catch((error) => console.error("Lỗi khi tải danh sách tỉnh thành:", error));
  }, []);

  // Lấy danh sách sản phẩm từ API
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
          const sortedProducts = formattedData
            .sort((a: Product, b: Product) => {
              const idA = parseInt(a.productID || "0");
              const idB = parseInt(b.productID || "0");
              return idB - idA;
            })
            .slice(0, 4);
          setProducts(sortedProducts);
        } else {
          console.error("Dữ liệu sản phẩm không phải mảng:", data);
          setProducts([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải danh sách sản phẩm:", error);
        setProducts([]);
      });
  }, []);

  // Hiển thị modal quảng cáo sau 60 giây
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
              <div className="new">
                <Image src="/images/1.png" alt="1" width={230} height={200} />
                <h4 className="text">Best Selling</h4>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="new">
                <Image src="/images/2.png" alt="2" width={230} height={200} />
                <h4 className="text">New Collection</h4>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="new">
                <Image src="/images/3.png" alt="3" width={230} height={200} />
                <h4 className="text">Truyền thống</h4>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="new">
                <Image src="/images/4.png" alt="4" width={230} height={200} />
                <h4 className="text">Hiện đại</h4>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="new">
                <Image src="/images/5.png" alt="5" width={230} height={200} />
                <h4 className="text">Luxury</h4>
              </div>
            </SwiperSlide>

            <SwiperSlide>
              <div className="new">
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
            <Image src="/images/arranage.png" alt="arranage" width={25} height={25} />
            <span>Sắp xếp</span>
          </div>

          <div className="right">
            <Image src="/images/collapse.png" alt="collapse" width={25} height={25} />
            <span>Thu gọn</span>
          </div>
        </div>

        <div id="content-2">
          {products.length >= 4 ? (
            products.map((product, index) => (
              <Link key={index} href={`/user/details/${product.productID}`}>
                <div className="new">
                  <span className="heart-icon1" onClick={(e) => { e.preventDefault(); toggleFavourite(product); }}>
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
                    src={product.images.find((img) => img.is_main === 1)?.imageURL || product.images[0]?.imageURL || "/images/addImage.png"}
                    alt={product.product_name || "Hình ảnh sản phẩm"}
                    width={250}
                    height={250}
                  />
                  <p>{product.product_name}</p>
                  <p>{calculateProductPrice(product.materials).toLocaleString("vi-VN")} ₫</p>
                </div>
              </Link>
            ))
          ) : (
            <p>Không đủ sản phẩm để hiển thị.</p>
          )}
        </div>

        <div className="img-container">
          <Image className="img-poster" src="/images/poster.png" alt="poster" width={500} height={150} />
        </div>

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
                    do đặc điểm cấu trúc hoặc chi tiết trang trí tinh xảo, nhưng đội ngũ Jewelry luôn sẵn sàng tư vấn
                    giải pháp tốt nhất cho từng trường hợp cụ thể.
                  </p>
                  <p>
                    Đối với nhẫn cưới có đá viên tấm kim cương hoặc CZ dưới 2mm ly bị rơi hoặc mất, Jewelry sẽ hỗ trợ
                    thay hoàn toàn miễn phí trong quá trình bảo hành. Tierra cam kết luôn đảm bảo viên đá được thay thế
                    sẽ có kích thước, màu sắc và độ sáng tương đồng với viên đá ban đầu.
                  </p>
                  <p>
                    Chính sách đánh bóng, xi mạ và làm mới trọn đời miễn phí cho tất cả các sản phẩm nhẫn cưới. Với
                    chính sách này, khách hàng có thể hoàn toàn yên tâm rằng chiếc nhẫn của mình sẽ luôn được duy trì
                    trong trạng thái hoàn hảo nhất mà không bị giới hạn số lần bảo dưỡng. Bất kể khi nào cần, Tierra sẽ
                    hỗ trợ đánh bóng lại bề mặt, xi mạ vàng hoặc rhodium theo nhu cầu của sản phẩm, giúp chiếc nhẫn luôn
                    sáng đẹp và bền bỉ như ngày đầu. Đây là cam kết trọn đời của chúng tôi nhằm tôn vinh giá trị và ý
                    nghĩa vĩnh cửu của mỗi chiếc nhẫn trong hành trình hạnh phúc của khách hàng.
                  </p>
                  <ul>
                    <li>
                      - Tất cả kim cương của Jewelry (kích thước từ 4.00 mm trở lên) đều được kiểm định và có giấy
                      chứng nhận từ GIA
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
                      - Dịch vụ BẢO HÀNH & SỬA CHỮA MIỄN PHÍ TRỌN ĐỜI với thân nhẫn và kim cương tấm dưới 2.0mm
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
      </div>
    </Layout>
  );
}