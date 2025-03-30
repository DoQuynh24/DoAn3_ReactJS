const mysql = require('mysql')
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '020624',
    database: 'jewelry' 
});
db.connect((err) => {
    if (err) {
        console.error(' Lỗi kết nối MySQL:', err.message);
    } else {
        console.log(' Kết nối MySQL thành công!');
    }
})
module.exports = db;