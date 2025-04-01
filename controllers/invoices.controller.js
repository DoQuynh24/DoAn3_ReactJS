const Invoices = require("../models/invoices.model");
const db = require("../common/db");

// Lấy tất cả hóa đơn
exports.getAll = (req, res) => {
    const perID = req.query.perID;
  
    if (!perID) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp perID" });
    }
  
    Invoices.getByPerID(perID, (err, data) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Lỗi server", error: err });
      }
      res.json({ success: true, data });
    });
  };
// Lấy hóa đơn theo ID
exports.getById = (req, res) => {
  const invoiceID = req.params.invoiceID;
  Invoices.getById(invoiceID, (err, data) => {
    if (err) {
      if (err.message) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Lỗi server", error: err });
    }
    res.json({ success: true, data });
  });
};

// Thêm hóa đơn mới
// Thêm hóa đơn mới
exports.insert = (req, res) => {
  const { invoice, invoiceDetail } = req.body;

  // Kiểm tra đầy đủ các trường bắt buộc, bao gồm quantity
  if (
    !invoice ||
    !invoice.perID ||
    !invoice.receiverName ||
    !invoice.receiverPhone ||
    !invoice.fullAddress ||
    !invoice.paymentMethod ||
    !invoiceDetail ||
    !invoiceDetail.productID ||
    !invoiceDetail.materialID ||
    !invoiceDetail.price ||
    !invoiceDetail.quantity 
  ) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin, bao gồm số lượng" });
  }

  // Kiểm tra xem cặp (productID, materialID) có tồn tại trong productMaterial không
  const checkProductMaterialQuery = `
    SELECT COUNT(*) as count 
    FROM productMaterial 
    WHERE productID = ? AND materialID = ?
  `;
  db.query(
    checkProductMaterialQuery,
    [invoiceDetail.productID, invoiceDetail.materialID],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Lỗi server", error: err });
      }

      if (result[0].count === 0) {
        return res.status(400).json({
          success: false,
          message: "Cặp productID và materialID không hợp lệ",
        });
      }

      const newInvoice = new Invoices({
        perID: invoice.perID,
        receiverName: invoice.receiverName,
        receiverPhone: invoice.receiverPhone,
        fullAddress: invoice.fullAddress,
        paymentMethod: invoice.paymentMethod,
        status: invoice.status || "Chờ xác nhận",
      });

      Invoices.insert(newInvoice, invoiceDetail, (err, data) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Lỗi khi thêm hóa đơn", error: err });
        }
        res.json({ success: true, message: "Thêm hóa đơn thành công", data });
      });
    }
  );
};
// Cập nhật hóa đơn
exports.update = (req, res) => {
  const invoiceID = req.body.invoiceID;
  const updatedInvoice = req.body;

  if (
    !invoiceID ||
    !updatedInvoice.receiverName ||
    !updatedInvoice.receiverPhone ||
    !updatedInvoice.fullAddress || // Kiểm tra fullAddress
    !updatedInvoice.paymentMethod ||
    !updatedInvoice.status
  ) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
  }

  Invoices.update(invoiceID, updatedInvoice, (err, data) => {
    if (err) {
      if (err.message) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Lỗi khi cập nhật hóa đơn", error: err });
    }
    res.json({ success: true, message: "Cập nhật hóa đơn thành công", data });
  });
};

// Xóa hóa đơn
exports.delete = (req, res) => {
  const invoiceID = req.body.invoiceID;

  if (!invoiceID) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp invoiceID" });
  }

  Invoices.delete(invoiceID, (err, data) => {
    if (err) {
      if (err.message) {
        return res.status(404).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: "Lỗi khi xóa hóa đơn", error: err });
    }
    res.json({ success: true, message: "Xóa hóa đơn thành công", data });
  });
};