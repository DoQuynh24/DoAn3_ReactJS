"use client";
import Image from "next/image";
import React, { ReactNode ,useState, useEffect } from "react";
import "./style.css";

import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

interface LayoutProps {
  children: ReactNode;
}
interface Message {
  sender: "user" | "admin" | string; // Cho phép `string` để tránh lỗi
  text: string;
}

interface ChatUser {
  name: string;
  messages: Message[]; // Chứa danh sách tin nhắn
}
interface Province {
  code: number;
  name: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [showChat, setShowChat] = useState(false);
    const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
    const [newMessage, setNewMessage] = useState("");
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
  const [showAd, setShowAd] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

 
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/")
      .then((response) => response.json())
      .then((data: Province[]) => {
        console.log("Dữ liệu tỉnh:", data);
        setProvinces(data);
      })
      .catch((error) => console.error("Lỗi khi tải danh sách tỉnh thành:", error));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAd(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, [showAd]);

  const toggleAccordion = (index: number) => {
    setOpenAccordion(openAccordion === index ? null : index);
  };

  return (  
    <div>
      <div id="main">
      <div id="top-bar">
        <div className="left">
          <span>
            <Image src="/images/location.png" alt="location" width={20} height={25} />
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
          <span>
            <Image src="/images/heart.png" alt="heart" width={25} height={25} />
          </span>
          <span>
            <Image src="/images/user.png" alt="user" width={25} height={30} />
          </span>
          <span>VI | EN</span>
        </div>
      </div>

      {/* Header */}
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

        {/* Search Box */}
        <div className="search-box">
          <input type="text" placeholder="Tìm kiếm nhanh" />
          <button className="search-icon">
            <Image src="/images/search.png" alt="search" width={25} height={25} />
          </button>
        </div>
      </div>
      </div>

      {/* Nội dung riêng của từng trang */}
      <div id="content">{children}</div>
      <button id="chat"  onClick={() => setShowChat(!showChat)} >
              <Image src="/images/chatbox.png" alt="chat" width={40} height={40} />
            </button>
            {showChat && (
            <div id="chat-box">
              <div id="chat-header">
               {currentChatUser ? (
                <>
                <button onClick={() => setCurrentChatUser(null)}><Image src="/images/back.png" alt="send" width={25} height={25}/></button>
                <p>{currentChatUser.name}</p>
              </>
               ) : (
                <ul>
                  <li style={{  fontSize:"20px"}}> 
                   Jewelry 
                  </li>
                  <li style={{  fontSize:"13px"}}>Natural Diamond Jewelry</li>
                </ul>
                
              )}
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
                 <button onClick={sendMessage}><Image src="/images/send.png" alt="send" width={20} height={20}/></button>
              </div>
            </div>
            )}
      <div id="footer">
        <div>
          <ul className="link">
            <li><a href="https://www.facebook.com/ddquynh.24">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Tiktok</a></li>
            <li><a>x</a></li>
            <li><a href="#">Spotify</a></li>
            <li><a href="#">Threads</a></li>
            <li><a href="#">Zalo</a></li>
          </ul>
        </div>
        <div style={{ display:"flex" }}>
           <div className="lienhe">
              <ul className="noidung">
                <li style={{ fontSize: "15px" }}><b>CÔNG TY</b></li>
                <br />
                <ul>
                  <li><a href="#">Giới thiệu về chúng tôi</a></li>
                  <li>268Đ, Quận Cầu Giấy, Hà Nội, Vietnam</li>
                  <li>0364554001 - Thứ 2 - Chủ nhật: 9:00 - 18:00</li>
                  <li>sullybagVN.vn@gmail.com</li>
                </ul>
              </ul>
          </div>
    
          <div className="lienhe">
              <ul className="noidung">
                <li style={{ fontSize: "15px" }}><b>THEO DÕI CHÚNG TÔI</b></li>
                <br />
                <li><a href="https://www.facebook.com/ddquynh.24">Facebook</a></li>
                <li><a href="#">Instagram</a></li>
                <li><a href="#">Tiktok</a></li>
                <li><a>x</a></li>
                <li><a href="#">Spotify</a></li>
                <li><a href="#">Threads</a></li>
                <li><a href="#">Zalo</a></li>
              </ul>
          </div>
    
          <div className="lienhe">
              <ul className="noidung">
                <li style={{ fontSize: "15px" }}><b>CHÍNH SÁCH</b></li>
                <br />
                <li><a href="#">Chính sách bảo mật</a></li>
                <li><a href="#">Điều kiện mua hàng</a></li>
                <li><a href="#">Cài đặt Cookie</a></li>
              </ul>
          </div>
    
          <div className="lienhe">
            <div className="noidung">
                <p style={{ fontSize: "15px" }}><b>KẾT NỐI VỚI JEWELRY</b></p>
                <br />
                <div className="center">
                   <Image src="/images/logo.png" alt="logo" width={200} height={200}/>
                </div>
                <div className="menu-icons">
                  <Image className="icon" src="/images/fb.png" alt="Facebook"  width={20} height={20}/> 
                  <Image className="icon" src="/images/ins.png" alt="Instagram" width={20} height={20}/>
                  <Image className="icon" src="/images/tiktok.png" alt="TikTok" width={20} height={20}/>
                  <Image className="icon" src="/images/git.png" alt="GitHub" width={20} height={20}/>
                </div>
            </div>
          </div>   
        </div>
      </div>   
    </div>
  );
};

export default Layout;
