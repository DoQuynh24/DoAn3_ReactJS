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

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname(); // Lấy URL hiện tại
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("/admin/home"); // Mặc định là Home

  // Đồng bộ activeTab với URL hiện tại
  useEffect(() => {
    setActiveTab(pathname); // Cập nhật activeTab khi pathname thay đổi
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
          <span className="brand">Jewelry Dashboard</span>
          <p className="dashboard-date">
        {new Date().toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

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
          <span>Đỗ Quỳnh</span>
          <button className="logout-btn" onClick={() => router.push("/logout")}>
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