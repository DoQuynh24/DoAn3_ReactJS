"use client";
import React, { ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import "./styleAdmin.css";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";

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
interface UserInfo {
  full_name: string;
  phone_number: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname(); // Lấy URL hiện tại
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("/admin/home"); 

  useEffect(() => {
    setIsClient(true);
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      if (parsedUserInfo.role !== "Admin") {
        router.push("/user/login");
      }
    } else {
      router.push("/user/login");
    }
  }, [router]);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const openChatWithUser = (user: ChatUser) => {
    setCurrentChatUser(user);
    setShowChat(true);
  };

  const sendMessage = () => {
    if (newMessage.trim() !== "" && currentChatUser) {
      const updatedChat = {
        ...currentChatUser,
        messages: [...currentChatUser.messages, { sender: "admin", text: newMessage }],
      };
      setCurrentChatUser(updatedChat);
      setNewMessage("");
    }
  };

  const handleNavigation = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };
  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setUserInfo(null);
      router.push("/user/login");
    }
  };
  const navItems = [
    { path: "/admin/home", label: "Tổng quan" },
    { path: "/admin/products", label: "Sản phẩm" },
    { path: "/admin/invoices", label: "Hóa đơn" },
    { path: "/admin/import", label: "Nhập hàng" },
    { path: "/admin/user", label: "Người dùng" },
    { path: "/admin/notifications", label: "Thông báo" },
    { path: "/admin/store", label: "Cửa hàng" },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="brand">JEWELRY DASHBOARD</span>
          <span className="dashboard-date">
        {new Date().toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>

        </div>
        <div className="header-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-tab ${activeTab === item.path ? "active" : ""}`}
              onClick={() => handleNavigation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="header-right">
          <input type="text" value={userInfo?.full_name || "Chưa đăng nhập"} readOnly />
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <div className="dashboard-content">{children}</div>

      <button className="chat-btn" onClick={() => setShowChat(!showChat)}>
        <Image src="/images/chatbox.png" alt="chat" width={30} height={30} />
      </button>

      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            {currentChatUser ? (
              <>
                <button onClick={() => setCurrentChatUser(null)}>
                  <Image src="/images/back.png" alt="back" width={20} height={20} />
                </button>
                <span>{currentChatUser.name}</span>
              </>
            ) : (
              <span>Tin nhắn</span>
            )}
            <button onClick={() => setShowChat(false)}>✖</button>
          </div>
          <div className="chat-body">
            {currentChatUser ? (
              currentChatUser.messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  <span>{msg.text}</span>
                </div>
              ))
            ) : (
              <div className="chat-contacts">
                <div
                  className="contact"
                  onClick={() =>
                    openChatWithUser({
                      name: "Anh Quan",
                      messages: [{ sender: "user", text: "Chào shop nhaa, mình muốn tư vấn" }],
                    })
                  }
                >
                  <span className="contact-name">Anh Quan</span>
                  <span className="contact-msg">Chào shop nhaa, mình muốn tư vấn</span>
                </div>
                <div
                  className="contact"
                  onClick={() =>
                    openChatWithUser({
                      name: "Nguyễn Mai",
                      messages: [{ sender: "user", text: "Sản phẩm này còn hàng không shop?" }],
                    })
                  }
                >
                  <span className="contact-name">Nguyễn Mai</span>
                  <span className="contact-msg">Sản phẩm này còn hàng không shop?</span>
                </div>
                <div
                  className="contact"
                  onClick={() =>
                    openChatWithUser({
                      name: "Trần Bình",
                      messages: [{ sender: "user", text: "Mình muốn đặt đơn" }],
                    })
                  }
                >
                  <span className="contact-name">Trần Bình</span>
                  <span className="contact-msg">Mình muốn đặt đơn</span>
                </div>
              </div>
            )}
          </div>
          {currentChatUser && (
            <div className="chat-footer">
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button onClick={sendMessage}>
                <Image src="/images/send.png" alt="send" width={20} height={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Layout;