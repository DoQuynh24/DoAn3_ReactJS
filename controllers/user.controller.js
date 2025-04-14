const User = require("../models/user.model");
const db = require("../common/db");

module.exports = {
  getAll: (req, res) => {
    User.getAll((err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy nguoi dung", error: err });
      res.json({ success: true, data: result });
    });
  },

  getById: (req, res) => {
    const perID = req.params.perID;
    User.getById(perID, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi lấy nguoi dung", error: err });
      if (!result) return res.status(404).json({ success: false, message: "Không tìm thấy nguoi dung" });
      res.json({ success: true, data: result });
    });
  },

  insert: (req, res) => {
    const user = req.body;
    User.insert(user, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Lỗi khi thêm nguoi dung", error: err });
      res.json({ success: true, message: "Thêm nguoi dung thanh cong", data: result });
    });
  },
};