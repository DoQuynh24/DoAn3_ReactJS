require('dotenv').config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../common/db');

const SECRET_KEY = process.env.SECRET_KEY; 
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10);

router.post('/login', (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại và mật khẩu' });
  }

  const sql = 'SELECT * FROM user WHERE phone_number = ?';
  db.query(sql, [phone_number], (err, result) => {
    if (err) {
      console.error('Lỗi khi truy vấn người dùng:', err);
      return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
    }

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    const user = result[0];

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Lỗi khi so sánh mật khẩu:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
      }

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Tài khoản hoặc mật khẩu không đúng' });
      }

      const token = jwt.sign(
        { perID: user.perID, phone_number: user.phone_number, role: user.role },
        SECRET_KEY,
        { expiresIn: '1h' }
      );


      res.json({
        success: true,
        token,
        role: user.role,
        full_name: user.full_name,
        perID: user.perID, 
      });
    });
  });
});
// Đăng ký
router.post('/register', (req, res) => {
  const { full_name, phone_number, password } = req.body;

  if (!full_name || !phone_number || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  const sqlCheck = 'SELECT * FROM user WHERE phone_number = ?';
  db.query(sqlCheck, [phone_number], (err, result) => {
    if (err) {
      console.error('Lỗi khi kiểm tra số điện thoại:', err);
      return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
    }

    if (result.length > 0) {
      return res.status(400).json({ success: false, message: 'Số điện thoại đã được đăng ký' });
    }

    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
      if (err) {
        console.error('Lỗi khi mã hóa mật khẩu:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
      }

      const sqlInsert = 'INSERT INTO user (phone_number, password, full_name, role) VALUES (?, ?, ?, ?)';
      db.query(sqlInsert, [phone_number, hashedPassword, full_name, 'Khách hàng'], (err, result) => {
        if (err) {
          console.error('Lỗi khi đăng ký người dùng:', err);
          return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
        }

        res.json({ success: true, message: 'Đăng ký thành công' });
      });
    });
  });
});

// Thay đổi mật khẩu
router.put('/change-password', (req, res) => {
  const { phone_number, old_password, new_password } = req.body;

  if (!phone_number || !old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token, vui lòng đăng nhập lại' });
  }

  try {
    jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const sql = 'SELECT * FROM user WHERE phone_number = ?';
  db.query(sql, [phone_number], (err, result) => {
    if (err) {
      console.error('Lỗi khi truy vấn người dùng:', err);
      return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
    }

    if (result.length === 0) {
      return res.status(400).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    const user = result[0];

    bcrypt.compare(old_password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Lỗi khi so sánh mật khẩu:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
      }

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' });
      }

      bcrypt.hash(new_password, SALT_ROUNDS, (err, hashedPassword) => {
        if (err) {
          console.error('Lỗi khi mã hóa mật khẩu mới:', err);
          return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
        }

        const sqlUpdate = 'UPDATE user SET password = ? WHERE phone_number = ?';
        db.query(sqlUpdate, [hashedPassword, phone_number], (err, result) => {
          if (err) {
            console.error('Lỗi khi cập nhật mật khẩu:', err);
            return res.status(500).json({ success: false, message: 'Lỗi server', error: err });
          }

          res.json({ success: true, message: 'Thay đổi mật khẩu thành công' });
        });
      });
    });
  });
});
// Thêm endpoint kiểm tra token
router.get('/verify-token', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ success: true, role: decoded.role, perID: decoded.perID });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
});
module.exports = router;