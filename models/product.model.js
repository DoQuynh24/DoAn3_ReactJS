const db = require("../common/db");

const Product = function (product) {
  this.productID = product.productID;
  this.product_name = product.product_name;
  this.categoryID = product.categoryID;
  this.style = product.style;
  this.stock = product.stock;
  this.description = product.description;
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
    if (err) {
      console.error("Lỗi khi lấy sản phẩm theo ID:", err);
      return callback(err, null);
    }
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
    if (err) {
      console.error("Lỗi khi lấy tất cả sản phẩm:", err);
      return callback(err, null);
    }

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
  // Validation cơ bản
  if (!product.product_name || !product.categoryID || product.stock === undefined || !product.description) {
    console.error("Validation failed: Thiếu thông tin bắt buộc");
    return callback(new Error("Thiếu thông tin bắt buộc: product_name, categoryID, stock, hoặc description"), null);
  }

  console.log("Bắt đầu thêm sản phẩm:", product);

  db.beginTransaction((err) => {
    if (err) {
      console.error("Lỗi khi bắt đầu transaction:", err);
      return callback(err, null);
    }

    // Thêm sản phẩm vào bảng product
    const sqlString = `
      INSERT INTO product (product_name, categoryID, style, stock, description) 
      VALUES (?, ?, ?, ?, ?)
    `;
    console.log("Thực hiện INSERT vào bảng product:", sqlString);
    console.log("Dữ liệu:", [product.product_name, product.categoryID, product.style || null, product.stock, product.description]);

    db.query(
      sqlString,
      [product.product_name, product.categoryID, product.style || null, product.stock, product.description],
      (err, res) => {
        if (err) {
          console.error("Lỗi khi chèn sản phẩm:", err);
          return db.rollback(() => callback(new Error("Lỗi khi chèn sản phẩm: " + err.message), null));
        }

        console.log("Kết quả INSERT vào product:", res);

        // Vì productID được sinh bởi trigger và là VARCHAR, không sử dụng res.insertId
        // Thay vào đó, truy vấn để lấy productID vừa chèn
        const sqlGetProductID = `
          SELECT productID 
          FROM product 
          WHERE product_name = ? 
            AND categoryID = ? 
            AND (style = ? OR (style IS NULL AND ? IS NULL)) 
            AND stock = ? 
            AND description = ?
          ORDER BY productID DESC
          LIMIT 1
        `;
        db.query(
          sqlGetProductID,
          [product.product_name, product.categoryID, product.style || null, product.style || null, product.stock, product.description],
          (err2, result) => {
            if (err2) {
              console.error("Lỗi khi lấy productID:", err2);
              return db.rollback(() => callback(new Error("Lỗi khi lấy productID: " + err2.message), null));
            }
            if (!result || result.length === 0) {
              console.error("Không tìm thấy productID vừa chèn");
              return db.rollback(() => callback(new Error("Không tìm thấy productID vừa chèn"), null));
            }

            const productID = result[0].productID;
            console.log("productID vừa chèn:", productID);

            // Thêm materials nếu có
            if (materials && materials.length > 0) {
              const materialValues = materials.map((m) => [
                productID,
                m.materialID,
                m.price !== undefined ? m.price : 0,
              ]);
              const sqlMaterial = "INSERT INTO productMaterial (productID, materialID, price) VALUES ?";
              console.log("Thực hiện INSERT vào bảng productMaterial:", sqlMaterial);
              console.log("Dữ liệu materials:", materialValues);

              db.query(sqlMaterial, [materialValues], (err3) => {
                if (err3) {
                  console.error("Lỗi khi chèn chất liệu:", err3);
                  return db.rollback(() => callback(new Error("Lỗi khi chèn chất liệu: " + err3.message), null));
                }

                console.log("Thêm chất liệu thành công");

                // Thêm images nếu có
                if (images && images.length > 0) {
                  const imageValues = images.map((img) => [productID, img.imageURL, img.is_main ? 1 : 0]);
                  const sqlImage = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                  console.log("Thực hiện INSERT vào bảng productImage:", sqlImage);
                  console.log("Dữ liệu images:", imageValues);

                  db.query(sqlImage, [imageValues], (err4) => {
                    if (err4) {
                      console.error("Lỗi khi chèn ảnh:", err4);
                      return db.rollback(() => callback(new Error("Lỗi khi chèn ảnh: " + err4.message), null));
                    }

                    console.log("Thêm ảnh thành công");

                    // Commit transaction
                    db.commit((err5) => {
                      if (err5) {
                        console.error("Lỗi khi commit transaction:", err5);
                        return db.rollback(() => callback(new Error("Lỗi khi commit transaction: " + err5.message), null));
                      }
                      console.log("Commit transaction thành công");
                      callback(null, { productID, message: "Thêm sản phẩm thành công" });
                    });
                  });
                } else {
                  // Commit transaction nếu không có images
                  db.commit((err4) => {
                    if (err4) {
                      console.error("Lỗi khi commit transaction:", err4);
                      return db.rollback(() => callback(new Error("Lỗi khi commit transaction: " + err4.message), null));
                    }
                    console.log("Commit transaction thành công (không có images)");
                    callback(null, { productID, message: "Thêm sản phẩm thành công" });
                  });
                }
              });
            } else {
              // Thêm images nếu có, nhưng không có materials
              if (images && images.length > 0) {
                const imageValues = images.map((img) => [productID, img.imageURL, img.is_main ? 1 : 0]);
                const sqlImage = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                console.log("Thực hiện INSERT vào bảng productImage:", sqlImage);
                console.log("Dữ liệu images:", imageValues);

                db.query(sqlImage, [imageValues], (err3) => {
                  if (err3) {
                    console.error("Lỗi khi chèn ảnh:", err3);
                    return db.rollback(() => callback(new Error("Lỗi khi chèn ảnh: " + err3.message), null));
                  }

                  console.log("Thêm ảnh thành công");

                  // Commit transaction
                  db.commit((err4) => {
                    if (err4) {
                      console.error("Lỗi khi commit transaction:", err4);
                      return db.rollback(() => callback(new Error("Lỗi khi commit transaction: " + err4.message), null));
                    }
                    console.log("Commit transaction thành công (không có materials)");
                    callback(null, { productID, message: "Thêm sản phẩm thành công" });
                  });
                });
              } else {
                // Commit transaction nếu không có materials và images
                db.commit((err4) => {
                  if (err4) {
                    console.error("Lỗi khi commit transaction:", err4);
                    return db.rollback(() => callback(new Error("Lỗi khi commit transaction: " + err4.message), null));
                  }
                  console.log("Commit transaction thành công (không có materials và images)");
                  callback(null, { productID, message: "Thêm sản phẩm thành công" });
                });
              }
            }
          }
        );
      }
    );
  });
};

Product.update = (productID, product, materials, images, callback) => {
  db.beginTransaction((err) => {
    if (err) {
      console.error("Lỗi khi bắt đầu giao dịch:", err);
      return callback(new Error("Lỗi khi bắt đầu giao dịch: " + err.message), null);
    }

    // Kiểm tra dữ liệu sản phẩm, chỉ bắt buộc product_name
    if (!product.product_name) {
      console.error("Thiếu thông tin bắt buộc: product_name");
      return db.rollback(() => callback(new Error("Thiếu thông tin bắt buộc: product_name"), null));
    }

    // Lấy thông tin sản phẩm hiện tại để giữ giá trị cũ cho các trường không được cung cấp
    const sqlGetCurrent = "SELECT * FROM product WHERE productID = ?";
    db.query(sqlGetCurrent, [productID], (err, currentProduct) => {
      if (err) {
        console.error("Lỗi khi lấy sản phẩm hiện tại:", err);
        return db.rollback(() => callback(new Error("Lỗi khi lấy sản phẩm hiện tại: " + err.message), null));
      }
      if (currentProduct.length === 0) {
        return db.rollback(() => callback(null, { message: "Không tìm thấy sản phẩm để cập nhật", success: false }));
      }

      // Gộp dữ liệu mới với dữ liệu cũ
      const current = currentProduct[0];
      const updateFields = {
        product_name: product.product_name,
        categoryID: product.categoryID !== undefined ? product.categoryID : current.categoryID,
        style: product.style !== undefined ? product.style : current.style,
        stock: product.stock !== undefined ? product.stock : current.stock,
        description: product.description !== undefined ? product.description : current.description
      };

      // Câu lệnh SQL cập nhật chỉ các trường được cung cấp hoặc giữ nguyên giá trị cũ
      const sqlUpdateProduct = `
        UPDATE product 
        SET product_name = ?, categoryID = ?, style = ?, stock = ?, description = ?
        WHERE productID = ?
      `;
      db.query(
        sqlUpdateProduct,
        [
          updateFields.product_name,
          updateFields.categoryID,
          updateFields.style,
          updateFields.stock,
          updateFields.description,
          productID
        ],
        (err, res) => {
          if (err) {
            console.error("Lỗi khi cập nhật sản phẩm:", err);
            return db.rollback(() => callback(new Error("Lỗi khi cập nhật sản phẩm: " + err.message), null));
          }
          if (res.affectedRows === 0) {
            return db.rollback(() =>
              callback(null, { message: "Không tìm thấy sản phẩm để cập nhật", success: false })
            );
          }

          // Xử lý chất liệu
          const sqlDeleteMaterials = "DELETE FROM productMaterial WHERE productID = ?";
          db.query(sqlDeleteMaterials, [productID], (err2) => {
            if (err2) {
              console.error("Lỗi khi xóa chất liệu cũ:", err2);
              return db.rollback(() => callback(new Error("Lỗi khi xóa chất liệu cũ: " + err2.message), null));
            }

            if (materials && materials.length > 0) {
              const values = materials.map((m) => [
                productID,
                m.materialID,
                m.price !== undefined ? m.price : 0
              ]);
              const sqlInsertMaterials = "INSERT INTO productMaterial (productID, materialID, price) VALUES ?";
              db.query(sqlInsertMaterials, [values], (err3) => {
                if (err3) {
                  console.error("Lỗi khi chèn chất liệu mới:", err3);
                  return db.rollback(() => callback(new Error("Lỗi khi chèn chất liệu mới: " + err3.message), null));
                }

                // Xử lý ảnh
                const sqlDeleteImages = "DELETE FROM productImage WHERE productID = ?";
                db.query(sqlDeleteImages, [productID], (err4) => {
                  if (err4) {
                    console.error("Lỗi khi xóa ảnh cũ:", err4);
                    return db.rollback(() => callback(new Error("Lỗi khi xóa ảnh cũ: " + err4.message), null));
                  }

                  if (images && images.length > 0) {
                    const imageValues = images.map((img) => [
                      productID,
                      img.imageURL,
                      img.is_main ? 1 : 0
                    ]);
                    const sqlInsertImages = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                    db.query(sqlInsertImages, [imageValues], (err5) => {
                      if (err5) {
                        console.error("Lỗi khi chèn ảnh mới:", err5);
                        return db.rollback(() => callback(new Error("Lỗi khi chèn ảnh mới: " + err5.message), null));
                      }

                      db.commit((err6) => {
                        if (err6) {
                          console.error("Lỗi khi xác nhận giao dịch:", err6);
                          return db.rollback(() => callback(new Error("Lỗi khi xác nhận giao dịch: " + err6.message), null));
                        }
                        callback(null, { message: "Cập nhật sản phẩm thành công", success: true });
                      });
                    });
                  } else {
                    db.commit((err5) => {
                      if (err5) {
                        console.error("Lỗi khi xác nhận giao dịch:", err5);
                        return db.rollback(() => callback(new Error("Lỗi khi xác nhận giao dịch: " + err5.message), null));
                      }
                      callback(null, { message: "Cập nhật sản phẩm thành công", success: true });
                    });
                  }
                });
              });
            } else {
              // Xử lý ảnh khi không có chất liệu
              const sqlDeleteImages = "DELETE FROM productImage WHERE productID = ?";
              db.query(sqlDeleteImages, [productID], (err4) => {
                if (err4) {
                  console.error("Lỗi khi xóa ảnh cũ:", err4);
                  return db.rollback(() => callback(new Error("Lỗi khi xóa ảnh cũ: " + err4.message), null));
                }

                if (images && images.length > 0) {
                  const imageValues = images.map((img) => [
                    productID,
                    img.imageURL,
                    img.is_main ? 1 : 0
                  ]);
                  const sqlInsertImages = "INSERT INTO productImage (productID, imageURL, is_main) VALUES ?";
                  db.query(sqlInsertImages, [imageValues], (err5) => {
                    if (err5) {
                      console.error("Lỗi khi chèn ảnh mới:", err5);
                      return db.rollback(() => callback(new Error("Lỗi khi chèn ảnh mới: " + err5.message), null));
                    }

                    db.commit((err6) => {
                      if (err6) {
                        console.error("Lỗi khi xác nhận giao dịch:", err6);
                        return db.rollback(() => callback(new Error("Lỗi khi xác nhận giao dịch: " + err6.message), null));
                      }
                      callback(null, { message: "Cập nhật sản phẩm thành công", success: true });
                    });
                  });
                } else {
                  db.commit((err5) => {
                    if (err5) {
                      console.error("Lỗi khi xác nhận giao dịch:", err5);
                      return db.rollback(() => callback(new Error("Lỗi khi xác nhận giao dịch: " + err5.message), null));
                    }
                    callback(null, { message: "Cập nhật sản phẩm thành công", success: true });
                  });
                }
              });
            }
          });
        }
      );
    });
  });
};

Product.delete = (productID, callback) => {
  const sqlDeleteImages = "DELETE FROM productImage WHERE productID IN (?)";
  db.query(sqlDeleteImages, [productID], (err) => {
    if (err) {
      console.error("Lỗi khi xóa ảnh:", err);
      return callback(new Error("Lỗi khi xóa ảnh: " + err.message), null);
    }

    const sqlDeleteMaterials = "DELETE FROM productMaterial WHERE productID IN (?)";
    db.query(sqlDeleteMaterials, [productID], (err2) => {
      if (err2) {
        console.error("Lỗi khi xóa chất liệu:", err2);
        return callback(new Error("Lỗi khi xóa chất liệu: " + err2.message), null);
      }

      const sqlDeleteProduct = "DELETE FROM product WHERE productID IN (?)";
      db.query(sqlDeleteProduct, [productID], (err3, res) => {
        if (err3) {
          console.error("Lỗi khi xóa sản phẩm:", err3);
          return callback(new Error("Lỗi khi xóa sản phẩm: " + err3.message), null);
        }
        if (res.affectedRows === 0) {
          return callback(null, { message: "Không tìm thấy sản phẩm để xóa", success: false });
        }
        callback(null, { message: "Xóa sản phẩm thành công", success: true, affectedRows: res.affectedRows });
      });
    });
  });
};

module.exports = Product;