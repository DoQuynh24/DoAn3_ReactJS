"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import Image from "next/image";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Line } from "react-chartjs-2"; // Thay Pie thành Line
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"; // Cập nhật thành phần
import "./stylesInvoices.css";

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

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

interface ProductStat {
  product_name: string;
  quantity: number;
  imageURL?: string;
}

interface StatusStat {
  status: string;
  count: number;
}

interface RevenueStat {
  status: string;
  revenue: number;
}

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [invoicesPerPage] = useState<number>(7);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalProductsSold, setTotalProductsSold] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalInvoices, setTotalInvoices] = useState<number>(0);
  const [mostOrderedProducts, setMostOrderedProducts] = useState<ProductStat[]>([]);
  const [invoicesByStatus, setInvoicesByStatus] = useState<StatusStat[]>([]);
  const [revenueByStatus, setRevenueByStatus] = useState<RevenueStat[]>([]);

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
      calculateStatistics(data);
      calculateInvoiceStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (data: Invoice[]) => {
    setTotalRevenue(data.reduce((sum, invoice) => sum + (invoice.totalPrice || 0), 0));
    setTotalProductsSold(data.reduce((sum, invoice) => sum + (invoice.quantity || 1), 0));
    setTotalCustomers(new Set(data.map((invoice) => invoice.perID)).size);
    setTotalInvoices(data.length);

    const productMap: { [key: string]: { quantity: number; imageURL?: string } } = {};
    data.forEach((invoice) => {
      const productName = invoice.product_name || "Unknown";
      if (!productMap[productName]) {
        productMap[productName] = { quantity: 0, imageURL: invoice.imageURL };
      }
      productMap[productName].quantity += invoice.quantity || 1;
    });
    setMostOrderedProducts(
      Object.entries(productMap)
        .map(([product_name, { quantity, imageURL }]) => ({ product_name, quantity, imageURL }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3)
    );
  };

  const calculateInvoiceStatistics = (data: Invoice[]) => {
    const statusMap: { [key: string]: number } = {};
    data.forEach((invoice) => {
      const status = invoice.status || "Unknown";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    setInvoicesByStatus(
      Object.entries(statusMap)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)
    );

    const revenueMap: { [key: string]: number } = {};
    data.forEach((invoice) => {
      const status = invoice.status || "Unknown";
      revenueMap[status] = (revenueMap[status] || 0) + (invoice.totalPrice || 0);
    });
    setRevenueByStatus(
      Object.entries(revenueMap)
        .map(([status, revenue]) => ({ status, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
    );
  };

  const formatCurrency = (amount: number | undefined): string =>
    amount === undefined
      ? "N/A"
      : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Chờ xác nhận": return "#ffa500";
      case "Chờ lấy hàng": return "#3498db";
      case "Chờ giao hàng": return "#f1c40f";
      case "Đã giao": return "#27ae60";
      case "Đã hủy": return "#e74c3c";
      case "Yêu cầu trả hàng": return "#8e44ad";
      default: return "#7f8c8d";
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
      filterStatus === "All" ? filtered : filtered.filter((invoice) => invoice.status === filterStatus)
    );
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
    const filtered = invoices.filter((invoice) => (status === "All" ? true : invoice.status === status));
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

  const indexOfFirstInvoice = (currentPage - 1) * invoicesPerPage;
  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleRowClick = (invoice: Invoice) => setSelectedInvoice(invoice);
  const closeModal = () => setSelectedInvoice(null);

  const handleStatusChange = async (invoiceID: string, newStatus: string) => {
    if (newStatus === "Đã giao") {
      setError("Admin không thể cập nhật trạng thái thành 'Đã giao'. Trạng thái này chỉ được cập nhật khi người dùng xác nhận nhận hàng.");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/invoices/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceID,
          receiverName: selectedInvoice?.receiverName,
          receiverPhone: selectedInvoice?.receiverPhone,
          fullAddress: selectedInvoice?.fullAddress,
          paymentMethod: selectedInvoice?.paymentMethod,
          status: newStatus,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Lỗi khi cập nhật trạng thái");
      }
      setInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: newStatus } : inv))
      );
      setFilteredInvoices((prev) =>
        prev.map((inv) => (inv.invoiceID === invoiceID ? { ...inv, status: newStatus } : inv))
      );
      setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
      calculateInvoiceStatistics(invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái");
    }
  };

  const lineChartData = {
    labels: revenueByStatus.map((item) => item.status), // Trục X: trạng thái
    datasets: [
      {
        label: "Doanh thu (VND)",
        data: revenueByStatus.map((item) => item.revenue), // Trục Y: doanh thu
        fill: false, // Không điền màu dưới đường
        borderColor: "#ff6f61", // Màu đường
        backgroundColor: revenueByStatus.map((item) => getStatusColor(item.status)), // Màu điểm
        tension: 0.1, // Độ mượt của đường
        pointRadius: 5, // Kích thước điểm
        pointHoverRadius: 7, // Kích thước điểm khi hover
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const, // Vị trí chú thích
        labels: { font: { size: 14 }, color: "#333" },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw || 0)}`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Trạng thái",
          font: { size: 14 },
          color: "#333",
        },
      },
      y: {
        title: {
          display: true,
          text: "Doanh thu (VND)",
          font: { size: 14 },
          color: "#333",
        },
        beginAtZero: true, // Bắt đầu từ 0
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
          <div className="status-report">
            <h3 className="section-title">Hóa đơn theo trạng thái</h3>
            <div className="status-list">
              {invoicesByStatus.map((item, index) => (
                <p key={index} className="status-stat">
                  <span className="status-dot" style={{ backgroundColor: getStatusColor(item.status) }}></span>
                  {item.status}: {item.count}
                </p>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <div className="order-report">
            <div className="report-header">
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
                  <option value="Chờ lấy hàng">Đang lấy hàng</option>
                  <option value="Chờ giao hàng">Chờ giao hàng</option>
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
                    <div className="column">STT</div>
                    <div className="column">Khách hàng</div>
                    <div className="column">Sản phẩm</div>
                    <div className="column">Tổng tiền</div>
                    <div className="column">Ngày đặt</div>
                    <div className="column">Trạng thái</div>
                  </div>
                  {currentInvoices.map((invoice, index) => (
                    <div
                      key={invoice.invoiceID}
                      className="invoice-row"
                      onClick={() => handleRowClick(invoice)}
                    >
                      <div className="column">{indexOfFirstInvoice + index + 1}</div>
                      <div className="column customer-column">
                        <span>{invoice.receiverName}</span>
                      </div>
                      <div className="column">{invoice.product_name || "N/A"}</div>
                      <div className="column">{formatCurrency(invoice.totalPrice)}</div>
                      <div className="column">{new Date(invoice.createdAt).toLocaleDateString("vi-VN")}</div>
                      <div className="column">
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(invoice.status) }}>
                          {invoice.status}
                        </span>
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
          <div className="most-ordered">
            <h4 className="section-title">Sản phẩm được đặt nhiều nhất</h4>
            <div className="item">
              {mostOrderedProducts.map((product, index) => (
                <div key={index} className="most-ordered-item">
                  <Image
                    src={product.imageURL ? `http://localhost:4000${product.imageURL}` : "/images/default-product.jpg"}
                    alt={product.product_name}
                    width={40}
                    height={40}
                    className="most-ordered-image"
                  />
                  <div className="most-ordered-info">
                    <p>{product.product_name}</p>
                    <p className="quantity">{product.quantity} sản phẩm</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="revenue-report">
            <h3 className="section-title">Doanh thu theo trạng thái</h3>
              <div className="line-chart-container">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
          </div>
        </Col>
      </Row>

      {selectedInvoice && (
      <div className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Chi Tiết Đơn Hàng</h3>
            <button className="close-btn" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="info-section">
              <p className="order-date">
                <strong>Ngày đặt:</strong> {new Date(selectedInvoice.createdAt).toLocaleTimeString("vi-VN")} {new Date(selectedInvoice.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="highlight">{selectedInvoice.receiverName} - {selectedInvoice.receiverPhone}</p>
              <p>{selectedInvoice.fullAddress}</p>
              
            </div>

            {/* Chi Tiết Sản Phẩm */}
            <div className="product-section">
              <div className="product-item">
                <Image
                  src={selectedInvoice.imageURL ? `http://localhost:4000${selectedInvoice.imageURL}` : "/images/default-product.jpg"}
                  alt={selectedInvoice.product_name || "Product"}
                  width={80}
                  height={80}
                  className="product-image"
                />
                <div className="product-details">
                  <p className="highlight">{selectedInvoice.product_name || "N/A"}</p>
                  <p>Phân loại hàng: {selectedInvoice.material_name || "N/A"} {selectedInvoice.ringSize || ""}</p>
                  <p>x{selectedInvoice.quantity || 1}</p>
                </div>
                <div className="product-price">
                  <p>{formatCurrency(selectedInvoice.unitPrice)}</p>
                </div>
              </div>
            </div>

            {/* Thông Tin Giá */}
            <div className="summary-section">
              <div className="summary-item">
                <p>Tổng tiền hàng</p>
                <p>{formatCurrency((selectedInvoice.unitPrice || 0) * (selectedInvoice.quantity || 1))}</p>
              </div>
              <div className="summary-item">
                <p>Phí vận chuyển</p>
                <p>{formatCurrency(selectedInvoice.shippingFee)}</p>
              </div>
              <div className="summary-item total">
                <p>Thành tiền</p>
                <p>{formatCurrency(selectedInvoice.totalPrice)}</p>
              </div>
              <div className="summary-item">
                <p>Phương thức thanh toán</p>
                <p>{selectedInvoice.paymentMethod}</p>
              </div>
              <div className="summary-item">
                <p>Trạng thái</p>
                <select
                  value={selectedInvoice.status}
                  onChange={(e) => handleStatusChange(selectedInvoice.invoiceID, e.target.value)}
                  className="status-select"
                >
                  <option value="Chờ xác nhận">Chờ xác nhận</option>
                  <option value="Chờ lấy hàng">Đang lấy hàng</option>
                  <option value="Chờ giao hàng">Chờ giao hàng</option>
                  <option value="Đã hủy">Đã hủy</option>
                  <option value="Yêu cầu trả hàng">Yêu cầu trả hàng</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="close-modal-btn" onClick={closeModal}>Đóng</button>
          </div>
        </div>
      </div>
    )}
    </Layout>
  );
}