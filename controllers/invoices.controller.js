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

exports.insert = (req, res) => {
  const { invoice, invoiceDetail } = req.body;

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
    !invoiceDetail.quantity
  ) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin" });
  }

  const checkProductMaterialQuery = `
    SELECT price
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

      if (result.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cặp productID và materialID không hợp lệ",
        });
      }

      const unitPrice = result[0].price;
      const shippingFee = 30000;
      const productPrice = unitPrice * invoiceDetail.quantity;
      const totalPrice = productPrice + shippingFee;

      const newInvoice = {
        perID: invoice.perID,
        receiverName: invoice.receiverName,
        receiverPhone: invoice.receiverPhone,
        fullAddress: invoice.fullAddress,
        paymentMethod: invoice.paymentMethod,
        status: invoice.status || "Chờ xác nhận",
      };

      const updatedInvoiceDetail = {
        productID: invoiceDetail.productID,
        materialID: invoiceDetail.materialID,
        unitPrice,
        shippingFee,
        totalPrice,
        ringSize: invoiceDetail.ringSize || null,
        quantity: invoiceDetail.quantity,
      };

      Invoices.insert(newInvoice, updatedInvoiceDetail, (err, data) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Lỗi khi thêm hóa đơn", error: err });
        }
        res.json({ success: true, message: "Thêm hóa đơn thành công", invoiceID: data.invoiceID });
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

// Xác nhận đã nhận hàng
exports.confirmReceived = (req, res) => {
  const invoiceID = req.body.invoiceID;

  if (!invoiceID) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp invoiceID" });
  }

  const updatedInvoice = { status: "Đã giao" };
  Invoices.update(invoiceID, updatedInvoice, (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Lỗi khi xác nhận nhận hàng", error: err });
    }
    res.json({ success: true, message: "Xác nhận nhận hàng thành công", data });
  });
};

// Hủy đơn hàng
exports.cancelOrder = (req, res) => {
  const invoiceID = req.body.invoiceID;

  if (!invoiceID) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp invoiceID" });
  }

  const updatedInvoice = { status: "Đã hủy" };
  Invoices.update(invoiceID, updatedInvoice, (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Lỗi khi hủy đơn hàng", error: err });
    }
    res.json({ success: true, message: "Hủy đơn hàng thành công", data });
  });
};

// Yêu cầu trả hàng/hoàn tiền
exports.requestReturn = (req, res) => {
  const invoiceID = req.body.invoiceID;

  if (!invoiceID) {
    return res.status(400).json({ success: false, message: "Vui lòng cung cấp invoiceID" });
  }

  const updatedInvoice = { status: "Yêu cầu trả hàng" }; // Có thể thêm trạng thái mới trong DB
  Invoices.update(invoiceID, updatedInvoice, (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Lỗi khi yêu cầu trả hàng", error: err });
    }
    res.json({ success: true, message: "Yêu cầu trả hàng thành công", data });
  });
};