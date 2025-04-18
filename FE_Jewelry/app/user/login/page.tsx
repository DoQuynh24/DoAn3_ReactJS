"use client";
import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import "./styleLogin.css";

export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:4000/auth/login", {
        phone_number: phoneNumber,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        const userInfo = {
          full_name: response.data.full_name || "Người dùng",
          phone_number: phoneNumber,
          perID: response.data.perID,
          role: response.data.role,
        };
        localStorage.setItem("userInfo", JSON.stringify(userInfo));

        // Khôi phục danh sách yêu thích từ localStorage dựa trên perID
        const userFavouritesKey = `favouriteProducts_${response.data.perID}`;
        const storedFavourites = localStorage.getItem(userFavouritesKey);
        if (!storedFavourites) {
          localStorage.setItem(userFavouritesKey, JSON.stringify([]));
        }

        console.log("Navigating to:", response.data.role === "Admin" ? "/admin/products" : "/user/products");
        if (response.data.role === "Admin") {
          router.push("/admin/home");
        } else if (response.data.role === "Khách hàng") {
          router.push("/user/home");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với điều khoản dịch vụ!");
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/auth/register", {
        full_name: fullName,
        phone_number: phoneNumber,
        password,
      });

      if (response.data.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        setActiveTab("login");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  const handleForgotPassword = () => {
    alert("Vui lòng nhập số điện thoại để khôi phục mật khẩu!");
  };

  return (
    <div className="auth-page">
      <h1>Jewelry</h1>
      <div className="auth-container">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Đăng nhập
          </button>
          <button
            className={`tab-button ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "login" ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="input-group">
                <Image src="/images/user.png" alt="user" width={18} height={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  <Image
                    src={showLoginPassword ? "/images/eye-off.png" : "/images/eye.png"}
                    alt="toggle password"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
              <div className="forgot-password">
                <p className="forgot-password-link">
                  Bạn đã có tài khoản
                </p>
                <button type="button" onClick={handleForgotPassword} className="forgot-password-link">
                  Quên mật khẩu?
                </button>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="auth-button">
                ĐĂNG NHẬP
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-group">
                <Image src="/images/user.png" alt="user" width={18} height={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Image src="/images/phone_number.png" alt="phone" width={18} height={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <Image src="/images/password.png" alt="password" width={18} height={18} className="input-icon" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  <Image
                    src={showRegisterPassword ? "/images/eye-off.png" : "/images/eye.png"}
                    alt="toggle password"
                    width={18}
                    height={18}
                  />
                </button>
              </div>
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <label>Tôi đồng ý với <a href="/terms">điều khoản dịch vụ</a></label>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="auth-button">
                ĐĂNG KÝ
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}