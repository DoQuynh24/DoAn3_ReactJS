var express = require('express');
var router = express.Router();
const materialController = require("../controllers/material.controller");

router.get('/', materialController.getAll);
router.get('/:materialID', materialController.getById);
router.post('/add', materialController.insert);
router.post('/update', materialController.update);
router.post('/delete', materialController.delete);

module.exports = router;
