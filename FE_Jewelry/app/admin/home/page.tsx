"use client";
import React from "react";
import Layout from "../components/page";
import Image from "next/image";
import "./styleHome.css";

export default function AdminHome() {
  return (
    <Layout>
      <div className="stats-row">
        <div className="stat-card">
          <Image src="/images/ring.png" alt="products" width={24} height={24} />
          <div>
            <span className="stat-value">5</span>
            <p>Sản phẩm</p>
          </div>
        </div>
        <div className="stat-card">
          <Image src="/images/bill.png" alt="invoices" width={24} height={24} />
          <div>
            <span className="stat-value">430,000</span>
            <p>Hóa đơn</p>
          </div>
        </div>
        <div className="stat-card">
          <Image src="/images/notification.png" alt="notifications" width={24} height={24} />
          <div>
            <span className="stat-value">0</span>
            <p>Thông báo</p>
          </div>
        </div>
        <div className="stat-card">
          <Image src="/images/user.png" alt="users" width={24} height={24} />
          <div>
            <span className="stat-value">430,000</span>
            <p>Người dùng</p>
          </div>
        </div>
        <div className="stat-card">
          <Image src="/images/home.png" alt="store" width={24} height={24} />
          <div>
            <span className="stat-value">0 / 31</span>
            <p>Cửa hàng</p>
          </div>
        </div>
      </div>

      <div className="main-sections">
        <div className="left-section">
          <div className="chart-card">
            <h3>Doanh thu sản phẩm</h3>
            <div className="chart-placeholder">
              <p>Biểu đồ doanh thu (sẽ được thêm sau)</p>
            </div>
          </div>
          <div className="video-card">
            <h3>Video khác</h3>
            <p>Video quảng bá sản phẩm mới</p>
            <div className="video-placeholder">
              <p>Video placeholder</p>
            </div>
          </div>
        </div>
        <div className="right-section">
          <div className="contact-card">
            <h3>Hotline: 1900 4515</h3>
            <button className="app-btn">Tải ứng dụng</button>
            <button className="market-btn">Android Market</button>
          </div>
          <div className="activity-card">
            <h3>Hoạt động gần đây</h3>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-dot"></span>
                <p>Admin đặt bán sản phẩm với giá 110,000</p>
                <span className="activity-time">0 giây trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot"></span>
                <p>Admin đặt bán sản phẩm với giá 130,000</p>
                <span className="activity-time">0 giây trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot"></span>
                <p>Admin đặt bán sản phẩm với giá 170,000</p>
                <span className="activity-time">0 giây trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot"></span>
                <p>Admin đặt bán sản phẩm với giá 125,000</p>
                <span className="activity-time">0 giây trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot"></span>
                <p>Admin đặt bán sản phẩm với giá 95,000</p>
                <span className="activity-time">0 giây trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}