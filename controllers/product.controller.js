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
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage }).array("images", 10);

module.exports = {
  getAll: (req, res) => {
    Product.getAll((err, result) => {
      if (err) {
        console.error("Lỗi khi lấy tất cả sản phẩm:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm", error: err.message });
      }
      // Chuẩn hóa imageURL trong phản hồi
      const formattedResult = result.map((product) => ({
        ...product,
        images: product.images.map((img) => ({
          ...img,
          imageURL: img.imageURL.startsWith("http") ? img.imageURL.replace(/^http:\/\/localhost:4000/, "") : img.imageURL,
        })),
      }));
      res.json({ success: true, data: formattedResult });
    });
  },

  getById: (req, res) => {
    const productID = req.params.productID;
    console.log("Lấy sản phẩm theo ID:", productID);
    Product.getById(productID, (err, result) => {
      if (err) {
        console.error("Lỗi khi lấy sản phẩm theo ID:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm", error: err.message });
      }
      if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });
      // Chuẩn hóa imageURL trong phản hồi
      const formattedResult = {
        ...result,
        images: result.images.map((img) => ({
          ...img,
          imageURL: img.imageURL.startsWith("http") ? img.imageURL.replace(/^http:\/\/localhost:4000/, "") : img.imageURL,
        })),
      };
      res.json({ success: true, data: formattedResult });
    });
  },

  insert: (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.error("Lỗi khi upload ảnh:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi upload ảnh", error: err.message });
      }

      console.log("Dữ liệu nhận được từ frontend:", req.body);
      console.log("File ảnh:", req.files);

      const { product_name, categoryID, style, stock, description, materials, mainImageIndex } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!product_name || !categoryID || stock === undefined || !description) {
        console.error("Thiếu thông tin bắt buộc:", { product_name, categoryID, stock, description });
        return res.status(400).json({ success: false, message: "Vui lòng nhập đầy đủ thông tin sản phẩm (product_name, categoryID, stock, description)" });
      }

      const newProduct = {
        product_name,
        categoryID: parseInt(categoryID),
        style: style || null,
        stock: parseInt(stock),
        description,
      };

      let productMaterials;
      try {
        productMaterials = materials ? JSON.parse(materials) : [];
        console.log("Materials sau khi parse:", productMaterials);
        if (productMaterials.some((m) => !m.materialID || m.price === undefined || m.price < 0)) {
          console.error("Dữ liệu chất liệu không hợp lệ:", productMaterials);
          return res.status(400).json({ success: false, message: "Dữ liệu chất liệu không hợp lệ (thiếu materialID hoặc giá âm)" });
        }
      } catch (parseError) {
        console.error("Lỗi khi parse materials:", parseError);
        return res.status(400).json({ success: false, message: "Dữ liệu materials không hợp lệ", error: parseError.message });
      }

      let productImages = [];
      if (req.files && req.files.length > 0) {
        const mainIndex = parseInt(mainImageIndex);
        if (isNaN(mainIndex) || mainIndex < 0 || mainIndex >= req.files.length) {
          console.error("Chỉ số ảnh chính không hợp lệ:", mainImageIndex);
          return res.status(400).json({ success: false, message: "Chỉ số ảnh chính không hợp lệ" });
        }

        productImages = req.files.map((file, index) => ({
          imageURL: `/images/${file.filename}`,
          is_main: index === mainIndex ? 1 : 0,
        }));
        console.log("Images sau khi xử lý:", productImages);
      }

      Product.insert(newProduct, productMaterials, productImages, (err, result) => {
        if (err) {
          console.error("Lỗi khi thêm sản phẩm:", err);
          return res.status(500).json({ success: false, message: "Lỗi khi thêm sản phẩm", error: err.message });
        }

        Product.getById(result.productID, (errGet, product) => {
          if (errGet) {
            console.error("Lỗi khi lấy sản phẩm vừa thêm:", errGet);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm vừa thêm", error: errGet.message });
          }
          console.log("Thêm sản phẩm thành công, trả về dữ liệu:", product);
          res.json({ success: true, message: "Thêm sản phẩm thành công", data: product });
        });
      });
    });
  },

  update: (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        console.error("Lỗi khi tải ảnh lên:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi tải ảnh lên", error: err.message });
      }
  
      const { productID, product_name, categoryID, style, stock, description, materials, mainImageIndex, existingImages } = req.body;
  
      // Kiểm tra dữ liệu đầu vào, chỉ bắt buộc productID và product_name
      if (!productID || !product_name) {
        console.error("Thiếu thông tin bắt buộc:", { productID, product_name });
        return res.status(400).json({ success: false, message: "Vui lòng cung cấp productID và product_name" });
      }
  
      const updatedProduct = {
        product_name,
        categoryID: categoryID ? parseInt(categoryID) : undefined,
        style: style !== undefined ? style : undefined,
        stock: stock !== undefined ? parseInt(stock) : undefined,
        description: description !== undefined ? description : undefined,
      };
  
      let updatedMaterials;
      try {
        updatedMaterials = materials ? JSON.parse(materials) : [];
        if (updatedMaterials.some((m) => !m.materialID || m.price === undefined || m.price < 0)) {
          console.error("Dữ liệu chất liệu không hợp lệ:", updatedMaterials);
          return res.status(400).json({ success: false, message: "Dữ liệu chất liệu không hợp lệ (thiếu materialID hoặc giá âm)" });
        }
      } catch (parseError) {
        console.error("Lỗi khi phân tích materials:", parseError);
        return res.status(400).json({ success: false, message: "Dữ liệu materials không hợp lệ", error: parseError.message });
      }
  
      let productImages = [];
      try {
        productImages = existingImages ? JSON.parse(existingImages) : [];
        // Chuẩn hóa imageURL thành dạng tương đối
        productImages = productImages.map((img) => ({
          ...img,
          imageURL: img.imageURL.replace(/^http:\/\/localhost:4000/, ""), // Loại bỏ tiền tố
        }));
      } catch (parseError) {
        console.error("Lỗi khi phân tích existingImages:", parseError);
        return res.status(400).json({ success: false, message: "Dữ liệu existingImages không hợp lệ", error: parseError.message });
      }
  
      if (req.files && req.files.length > 0) {
        const mainIndex = parseInt(mainImageIndex);
        const totalImages = productImages.length + req.files.length;
        if (isNaN(mainIndex) || mainIndex < 0 || mainIndex >= totalImages) {
          console.error("Chỉ số ảnh chính không hợp lệ:", mainImageIndex, "Tổng số ảnh:", totalImages);
          return res.status(400).json({ success: false, message: "Chỉ số ảnh chính không hợp lệ" });
        }
  
        const newImages = req.files.map((file) => ({
          imageURL: `/images/${file.filename}`,
          is_main: 0,
        }));
  
        productImages = productImages
          .map((img, index) => ({
            ...img,
            is_main: index === mainIndex ? 1 : 0,
          }))
          .concat(
            newImages.map((img, index) => ({
              ...img,
              is_main: index + productImages.length === mainIndex ? 1 : 0,
            }))
          );
      } else if (productImages.length > 0) {
        const mainIndex = parseInt(mainImageIndex);
        if (isNaN(mainIndex) || mainIndex < 0 || mainIndex >= productImages.length) {
          console.error("Chỉ số ảnh chính không hợp lệ:", mainImageIndex, "Tổng số ảnh:", productImages.length);
          return res.status(400).json({ success: false, message: "Chỉ số ảnh chính không hợp lệ" });
        }
        productImages = productImages.map((img, index) => ({
          ...img,
          is_main: index === mainIndex ? 1 : 0,
        }));
      }
  
      // Đảm bảo chỉ một ảnh được đánh dấu là chính
      let mainCount = productImages.filter((img) => img.is_main === 1).length;
      if (mainCount > 1) {
        productImages = productImages.map((img, index) => ({
          ...img,
          is_main: index === parseInt(mainImageIndex) ? 1 : 0,
        }));
      } else if (mainCount === 0 && productImages.length > 0) {
        productImages[0].is_main = 1;
      }
  
      Product.update(productID, updatedProduct, updatedMaterials, productImages, (err, result) => {
        if (err) {
          console.error("Lỗi khi cập nhật sản phẩm:", err);
          return res.status(500).json({ success: false, message: "Lỗi khi cập nhật sản phẩm", error: err.message });
        }
        if (!result.success) {
          return res.status(404).json(result);
        }
        Product.getById(productID, (errGet, product) => {
          if (errGet) {
            console.error("Lỗi khi lấy sản phẩm vừa cập nhật:", errGet);
            return res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm vừa cập nhật", error: errGet.message });
          }
          // Chuẩn hóa imageURL trong phản hồi
          const formattedProduct = {
            ...product,
            images: product.images.map((img) => ({
              ...img,
              imageURL: img.imageURL.startsWith("http") ? img.imageURL.replace(/^http:\/\/localhost:4000/, "") : img.imageURL,
            })),
          };
          res.json({ success: true, message: "Cập nhật sản phẩm thành công", data: formattedProduct });
        });
      });
    });
  },
     
  delete: (req, res) => {
    const { productID } = req.body;
    if (!productID || !Array.isArray(productID) || productID.length === 0) {
      console.error("Danh sách ID sản phẩm không hợp lệ:", productID);
      return res.status(400).json({ success: false, message: "Danh sách ID sản phẩm không hợp lệ" });
    }

    Product.delete(productID, (err, result) => {
      if (err) {
        console.error("Lỗi khi xóa sản phẩm:", err);
        return res.status(500).json({ success: false, message: "Lỗi khi xóa sản phẩm", error: err.message });
      }
      res.json({ success: true, message: "Xóa sản phẩm thành công", affectedRows: result.affectedRows });
    });
  },
};