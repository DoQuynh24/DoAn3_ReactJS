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
      id.detailID, id.productID, id.materialID, id.unitPrice, id.shippingFee, id.totalPrice, id.ringSize, id.quantity,
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
      id.detailID, id.productID, id.materialID, id.unitPrice, id.shippingFee, id.totalPrice, id.ringSize, id.quantity,
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
      id.detailID, id.productID, id.materialID, id.unitPrice, id.shippingFee, id.totalPrice, id.ringSize, id.quantity,
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

      // Lấy invoiceID từ bản ghi vừa thêm dựa trên perID, receiverPhone và fullAddress
      const getInvoiceIDQuery = `
        SELECT invoiceID 
        FROM Invoice 
        WHERE perID = ? AND receiverPhone = ? AND fullAddress = ? 
        ORDER BY createdAt DESC 
        LIMIT 1
      `;
      db.query(
        getInvoiceIDQuery,
        [newInvoice.perID, newInvoice.receiverPhone, newInvoice.fullAddress],
        (err, idResult) => {
          if (err || !idResult[0]) {
            console.error("Không thể lấy invoiceID:", err);
            result(new Error("Không thể lấy invoiceID"), null);
            return;
          }

          const invoiceID = idResult[0].invoiceID;

          const sqlDetail = `
            INSERT INTO InvoiceDetail (invoiceID, productID, materialID, unitPrice, shippingFee, totalPrice, ringSize, quantity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(
            sqlDetail,
            [
              invoiceID,
              invoiceDetail.productID,
              invoiceDetail.materialID,
              invoiceDetail.unitPrice,
              invoiceDetail.shippingFee,
              invoiceDetail.totalPrice,
              invoiceDetail.ringSize || null,
              invoiceDetail.quantity || 1,
            ],
            (err, detailResult) => {
              if (err) {
                console.error("Lỗi khi thêm chi tiết hóa đơn:", err);
                result(err, null);
                return;
              }
              result(null, {
                invoiceID,
                ...newInvoice,
                detail: { detailID: detailResult.insertId, ...invoiceDetail },
              });
            }
          );
        }
      );
    }
  );
};
// Cập nhật hóa đơn
Invoices.update = (invoiceID, updatedInvoice, result) => {
  // Tạo câu SQL động dựa trên các trường được cung cấp
  const fields = [];
  const values = [];

  if (updatedInvoice.receiverName) {
    fields.push("receiverName = ?");
    values.push(updatedInvoice.receiverName);
  }
  if (updatedInvoice.receiverPhone) {
    fields.push("receiverPhone = ?");
    values.push(updatedInvoice.receiverPhone);
  }
  if (updatedInvoice.fullAddress) {
    fields.push("fullAddress = ?");
    values.push(updatedInvoice.fullAddress);
  }
  if (updatedInvoice.paymentMethod) {
    fields.push("paymentMethod = ?");
    values.push(updatedInvoice.paymentMethod);
  }
  if (updatedInvoice.status) {
    fields.push("status = ?");
    values.push(updatedInvoice.status);
  }

  if (fields.length === 0) {
    result({ message: "Không có dữ liệu để cập nhật" }, null);
    return;
  }

  const sql = `
    UPDATE Invoice 
    SET ${fields.join(", ")}
    WHERE invoiceID = ?
  `;
  values.push(invoiceID);

  db.query(sql, values, (err, response) => {
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
  });
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