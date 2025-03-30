const Product = require("../models/product.model");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../public/images"); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Đã tạo thư mục public/images");
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ví dụ: 1742528813869.png
  },
});
const upload = multer({ storage }).array("images", 10); // Tối đa 10 ảnh

module.exports = {
  getAll: (req, res) => {
    Product.getAll((err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm", error: err });
      res.json({ success: true, data: result });
    });
  },

  getById: (req, res) => {
    const productID = req.params.productID;
    Product.getById(productID, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm", error: err });
      if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
      res.json({ success: true, data: result });
    });
  },

  insert: (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.error("Lỗi khi upload ảnh:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi upload ảnh", error: err });
      }

      console.log("Dữ liệu nhận được từ frontend:", req.body);
      console.log("File ảnh nhận được:", req.files);

      const { product_name, categoryID, style, stock, description, materials, mainImageIndex } = req.body;

      // Kiểm tra dữ liệu sản phẩm
      if (!product_name || !categoryID || !style || stock === undefined || !description) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin sản phẩm" });
      }

      const newProduct = {
        product_name,
        categoryID: parseInt(categoryID),
        style,
        stock: parseInt(stock),
        description,
      };

      let productMaterials;
      try {
        productMaterials = materials ? JSON.parse(materials) : [];
      } catch (parseError) {
        console.error("Lỗi khi parse materials:", parseError);
        return res.status(400).json({ success: false, message: "Dữ liệu materials không hợp lệ", error: parseError });
      }

      // Tạo danh sách ảnh (nếu có)
      let productImages = [];
      if (req.files && req.files.length > 0) {
        const mainIndex = parseInt(mainImageIndex);
        // Kiểm tra mainImageIndex nếu có ảnh
        if (isNaN(mainIndex) || mainIndex < 0 || mainIndex >= req.files.length) {
          return res.status(400).json({ success: false, message: "Chỉ số ảnh chính không hợp lệ" });
        }

        productImages = req.files.map((file, index) => ({
          imageURL: `/images/${file.filename}`,
          is_main: index === mainIndex ? 1 : 0,
        }));
      }

      Product.insert(newProduct, productMaterials, productImages, (err, result) => {
        if (err) {
          console.error("Lỗi từ model:", err);
          return res.status(500).json({ success: false, message: "Lỗi khi thêm sản phẩm", error: err });
        }

        // Lấy lại thông tin sản phẩm vừa thêm để trả về đầy đủ dữ liệu (bao gồm images)
        Product.getById(result.productID, (errGet, product) => {
          if (errGet) {
            console.error("Lỗi khi lấy sản phẩm vừa thêm:", errGet);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm vừa thêm", error: errGet });
          }
          res.json({ success: true, message: "Thêm sản phẩm thành công", data: product });
        });
      });
    });
  },

  update: (req, res) => {
    const { productID, product_name, categoryID, style, stock, description, materials } = req.body;
    if (!productID) return res.status(400).json({ success: false, message: "Thiếu ID sản phẩm" });

    const updatedProduct = { product_name, categoryID, style, stock, description };
    const updatedMaterials = Array.isArray(materials) ? materials : [];

    Product.update(productID, updatedProduct, updatedMaterials, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi cập nhật sản phẩm", error: err });
      res.json({ success: true, message: "Cập nhật sản phẩm thành công", data: result });
    });
  },

  delete: (req, res) => {
    const { productID } = req.body;
    if (!productID || !Array.isArray(productID) || productID.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách ID sản phẩm không hợp lệ" });
    }

    Product.delete(productID, (err, result) => {
      if (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi xóa sản phẩm", error: err });
      }
      res.json({ success: true, message: "Xóa sản phẩm thành công", affectedRows: result.affectedRows });
    });
  },
};