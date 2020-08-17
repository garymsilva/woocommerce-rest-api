const db = require('../database/connection');

function selectAllProducts (callback) {
  const query = `
  SELECT\
    p.ID AS productId,\
    p.post_title AS productName,\
    p.post_content AS productDescription,\
    price.meta_value AS productPrice,\
    stock.meta_value AS productStock\
  FROM wp_posts as p\
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_price") AS price\
	  ON price.post_id = p.ID\
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_stock") AS stock\
    ON stock.post_id = p.ID\
  WHERE\
  	p.post_type="product"`;

  db.getConnection().query(query, (error, result) => {
    if (error) {
      console.log('ProductService.selectAllProducts() - Error executing query.\n', error);
      callback(error);
      return;
    }

    callback(error, result); // TODO: Tratar a formatação do texto.
  });
}

function selectProduct (productId, callback) {
  const query = `
  SELECT\
    p.ID AS productId,\
    p.post_title AS productName,\
    p.post_content AS productDescription,\
    price.meta_value AS productPrice,\
    stock.meta_value AS productStock\
  FROM wp_posts AS p\
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_price") AS price\
	  ON price.post_id = p.ID\
  JOIN (SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key="_stock") AS stock\
    ON stock.post_id = p.ID\
  WHERE\
    p.post_type="product"\
    AND\
    p.ID=?`;

  db.getConnection().query(query, productId, (error, result) => {
    if (error) {
      console.log('ProductService.selectProduct() - Error executing query.\n', error);
      callback(error);
      return;
    }

    callback(error, result); // TODO: Tratar a formatação do texto.
  });
}

function insertProduct (product, callback) {
  const conn = db.getConnection();

  conn.beginTransaction((error) => {
    if (error) {
      console.log('ProductService.insertProduct() - Error beginning transaction.\n', error);
      callback(error);
      return;
    }

    const query1 = `
    INSERT INTO wp_posts (\
      post_author,\
      post_date,\
      post_date_gmt,\
      post_content,\
      post_title,\
      post_excerpt,\
      ping_status,\
      to_ping,\
      pinged,\
      post_content_filtered,\
      post_type\
    )\
    values (1, now(), adddate(now(), interval 3 hour), ?, ?, "", "closed", "", "", "", "product")`;

    const query1Params = [
      product.productDescription, // post_content
      product.productName, // post_title
    ];

    conn.query(query1, query1Params, function (error, results) {
      if (error) {
        console.log('ProductService.insertProduct() - Error executing query 1.\n', error);
        callback(error);
        return conn.rollback((error) => {
          console.log('ProductService.insertProduct() - Error rolling back query 1.\n', error);
        });
      }

      const productId = results.insertId;

      const query2 =`
      INSERT INTO wp_postmeta (\
        post_id,\
        meta_key,\
        meta_value\
      )\
      values (?, '_stock', ?), (?, '_price', ?)`;

      const query2Params = [
        productId,
        product.productStock,
        productId,
        product.productPrice
      ];

      conn.query(query2, query2Params, function (error, results) {
        if (error) {
          console.log('ProductService.insertProduct() - Error executing query 2.\n', error);
          callback(error);
          return conn.rollback((error) => {
            console.log('ProductService.insertProduct() - Error rolling back query 2.\n', error);
          });
        }

        conn.commit(function (error) {
          if (error) {
            console.log('ProductService.insertProduct() - Error commiting transaction.\n', error);
            callback(error);
            return conn.rollback((error) => {
              console.log('ProductService.insertProduct() - Error rolling back commit.\n', error);
            });
          }

          callback(error, {
            productId: productId
          });
        }); // commit
      }); // query 2
    }); // query 1
  }); // begin transaction
}

function updateProduct (product, callback) {
  const conn = db.getConnection();

  conn.beginTransaction((error) => {
    if (error) {
      console.log('ProductService.updateProduct() - Error beginning transaction.\n', error);
      callback(error);
      return;
    }

    const query1 = `
    UPDATE wp_posts\
    SET\
      post_content=?,\
      post_title=?,\
      post_modified=NOW(),\
      post_modified_gmt=ADDDATE(NOW(), INTERVAL 3 HOUR)\
    WHERE ID=?`;

    const query1Params = [
      product.productDescription, // post_content
      product.productName, // post_title
      product.productId // ID
    ];

    conn.query(query1, query1Params, function (error, result) {
      if (error) {
        console.log('ProductService.updateProduct() - Error executing query 1.\n', error);
        callback(error);
        return conn.rollback((error) => {
          console.log('ProductService.updateProduct() - Error rolling back query 1.\n', error);
        });
      }

      const query2 =`
      UPDATE wp_postmeta\
      SET\
        meta_value=?\
      WHERE post_id=? AND meta_key='_price'`;

      const query2Params = [
        product.productPrice, // meta_value
        product.productId // post_id
      ];

      conn.query(query2, query2Params, function (error, result) {
        if (error) {
          console.log('ProductService.updateProduct() - Error executing query 2.\n', error);
          callback(error);
          return conn.rollback((error) => {
            console.log('ProductService.updateProduct() - Error rolling back query 2.\n', error);
          });
        }

        const query3 = `
        UPDATE wp_postmeta\
        SET\
          meta_value=?\
        WHERE post_id=? AND meta_key='_stock'`;

        const query3Params = [
          product.productStock, // meta_value
          product.productId // post_id
        ];

        conn.query(query3, query3Params, function (error, result) {
          if (error) {
            console.log('ProductService.updateProduct() - Error executing query 3.\n', error);
            callback(error);
            return conn.rollback((error) => {
              console.log('ProductService.updateProduct() - Error rolling back query 3.\n', error);
            });
          }

          conn.commit(function (error) {
            if (error) {
              console.log('ProductService.updateProduct() - Error commiting transaction.\n', error);
              callback(error);
              return conn.rollback((error) => {
                console.log('ProductService.updateProduct() - Error rolling back commit.\n', error);
              });
            }
  
            callback(error, {
              productId: product.productId
            });
          }); // commit
        }); // query 3
      }); // query 2
    }); // query 1
  }); // begin transaction
}

function deleteProduct (productId, callback) {
  const conn = db.getConnection();

  conn.beginTransaction(function (error) {
    if (error) {
      console.log('ProductService.deleteProduct() - Error beginning transaction.\n', error);
      callback(error);
      return;
    }

    const query1 = `DELETE FROM wp_posts WHERE ID=?`;

    conn.query(query1, productId, function (error, result) {
      if (error) {
        console.log('ProductService.deleteProduct() - Error executing query 1.\n', error);
        callback(error);
        return conn.rollback((error) => {
          console.log('ProductService.deleteProduct() - Error rolling back query 1.\n', error);
        });
      }

      const query2 = `DELETE FROM wp_postmeta WHERE post_id=?`;

      conn.query(query2, productId, function (error, result) {
        if (error) {
          console.log('ProductService.deleteProduct() - Error executing query 2.\n', error);
          callback(error);
          return conn.rollback((error) => {
            console.log('ProductService.deleteProduct() - Error rolling back query 2.\n', error);
          });
        }

        conn.commit(function (error) {
          if (error) {
            console.log('ProductService.deleteProduct() - Error commiting transaction.\n', error);
            callback(error);
            return conn.rollback((error) => {
              console.log('ProductService.deleteProduct() - Error rolling back commit.\n', error);
            });
          }

          callback(error, result);
        }); // commit
      }); // query 2
    }); // query 1
  }); // begin transaction
}

module.exports = {
  selectAllProducts,
  selectProduct,
  insertProduct,
  updateProduct,
  deleteProduct
};