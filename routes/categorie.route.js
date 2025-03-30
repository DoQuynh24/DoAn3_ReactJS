var express = require('express');
var router = express.Router();
const categorieController = require("../controllers/categorie.controller");

router.get('/', categorieController.getAll);
router.get('/:categoryID', categorieController.getById);
router.post('/add', categorieController.insert);
router.post('/update', categorieController.update);
router.post('/delete', categorieController.delete);

module.exports = router;
