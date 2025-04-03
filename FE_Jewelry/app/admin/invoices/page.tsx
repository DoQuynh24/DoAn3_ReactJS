"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import Image from "next/image";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./stylesInvoices.css";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Định nghĩa interface cho Invoice
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

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [invoicesPerPage] = useState<number>(5);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Thống kê tổng quan
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalProductsSold, setTotalProductsSold] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [mostOrderedProducts, setMostOrderedProducts] = useState<
    { product_name: string; quantity: number; imageURL?: string }[]
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<
    { method: string; count: number }[]
  >([]);

  // Thống kê hóa đơn
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [invoicesByStatus, setInvoicesByStatus] = useState<
    { status: string; count: number }[]
  >([]);
  const [revenueByStatus, setRevenueByStatus] = useState<
    { status: string; revenue: number }[]
  >([]);

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const fetchAllInvoices = async () => {
    try {
      const response = await fetch("http://localhost:4000/invoices/all", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi lấy danh sách hóa đơn");
      }
      const data = result.data || [];
      setInvoices(data);
      setFilteredInvoices(data);

      // Tính toán thống kê
      calculateStatistics(data);
      calculateInvoiceStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: Invoice[]) => {
    const revenue = data.reduce(
      (sum, invoice) => sum + (invoice.totalPrice || 0),
      0
    );
    setTotalRevenue(revenue);

    const productsSold = data.reduce(
      (sum, invoice) => sum + (invoice.quantity || 1),
      0
    );
    setTotalProductsSold(productsSold);

    const uniqueCustomers = new Set(data.map((invoice) => invoice.perID)).size;
    setTotalCustomers(uniqueCustomers);

    const productMap: { [key: string]: { quantity: number; imageURL?: string } } = {};
    data.forEach((invoice) => {
      const productName = invoice.product_name || "Unknown";
      if (!productMap[productName]) {
        productMap[productName] = { quantity: 0, imageURL: invoice.imageURL };
      }
      productMap[productName].quantity += invoice.quantity || 1;
    });
    const mostOrdered = Object.entries(productMap)
      .map(([product_name, { quantity, imageURL }]) => ({
        product_name,
        quantity,
        imageURL,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);
    setMostOrderedProducts(mostOrdered);

    const paymentMap: { [key: string]: number } = {};
    data.forEach((invoice) => {
      const method = invoice.paymentMethod || "Unknown";
      paymentMap[method] = (paymentMap[method] || 0) + 1;
    });
    const paymentStats = Object.entries(paymentMap)
      .map(([method, count]) => ({ method, count }))
      .sort((a, b) => b.count - a.count);
    setPaymentMethods(paymentStats);
  };

  const calculateInvoiceStatistics = (data: Invoice[]) => {
    setTotalInvoices(data.length);

    const statusMap: { [key: string]: number } = {};
    data.forEach((invoice) => {
      const status = invoice.status || "Unknown";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusStats = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
    setInvoicesByStatus(statusStats);

    const revenueMap: { [key: string]: number } = {};
    data.forEach((invoice) => {
      const status = invoice.status || "Unknown";
      revenueMap[status] = (revenueMap[status] || 0) + (invoice.totalPrice || 0);
    });
    const revenueStats = Object.entries(revenueMap)
      .map(([status, revenue]) => ({ status, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
    setRevenueByStatus(revenueStats);
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Chờ xác nhận":
        return "#ffa500";
      case "Đã giao":
        return "#27ae60";
      case "Đã hủy":
        return "#e74c3c";
      case "Yêu cầu trả hàng":
        return "#8e44ad";
      default:
        return "#7f8c8d";
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1);

    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoiceID.toLowerCase().includes(term) ||
        invoice.receiverName.toLowerCase().includes(term) ||
        (invoice.product_name && invoice.product_name.toLowerCase().includes(term))
    );
    setFilteredInvoices(
      filterStatus === "All"
        ? filtered
        : filtered.filter((invoice) => invoice.status === filterStatus)
    );
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);

    const filtered = invoices.filter((invoice) =>
      status === "All" ? true : invoice.status === status
    );
    setFilteredInvoices(
      searchTerm
        ? filtered.filter(
            (invoice) =>
              invoice.invoiceID.toLowerCase().includes(searchTerm) ||
              invoice.receiverName.toLowerCase().includes(searchTerm) ||
              (invoice.product_name && invoice.product_name.toLowerCase().includes(searchTerm))
          )
        : filtered
    );
  };

  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const closeModal = () => {
    setSelectedInvoice(null);
  };

  const pieChartData = {
    labels: revenueByStatus.map((item) => item.status),
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: revenueByStatus.map((item) => item.revenue),
        backgroundColor: revenueByStatus.map((item) => getStatusColor(item.status)),
        hoverOffset: 20,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 14,
          },
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Đang tải danh sách hóa đơn...</div>
      </Layout>
    );
  }

  return (
    <Layout>

      <Row>
        <Col md={9}>
          {/* Tổng quan thống kê */}
          <div className="overview-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon revenue-icon">💰</div>
                <div className="stat-info">
                  <h3>{formatCurrency(totalRevenue)}</h3>
                  <p>Tổng doanh thu</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon product-icon">📦</div>
                <div className="stat-info">
                  <h3>{totalProductsSold}</h3>
                  <p>Tổng sản phẩm đã bán</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon customer-icon">👥</div>
                <div className="stat-info">
                  <h3>{totalCustomers}</h3>
                  <p>Tổng khách hàng</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon invoice-icon">📜</div>
                <div className="stat-info">
                  <h3>{totalInvoices}</h3>
                  <p>Tổng số hóa đơn</p>
                </div>
              </div>
            </div>
          </div>
        </Col>

        <Col md={3}>
          {/* Sản phẩm được đặt nhiều nhất */}
          <div className="most-ordered">
            <h3 className="section-title">Sản phẩm được đặt nhiều nhất</h3>
            <div className="item">
            {mostOrderedProducts.map((product, index) => (
              <div key={index} className="most-ordered-item">
                {product.imageURL ? (
                  <Image
                    src={`http://localhost:4000${product.imageURL}`}
                    alt={product.product_name}
                    width={60}
                    height={60}
                    className="most-ordered-image"
                  />
                ) : (
                  <Image
                    src="/images/default-product.jpg"
                    alt="Default Product"
                    width={60}
                    height={60}
                    className="most-ordered-image"
                  />
                )}
                <div className="most-ordered-info">
                  <p>{product.product_name}</p>
                  <p className="quantity">{product.quantity} sản phẩm</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          {/* Báo cáo hóa đơn */}
          <div className="order-report">
            <div className="report-header">
              <h2 className="report-title">Báo cáo hóa đơn</h2>
              <div className="filter-container">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã, khách hàng, sản phẩm..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="search-input"
                />
                <select
                  className="filter-select"
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value)}
                >
                  <option value="All">Tất cả</option>
                  <option value="Chờ xác nhận">Chờ xác nhận</option>
                  <option value="Đã giao">Đã giao</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Yêu cầu trả hàng">Yêu cầu trả hàng</option>
                </select>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}

            {filteredInvoices.length === 0 ? (
              <div className="alert-info">Chưa có hóa đơn nào</div>
            ) : (
              <>
                <div className="invoices-table">
                  <div className="table-header">
                    <div className="column">Mã hóa đơn</div>
                    <div className="column">Khách hàng</div>
                    <div className="column">Sản phẩm</div>
                    <div className="column">Tổng tiền</div>
                    <div className="column">Trạng thái</div>
                    <div className="column">Ngày tạo</div>
                  </div>

                  {currentInvoices.map((invoice) => (
                    <div
                      key={invoice.invoiceID}
                      className="invoice-row"
                      onClick={() => handleRowClick(invoice)}
                    >
                      <div className="column">#{invoice.invoiceID}</div>
                      <div className="column customer-column">
                        <Image
                          src="/images/customer-placeholder.png"
                          alt="Customer"
                          width={32}
                          height={32}
                          className="customer-avatar"
                        />
                        <span>{invoice.receiverName}</span>
                      </div>
                      <div className="column">{invoice.product_name || "N/A"}</div>
                      <div className="column">{formatCurrency(invoice.totalPrice)}</div>
                      <div className="column">
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor: getStatusColor(invoice.status),
                          }}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <div className="column">
                        {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => paginate(index + 1)}
                      className={`page-btn ${currentPage === index + 1 ? "active" : ""}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Col>

        <Col md={4}>
          {/* Hóa đơn theo trạng thái */}
          <div className="stat-card">
            <div className="stat-icon status-icon">📊</div>
            <div className="stat-info">
              <h3>Hóa đơn theo trạng thái</h3>
              <div className="status-list">
                {invoicesByStatus.map((item, index) => (
                  <p key={index} className="status-stat">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: getStatusColor(item.status) }}
                    ></span>
                    {item.status}: {item.count}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Doanh thu theo trạng thái */}
          <div className="stat-card">
            <div className="stat-icon revenue-status-icon">💵</div>
            <div className="stat-info">
              <h3>Doanh thu theo trạng thái</h3>
              <div className="pie-chart-container">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
          </div>

          {/* Phương thức thanh toán phổ biến nhất
          <div className="most-type-order">
            <h3 className="section-title">Phương thức thanh toán phổ biến</h3>
            <div className="donut-chart">
              {paymentMethods.map((method, index) => (
                <div key={index} className="chart-legend">
                  <span
                    className="legend-color"
                    style={{
                      backgroundColor: ["#ff6f61", "#6b5b95", "#88b04b"][index % 3],
                    }}
                  ></span>
                  <p>
                    {method.method}: {method.count} hóa đơn
                  </p>
                </div>
              ))}
            </div>
          </div> */}
        </Col>
      </Row>

      {selectedInvoice && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Chi tiết hóa đơn #{selectedInvoice.invoiceID}</h3>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="info-section">
                <h4>Thông tin khách hàng</h4>
                <p><strong>Tên:</strong> {selectedInvoice.receiverName}</p>
                <p><strong>SĐT:</strong> {selectedInvoice.receiverPhone}</p>
                <p><strong>Địa chỉ:</strong> {selectedInvoice.fullAddress}</p>
                <p><strong>Phương thức thanh toán:</strong> {selectedInvoice.paymentMethod}</p>
              </div>

              <div className="product-section">
                <h4>Sản phẩm</h4>
                <div className="product-item">
                  {selectedInvoice.imageURL ? (
                    <Image
                      src={`http://localhost:4000${selectedInvoice.imageURL}`}
                      alt={selectedInvoice.product_name || "Product"}
                      width={80}
                      height={80}
                      className="product-image"
                    />
                  ) : (
                    <Image
                      src="/images/default-product.jpg"
                      alt="Default Product"
                      width={80}
                      height={80}
                      className="product-image"
                    />
                  )}
                  <div className="product-details">
                    <p><strong>Tên sản phẩm:</strong> {selectedInvoice.product_name || "N/A"}</p>
                    <p><strong>Chất liệu:</strong> {selectedInvoice.material_name || "N/A"}</p>
                    <p><strong>Kích thước:</strong> {selectedInvoice.ringSize || "N/A"}</p>
                    <p><strong>Số lượng:</strong> {selectedInvoice.quantity || 1}</p>
                    <p><strong>Đơn giá:</strong> {formatCurrency(selectedInvoice.unitPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="summary-section">
                <h4>Tổng kết</h4>
                <p><strong>Giá sản phẩm:</strong> {formatCurrency((selectedInvoice.unitPrice || 0) * (selectedInvoice.quantity || 1))}</p>
                <p><strong>Phí vận chuyển:</strong> {formatCurrency(selectedInvoice.shippingFee)}</p>
                <p><strong>Tổng cộng:</strong> {formatCurrency(selectedInvoice.totalPrice)}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}