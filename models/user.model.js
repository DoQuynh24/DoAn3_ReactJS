const db = require("../common/db");

const User = function (user) {
  this.perID = user.perID;
  this.phone_number = user.phone_number;
  this.password = user.password;
  this.full_name = user.full_name;
  this.role = user.role
  this.created_at = user.created_at;
  this.updated_at = user.updated_at;
};

User.getById = (perID, callback) => {
  const sqlString = "SELECT * FROM user WHERE perID = ?";
  db.query(sqlString, [perID], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result[0]); 
  });
};

User.getAll = (callback) => {
  const sqlString = "SELECT * FROM user";
  db.query(sqlString, (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

User.insert = (user, callback) => {
  const sqlString = "INSERT INTO user SET ?";
  db.query(sqlString, material, (err, res) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, { perID: res.insertId, ...user });
  });
};

module.exports = User;
