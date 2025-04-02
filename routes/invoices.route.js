var express = require('express');
var router = express.Router();
const invoicesController = require("../controllers/invoices.controller");

router.get('/', invoicesController.getAll);
router.get('/:invoiceID', invoicesController.getById);
router.post('/add', invoicesController.insert);
router.post('/update', invoicesController.update);
router.post('/delete', invoicesController.delete);
router.post('/confirm-received', invoicesController.confirmReceived); // Xác nhận đã nhận hàng
router.post('/cancel', invoicesController.cancelOrder); // Hủy đơn hàng
router.post('/request-return', invoicesController.requestReturn); // Yêu cầu trả hàng/hoàn tiền

module.exports = router;
