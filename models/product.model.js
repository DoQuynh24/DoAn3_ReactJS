const db = require("../common/db");

const Product = function (product) {
  this.productID = product.productID;
  this.product_name = product.product_name;
  this.categoryID = product.categoryID;
  this.style = product.style;
  this.stock = product.stock;
  this.description = product.description;
  this.created_at = product.created_at;
  this.updated_at = product.updated_at;
};

Product.getById = (productID, callback) => {
  const sqlString = `
    SELECT 
        p.*,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'materialID', pm.materialID,
                    'price', pm.price,
                    'material_name', m.material_name
                )
            )
            FROM productMaterial pm
            LEFT JOIN material m ON pm.materialID = m.materialID
            WHERE pm.productID = p.productID
        ) AS materials,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'imageURL', i.imageURL,
                    'is_main', i.is_main
                )
            )
            FROM productImage i
            WHERE i.productID = p.productID
        ) AS images
    FROM product p
    WHERE p.productID = ?
  `;

  db.query(sqlString, [productID], (err, result) => {
    if (err) return callback(err, null);
    if (result.length === 0) return callback(null, null);

    const product = {
      productID: result[0].productID,
      product_name: result[0].product_name,
      categoryID: result[0].categoryID,
      style: result[0].style,
      stock: result[0].stock,
      description: result[0].description,
      materials: result[0].materials ? JSON.parse(result[0].materials) : [],
      images: result[0].images
        ? JSON.parse(result[0].images).map((img) => ({
            ...img,
            imageURL: img.imageURL.startsWith("/") ? img.imageURL : `/images/${img.imageURL}`,
          }))
        : [],
    };

    callback(null, product);
  });
};

Product.getAll = (callback) => {
  const sqlString = `
    SELECT 
        p.*,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'materialID', pm.materialID,
                    'price', pm.price,
                    'material_name', m.material_name
                )
            )
            FROM productMaterial pm
            LEFT JOIN material m ON pm.materialID = m.materialID
            WHERE pm.productID = p.productID
        ) AS materials,
        (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'imageURL', i.imageURL,
                    'is_main', i.is_main
                )
            )
            FROM productImage i
            WHERE i.productID = p.productID
        ) AS images
    FROM product p
  `;

  db.query(sqlString, (err, result) => {
    if (err) return callback(err, null);

    const products = result.map((row) => ({
      productID: row.productID,
      product_name: row.product_name,
      categoryID: row.categoryID,
      style: row.style,
      stock: row.stock,
      description: row.description,
      materials: row.materials ? JSON.parse(row.materials) : [],
      images: row.images
        ? JSON.parse(row.images).map((img) => ({
            ...img,
            imageURL: img.imageURL.startsWith("/") ? img.imageURL : `/images/${img.imageURL}`,
          }))
        : [],
    }));

    callback(null, products);
  });
};

Product.insert = (product, materials, images, callback) => {
  // Bắt đầu transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error("Lỗi khi bắt đầu transaction:", err);
      return callback(err, null);
    }

    // Thêm sản phẩm vào bảng product
    const sqlString = `
      INSERT INTO product (product_name, categoryID, style, stock, description) 
      VALUES (?, ?, ?, ?, ?)`;
    db.query(
      sqlString,
      [product.product_name, product.categoryID, product.style, product.stock, product.description],
      (err, res) => {
        if (err) {
          console.error("Lỗi khi chèn sản phẩm:", err);
          return db.rollback(() => callback(err, null));
        }

        // Truy vấn lại để lấy productID
        const sqlGetProductID = `
          SELECT productID 
          FROM product 
          WHERE product_name = ? AND categoryID = ? AND style = ? AND stock = ? AND description = ?
          ORDER BY productID DESC LIMIT 1`;
        db.query(
          sqlGetProductID,
          [product.product_name, product.categoryID, product.style, product.stock, product.description],
          (errGet, resultGet) => {
            if (errGet) {
              console.error("Lỗi khi lấy productID:", errGet);
              return db.rollback(() => callback(errGet, null));
            }
            if (!resultGet || resultGet.length === 0) {
              console.error("Không tìm thấy sản phẩm vừa thêm:", product);
              return db.rollback(() => callback(new Error("Không tìm thấy sản phẩm vừa thêm"), null));
            }

            const productID = resultGet[0].productID;

            // Thêm dữ liệu vào bảng productMaterial (nếu có materials)
            if (materials && materials.length > 0) {
              const materialValues = materials.map((m) => [productID, m.materialID, m.price]);
              const sqlMaterial = "INSERT INTO productMaterial (productID, materialID, price) VALUES ?";
              db.query(sqlMaterial, [materialValues], (err2) => {
                if (err2) {
                  console.error("Lỗi khi chèn chất liệu:", err2);
                  return db.rollback(() => callback(err2, null));
                }

                // Thêm dữ liệu vào bảng productImage (nếu có ảnh)
                if (images && images.length > 0) {
                  console.log("Ảnh sẽ được thêm:", images); // Log để kiểm tra
                  const imageValues = images.map((img) => [productID, img.imageURL, img.is_main]);
                  const sqlImage = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                  db.query(sqlImage, [imageValues], (err3) => {
                    if (err3) {
                      console.error("Lỗi khi chèn ảnh:", err3);
                      return db.rollback(() => callback(err3, null));
                    }

                    // Commit transaction nếu tất cả thành công
                    db.commit((err4) => {
                      if (err4) {
                        console.error("Lỗi khi commit transaction:", err4);
                        return db.rollback(() => callback(err4, null));
                      }
                      callback(null, { productID });
                    });
                  });
                } else {
                  // Commit transaction nếu không có ảnh
                  db.commit((err4) => {
                    if (err4) {
                      console.error("Lỗi khi commit transaction:", err4);
                      return db.rollback(() => callback(err4, null));
                    }
                    callback(null, { productID });
                  });
                }
              });
            } else {
              // Commit transaction nếu không có materials
              if (images && images.length > 0) {
                console.log("Ảnh sẽ được thêm:", images); // Log để kiểm tra
                const imageValues = images.map((img) => [productID, img.imageURL, img.is_main]);
                const sqlImage = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                db.query(sqlImage, [imageValues], (err3) => {
                  if (err3) {
                    console.error("Lỗi khi chèn ảnh:", err3);
                    return db.rollback(() => callback(err3, null));
                  }

                  db.commit((err4) => {
                    if (err4) {
                      console.error("Lỗi khi commit transaction:", err4);
                      return db.rollback(() => callback(err4, null));
                    }
                    callback(null, { productID });
                  });
                });
              } else {
                db.commit((err4) => {
                  if (err4) {
                    console.error("Lỗi khi commit transaction:", err4);
                    return db.rollback(() => callback(err4, null));
                  }
                  callback(null, { productID });
                });
              }
            }
          }
        );
      }
    );
  });
};

Product.update = (productID, product, materials, callback) => {
  const sqlUpdateProduct = "UPDATE product SET ? WHERE productID = ?";
  db.query(sqlUpdateProduct, [product, productID], (err, res) => {
    if (err) return callback(err, null);
    if (res.affectedRows === 0) {
      return callback(null, { message: "Không tìm thấy sản phẩm để cập nhật", success: false });
    }

    // Xóa chất liệu cũ
    const sqlDeleteMaterials = "DELETE FROM productMaterial WHERE productID = ?";
    db.query(sqlDeleteMaterials, [productID], (err2) => {
      if (err2) return callback(err2, null);

      // Thêm chất liệu mới (nếu có)
      if (materials && materials.length > 0) {
        const values = materials.map((m) => [productID, m.materialID, m.price]);
        const sqlInsertMaterials = "INSERT INTO productMaterial (productID, materialID, price) VALUES ?";
        db.query(sqlInsertMaterials, [values], (err3) => {
          if (err3) return callback(err3, null);
          callback(null, { message: "Cập nhật sản phẩm và chất liệu thành công", success: true });
        });
      } else {
        callback(null, { message: "Cập nhật sản phẩm thành công", success: true });
      }
    });
  });
};

Product.delete = (productID, callback) => {
  // Xóa ảnh trước
  const sqlDeleteImages = "DELETE FROM productImage WHERE productID IN (?)";
  db.query(sqlDeleteImages, [productID], (err) => {
    if (err) return callback(err, null);

    // Xóa chất liệu
    const sqlDeleteMaterials = "DELETE FROM productMaterial WHERE productID IN (?)";
    db.query(sqlDeleteMaterials, [productID], (err2) => {
      if (err2) return callback(err2, null);

      // Xóa sản phẩm
      const sqlDeleteProduct = "DELETE FROM product WHERE productID IN (?)";
      db.query(sqlDeleteProduct, [productID], (err3, res) => {
        if (err3) return callback(err3, null);
        if (res.affectedRows === 0) {
          return callback(null, { message: "Không tìm thấy sản phẩm để xóa", success: false });
        }
        callback(null, { message: "Xóa sản phẩm thành công", success: true, affectedRows: res.affectedRows });
      });
    });
  });
};

module.exports = Product;