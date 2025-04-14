var express = require('express');
var router = express.Router();
const userController = require("../controllers/user.controller");

router.get('/', userController.getAll);
router.get('/:perID', userController.getById);
router.post('/add', userController.insert);

module.exports = router;
