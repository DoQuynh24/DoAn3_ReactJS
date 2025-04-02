"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Layout from "../components/page";
import "./styleInvoice.css";

interface Invoice {
  invoiceID: string;
  perID: number;
  receiverName: string;
  receiverPhone: string;
  fullAddress: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  detailID?: number;
  productID?: string;
  materialID?: number;
  unitPrice?: number;
  shippingFee?: number;
  totalPrice?: number;
  ringSize?: string | null;
  product_name?: string;
  material_name?: string;
  imageURL?: string;
  quantity?: number;
}
interface UserInfo {
  perID: number;
  full_name: string;
  phone_number: string;
}

export default function Invoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPerID, setUserPerID] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("Tất cả");

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
        setUserPerID(parsedUserInfo.perID);
      } catch (err) {
        setError("Lỗi khi lấy thông tin người dùng từ localStorage");
      }
    } else {
      setError("Vui lòng đăng nhập để xem đơn hàng");
    }
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!userPerID) return;

      try {
        const response = await fetch(`http://localhost:4000/invoices?perID=${userPerID}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Lỗi khi lấy danh sách hóa đơn");
        }
        setInvoices(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải hóa đơn");
      } finally {
        setLoading(false);
      }
    };

    if (userPerID) fetchInvoices();
  }, [userPerID]);

  const handleViewDetails = async (invoiceID: string) => {
    try {
      const response = await fetch(`http://localhost:4000/invoices/${invoiceID}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi lấy chi tiết hóa đơn");
      }
      setSelectedInvoice(result.data[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải chi tiết hóa đơn");
    }
  };

  const closeDetails = () => {
    setSelectedInvoice(null);
  };

  // Hàm xử lý khi nhấn "Đã nhận hàng"
  const handleConfirmReceived = async (invoiceID: string) => {
    try {
      const response = await fetch("http://localhost:4000/invoices/confirm-received", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi xác nhận nhận hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Đã giao" } : inv))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xác nhận nhận hàng");
    }
  };

  // Hàm xử lý khi nhấn "Hủy đơn hàng" với xác nhận
  const handleCancelOrder = async (invoiceID: string) => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!confirmCancel) {
      return; // Nếu người dùng chọn "Hủy" trong hộp thoại, không làm gì cả
    }

    try {
      const response = await fetch("http://localhost:4000/invoices/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi hủy đơn hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Đã hủy" } : inv))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi hủy đơn hàng");
    }
  };

  // Hàm xử lý khi nhấn "Yêu cầu trả hàng/hoàn tiền"
  const handleRequestReturn = async (invoiceID: string) => {
    try {
      const response = await fetch("http://localhost:4000/invoices/request-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceID }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi yêu cầu trả hàng");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: "Yêu cầu trả hàng" } : inv))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi yêu cầu trả hàng");
    }
  };

  const statusToTabMap: { [key: string]: string } = {
    "Chờ xác nhận": "Chờ thanh toán",
    "Chờ lấy hàng": "Vận chuyển",
    "Chờ giao hàng": "Chờ giao hàng",
    "Đã giao": "Hoàn thành",
    "Đã hủy": "Đã hủy",
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab === "Tất cả") return true;
    const tabStatus = Object.keys(statusToTabMap).find((key) => statusToTabMap[key] === activeTab);
    return tabStatus && invoice.status.toLowerCase() === tabStatus.toLowerCase();
  });

  if (!userPerID) {
    return (
      <Layout>
        <div className="container">
          <div className="alert-warning">Vui lòng đăng nhập để xem đơn hàng của bạn</div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div className="search">
          <Image src="/images/search.png" alt="search" width={20} height={20} className="search-icon" />
          <input type="text" placeholder="Bạn có thể tìm kiếm theo ID đơn hàng hoặc tên sản phẩm" />
        </div>

        <ul className="nav-tabs">
          {["Tất cả", "Chờ thanh toán", "Vận chuyển", "Chờ giao hàng", "Hoàn thành", "Đã hủy", "Trả hàng/Hoàn tiền"].map(
            (tab) => (
              <li key={tab} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              </li>
            )
          )}
        </ul>

        {error && <div className="alert-error">{error}</div>}
        {filteredInvoices.length === 0 ? (
          <div className="alert-info">Bạn chưa có đơn hàng nào</div>
        ) : (
          <div className="invoice-list">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.invoiceID} className="invoice-card">
                <div className="card-header">
                  <div className="header-info">
                    <span className="order-id">
                      <i className="bi bi-truck"></i>
                      <Image
                        src="/images/icon-product.png"
                        alt="delete"
                        width={20}
                        height={20}
                        className="order-icon"
                      />
                      {invoice.invoiceID}
                    </span>
                    <span className="status-badge">{invoice.status}</span>
                  </div>
                </div>
                <div className="card-body" onClick={() => handleViewDetails(invoice.invoiceID)}>
                  <div className="product-details">
                    <Image
                      src={invoice.imageURL ? `http://localhost:4000${invoice.imageURL}` : "/images/addImage.png"}
                      alt={invoice.product_name || "Product"}
                      width={80}
                      height={80}
                      className="product-image"
                    />
                    <div className="product-info">
                      <p className="product-name">{invoice.product_name || "N/A"}</p>
                      <p className="material">Chất liệu: {invoice.material_name || "N/A"}</p>
                      <p className="size">Size: {invoice.ringSize || "Không có"}</p>
                    </div>
                  </div>
                  <div className="price">
                    ₫{invoice.totalPrice ? invoice.totalPrice.toLocaleString("vi-VN") : "N/A"}
                  </div>
                </div>

                <div className="card-footer">
                  <p className="footer-note">
                    Vui lòng chỉ nhận "Đã nhận được hàng" khi đơn hàng đã được giao đến bạn và sản phẩm không có vấn đề nào
                  </p>
                  <div className="action-buttons">
                    {invoice.status === "Chờ giao hàng" && (
                      <>
                        <button
                          className="btn-received"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmReceived(invoice.invoiceID);
                          }}
                        >
                          Đã Nhận Hàng
                        </button>
                        <button className="btn-contact" onClick={(e) => e.stopPropagation()}>
                          Liên Hệ Người Bán
                        </button>
                      </>
                    )}
                    {invoice.status === "Đã giao" && (
                      <>
                        <button
                          className="btn-return"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestReturn(invoice.invoiceID);
                          }}
                        >
                          Yêu Cầu Trả Hàng/Hoàn Tiền
                        </button>
                        <button className="btn-contact" onClick={(e) => e.stopPropagation()}>
                          Liên Hệ Người Bán
                        </button>
                      </>
                    )}
                    {invoice.status === "Chờ xác nhận" && (
                      <>
                        <button
                          className="btn-cancel"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(invoice.invoiceID);
                          }}
                        >
                          Hủy Đơn Hàng
                        </button>
                        <button className="btn-contact" onClick={(e) => e.stopPropagation()}>
                          Liên Hệ Người Bán
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedInvoice && (
          <div className="modal show">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Chi Tiết Đơn Hàng</h5>
                  <button className="close-btn" onClick={closeDetails}>×</button>
                </div>
                <div className="modal-body">
                  <div className="info-container">
                    <div className="delivery-info">
                      <p>Địa Chỉ Nhận Hàng</p>
                      <p>
                        <strong>{selectedInvoice.receiverName}</strong>
                      </p>
                      <p>{selectedInvoice.receiverPhone}</p>
                      <p>{selectedInvoice.fullAddress}</p>
                    </div>
                    <div className="divider"></div>
                    <div className="order-status">
                      <p>
                        <strong>{selectedInvoice.status}</strong>
                      </p>
                      <p>Ngày đặt: {new Date(selectedInvoice.createdAt).toLocaleString("vi-VN")}</p>
                    </div>
                  </div>

                  <div className="product-details-modal">
                    <h6>Chi Tiết Sản Phẩm</h6>
                    <div className="product-info-modal">
                      <Image
                        src={
                          selectedInvoice.imageURL
                            ? `http://localhost:4000${selectedInvoice.imageURL}`
                            : "/images/addImage.png"
                        }
                        alt={selectedInvoice.product_name || "Product"}
                        width={80}
                        height={80}
                        className="modal-product-image"
                      />
                      <div className="text-info">
                        <p>{selectedInvoice.product_name || "N/A"}</p>
                        <p>Phân loại hàng: {selectedInvoice.material_name || "N/A"}</p>
                        <p>x{selectedInvoice.quantity || 1}</p>
                      </div>
                      <div className="price-info">
                        <p>₫{(selectedInvoice.unitPrice || 0).toLocaleString("vi-VN")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="price-details">
                    <h6>Thông Tin Giá</h6>
                    <div className="price-row">
                      <span>Tổng tiền hàng</span>
                      <span>
                        ₫{((selectedInvoice.unitPrice || 0) * (selectedInvoice.quantity || 1)).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="price-row">
                      <span>Phí vận chuyển</span>
                      <span>₫{(selectedInvoice.shippingFee || 0).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="price-row">
                      <span>Thành tiền</span>
                      <span>₫{(selectedInvoice.totalPrice || 0).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="price-row">
                      <span>Phương thức thanh toán</span>
                      <span>{selectedInvoice.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-close-modal" onClick={closeDetails}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}