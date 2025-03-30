const ProductMaterial = require("../models/productMaterial.model");

module.exports = {
  getAll: (req, res) => {
    ProductMaterial.getAll((err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi lấy dữ liệu productMaterial", error: err });
      res.render("productMaterials", { productMaterials: result });
    });
  },

  getById: (req, res) => {
    const productID = req.params.productID;
    ProductMaterial.getById(productID, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi lấy dữ liệu productMaterial", error: err });
      if (!result) return res.status(404).send({ message: "Không tìm thấy dữ liệu productMaterial" });
      res.send(result);
    });
  },

  insert: (req, res) => {
    const productMaterial = req.body;
    ProductMaterial.insert(productMaterial, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi thêm productMaterial", error: err });
      res.redirect("/productMaterials");
    });
  },

  update: (req, res) => {
    const productID = req.body.productID;
    const materialID = req.body.materialID;
    const productMaterial = {
      price: req.body.price
    };
    ProductMaterial.update(productID, materialID, productMaterial, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi cập nhật productMaterial", error: err });
      res.redirect("/productMaterials");
    });
  },

  delete: (req, res) => {
    const productID = req.body.productID;
    const materialID = req.body.materialID;
    ProductMaterial.delete(productID, materialID, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi xóa productMaterial", error: err });
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: "Dữ liệu productMaterial không tồn tại" });
      }
      res.redirect("/productMaterials");
    });
  }
};
