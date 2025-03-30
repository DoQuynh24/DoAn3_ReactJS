var express = require('express');
var router = express.Router();
const productMaterialController = require("../controllers/productMaterial.controller");

router.get('/', productMaterialController.getAll);
router.get('/:materialID', productMaterialController.getById);
router.post('/add', productMaterialController.insert);
router.post('/update', productMaterialController.update);
router.post('/delete', productMaterialController.delete);

module.exports = router;
