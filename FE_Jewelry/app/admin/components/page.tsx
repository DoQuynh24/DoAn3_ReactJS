"use client";
import React, { ReactNode, useState, useEffect } from "react";
import Image from "next/image";
import "./styleAdmin.css";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
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

interface UserInfo {
  full_name: string;
  phone_number: string;
  role: "Khách hàng" | "Admin";
}

const socket = io("http://localhost:4000");

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("/admin/home");
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);

  useEffect(() => {
    setIsClient(true);
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      if (parsedUserInfo.role !== "Admin") {
        router.push("/user/login");
      } else {
        socket.emit("joinAdmin");
        console.log("Admin joined adminRoom");

        const storedChats = localStorage.getItem("adminChats");
        if (storedChats) {
          try {
            const chats: ChatUser[] = JSON.parse(storedChats);
            setChatUsers(chats);
            chats.forEach((chat: ChatUser) => {
              socket.emit("joinRoom", chat.name);
              console.log(`Admin rejoined room: ${chat.name}`);
            });
            console.log("Restored adminChats:", chats);
          } catch (e) {
            console.error("Error parsing adminChats:", e);
            setChatUsers([]);
          }
        }
      }
    } else {
      router.push("/user/login");
    }
  }, [router]);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  useEffect(() => {
    const handleReceiveMessage = (data: { sender: string; text: string; userName: string }) => {
      console.log("Admin received message:", data);
      if (data.sender === "user") {
        setChatUsers((prev) => {
          const existingUser = prev.find((u) => u.name === data.userName);
          let updatedChats: ChatUser[];
          if (existingUser) {
            updatedChats = prev.map((u) =>
              u.name === data.userName
                ? { ...u, messages: [...u.messages, { sender: data.sender, text: data.text }] }
                : u
            );
          } else {
            updatedChats = [
              ...prev,
              { name: data.userName, messages: [{ sender: data.sender, text: data.text }] },
            ];
            socket.emit("joinRoom", data.userName);
          }
          localStorage.setItem("adminChats", JSON.stringify(updatedChats));
          return updatedChats;
        });

        if (currentChatUser && currentChatUser.name === data.userName) {
          setCurrentChatUser((prev) => ({
            ...prev!,
            messages: [...prev!.messages, { sender: data.sender, text: data.text }],
          }));
        }
      }
    };

    const handleUserLogout = (userName: string) => {
      setChatUsers((prev) => {
        const updatedChats = prev.filter((u) => u.name !== userName);
        localStorage.setItem("adminChats", JSON.stringify(updatedChats));
        return updatedChats;
      });
      if (currentChatUser && currentChatUser.name === userName) {
        setCurrentChatUser(null);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("userLogout", handleUserLogout);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("userLogout", handleUserLogout);
    };
  }, [currentChatUser]);

  const openChatWithUser = (user: ChatUser) => {
    setCurrentChatUser(user);
    socket.emit("joinRoom", user.name);
    setShowChat(true);
  };

  const sendMessage = () => {
    if (newMessage.trim() === "" || isSending || !currentChatUser) return;

    console.log("Admin sending message:", newMessage);
    setIsSending(true);
    const messageData = {
      sender: "admin",
      text: newMessage,
      userName: currentChatUser.name,
      room: currentChatUser.name,
    };
    socket.emit("sendMessage", messageData);

    setChatUsers((prev) => {
      const updatedChats = prev.map((u) =>
        u.name === currentChatUser.name
          ? { ...u, messages: [...u.messages, { sender: "admin", text: newMessage }] }
          : u
      );
      localStorage.setItem("adminChats", JSON.stringify(updatedChats));
      return updatedChats;
    });
    setCurrentChatUser((prev) => ({
      ...prev!,
      messages: [...prev!.messages, { sender: "admin", text: newMessage }],
    }));

    setNewMessage("");
    setIsSending(false);
  };

  const handleNavigation = (path: string) => {
    setActiveTab(path);
    router.push(path);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      console.log("Logging out, removing localStorage: userInfo, token");
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      setUserInfo(null);
      setChatUsers([]);
      setCurrentChatUser(null);
      router.push("/user/login");
    }
  };

  const getLastMessagePreview = (user: ChatUser) => {
    const lastMessage = user.messages[user.messages.length - 1];
    if (lastMessage.sender === "admin") {
      return `Bạn: ${lastMessage.text}`;
    }
    return lastMessage.text;
  };

  const navItems = [
    { path: "/admin/home", label: "Tổng quan" },
    { path: "/admin/products", label: "Sản phẩm" },
    { path: "/admin/invoices", label: "Hóa đơn" },
    { path: "/admin/import", label: "Nhập hàng" },
    { path: "/admin/users", label: "Khách hàng" },
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
              <ul>
                <li style={{ fontSize: "28px" }}>Jewelry</li>
                <li style={{ fontSize: "13px" }}>Natural Diamond Jewelry</li>
              </ul>
            )}
            <button onClick={() => setShowChat(false)}>✖</button>
          </div>
          <div className="chat-body">
            {currentChatUser ? (
              <div className="chat-messages">
                {currentChatUser.messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.sender}`}>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chat-contacts">
                {chatUsers.map((user, index) => (
                  <div key={index} className="contact" onClick={() => openChatWithUser(user)}>
                    <span className="contact-name">{user.name}</span>
                    <span className="contact-msg">{getLastMessagePreview(user)}</span>
                  </div>
                ))}
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
                disabled={isSending}
              />
              <button onClick={sendMessage} disabled={isSending}>
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