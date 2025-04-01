const db = require("../common/db");

const Invoices = function (invoices) {
  this.invoiceID = invoices.invoiceID;
  this.perID = invoices.perID;
  this.receiverName = invoices.receiverName;
  this.receiverPhone = invoices.receiverPhone;
  this.fullAddress = invoices.fullAddress;
  this.paymentMethod = invoices.paymentMethod;
  this.status = invoices.status;
  this.createdAt = invoices.createdAt;
};

// Lấy tất cả hóa đơn
Invoices.getAll = (result) => {
  const sql = `
    SELECT 
      i.invoiceID, i.perID, i.receiverName, i.receiverPhone, i.fullAddress, 
      i.paymentMethod, i.status, i.createdAt,
      id.detailID, id.productID, id.materialID, id.price, id.ringSize,
      p.product_name, m.material_name,
      pi.imageURL
    FROM Invoice i
    LEFT JOIN InvoiceDetail id ON i.invoiceID = id.invoiceID
    LEFT JOIN product p ON id.productID = p.productID
    LEFT JOIN material m ON id.materialID = m.materialID
    LEFT JOIN productImage pi ON p.productID = pi.productID AND pi.is_main = 1
  `;
  db.query(sql, (err, response) => {
    if (err) {
      console.error("Lỗi khi lấy tất cả hóa đơn:", err);
      result(err, null);
      return;
    }
    result(null, response);
  });
};

// Lấy hóa đơn theo ID
Invoices.getById = (invoiceID, result) => {
  const sql = `
    SELECT 
      i.invoiceID, i.perID, i.receiverName, i.receiverPhone, i.fullAddress, 
      i.paymentMethod, i.status, i.createdAt,
      id.detailID, id.productID, id.materialID, id.price, id.ringSize,
      p.product_name, m.material_name,
      pi.imageURL
    FROM Invoice i
    LEFT JOIN InvoiceDetail id ON i.invoiceID = id.invoiceID
    LEFT JOIN product p ON id.productID = p.productID
    LEFT JOIN material m ON id.materialID = m.materialID
    LEFT JOIN productImage pi ON p.productID = pi.productID AND pi.is_main = 1
    WHERE i.invoiceID = ?
  `;
  db.query(sql, [invoiceID], (err, response) => {
    if (err) {
      console.error("Lỗi khi lấy hóa đơn theo invoiceID:", err);
      result(err, null);
      return;
    }
    if (response.length === 0) {
      result({ message: "Hóa đơn không tồn tại" }, null);
      return;
    }
    result(null, response);
  });
};

// Lấy hóa đơn theo perID
Invoices.getByPerID = (perID, result) => {
  const sql = `
    SELECT 
      i.invoiceID, i.perID, i.receiverName, i.receiverPhone, i.fullAddress, 
      i.paymentMethod, i.status, i.createdAt,
      id.detailID, id.productID, id.materialID, id.price, id.ringSize,
      p.product_name, m.material_name,
      pi.imageURL
    FROM Invoice i
    LEFT JOIN InvoiceDetail id ON i.invoiceID = id.invoiceID
    LEFT JOIN product p ON id.productID = p.productID
    LEFT JOIN material m ON id.materialID = m.materialID
    LEFT JOIN productImage pi ON p.productID = pi.productID AND pi.is_main = 1
    WHERE i.perID = ?
  `;
  db.query(sql, [perID], (err, response) => {
    if (err) {
      console.error("Lỗi khi lấy hóa đơn theo perID:", err);
      result(err, null);
      return;
    }
    result(null, response);
  });
};

// Thêm hóa đơn mới
Invoices.insert = (newInvoice, invoiceDetail, result) => {
  const sqlInvoice = `
    INSERT INTO Invoice (perID, receiverName, receiverPhone, fullAddress, paymentMethod, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sqlInvoice,
    [
      newInvoice.perID,
      newInvoice.receiverName,
      newInvoice.receiverPhone,
      newInvoice.fullAddress,
      newInvoice.paymentMethod,
      newInvoice.status || "Chờ xác nhận",
    ],
    (err, invoiceResult) => {
      if (err) {
        console.error("Lỗi khi thêm hóa đơn:", err);
        result(err, null);
        return;
      }

      const invoiceID = invoiceResult.insertId;

      // Đoạn mã sửa đổi ở đây: thêm quantity vào InvoiceDetail
      const sqlDetail = `
        INSERT INTO InvoiceDetail (invoiceID, productID, materialID, price, ringSize, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(
        sqlDetail,
        [
          invoiceID,
          invoiceDetail.productID,
          invoiceDetail.materialID,
          invoiceDetail.price,
          invoiceDetail.ringSize || null,
          invoiceDetail.quantity || 1, // Thêm quantity, mặc định là 1 nếu không có giá trị
        ],
        (err, detailResult) => {
          if (err) {
            console.error("Lỗi khi thêm chi tiết hóa đơn:", err);
            result(err, null);
            return;
          }
          result(null, { invoiceID, ...newInvoice, detail: invoiceDetail });
        }
      );
    }
  );
};
// Cập nhật hóa đơn
Invoices.update = (invoiceID, updatedInvoice, result) => {
  const sql = `
    UPDATE Invoice 
    SET 
      receiverName = ?, 
      receiverPhone = ?, 
      fullAddress = ?, 
      paymentMethod = ?, 
      status = ?
    WHERE invoiceID = ?
  `;
  db.query(
    sql,
    [
      updatedInvoice.receiverName,
      updatedInvoice.receiverPhone,
      updatedInvoice.fullAddress,
      updatedInvoice.paymentMethod,
      updatedInvoice.status,
      invoiceID,
    ],
    (err, response) => {
      if (err) {
        console.error("Lỗi khi cập nhật hóa đơn:", err);
        result(err, null);
        return;
      }
      if (response.affectedRows === 0) {
        result({ message: "Hóa đơn không tồn tại" }, null);
        return;
      }
      result(null, { invoiceID, ...updatedInvoice });
    }
  );
};

// Xóa hóa đơn
Invoices.delete = (invoiceID, result) => {
  const sql = "DELETE FROM Invoice WHERE invoiceID = ?";
  db.query(sql, [invoiceID], (err, response) => {
    if (err) {
      console.error("Lỗi khi xóa hóa đơn:", err);
      result(err, null);
      return;
    }
    if (response.affectedRows === 0) {
      result({ message: "Hóa đơn không tồn tại" }, null);
      return;
    }
    result(null, { message: "Xóa hóa đơn thành công" });
  });
};

module.exports = Invoices;