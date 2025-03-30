var express = require('express');
var router = express.Router();
const productController = require("../controllers/product.controller");

router.get('/', productController.getAll);
router.get('/:productID', productController.getById);
router.post('/', productController.insert); 
router.put('/:productID', productController.update); 
router.delete('/', productController.delete); 

module.exports = router;
