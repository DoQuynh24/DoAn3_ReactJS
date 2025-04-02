"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/page";
import Image from "next/image";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import "./styleProducts.css";
import "bootstrap/dist/css/bootstrap.min.css";

interface Category {
  categoryID: number;
  category_name: string;
}

interface Material {
  materialID: number;
  material_name?: string;
  price: number;
}

interface Image {
  imageURL: string;
  is_main: number;
}

interface Product {
  productID?: string;
  product_name: string;
  categoryID: number;
  style: string;
  stock: number;
  description: string;
  materials: Material[];
  images: Image[];
}

export default function AdminProduct() {
  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // Trạng thái để lưu danh sách sản phẩm được chọn
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    product_name: "",
    categoryID: 1,
    style: "",
    stock: 0,
    description: "",
    materials: [{ materialID: 1, price: 0 }],
    images: [],
  });
  const [newCategory, setNewCategory] = useState({ category_name: "" });
  const [newMaterial, setNewMaterial] = useState({ material_name: "", price: 0 });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:4000/products")
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          const formattedData = data.map((product: Product) => ({
            ...product,
            images: product.images.map((img: Image) => ({
              ...img,
              imageURL: img.imageURL
                ? img.imageURL.startsWith("/")
                  ? `http://localhost:4000${img.imageURL}`
                  : img.imageURL
                : "/images/addImage.png",
            })),
          }));
          setProducts(formattedData);
        } else {
          console.error("Dữ liệu sản phẩm không phải mảng:", data);
          setProducts([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi gọi API:", error);
        setProducts([]);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:4000/materials")
      .then((response) => {
        const data = response.data.data || response.data || [];
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          console.error("Dữ liệu vật liệu không phải mảng:", data);
          setMaterials([]);
        }
      })
      .catch((error) => {
        console.error("Lỗi gọi API vật liệu:", error);
        setMaterials([]);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://localhost:4000/categories")
      .then((response) => setCategories(response.data.data))
      .catch((error) => console.error("Lỗi gọi API danh mục:", error));
  }, []);

  const handleShowDetail = (product: Product) => {
    axios
      .get(`http://localhost:4000/products/${product.productID}`)
      .then((response) => {
        const detailedProduct = response.data.data;
        const formattedProduct = {
          ...detailedProduct,
          images: detailedProduct.images.map((img: Image) => ({
            ...img,
            imageURL: img.imageURL
              ? img.imageURL.startsWith("/")
                ? `http://localhost:4000${img.imageURL}`
                : img.imageURL
              : "/images/default.png",
          })),
        };
        setCurrentProduct(formattedProduct);
        setNewProduct(formattedProduct); // Set newProduct for editing
        setImageFiles([]); // Reset image files for editing
        setMainImageIndex(formattedProduct.images.findIndex((img: Image) => img.is_main === 1));
        setShowModal(true);
      })
      .catch((error) => console.error("Lỗi khi lấy chi tiết sản phẩm:", error));
  };

  const handleShowAddProduct = () => {
    const defaultCategoryID = selectedCategory || categories[0]?.categoryID || 1;
    setNewProduct({
      product_name: "",
      categoryID: defaultCategoryID,
      style: "",
      stock: 0,
      description: "",
      materials: [{ materialID: 1, price: 0 }],
      images: [],
    });
    setImageFiles([]);
    setMainImageIndex(0);
    setCurrentProduct(null);
    setShowModal(true);
  };

  const handleShowAddCategory = () => {
    setNewCategory({ category_name: "" });
    setShowCategoryModal(true);
  };

  const handleShowAddMaterial = () => {
    setNewMaterial({ material_name: "", price: 0 });
    setShowMaterialModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "categoryID" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleMaterialChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setNewProduct((prev) => {
      const updatedMaterials = prev.materials.map((mat, i) =>
        i === index ? { ...mat, [field]: Number(value) } : mat
      );
      return { ...prev, materials: updatedMaterials };
    });
  };

  const handleAddMaterial = () => {
    setNewProduct((prev) => ({
      ...prev,
      materials: [...prev.materials, { materialID: 1, price: 0 }],
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setNewProduct((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      setMainImageIndex(0);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (currentProduct) {
      setNewProduct((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddProduct = () => {
    if (
      !newProduct.product_name ||
      !newProduct.categoryID ||
      !newProduct.style ||
      newProduct.stock === undefined ||
      !newProduct.description
    ) {
      alert("Vui lòng nhập đầy đủ thông tin sản phẩm!");
      return;
    }

    if (!Array.isArray(newProduct.materials) || newProduct.materials.length === 0) {
      alert("Vui lòng thêm ít nhất một chất liệu!");
      return;
    }

    if (!categories.some((cat) => cat.categoryID === newProduct.categoryID)) {
      alert("Danh mục không hợp lệ!");
      return;
    }

    if (
      !newProduct.materials.every((mat) =>
        materials.some((m) => m.materialID === mat.materialID)
      )
    ) {
      alert("Chất liệu không hợp lệ!");
      return;
    }

    const formData = new FormData();
    formData.append("product_name", newProduct.product_name);
    formData.append("categoryID", newProduct.categoryID.toString());
    formData.append("style", newProduct.style);
    formData.append("stock", newProduct.stock.toString());
    formData.append("description", newProduct.description);
    formData.append("materials", JSON.stringify(newProduct.materials));
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });
    if (imageFiles.length > 0) {
      formData.append("mainImageIndex", mainImageIndex.toString());
    }

    axios
      .post("http://localhost:4000/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        const addedProduct = response.data.data;
        const newImages = addedProduct.images.map((img: Image) => ({
          ...img,
          imageURL: img.imageURL
            ? img.imageURL.startsWith("/")
              ? `http://localhost:4000${img.imageURL}`
              : `http://localhost:4000/images/${img.imageURL.split("/").pop()}`
            : "/images/default.png",
        }));
        setProducts((prev) => [
          ...prev,
          { ...newProduct, productID: addedProduct.productID, images: newImages },
        ]);
        handleCloseModal();
      })
      .catch((error) => console.error("Lỗi thêm sản phẩm:", error));
  };

  const handleUpdateProduct = () => {
    if (!currentProduct || !currentProduct.productID) return;

    const formData = new FormData();
    formData.append("productID", currentProduct.productID);
    formData.append("product_name", newProduct.product_name);
    formData.append("categoryID", newProduct.categoryID.toString());
    formData.append("style", newProduct.style);
    formData.append("stock", newProduct.stock.toString());
    formData.append("description", newProduct.description);
    formData.append("materials", JSON.stringify(newProduct.materials));
    imageFiles.forEach((file, index) => {
      formData.append("images", file);
    });
    if (imageFiles.length > 0) {
      formData.append("mainImageIndex", mainImageIndex.toString());
    }

    axios
      .put("http://localhost:4000/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        const updatedProduct = response.data.data;
        setProducts((prev) =>
          prev.map((p) =>
            p.productID === updatedProduct.productID ? updatedProduct : p
          )
        );
        handleCloseModal();
      })
      .catch((error) => console.error("Lỗi cập nhật sản phẩm:", error));
  };

  const handleAddCategory = () => {
    axios
      .post("http://localhost:4000/categories", newCategory)
      .then((response) => {
        setCategories((prev) => [...prev, response.data.data]);
        setShowCategoryModal(false);
      })
      .catch((error) => console.error("Lỗi thêm danh mục:", error));
  };

  const handleAddNewMaterial = () => {
    axios
      .post("http://localhost:4000/materials", newMaterial)
      .then((response) => {
        setMaterials((prev) => [...prev, response.data.data]);
        setShowMaterialModal(false);
      })
      .catch((error) => console.error("Lỗi thêm chất liệu:", error));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProduct(null);
    setImageFiles([]);
  };

  // Hàm xử lý chọn sản phẩm
  const handleSelectProduct = (productID: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productID)
        ? prev.filter((id) => id !== productID)
        : [...prev, productID]
    );
  };

  // Hàm xử lý xóa sản phẩm
  const handleDeleteProducts = () => {
    if (selectedProducts.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để xóa!");
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm?`)) {
      axios
        .delete("http://localhost:4000/products", {
          data: { productID: selectedProducts },
        })
        .then((response) => {
          if (response.data.success) {
            setProducts((prev) =>
              prev.filter((product) => !selectedProducts.includes(product.productID!))
            );
            setSelectedProducts([]); // Reset danh sách sản phẩm đã chọn
            alert("Xóa sản phẩm thành công!");
          } else {
            alert("Xóa sản phẩm thất bại: " + response.data.message);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi xóa sản phẩm:", error);
          alert("Lỗi khi xóa sản phẩm!");
        });
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      (product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productID &&
          product.productID.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedCategory ? product.categoryID === selectedCategory : true) &&
      (selectedMaterial
        ? product.materials.some((mat) => mat.materialID === selectedMaterial)
        : true)
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item
        key={number}
        active={number === currentPage}
        onClick={() => handlePageChange(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Row>
        {/* Sidebar for Categories and Materials */}
        <Col md={2} className="sidebar">
          <div className="product-count">
            <p>
              Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
            </p>
          </div>
          <h5>Danh mục sản phẩm</h5>
          <ul className="category-list">
            <li
              className={selectedCategory === null ? "active" : ""}
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả danh mục
            </li>
            {categories.map((category) => (
              <li
                key={category.categoryID}
                className={
                  selectedCategory === category.categoryID ? "active" : ""
                }
                onClick={() => setSelectedCategory(category.categoryID)}
              >
                {category.category_name}
              </li>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              className="btn-outline-success"
              onClick={handleShowAddCategory}
            >
              Thêm danh mục
            </Button>
          </ul>

          <h5 className="mt-4">Chất liệu</h5>
          <ul className="category-list">
            <li
              className={selectedMaterial === null ? "active" : ""}
              onClick={() => setSelectedMaterial(null)}
            >
              Tất cả chất liệu
            </li>
            {materials.map((material) => (
              <li
                key={material.materialID}
                className={
                  selectedMaterial === material.materialID ? "active" : ""
                }
                onClick={() => setSelectedMaterial(material.materialID)}
              >
                {material.material_name}
              </li>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              className="btn-outline-success"
              onClick={handleShowAddMaterial}
            >
              Thêm chất liệu
            </Button>
          </ul>
        </Col>

        {/* Main Content */}
        <Col md={10}>
          <div id="product">
            <div id="search">
              <Button variant="transparent" onClick={handleShowAddProduct}>
                <Image
                  src="/images/addProduct.png"
                  alt="addProduct"
                  width={25}
                  height={25}
                />
              </Button>
              <div className="search-box">
                <Image
                  src="/images/search.png"
                  alt="search"
                  width={18}
                  height={18}
                  className="search-icon"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm nhanh..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteProducts}
                disabled={selectedProducts.length === 0}
              >
                Xóa sản phẩm
              </Button>
            </div>

            <div className="product-grid">
              {currentProducts.length > 0 ? (
                currentProducts.map((product) => {
                  const mainImage =
                    product.images.find((img) => img.is_main === 1) ||
                    product.images[0];
                  return (
                    <div key={product.productID} className="product-card">
                      {mainImage ? (
                        <Image
                          src={mainImage.imageURL}
                          alt={product.product_name || "Hình ảnh sản phẩm"}
                          width={200}
                          height={190}
                          className="product-image"
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                      <h6>{product.product_name}</h6>
                      <p>{product.style}</p>
                      <div className="check">
                        
                      <Button
                        variant="transparent"
                        size="sm"
                        onClick={() => handleShowDetail(product)}
                      >
                        <Image
                          src="/images/edit.png"
                          alt="edit"
                          width={20}
                          height={20}
                        />
                      </Button>
                      <Form.Check
                        type="checkbox"
                        className="product-checkbox"
                        checked={selectedProducts.includes(product.productID!)}
                        onChange={() => handleSelectProduct(product.productID!)}
                      />
                      </div>
                      
                    </div>
                  );
                })
              ) : (
                <p>
                  {searchTerm ? "Không tìm thấy sản phẩm" : "Không có dữ liệu"}
                </p>
              )}
            </div>

            <div className="totalPages">
           
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-2">
                  
                  <Pagination>
                    <Pagination.Prev
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    />
                    {paginationItems}
                    <Pagination.Next
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>

        {/* Modal for Product Details/Add/Edit */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {currentProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form>
                  <Form.Group className="mb-2">
                    <Form.Label>Tên sản phẩm</Form.Label>
                    <Form.Control
                      type="text"
                      name="product_name"
                      value={
                        currentProduct?.product_name || newProduct.product_name
                      }
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      name="categoryID"
                      value={newProduct.categoryID}
                      onChange={handleInputChange}
                      disabled={selectedCategory !== null}
                    >
                      {categories.map((category) => (
                        <option
                          key={category.categoryID}
                          value={category.categoryID}
                        >
                          {category.category_name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Kiểu dáng</Form.Label>
                    <Form.Control
                      type="text"
                      name="style"
                      value={currentProduct?.style || newProduct.style}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Số lượng</Form.Label>
                    <Form.Control
                      type="number"
                      name="stock"
                      value={currentProduct?.stock || newProduct.stock}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={3}
                      value={
                        currentProduct?.description || newProduct.description
                      }
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Form>
              </Col>
              <Col md={6}>
                <h6>Chất liệu</h6>
                {newProduct.materials.map((mat, index) => (
                  <Row key={index} className="mb-2">
                    <Col md={5}>
                      <Form.Select
                        value={mat.materialID}
                        onChange={(e) =>
                          handleMaterialChange(index, "materialID", e.target.value)
                        }
                      >
                        {materials.map((material) => (
                          <option
                            key={material.materialID}
                            value={material.materialID}
                          >
                            {material.material_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={5}>
                      <Form.Control
                        type="number"
                        value={mat.price}
                        onChange={(e) =>
                          handleMaterialChange(index, "price", e.target.value)
                        }
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="transparent"
                        size="sm"
                        onClick={() => handleRemoveMaterial(index)}
                      >
                        ❌️
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddMaterial}
                >
                  Thêm chất liệu
                </Button>

                <Form.Group className="mt-3">
                  <Form.Label>Ảnh sản phẩm</Form.Label>
                  <div className="image-list">
                    {newProduct.images.map((image, index) => (
                      <div key={index} className="image-item">
                        <Image
                          src={image.imageURL}
                          alt={`Ảnh ${index + 1}`}
                          width={80}
                          height={80}
                          className="product-image"
                        />
                        <Button
                          variant="transparent"
                          size="sm"
                          onClick={() => handleRemoveImage(index)}
                        >
                          ❌️
                        </Button>
                        <Form.Check
                          type="radio"
                          label="Ảnh chính"
                          name="mainImage"
                          checked={index === mainImageIndex}
                          onChange={() => setMainImageIndex(index)}
                        />
                      </div>
                    ))}
                  </div>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    accept="image/*"
                  />
                  {imageFiles.length > 0 && (
                    <div className="image-preview">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="image-item">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            width={80}
                            height={80}
                          />
                          <Form.Check
                            type="radio"
                            label="Ảnh chính"
                            name="mainImage"
                            checked={mainImageIndex === index}
                            onChange={() => setMainImageIndex(index)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Đóng
            </Button>
            {currentProduct ? (
              <Button variant="primary" onClick={handleUpdateProduct}>
                Cập nhật sản phẩm
              </Button>
            ) : (
              <Button variant="success" onClick={handleAddProduct}>
                Thêm sản phẩm
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Modal for Adding Category */}
        <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Thêm danh mục mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Tên danh mục</Form.Label>
                <Form.Control
                  type="text"
                  value={newCategory.category_name}
                  onChange={(e) =>
                    setNewCategory({ category_name: e.target.value })
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
              Đóng
            </Button>
            <Button variant="success" onClick={handleAddCategory}>
              Thêm danh mục
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal for Adding Material */}
        <Modal show={showMaterialModal} onHide={() => setShowMaterialModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Thêm chất liệu mới</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Tên chất liệu</Form.Label>
                <Form.Control
                  type="text"
                  value={newMaterial.material_name}
                  onChange={(e) =>
                    setNewMaterial((prev) => ({
                      ...prev,
                      material_name: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMaterialModal(false)}>
              Đóng
            </Button>
            <Button variant="success" onClick={handleAddNewMaterial}>
              Thêm chất liệu
            </Button>
          </Modal.Footer>
        </Modal>

    </Layout>
  );
}