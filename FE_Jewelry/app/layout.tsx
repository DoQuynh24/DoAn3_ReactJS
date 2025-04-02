"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); // Lấy đường dẫn trang hiện tại

  useEffect(() => {
    let title = "Jewelry.VN"; // Tiêu đề mặc định
    switch (pathname) {
      case "/":
        title = "Trang Chủ - Jewerly.vn";
        break;  
      case "/admin/home":
        title = " Trang chủ | Jewerly.vn";
        break;
      case "/admin/products":
        title = " Quản lý sản phẩm | Jewerly.vn";
        break;
      case "/admin/invoices":
        title = " Quản lý hóa đơn | Jewerly.vn";
        break;
      case "/user/favourite":
        title = "Whistlist | Natural Diamond";
        break;
      case "/user/details/[productID]":
        title = "BST Nhẫn cưới vàng 14K, 18K, Kim cương thiết kế 2025";
        break;
      case "/user/orders":
        title = "Đặt hàng | Natural Diamond";
        break;
        case "/user/invoices":
          title = "Tra cứu đơn hàng | Natural Diamond";
          break;
      case "/user/products":
        title = " Natural Diamond | Trang sức kim cương cao cấp";
        break;
      default:
        title = "Trang quản trị Jewerly.vn";
    }
    document.title = title;
  }, [pathname]);

  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}