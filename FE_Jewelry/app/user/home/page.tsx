"use client";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/page";
import React, { useState, useEffect } from "react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./styleHome.css";

interface Province {
  code: number;
  name: string;
}

export default function Home() {
  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);

  // Lấy danh sách tỉnh thành
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/")
      .then((response) => response.json())
      .then((data: Province[]) => {
        setProvinces(data);
      })
      .catch((error) => console.error("Lỗi khi tải danh sách tỉnh thành:", error));
  }, []);

  // Hiển thị modal quảng cáo sau 60 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [showAd]);

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
      
      <Image src="/images/banner1.png" alt="Banner 1" width={1920} height={800} className="banner-image" />
      {/* Fine Jewelry */}
      <section className="fine-section">
          <span className="fine-title">Fine Jewelry</span>
          <p>Thế giới lấp lánh của quý cô hiện đại</p>
          <div className="reasons-content">
            <div className="fine-item">
              <Image src="/images/2.png" alt="fine 1" width={150} height={150} className="fine-image" />
              <p><Link href="/user/products"> Nhẫn cầu hôn</Link></p>
            </div>
            <div className="fine-item">
              <Image src="/images/fine2.png" alt="fine 2" width={150} height={150} className="fine-image" />
              <p><Link href="/user/products"> Vòng tay - Lắc tay</Link></p>
            </div>
            <div className="fine-item">
              <Image src="/images/fine3.png" alt="fine 3" width={150} height={150} className="fine-image" />
              <p><Link href="/user/products"> Dây chuyền</Link></p>
            </div>
            <div className="fine-item">
              <Image src="/images/fine4.png" alt="fine 4" width={150} height={150} className="fine-image" />
              <p><Link href="/user/products"> Nhẫn thời trang</Link></p>
            </div>
            <div className="fine-item">
              <Image src="/images/fine5.png" alt="fine 4" width={150} height={150} className="fine-image" />
              <p><Link href="/user/products"> Bông tai</Link></p>
            </div>
          </div>
        </section>
        <Image src="/images/banner2.png" alt="Banner 2" width={1920} height={80} className="banner-image" />
        {/* Hệ thống cửa hàng Section */}
        <section className="store-system-section">
          <div className="store-system-content">
            <div className="store-system-image">
              <Image src="/images/store-system.png" alt="Hệ thống cửa hàng" width={600} height={400} className="store-system-img" />
            </div>
            <div className="store-system-text">
              <h3>Hệ thống cửa hàng</h3>
              <p>Thế giới trang sức cực không gian mua sắm tuyệt vời dành cho bạn ghé thăm.</p>
              <p>Với hệ thống showroom và chính sách giao hàng nhanh toàn quốc hoàn toàn miễn phí, Tierra sẽ giúp quá trình mua hàng của bạn trở nên tiện lợi, nhanh chóng, tiết kiệm và an toàn hơn.</p>
              <p>Tìm cửa hàng gần bạn nhất.</p>
              <Link href="/stores" className="store-system-btn">
                ĐẶT LỊCH HẸN
              </Link>
            </div>
          </div>
        </section>

       {/* Lựa chọn trang sức lý tưởng Section */}
       <section className="reasons-section">
          <h3 className="section-title">Lựa chọn trang sức lý tưởng</h3>
          <div className="reasons-content">
            <div className="reason-item">
              <Image src="/images/reason1.png" alt="Reason 1" width={150} height={150} className="reason-image" />
              <p>Thân thiện & Tình cảm</p>
            </div>
            <div className="reason-item">
              <Image src="/images/reason2.png" alt="Reason 2" width={150} height={150} className="reason-image" />
              <p>Tinh tuyền tốt nhất</p>
            </div>
            <div className="reason-item">
              <Image src="/images/reason3.png" alt="Reason 3" width={150} height={150} className="reason-image" />
              <p>Tạo tác từ trái tim</p>
            </div>
            <div className="reason-item">
              <Image src="/images/reason4.png" alt="Reason 4" width={150} height={150} className="reason-image" />
              <p>Tư vấn 1:1 tận tâm</p>
            </div>
          </div>
        </section>

        {/* Tin mới nhất Section */}
        <section className="news-section">
          <div className="news-content">
            <div className="news-featured">
              <div className="news-featured-image">
                <Image src="/images/news-featured.png" alt="News Featured" width={600} height={400} className="news-featured-img" />
              </div>
              <div className="news-featured-text">
                <span className="news-category">Tin nổi bật</span>
                <h3>Jewelry Natural Diamond chào đón cửa hàng thứ 12 tại Hai Bà Trưng, Quận 1</h3>
                <p>
                  Jewelry Natural Diamond nhen đỏ niềm vui khi chính thức chào đón cửa hàng thứ mười hai tại số 464 Hai Bà Trưng, phường Tân Định, Quận 1 vào ngày 11/01/2025.
                </p>
              </div>
            </div>
            <div className="news-list">
                <h4>Tin mới nhất</h4>
              <div className="news-item">
                <div className="news-item-image">
                  <Image src="/images/news1.png" alt="News 1" width={100} height={100} className="news-item-img" />
                </div>
                <div className="news-item-text">
                  <p>Kim cương Lab-grown là gì? Sự khác nhau giữa Kim cương tự nhiên và kim cương Lab-grown: Đâu là sự lựa chọn tốt nhất?</p>
                  <p className="news-date">04/02/2025</p>
                </div>
              </div>
              <div className="news-item">
                <div className="news-item-image">
                  <Image src="/images/news2.png" alt="News 2" width={100} height={100} className="news-item-img" />
                </div>
                <div className="news-item-text">
                  <p>Hướng dẫn 4 cách đo size nhẫn chuẩn, không sai 1 li</p>
                  <p className="news-date">24/03/2025</p>
                </div>
              </div>
              <div className="news-item">
                <div className="news-item-image">
                  <Image src="/images/news3.png" alt="News 3" width={100} height={100} className="news-item-img" />
                </div>
                <div className="news-item-text">
                  <p>Spark Of Heaven – Bộ sưu tập lấp lánh của hôn lễ mới từ Tierra Diamond</p>
                  <p className="news-date">01/10/2024</p>
                </div>
              </div>
              <div className="news-item">
                <div className="news-item-image">
                  <Image src="/images/news4.png" alt="News 4" width={100} height={100} className="news-item-img" />
                </div>
                <div className="news-item-text">
                  <p>Thiết kế độc quyền Jewelry – Sở hữu chiếc nhẫn duy nhất do bạn thiết kế không phải là điều khó cho đội ngũ Jewelry.</p>
                  <p className="news-date">01/04/2024</p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </Layout>
  );
}