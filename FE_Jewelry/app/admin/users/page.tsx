"use client";
import React, { useState, useEffect } from "react"; 
import Layout from "../components/page";
import axios from "axios";
import Image from "next/image";
import "./style.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface User{

}
export default function AdminUser() {
const [users, setUsers] = useState<User[]>([]);
    useEffect(() => {
    axios.get("http://localhost:4000/users") // Gọi API danh sách sản phẩm
      .then((response) => {
        console.log("Dữ liệu API:", response.data); // Debug kiểm tra dữ liệu
        setUsers(response.data.data); // Nếu API trả về object chứa products

      })
      .catch((error) => console.error("Lỗi gọi API:", error));
  }, []);

  return (
    <Layout>
        <div>
            <h2>Danh sách người dùng</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên</th>
                  <th>Vai trò</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: "Đỗ Quỳnh", role: "Admin" },
                  { id: 2, name: "Anh Quan", role: "Khách hàng" },
                  { id: 3, name: "Nguyễn Mai", role: "Khách hàng" }
                ].map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
    </Layout>
  );
}
