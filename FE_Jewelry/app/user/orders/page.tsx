"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "../components/page";
import "./styleOrder.css";

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface OrderData {
  productID: string;
  product_name: string;
  price: string;
  selectedMaterial: Material;
  imageURL: string;
  quantity: number; // Thêm số lượng
}

interface UserInfo {
  full_name: string;
  phone_number: string;
  perID: number;
}

interface Province {
  code: number;
  name: string;
}

interface District {
  code: number;
  name: string;
}

export default function Order() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    province: "",
    district: "",
    ringSize: "",
    perID: 0,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash-on-delivery");
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeTimer, setQrCodeTimer] = useState(120);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);

  // Phí ship cố định (có thể thay đổi theo logic thực tế)
  const shippingFee = 30000; // 30,000 VNĐ

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
        setCustomerInfo((prev) => ({
          ...prev,
          fullName: parsedUserInfo.full_name,
          phoneNumber: parsedUserInfo.phone_number,
          perID: parsedUserInfo.perID,
        }));
      } catch (error) {
        console.error("Lỗi khi parse userInfo từ localStorage:", error);
      }
    }

    const productID = searchParams.get("productID");
    const product_name = searchParams.get("product_name");
    const price = searchParams.get("price");
    const selectedMaterial = searchParams.get("selectedMaterial");
    const imageURL = searchParams.get("imageURL");

    if (productID && product_name && price && selectedMaterial && imageURL) {
      let parsedMaterial: Material;
      try {
        parsedMaterial = JSON.parse(selectedMaterial);
      } catch (error) {
        console.error("Lỗi phân tích JSON:", error);
        parsedMaterial = { materialID: 0, material_name: "Không xác định", price: 0 };
      }

      setOrderData({
        productID,
        product_name,
        price,
        selectedMaterial: parsedMaterial,
        imageURL,
        quantity: 1, // Khởi tạo số lượng mặc định là 1
      });
    } else {
      router.push("/user/invoices");
    }

    fetch("https://provinces.open-api.vn/api/p/")
      .then((response) => response.json())
      .then((data) => setProvinces(data))
      .catch((error) => console.error("Lỗi khi lấy danh sách tỉnh:", error));
  }, [searchParams, router]);

  useEffect(() => {
    if (customerInfo.province) {
      fetch(`https://provinces.open-api.vn/api/p/${customerInfo.province}?depth=2`)
        .then((response) => response.json())
        .then((data) => setDistricts(data.districts || []))
        .catch((error) => {
          console.error("Lỗi khi lấy danh sách huyện:", error);
          setDistricts([]);
        });
    } else {
      setDistricts([]);
    }
  }, [customerInfo.province]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showQRCode && qrCodeTimer > 0) {
      timer = setInterval(() => setQrCodeTimer((prev) => prev - 1), 1000);
    } else if (qrCodeTimer === 0) {
      setShowQRCode(false);
      setError("Mã QR đã hết hạn. Vui lòng chọn lại phương thức thanh toán.");
    }
    return () => clearInterval(timer);
  }, [showQRCode, qrCodeTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowQRCode(false);
    setQrCodeTimer(120);
    setError("");
  };

  // Hàm tăng số lượng
  const increaseQuantity = () => {
    if (orderData) {
      setOrderData((prev) => prev && { ...prev, quantity: prev.quantity + 1 });
    }
  };

  // Hàm giảm số lượng (không cho giảm dưới 1)
  const decreaseQuantity = () => {
    if (orderData && orderData.quantity > 1) {
      setOrderData((prev) => prev && { ...prev, quantity: prev.quantity - 1 });
    }
  };

  // Tính tổng tiền
  const calculateTotal = () => {
    if (!orderData) return 0;
    const productPrice = parseFloat(orderData.price) * orderData.quantity;
    return productPrice + shippingFee;
  };

  const handleConfirmOrder = async () => {
    if (
      !customerInfo.fullName ||
      !customerInfo.phoneNumber ||
      !customerInfo.address ||
      !customerInfo.province ||
      !customerInfo.district
    ) {
      setError("Vui lòng nhập đầy đủ thông tin giao hàng");
      return;
    }
  
    if (!customerInfo.perID) {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      return;
    }
  
    if (!orderData) {
      setError("Dữ liệu đơn hàng không hợp lệ. Vui lòng thử lại.");
      return;
    }
  
    const provinceName = provinces.find((p) => p.code === parseInt(customerInfo.province))?.name;
    const districtName = districts.find((d) => d.code === parseInt(customerInfo.district))?.name;
    if (!provinceName || !districtName) {
      setError("Tỉnh hoặc huyện không hợp lệ. Vui lòng chọn lại.");
      return;
    }
    const fullAddress = `${customerInfo.address}, ${districtName}, ${provinceName}`;
  
    const unitPrice = parseFloat(orderData.price);
    const shippingFee = 30000;
    const productPrice = unitPrice * orderData.quantity;
    const totalPrice = productPrice + shippingFee;
  
    const invoiceData = {
      invoice: {
        perID: customerInfo.perID,
        receiverName: customerInfo.fullName,
        receiverPhone: customerInfo.phoneNumber,
        fullAddress,
        paymentMethod: selectedPaymentMethod,
        status: "Chờ xác nhận",
      },
      invoiceDetail: {
        productID: orderData.productID,
        materialID: orderData.selectedMaterial.materialID,
        unitPrice,
        shippingFee,
        totalPrice,
        ringSize: customerInfo.ringSize || null,
        quantity: orderData.quantity,
      },
    };
  
    try {
      setIsLoading(true);
      setError("");
  
      const response = await fetch("http://localhost:4000/invoices/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });
  
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi tạo hóa đơn");
      }
  
      setIsLoading(false);
      setIsOrderSuccess(true);
  
      setTimeout(() => {
        if (selectedPaymentMethod === "cash-on-delivery") {
          router.push("/user/invoices"); // Chuyển đến trang hóa đơn
        } else {
          setShowQRCode(true);
          setQrCodeTimer(120);
        }
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi lưu đơn hàng:", error);
      setError("Đã có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  const handleQRPaymentSuccess = async () => {
    // Tương tự handleConfirmOrder, chỉ thay đổi redirect sau khi thành công
    // Code tương tự, chỉ thay router.push("/user/invoices") sau khi thành công
  };

  if (!orderData) return <div>Đang tải...</div>;

  return (
    <Layout>
      <div id="content">
        <h1 className="order-title">Thanh Toán Sản Phẩm</h1>
        <div className="order-container">
          <div className="order-section order-product-info">
            <h2 className="section-title">Thông tin sản phẩm</h2>
            <div className="product-details">
              <Image
                src={orderData.imageURL}
                alt={orderData.product_name}
                width={120}
                height={120}
                className="product-image"
              />
              <div className="product-info">
                <p className="product-name">{orderData.product_name}</p>
                <p className="product-detail">
                  {orderData.selectedMaterial.material_name} -{" "}
                  {parseInt(orderData.price).toLocaleString("vi-VN")} ₫
                </p>
                <div className="quantity-control">
                  <button onClick={decreaseQuantity}>-</button>
                  <span>{orderData.quantity}</span>
                  <button onClick={increaseQuantity}>+</button>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Size nhẫn</label>
              <input
                type="text"
                name="ringSize"
                value={customerInfo.ringSize}
                onChange={handleInputChange}
                placeholder="Nhập size nhẫn (ví dụ: 6, 7, 8...)"
              />
            </div>
            <div className="total-section">
              <p>Phí sản phẩm: {(parseFloat(orderData.price) * orderData.quantity).toLocaleString("vi-VN")} ₫</p>
              <p>Phí vận chuyển: {shippingFee.toLocaleString("vi-VN")} ₫</p>
              <p className="total-price">
                Thành tiền: {calculateTotal().toLocaleString("vi-VN")} ₫
              </p>
            </div>
          </div>

          <div className="order-section order-customer-info">
            <p className="section-title">THÔNG TIN GIAO HÀNG</p>
            <div className="form-row">
              <div className="form-group">
                <label>
                  Họ và tên <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={customerInfo.fullName}
                  onChange={handleInputChange}
                  placeholder="Nhập họ và tên"
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Số điện thoại <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={customerInfo.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Tỉnh/Thành phố <span className="required">*</span>
                </label>
                <select
                  name="province"
                  value={customerInfo.province}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Quận/Huyện <span className="required">*</span>
                </label>
                <select
                  name="district"
                  value={customerInfo.district}
                  onChange={handleInputChange}
                  required
                  disabled={!customerInfo.province}
                >
                  <option value="">Chọn quận/huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                Địa chỉ giao hàng <span className="required">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ giao hàng (số nhà, tên đường, ...)"
                required
              />
            </div>

            <div className="payment-methods">
              <p className="section-title">PHƯƠNG THỨC THANH TOÁN</p>
              <div className="payment-options">
                <div
                  className={`payment-option ${selectedPaymentMethod === "cash-on-delivery" ? "selected" : ""}`}
                  onClick={() => handlePaymentMethodChange("cash-on-delivery")}
                >
                  <Image src="/images/receive.png" alt="Khi nhận hàng" width={35} height={35} />
                  <p>Khi nhận hàng</p>
                  <span className="status">
                    {selectedPaymentMethod === "cash-on-delivery" ? "Đã áp dụng" : "Chưa áp dụng"}
                  </span>
                </div>
                <div
                  className={`payment-option ${selectedPaymentMethod === "visa" ? "selected" : ""}`}
                  onClick={() => handlePaymentMethodChange("visa")}
                >
                  <Image src="/images/visa.png" alt="Visa" width={50} height={50} />
                  <p>Visa</p>
                  <span className="status">
                    {selectedPaymentMethod === "visa" ? "Đã áp dụng" : "Chưa áp dụng"}
                  </span>
                </div>
                <div
                  className={`payment-option ${selectedPaymentMethod === "mastercard" ? "selected" : ""}`}
                  onClick={() => handlePaymentMethodChange("mastercard")}
                >
                  <Image src="/images/mastercard.png" alt="Mastercard" width={50} height={50} />
                  <p>Mastercard</p>
                  <span className="status">
                    {selectedPaymentMethod === "mastercard" ? "Đã áp dụng" : "Chưa áp dụng"}
                  </span>
                </div>
                <div
                  className={`payment-option ${selectedPaymentMethod === "american-express" ? "selected" : ""}`}
                  onClick={() => handlePaymentMethodChange("american-express")}
                >
                  <Image src="/images/american-express.png" alt="American Express" width={50} height={50} />
                  <p>American Express</p>
                  <span className="status">
                    {selectedPaymentMethod === "american-express" ? "Đã áp dụng" : "Chưa áp dụng"}
                  </span>
                </div>
                <div
                  className={`payment-option ${selectedPaymentMethod === "atm" ? "selected" : ""}`}
                  onClick={() => handlePaymentMethodChange("atm")}
                >
                  <Image src="/images/atm.png" alt="ATM Nội địa" width={50} height={50} />
                  <p>Thẻ ATM nội địa</p>
                  <span className="status">
                    {selectedPaymentMethod === "atm" ? "Đã áp dụng" : "Chưa áp dụng"}
                  </span>
                </div>
              </div>
            </div>

            {isOrderSuccess && (
              <div className="success-overlay">
                <div className="success-animation">
                  <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                  </svg>
                  <p>Đặt hàng thành công!</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <p>Đang xử lý đơn hàng...</p>
              </div>
            )}

            {showQRCode && (
              <div className="qr-code-popup">
                <div className="qr-code-content">
                  <h3>Quét mã QR để thanh toán</h3>
                  <p>Thời gian còn lại: {Math.floor(qrCodeTimer / 60)}:{(qrCodeTimer % 60).toString().padStart(2, "0")}</p>
                  <Image
                    src="/images/qr-code.jpg"
                    alt="QR Code"
                    width={200}
                    height={200}
                    className="qr-code-image"
                  />
                  <p>Quét mã QR bằng ứng dụng ngân hàng của bạn</p>
                  <div className="qr-code-buttons">
                    <button className="qr-confirm-btn" onClick={handleQRPaymentSuccess}>
                      Xác nhận đã thanh toán
                    </button>
                    <button className="qr-cancel-btn" onClick={() => setShowQRCode(false)}>
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <button className="confirm-order-btn" onClick={handleConfirmOrder} disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "XÁC NHẬN ĐẶT HÀNG"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}