const Categorie = require("../models/categorie.model");
const db = require("../common/db");

module.exports = {
  getAll: (req, res) => {
    Categorie.getAll((err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy danh mục", error: err });
      res.json({ success: true, data: result });
    });
  },

  getById: (req, res) => {
    const categoryID = req.params.categoryID;
    Categorie.getById(categoryID, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy danh mục", error: err });
      if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });
      res.json({ success: true, data: result });
    });
  },

  insert: (req, res) => {
    const categorie = req.body;
    Categorie.insert(categorie, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi thêm danh mục", error: err });
      res.json({ success: true, message: "Thêm danh mục thành công", data: result });
    });
  },

  update: (req, res) => {
    const { categoryID, category_name } = req.body;
    if (!categoryID || !category_name) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin danh mục" });
    }
    const categorie = { category_name };
    Categorie.update(categoryID, categorie, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi cập nhật danh mục", error: err });
      if (result === "Không tìm thấy danh mục để cập nhật") {
        return res.status(404).json({ success: false, message: result });
      }
      res.json({ success: true, message: result, data: { categoryID, category_name } });
    });
  },

  delete: (req, res) => {
    const { categoryID } = req.body;
    if (!categoryID) {
      return res.status(400).json({ success: false, message: "Thiếu ID danh mục" });
    }
    // Kiểm tra xem danh mục có đang được sử dụng trong sản phẩm
    db.query("SELECT COUNT(*) as count FROM product WHERE categoryID = ?", [categoryID], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi kiểm tra danh mục", error: err });
      if (result[0].count > 0) {
        return res.status(400).json({ success: false, message: "Không thể xóa danh mục vì đang được sử dụng trong sản phẩm" });
      }
      Categorie.delete(categoryID, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi khi xóa danh mục", error: err });
        if (result === "Không tìm thấy danh mục để xóa") {
          return res.status(404).json({ success: false, message: result });
        }
        res.json({ success: true, message: result });
      });
    });
  },
};