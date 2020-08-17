const express = require('express');
const router = express.Router();
const controller = require('../controllers/product.controllers');

/* GET all products. */
router.get('/', controller.getAllProducts);

/* GET a product */
router.get('/:productId', controller.getProduct);

/* CREATE a product. */
router.post('/', controller.postProduct);

/* UPDATE a product. */
router.put('/:productId', controller.putProduct);

/* DELETE a product. */
router.delete('/:productId', controller.deleteProduct);

module.exports = router;
