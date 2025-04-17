"use client";
import Image from "next/image";
import React, { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  perID: number;
}

interface Category {
  categoryID: number;
  category_name: string;
}

interface Material {
  materialID: number;
  material_name: string;
}

const socket = io("http://localhost:4000");

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showChat, setShowChat] = useState(false);
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [favouriteProducts, setFavouriteProducts] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      const parsedUserInfo: UserInfo = JSON.parse(storedUserInfo);
      setUserInfo(parsedUserInfo);
      socket.emit("joinRoom", parsedUserInfo.full_name);

      const userFavouritesKey = `favouriteProducts_${parsedUserInfo.perID}`;
      const storedFavourites = localStorage.getItem(userFavouritesKey);
      if (storedFavourites) {
        setFavouriteProducts(JSON.parse(storedFavourites));
      }
    }
  }, []);

  useEffect(() => {
    if (isClient && userInfo) {
      const userFavouritesKey = `favouriteProducts_${userInfo.perID}`;
      localStorage.setItem(userFavouritesKey, JSON.stringify(favouriteProducts));
    }
  }, [favouriteProducts, isClient, userInfo]);

  useEffect(() => {
    axios
      .get("http://localhost:4000/categories")
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Dữ liệu danh mục không phải mảng:", data);
          setCategories([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh mục:", error);
        setCategories([]);
      });

    axios
      .get("http://localhost:4000/materials")
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          console.error("Dữ liệu chất liệu không phải mảng:", data);
          setMaterials([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi lấy chất liệu:", error);
        setMaterials([]);
      });
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (data: { sender: string; text: string; userName: string }) => {
      console.log("User received message:", data);
      if (currentChatUser && userInfo && data.userName === userInfo.full_name && data.sender !== "user") {
        const updatedChat = {
          ...currentChatUser,
          messages: [...currentChatUser.messages, { sender: data.sender, text: data.text }],
        };
        setCurrentChatUser(updatedChat);
        const userChatKey = `chat_${userInfo.perID}`;
        localStorage.setItem(userChatKey, JSON.stringify(updatedChat));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [currentChatUser, userInfo]);

  const toggleChat = () => {
    if (!showChat && !currentChatUser && userInfo) {
      const userChatKey = `chat_${userInfo.perID}`;
      const storedChat = localStorage.getItem(userChatKey);
      let userChat: ChatUser;
      if (storedChat) {
        userChat = JSON.parse(storedChat);
      } else {
        userChat = {
          name: "Admin",
          messages: [
            {
              sender: "admin",
              text: `Xin chào ${userInfo.full_name}, bạn cần đội ngũ Jewelry tư vấn?`,
            },
          ],
        };
        localStorage.setItem(userChatKey, JSON.stringify(userChat));
      }
      setCurrentChatUser(userChat);
      socket.emit("joinRoom", userInfo.full_name);
    }
    setShowChat((prev) => !prev);
  };

  const sendMessage = () => {
    if (newMessage.trim() === "" || isSending || !currentChatUser || !userInfo) return;

    console.log("User sending message:", newMessage);
    setIsSending(true);
    const messageData = {
      sender: "user",
      text: newMessage,
      userName: userInfo.full_name,
      room: userInfo.full_name,
    };
    socket.emit("sendMessage", messageData);

    const updatedChat = {
      ...currentChatUser,
      messages: [...currentChatUser.messages, { sender: "user", text: newMessage }],
    };
    setCurrentChatUser(updatedChat);
    const userChatKey = `chat_${userInfo.perID}`;
    localStorage.setItem(userChatKey, JSON.stringify(updatedChat));

    setNewMessage("");
    setIsSending(false);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      if (userInfo) {
        const userChatKey = `chat_${userInfo.perID}`;
        const userFavouritesKey = `favouriteProducts_${userInfo.perID}`;
        localStorage.removeItem(userChatKey);
        socket.emit("userLogout", userInfo.full_name);
      }
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      
      setUserInfo(null);
      setFavouriteProducts([]);
      setCurrentChatUser(null);
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

  const groupedCategories = () => {
    const mainCategories = categories.filter(
      (cat) => !["Nhẫn nam", "Nhẫn nữ"].includes(cat.category_name)
    );
    const subCategories: { [key: string]: Category[] } = {
      Nhẫn: categories.filter((cat) =>
        ["Nhẫn nam", "Nhẫn nữ"].includes(cat.category_name)
      ),
    };
    return { mainCategories, subCategories };
  };

  const { mainCategories, subCategories } = groupedCategories();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("query", searchQuery);
    } else {
      params.delete("query");
    }

    let newUrl = pathname;
    if (params.toString()) {
      newUrl = `${pathname}?${params.toString()}`;
    }

    router.replace(newUrl, { scroll: false });
  }, [searchQuery, pathname, router, searchParams]);

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
            <Link href="/user/home">
              <Image src="/images/logo.png" alt="Logo" width={200} height={100} />
            </Link>
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
              <Link href="/user/products">Tất cả </Link>
            </div>
            {mainCategories.map((categorie) => (
              <div key={categorie.categoryID} className="menu-item-wrapper">
                <div className="menu-item">
                  <Link href={`/user/categorie/${categorie.categoryID}`}>
                    {categorie.category_name}
                  </Link>
                </div>
                <div className="dropdown-container">
                  <div className="dropdown-content">
                    {subCategories[categorie.category_name]?.length > 0 &&
                      subCategories[categorie.category_name].map((subCat) => (
                        <Link
                          key={subCat.categoryID}
                          href={`/user/categorie/${subCat.categoryID}`}
                        >
                          {subCat.category_name}
                        </Link>
                      ))}
                    {materials.map((material) => (
                      <Link
                        key={material.materialID}
                        href={`/user/categorie/${categorie.categoryID}?material=${material.materialID}`}
                      >
                        {`${categorie.category_name} ${material.material_name}`}
                      </Link>
                    ))}
                    {categorie.category_name === "Kim Cương" && (
                      <>
                        <Link href={`/user/categorie/${categorie.categoryID}?type=natural`}>
                          Kim Cương Tự Nhiên
                        </Link>
                        <Link href={`/user/categorie/${categorie.categoryID}?type=lab-grown`}>
                          Kim Cương Nhân Tạo
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="menu-item">
              <Link href="/news">Tin tức</Link>
            </div>
          </nav>
          <div className="search-box">
            <Image
              src="/images/search.png"
              alt="search"
              width={20}
              height={20}
              className="search-icon"
            />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
              disabled={isSending}
            />
            <button onClick={sendMessage} disabled={isSending}>
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