const db = require("../config/db");

const ProductMaterial = function (productMaterial) {
  this.productID = productMaterial.productID;
  this.materialID = productMaterial.materialID;
  this.price = productMaterial.price;

};

ProductMaterial.getById = (productID, callback) => {
    db.query(
      "SELECT materialID, price FROM productMaterial WHERE productID = ?",
      [productID],
      (err, res) => {
        if (err) return callback(err, null);
        if (res.length) return callback(null, res);
        return callback({ message: "Không tìm thấy dữ liệu" }, null);
      }
    );
  };
  
ProductMaterial.insert = (productMaterial, callback) => {
    const sqlString = "INSERT INTO productMaterial (productID, materialID, price) VALUES (?, ?, ?)";
    db.query(
      sqlString,
      [productMaterial.productID, productMaterial.materialID, productMaterial.price],
      (err, res) => {
        if (err) return callback(err, null);
        return callback(null, { message: "Thêm dữ liệu thành công", success: true });
      }
    );
};

ProductMaterial.update = (productID, materialID, productMaterial, callback) => {
  db.query(
    "UPDATE productMaterial SET price = ?, updated_at = NOW() WHERE productID = ? AND materialID = ?",
    [productMaterial.price, productID, materialID],
    (err, res) => {
      if (err) {
        return callback(err, null);
      }
      if (res.affectedRows == 0) {
        return callback({ message: "Không tìm thấy dữ liệu" }, null);
      }
      return callback(null, {
        message: "Cập nhật dữ liệu thành công",
        success: true,
        ...productMaterial,
      });
    }
  );
};

ProductMaterial.delete = (productID, materialID, callback) => {
  db.query(
    "DELETE FROM productMaterial WHERE productID = ? AND materialID = ?",
    [productID, materialID],
    (err, res) => {
      if (err) {
        return callback(err, null);
      }
      if (res.affectedRows == 0) {
        return callback({ message: "Không tìm thấy dữ liệu" }, null);
      }
      return callback(null, { message: "Xóa dữ liệu thành công", success: true });
    }
  );
};

module.exports = ProductMaterial;
