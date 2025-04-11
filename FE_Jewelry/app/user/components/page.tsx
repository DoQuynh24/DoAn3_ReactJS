"use client";
import Image from "next/image";
import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import "./styleComponent.css";
import io from "socket.io-client";

interface LayoutProps {
  children: ReactNode;
}

interface Message {
  sender: "user" | "admin" | string;
  text: string;
}

interface ChatUser {
  name: string;
  messages: Message[];
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: { materialID: number; material_name?: string; price: number }[];
  images: { imageURL: string; is_main: number }[];
}

interface UserInfo {
  full_name: string;
  phone_number: string;
  role: "Khách hàng" | "Admin";
}

const socket = io("http://localhost:4000");

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const storedFavourites = localStorage.getItem("favouriteProducts");
    if (storedFavourites) {
      setFavouriteProducts(JSON.parse(storedFavourites));
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      socket.emit("joinRoom", parsedUserInfo.full_name);
    }

    const storedChat = localStorage.getItem("userChat");
    if (storedChat) {
      setCurrentChatUser(JSON.parse(storedChat));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("favouriteProducts", JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient]);

  useEffect(() => {
    socket.on("receiveMessage", (data: { sender: string; text: string; userName: string }) => {
      if (currentChatUser) {
        const updatedChat = {
          ...currentChatUser,
          messages: [...currentChatUser.messages, { sender: data.sender, text: data.text }],
        };
        setCurrentChatUser(updatedChat);
        localStorage.setItem("userChat", JSON.stringify(updatedChat));
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [currentChatUser]);

  const toggleChat = () => {
    if (!showChat && !currentChatUser && userInfo) {
      // Nếu chat chưa mở và chưa có currentChatUser, khởi tạo chat
      const userChat: ChatUser = {
        name: "Admin",
        messages: [
          {
            sender: "admin",
            text: `Xin chào ${userInfo?.full_name}, bạn cần đội ngũ Jewelry tư vấn?`,
          },
        ],
      };
      setCurrentChatUser(userChat);
      localStorage.setItem("userChat", JSON.stringify(userChat));
      if (userInfo) {
        socket.emit("joinRoom", userInfo.full_name);
      }
    }
    // Toggle trạng thái showChat (mở nếu đang đóng, đóng nếu đang mở)
    setShowChat((prev) => !prev);
  };

  const sendMessage = () => {
    if (newMessage.trim() !== "" && currentChatUser && userInfo) {
      const messageData = {
        sender: "user",
        text: newMessage,
        userName: userInfo.full_name,
        room: userInfo.full_name,
      };
      socket.emit("sendMessage", messageData);
      setNewMessage("");
    }
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setUserInfo(null);
      setIsUserPanelOpen(false);
      router.push("/user/login");
    }
  };

  const handleChangePassword = async () => {
    setError("");
    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword) {
      setError("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:4000/auth/change-password",
        {
          phone_number: userInfo?.phone_number,
          old_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        alert("Thay đổi mật khẩu thành công!");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Thay đổi mật khẩu thất bại");
    }
  };

  const handleViewInvoices = () => {
    router.push("/user/invoices");
  };

  if (!isClient) {
    return null;
  }

  return (
    <div>
      <div id="main">
        <div id="top-bar">
          <div className="left">
            <span>
              <Image src="/images/location.png" alt="location" width={25} height={25} />
            </span>
            <span>
              <Image src="/images/fb.png" alt="fb" width={30} height={30} />
            </span>
            <span>
              <Image src="/images/phone.png" alt="phone" width={30} height={30} />
            </span>
            <span>0364 554 001</span>
          </div>
          <div className="center">
            <Image src="/images/logo.png" alt="logo" width={200} height={100} />
          </div>
          <div className="right">
            <span className="heart-icon">
              <Link href="/user/favourite">
                <Image src="/images/heart.png" alt="heart" width={25} height={25} />
                {favouriteProducts.length > 0 && (
                  <span className="favourite-count">{favouriteProducts.length}</span>
                )}
              </Link>
            </span>
            <span>
              <Image
                src="/images/bill-order.png"
                alt="bill-order"
                width={27}
                height={27}
                onClick={handleViewInvoices}
                style={{ cursor: "pointer" }}
              />
            </span>
            <span>
              <Image
                id="userIcon"
                src="/images/user.png"
                alt="user"
                width={27}
                height={27}
                onClick={() => setIsUserPanelOpen(!isUserPanelOpen)}
              />
            </span>
            <span>VI | EN</span>
          </div>
        </div>

        <div className={`user-panel ${isUserPanelOpen ? "open" : ""}`}>
          <div className="user-panel-content">
            <p>TÀI KHOẢN CỦA TÔI</p>
            <button className="close-btn" onClick={() => setIsUserPanelOpen(false)}>
              <Image src="/images/right.png" alt="right" width={20} height={20} />
            </button>
          </div>
          <div className="user-info-form">
            <div className="form-group">
              <label>
                Tài khoản <span className="required">*</span>
              </label>
              <input type="text" value={userInfo?.phone_number || "Chưa đăng nhập"} readOnly />
            </div>
            <div className="form-group">
              <label>
                Tên hiển thị <span className="required">*</span>
              </label>
              <input type="text" value={userInfo?.full_name || "Chưa đăng nhập"} readOnly />
            </div>
            <p style={{ textAlign: "center" }}>Thay đổi mật khẩu</p>
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                placeholder="Mật khẩu hiện tại"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
            <button className="logout" onClick={handleLogout}>
              <Image src="/images/logout.png" alt="logout" width={20} height={20} />
              <span style={{ paddingLeft: "10px", fontSize: "14px" }}>Đăng xuất</span>
            </button>
            <button className="save-btn" onClick={handleChangePassword}>
              LƯU THAY ĐỔI
            </button>
          </div>
        </div>

        <div id="header">
          <nav className="menu">
            <div className="menu-item">
              <a href="#">Nhẫn cầu hôn</a>
              <div className="dropdown">
                <a href="#">Nhẫn Kim Cương</a>
                <a href="#">Nhẫn Đá Quý</a>
                <a href="#">Nhẫn Vàng</a>
              </div>
            </div>
            <div className="menu-item">
              <a href="#">Nhẫn cưới</a>
              <div className="dropdown">
                <a href="#">Nhẫn Cặp</a>
                <a href="#">Nhẫn Vàng Trắng</a>
              </div>
            </div>
            <div className="menu-item">
              <a href="#">Trang sức</a>
              <div className="dropdown">
                <a href="#">Bông Tai</a>
                <a href="#">Dây Chuyền</a>
                <a href="#">Lắc Tay</a>
              </div>
            </div>
            <div className="menu-item">
              <a href="#">Kim Cương</a>
              <div className="dropdown">
                <a href="#">Kim Cương Tự Nhiên</a>
                <a href="#">Kim Cương Nhân Tạo</a>
              </div>
            </div>
            <div className="menu-item">
              <a href="#">Men’s</a>
              <div className="dropdown">
                <a href="#">Nhẫn Nam</a>
                <a href="#">Dây Chuyền Nam</a>
              </div>
            </div>
            <div className="menu-item">
              <a href="#">Khuyến mãi</a>
            </div>
            <div className="menu-item">
              <a href="#">Tin tức</a>
            </div>
          </nav>
          <div className="search-box">
            <Image src="/images/search.png" alt="search" width={20} height={20} className="search-icon" />
            <input type="text" placeholder="Tìm kiếm nhanh..." />
          </div>
        </div>
      </div>

      <div id="content">{children}</div>
      <button id="chat" onClick={toggleChat}>
        <Image src="/images/chatbox.png" alt="chat" width={43} height={40} />
      </button>
      {showChat && (
        <div id="chat-box">
          <div id="chat-header">
            <ul>
              <li style={{ fontSize: "28px" }}>Jewelry</li>
              <li style={{ fontSize: "13px", paddingLeft: "3px" }}>Natural Diamond Jewelry</li>
            </ul>
            <button onClick={() => setShowChat(false)}>✖</button>
          </div>
          <div className="chat-messages">
            {currentChatUser?.messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
            />
            <button onClick={sendMessage}>
              <Image src="/images/send.png" alt="send" width={20} height={20} />
            </button>
          </div>
        </div>
      )}
      <div id="footer">
        <div>
          <ul className="link">
            <li>
              <a href="https://www.facebook.com/ddquynh.24">Facebook</a>
            </li>
            <li>
              <a href="#">Instagram</a>
            </li>
            <li>
              <a href="#">Tiktok</a>
            </li>
            <li>
              <a>x</a>
            </li>
            <li>
              <a href="#">Spotify</a>
            </li>
            <li>
              <a href="#">Threads</a>
            </li>
            <li>
              <a href="#">Zalo</a>
            </li>
          </ul>
        </div>
        <div style={{ display: "flex" }}>
          <div className="lienhe">
            <ul className="noidung">
              <li style={{ fontSize: "15px" }}>
                <b>CÔNG TY</b>
              </li>
              <br />
              <ul>
                <li>
                  <a href="#">Giới thiệu về chúng tôi</a>
                </li>
                <li>268Đ, Quận Cầu Giấy, Hà Nội, Vietnam</li>
                <li>0364554001 - Thứ 2 - Chủ nhật: 9:00 - 18:00</li>
                <li>sullybagVN.vn@gmail.com</li>
              </ul>
            </ul>
          </div>
          <div className="lienhe">
            <ul className="noidung">
              <li style={{ fontSize: "15px" }}>
                <b>THEO DÕI CHÚNG TÔI</b>
              </li>
              <br />
              <li>
                <a href="https://www.facebook.com/ddquynh.24">Facebook</a>
              </li>
              <li>
                <a href="#">Instagram</a>
              </li>
              <li>
                <a href="#">Tiktok</a>
              </li>
              <li>
                <a>x</a>
              </li>
              <li>
                <a href="#">Spotify</a>
              </li>
              <li>
                <a href="#">Threads</a>
              </li>
              <li>
                <a href="#">Zalo</a>
              </li>
            </ul>
          </div>
          <div className="lienhe">
            <ul className="noidung">
              <li style={{ fontSize: "15px" }}>
                <b>CHÍNH SÁCH</b>
              </li>
              <br />
              <li>
                <a href="#">Chính sách bảo mật</a>
              </li>
              <li>
                <a href="#">Điều kiện mua hàng</a>
              </li>
              <li>
                <a href="#">Cài đặt Cookie</a>
              </li>
            </ul>
          </div>
          <div className="lienhe">
            <div className="noidung">
              <p style={{ fontSize: "15px" }}>
                <b>KẾT NỐI VỚI JEWELRY</b>
              </p>
              <br />
              <div>
                <Image src="/images/logo.png" alt="logo" width={170} height={100} />
              </div>
              <div className="menu-icons">
                <Image className="icon" src="/images/fb.png" alt="Facebook" width={20} height={20} />
                <Image className="icon" src="/images/ins.png" alt="Instagram" width={20} height={20} />
                <Image className="icon" src="/images/tiktok.png" alt="TikTok" width={20} height={20} />
                <Image className="icon" src="/images/git.png" alt="GitHub" width={20} height={20} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;