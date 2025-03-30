const Material = require("../models/material.model");

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
    Material.insert(material, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi thêm chất liệu", error: err });
      res.json({ success: true, message: "Thêm chất liệu thành công", data: result });
    });
  },

  update: (req, res) => {
    const materialID = req.body.materialID;
    const material = { material_name: req.body.material_name };
    Material.update(materialID, material, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi cập nhật chất liệu", error: err });
      if (result === "Không tìm thấy chất liệu để cập nhật") {
        return res.status(404).json({ success: false, message: result });
      }
      res.json({ success: true, message: result });
    });
  },

  delete: (req, res) => {
    const materialID = req.body.materialID;
    Material.delete(materialID, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi xóa chất liệu", error: err });
      if (result === "Không tìm thấy chất liệu để xóa") {
        return res.status(404).json({ success: false, message: result });
      }
      res.json({ success: true, message: result });
    });
  },
};