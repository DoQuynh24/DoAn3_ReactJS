var express = require('express');
var router = express.Router();
const invoicesController = require("../controllers/invoices.controller");

router.get('/', invoicesController.getAll);
router.get('/:invoiceID', invoicesController.getById);
router.post('/add', invoicesController.insert);
router.post('/update', invoicesController.update);
router.post('/delete', invoicesController.delete);

module.exports = router;
