const db = require("../common/db");

const Material = function (material) {
  this.materialID = material.materialID;
  this.material_name = material.material_name;
  this.created_at = material.created_at;
  this.updated_at = material.updated_at;
};

Material.getById = (materialID, callback) => {
  const sqlString = "SELECT * FROM material WHERE materialID = ?";
  db.query(sqlString, [materialID], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result[0]); // Chỉ lấy 1 kết quả
  });
};

Material.getAll = (callback) => {
  const sqlString = "SELECT * FROM material";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

Material.insert = (material, callback) => {
  const sqlString = "INSERT INTO material SET ?";
  db.query(sqlString, material, (err, res) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, { materialID: res.insertId, ...material });
  });
};

Material.update = (materialID, material, callback) => {
  const sqlString = "UPDATE material SET ? WHERE materialID = ?";
  db.query(sqlString, [material, materialID], (err, res) => {
    if (err) {
      return callback(err, null);
    }
    if (res.affectedRows === 0) {
      return callback(null, "Không tìm thấy chất liệu để cập nhật");
    }
    callback(null, "Cập nhật chất liệu thành công");
  });
};

Material.delete = (materialID, callback) => {
  const sqlString = "DELETE FROM material WHERE materialID = ?";
  db.query(sqlString, [materialID], (err, res) => {
    if (err) {
      return callback(err, null);
    }
    if (res.affectedRows === 0) {
      return callback(null, "Không tìm thấy chất liệu để xóa");
    }
    callback(null, "Xóa chất liệu thành công");
  });
};

module.exports = Material;
