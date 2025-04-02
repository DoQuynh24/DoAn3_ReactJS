"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Home = () => {
  const pathname = usePathname();

  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href="/admin">Admin</Link>
          </li>
          <li>
            <Link href="/admin/user">AdminUser</Link>
          </li>
          <li>
            <Link href="/admin/products">AdminProduct</Link>
          </li>
          <li>
            <Link href="/admin/home">AdminHome</Link>
          </li>
          <li>
            <Link href="/user">User</Link>
          </li>
          <li>
            <Link href="/user/products">Product</Link>  
          </li>
          <li>
          <Link href="/user/details/[productID]">Details</Link>
          </li>
          <li>
          <Link href="/user/components">components</Link>
          </li>
          <li>
          <Link href="/admin/components">Admincomponents</Link>
          </li>
        </ul>
      </nav>

      <div>
        <h1>🏠 Trang chủ</h1>
        <p>Chọn Admin, User hoặc Product để chuyển trang.</p>
        <p>📍 Đường dẫn hiện tại: {pathname}</p>
      </div>
    </div>
  );
};

export default Home;
