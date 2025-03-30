const Categorie = require("../models/categorie.model");

module.exports = {
  getAll: (req, res) => {
    Categorie.getAll((err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi lấy danh mục", error: err });
      res.json({ data: result });
    });
  },

  getById: (req, res) => {
    const categoryID = req.params.categoryID;
    Categorie.getById(categoryID, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi lấy danh mục", error: err });
      res.send(result);
    });
  },

  insert: (req, res) => {
    const categorie = req.body;
    Categorie.insert(categorie, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi thêm danh mục", error: err });
      res.redirect("/categories");
    });
  },

  update: (req, res) => {
    const categoryID = req.body.categoryID;
    const categorie = { category_name: req.body.category_name };
    Categorie.update(categoryID, categorie, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi cập nhật danh mục", error: err });
      res.redirect("/categories");
    });
  },

  delete: (req, res) => {
    const categoryID = req.body.categoryID;
    Categorie.delete(categoryID, (err, result) => {
      if (err) return res.status(500).send({ message: "Lỗi khi xóa danh mục", error: err });
      res.redirect("/categories");
    });
  },
};
