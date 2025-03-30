const db = require("../common/db");

const Categorie = function (categorie) {
  this.categoryID = categorie.categoryID;
  this.category_name = categorie.category_name;
  this.created_at = categorie.created_at;
  this.updated_at = categorie.updated_at;
};

Categorie.getById = (categoryID, callback) => {
  const sqlString = "SELECT * FROM categorie WHERE categoryID = ?";
  db.query(sqlString, [categoryID], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result[0]); // Chỉ lấy 1 kết quả
  });
};

Categorie.getAll = (callback) => {
  const sqlString = "SELECT * FROM categorie";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

Categorie.insert = (categorie, callback) => {
  const sqlString = "INSERT INTO categorie SET ?";
  db.query(sqlString, categorie, (err, res) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, { categoryID: res.insertId, ...categorie });
  });
};

Categorie.update = (categoryID, categorie, callback) => {
  const sqlString = "UPDATE categorie SET ? WHERE categoryID = ?";
  db.query(sqlString, [categorie, categoryID], (err, res) => {
    if (err) {
      return callback(err, null);
    }
    if (res.affectedRows === 0) {
      return callback(null, "Không tìm thấy danh mục để cập nhật");
    }
    callback(null, "Cập nhật danh mục thành công");
  });
};

Categorie.delete = (categoryID, callback) => {
  const sqlString = "DELETE FROM categorie WHERE categoryID = ?";
  db.query(sqlString, [categoryID], (err, res) => {
    if (err) {
      return callback(err, null);
    }
    if (res.affectedRows === 0) {
      return callback(null, "Không tìm thấy danh mục để xóa");
    }
    callback(null, "Xóa danh mục thành công");
  });
};

module.exports = Categorie;
