"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/page";
import axios from "axios";
import { FaSearch, FaChevronDown, FaChevronUp, FaStickyNote, FaCrown, FaGem, FaSortUp, FaSortDown } from "react-icons/fa";
import "./styleUser.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface User {
  perID: string;
  phone_number: string;
  full_name: string;
  email?: string;
  created_at: string;
  notes?: string;
  tags?: string[];
}

interface Invoice {
  perID: string;
  invoiceID: string;
  createdAt: string;
  product_name?: string;
  totalPrice?: number;
}

interface SearchSuggestion {
  full_name: string;
  phone_number: string;
  perID: string;
}

export default function AdminUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterPurchaseCount, setFilterPurchaseCount] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(10);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [tags, setTags] = useState<{ [key: string]: string[] }>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userResponse = await axios.get("http://localhost:4000/users");
      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message || "Lỗi khi lấy danh sách người dùng");
      }
      const userData = userResponse.data.data || [];

      const invoiceResponse = await axios.get("http://localhost:4000/invoices/all");
      if (!invoiceResponse.data.success) {
        throw new Error(invoiceResponse.data.message || "Lỗi khi lấy danh sách hóa đơn");
      }
      const invoiceData = invoiceResponse.data.data || [];

      const customerIds = new Set(invoiceData.map((invoice: Invoice) => invoice.perID));
      const customers = userData.filter((user: User) => customerIds.has(user.perID));

      const initialNotes = customers.reduce((acc: { [key: string]: string }, user: User) => {
        acc[user.perID] = user.notes || "";
        return acc;
      }, {});
      const initialTags = customers.reduce((acc: { [key: string]: string[] }, user: User) => {
        acc[user.perID] = user.tags || [];
        return acc;
      }, {});

      setUsers(customers);
      setFilteredUsers(customers);
      setInvoices(invoiceData);
      setNotes(initialNotes);
      setTags(initialTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, filterStatus, filterPurchaseCount);

    if (term) {
      const suggestions = users
        .filter(
          (user) =>
            user.full_name.toLowerCase().includes(term) ||
            user.phone_number.toLowerCase().includes(term)
        )
        .slice(0, 5)
        .map((user) => ({
          full_name: user.full_name,
          phone_number: user.phone_number,
          perID: user.perID,
        }));
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.full_name);
    setSearchSuggestions([]);
    applyFilters(suggestion.full_name.toLowerCase(), filterStatus, filterPurchaseCount);
  };

  const handleFilterStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterStatus(value);
    applyFilters(searchTerm, value, filterPurchaseCount);
  };

  const handleFilterPurchaseCount = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilterPurchaseCount(value);
    applyFilters(searchTerm, filterStatus, value);
  };

  const applyFilters = (search: string, status: string, purchaseCount: string) => {
    setCurrentPage(1);
    let filtered = [...users];

    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.full_name.toLowerCase().includes(search) ||
          user.phone_number.toLowerCase().includes(search)
      );
    }

    if (status !== "All") {
      filtered = filtered.filter((user) => {
        const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
        const totalSpent = userInvoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
        const purchaseCount = userInvoices.length;
        if (status === "Diamond") return totalSpent >= 50000000 || purchaseCount >= 20;
        if (status === "Gold") return (totalSpent >= 20000000 && totalSpent < 50000000) || (purchaseCount >= 10 && purchaseCount < 20);
        if (status === "Loyal") return (totalSpent >= 5000000 && totalSpent < 20000000) || (purchaseCount >= 3 && purchaseCount < 10);
        if (status === "Normal") return totalSpent < 5000000 || purchaseCount < 3;
        return true;
      });
    }

    if (purchaseCount !== "All") {
      const [min, max] = purchaseCount.split("-").map(Number);
      filtered = filtered.filter((user) => {
        const orderCount = invoices.filter((inv) => inv.perID === user.perID).length;
        return max ? orderCount >= min && orderCount <= max : orderCount >= min;
      });
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (sortConfig.key === "full_name") {
          return sortConfig.direction === "asc"
            ? a.full_name.localeCompare(b.full_name)
            : b.full_name.localeCompare(a.full_name);
        }
        if (sortConfig.key === "purchaseCount") {
          const countA = invoices.filter((inv) => inv.perID === a.perID).length;
          const countB = invoices.filter((inv) => inv.perID === b.perID).length;
          return sortConfig.direction === "asc" ? countA - countB : countB - countA;
        }
        if (sortConfig.key === "lastPurchase") {
          const lastA = invoices
            .filter((inv) => inv.perID === a.perID)
            .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt;
          const lastB = invoices
            .filter((inv) => inv.perID === b.perID)
            .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())[0]?.createdAt;
          const timeA = lastA ? new Date(lastA).getTime() : 0;
          const timeB = lastB ? new Date(lastB).getTime() : 0;
          return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
        }
        return 0;
      });
    }

    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string): string =>
    new Date(dateString).toLocaleDateString("vi-VN");

  const getCustomerStatus = (user: User): string => {
    const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
    const totalSpent = userInvoices.reduce((sum, inv) => sum + (inv.totalPrice || 0), 0);
    const purchaseCount = userInvoices.length;
    if (totalSpent >= 50000000 || purchaseCount >= 20) return "Kim cương";
    if ((totalSpent >= 20000000 && totalSpent < 50000000) || (purchaseCount >= 10 && purchaseCount < 20)) return "Vàng";
    if ((totalSpent >= 5000000 && totalSpent < 20000000) || (purchaseCount >= 3 && purchaseCount < 10)) return "Trung thành";
    return "Bình thường";
  };

  const getLastProduct = (user: User): string => {
    const lastOrder = invoices
      .filter((inv) => inv.perID === user.perID)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return lastOrder?.product_name || "N/A";
  };

  const toggleExpand = (perID: string) => {
    setExpandedUser(expandedUser === perID ? null : perID);
  };

  const handleSendOffer = (perID: string, status: string) => {
    console.log(`Gửi ưu đãi cho ${perID} (${status})`);
  };

  const handleSort = (key: string) => {
    let direction = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    applyFilters(searchTerm, filterStatus, filterPurchaseCount);
  };

  const indexOfFirstUser = (currentPage - 1) * usersPerPage;
  
  const indexOfLastUser = currentPage * usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Layout>
        <div className="loading">Đang tải danh sách khách hàng...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="user-report">
        <div className="report">
          <div className="filter">
            <div className="wrapper">
              <FaSearch className="search" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                value={searchTerm}
                onChange={handleSearch}
                className="input"
              />
              {searchSuggestions.length > 0 && (
                <div className="suggestions">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <p>{suggestion.full_name} ({suggestion.phone_number})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select
              className="select"
              value={filterStatus}
              onChange={handleFilterStatus}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Diamond">VIP Kim cương</option>
              <option value="Gold">VIP Vàng</option>
              <option value="Loyal">Trung thành</option>
              <option value="Normal">Bình thường</option>
            </select>
            <select
              className="select"
              value={filterPurchaseCount}
              onChange={handleFilterPurchaseCount}
            >
              <option value="All">Tất cả số lần mua</option>
              <option value="0-2">0-2 lần</option>
              <option value="3-9">3-9 lần</option>
              <option value="10">10+ lần</option>
            </select>
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {filteredUsers.length === 0 ? (
          <div className="alert-info">Chưa có khách hàng nào</div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <div className="users-table">
                <div className="table-header">
                  <div className="column">STT</div>
                  <div className="column sortable" onClick={() => handleSort("full_name")}>
                    Tên {sortConfig?.key === "full_name" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                 
                  <div className="column sortable" onClick={() => handleSort("purchaseCount")}>
                    Số lần mua {sortConfig?.key === "purchaseCount" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                  <div className="column sortable" onClick={() => handleSort("lastPurchase")}>
                    Lần mua cuối {sortConfig?.key === "lastPurchase" && (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />)}
                  </div>
                  <div className="column">Sản phẩm gần nhất</div>
                  <div className="column">Trạng thái</div>
                  <div className="column"></div>
                </div>
                {currentUsers.map((user, index) => {
                  const userInvoices = invoices.filter((inv) => inv.perID === user.perID);
                  const purchaseCount = userInvoices.length;
                  const lastPurchase = userInvoices.sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  )[0]?.createdAt;
                  const status = getCustomerStatus(user);
                  const lastProduct = getLastProduct(user);
                  const isExpanded = expandedUser === user.perID;

                  return (
                    <React.Fragment key={user.perID}>
                      <div className="table-row" onClick={() => toggleExpand(user.perID)}>
                        <div className="column">{indexOfFirstUser + index + 1}</div>
                        <div className="column">{user.full_name}</div>
                        <div className="column">{purchaseCount}</div>
                        <div className="column">{lastPurchase ? formatDate(lastPurchase) : "N/A"}</div>
                        <div className="column">{lastProduct}</div>
                        <div className="column">
                          <span className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}>
                            {status === "Kim cương" && <FaGem className="gem-icon" />}
                            {status === "Kim cương" || status === "Vàng" ? <FaCrown className="crown-icon" /> : null}
                            {status}
                          </span>
                        </div>
                        <div className="column">
                          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="table-expand">
                          <div className="expand-content">
                            <p><strong>Liên hệ:</strong> {user.phone_number}</p>
                            <h5>Lịch sử mua hàng</h5>
                            {userInvoices.length > 0 ? (
                              userInvoices
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((inv, index) => (
                                  <p key={index}>
                                    {formatDate(inv.createdAt)} - {inv.product_name || "N/A"}
                                  </p>
                                ))
                            ) : (
                              <p>Chưa có đơn hàng nào</p>
                            )}
                            
                            {(status === "Kim cương" || status === "Vàng") && (
                              <div className="offer-container">
                                <button
                                  className="offer-btn"
                                  onClick={() => handleSendOffer(user.perID, status)}
                                >
                                  Gửi ưu đãi {status}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="use-pagination">
              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`page ${currentPage === index + 1 ? "active" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}