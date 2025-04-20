const Material = require("../models/material.model");
const db = require("../common/db");

module.exports = {
  getAll: (req, res) => {
    Material.getAll((err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy chất liệu", error: err });
      res.json({ success: true, data: result });
    });
  },

  getById: (req, res) => {
    const materialID = req.params.materialID;
    Material.getById(materialID, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy chất liệu", error: err });
      if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy chất liệu" });
      res.json({ success: true, data: result });
    });
  },

  insert: (req, res) => {
    const material = req.body;
    if (!material.material_name) {
      return res.status(400).json({ success: false, message: "Thiếu tên chất liệu" });
    }
    Material.insert(material, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi thêm chất liệu", error: err });
      res.json({ success: true, message: "Thêm chất liệu thành công", data: result });
    });
  },

  update: (req, res) => {
    const { materialID, material_name } = req.body;
    if (!materialID || !material_name) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin chất liệu" });
    }
    const material = { material_name };
    Material.update(materialID, material, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi cập nhật chất liệu", error: err });
      if (result === "Không tìm thấy chất liệu để cập nhật") {
        return res.status(404).json({ success: false, message: result });
      }
      res.json({ success: true, message: result, data: { materialID, material_name } });
    });
  },

  delete: (req, res) => {
    const { materialID } = req.body;
    if (!materialID) {
      return res.status(400).json({ success: false, message: "Thiếu ID chất liệu" });
    }
    // Kiểm tra xem chất liệu có đang được sử dụng trong sản phẩm
    db.query("SELECT COUNT(*) as count FROM productMaterial WHERE materialID = ?", [materialID], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi kiểm tra chất liệu", error: err });
      if (result[0].count > 0) {
        return res.status(400).json({ success: false, message: "Không thể xóa chất liệu vì đang được sử dụng trong sản phẩm" });
      }
      Material.delete(materialID, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Lỗi khi xóa chất liệu", error: err });
        if (result === "Không tìm thấy chất liệu để xóa") {
          return res.status(404).json({ success: false, message: result });
        }
        res.json({ success: true, message: result });
      });
    });
  },
};