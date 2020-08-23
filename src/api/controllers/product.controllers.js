const service = require('../services/product.service');

/* UTILS */
// TODO: Modularizar
function validate(object, model) {
  const keys = Object.keys(object);
  
  return {
    missing: Object.keys(model)
    .filter( // catch missing attributes
      (attr) => (!keys.includes(attr))
    ),
    
    wrongTyped: Object.entries(object)
    .map( // catch wrong typed attributes
      (entry) => {
        if (typeof(entry[1]) !== model[entry[0]]) return entry[0];
      }
    )
    .filter((i) => (i)), // remove null values
    
    negativeNumber: Object.entries(object)
    .filter( // filter numeric values
      (entry) => ( typeof(entry[1]) == 'number' )
    )
    .map( // catch negative values
      (entry) => {
        if (entry[1] < 0) return entry[0];
      }
    )
    .filter((i) => (i)) // remove null values
  };
}

function validateProduct(product) {
  const model = {
    productName: 'string',
    productDescription: 'string',
    productPrice: 'number',
    productStock: 'number'
  }

  const validation = validate(product, model);
  let message = '';
  let ok = true;

  if (validation.missing.length || validation.wrongTyped.length || validation.negativeNumber.length) {
    ok = false;
    
    const missingAttributesMessage = 'Atributos obrigatórios não foram encontrados na requisição ou estão com uma sintaxe inválida: \n' + validation.missing + '.\n\n';
    const wrongTypedMessage = 'O tipo de um ou mais atributos não corresponde ao esperado pelo servidor: \n' + validation.wrongTyped + '.\n\n';
    const negativeNumberMessage = 'O valor fornecido para um ou mais atributos não pode ser menor que zero: \n' + validation.negativeNumber + '.\n\n';

    if (validation.missing.length) message += missingAttributesMessage;
    if (validation.wrongTyped.length) message += wrongTypedMessage;
    if (validation.negativeNumber.length) message += negativeNumberMessage;
  }

  return {
    message: message,
    ok: ok
  };
}

/* CONTROLLER METHODS */
function getAllProducts (req, res) {
  service.selectAllProducts((error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    res.status(200).json(result);
  });
}

function getProduct (req, res) {
  // TODO: Validar dado de entrada
  const productId = req.params.productId;
  
  service.selectProduct(productId, (error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    if (result && result.length) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).send('O código de produto informado não existe!');
    }
  });
}

function postProduct (req, res) {
  const productValidation = validateProduct(req.body);
  if (!productValidation.ok) {
    res.status(400).send(productValidation.message);
    return;
  }

  const product = req.body;

  service.insertProduct(product, (error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    const responseData = {
      productUri: 'http://'+req.headers.host+req.baseUrl+'/'+result.productId
    };

    res.status(201).json(responseData);
  });
}

function putProduct (req, res) {
  // TODO: Validar dado de entrada
  const productId = req.params.productId;

  const productValidation = validateProduct(req.body);
  if (!productValidation.ok) {
    res.status(400).send(productValidation.message);
    return;
  }

  const product = req.body;
  product.productId = productId;

  service.updateProduct(product, (error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    const responseData = {
      productUri: 'http://'+req.headers.host+req.baseUrl+'/'+productId
    };

    if (result && result.affectedRows > 0) {
      res.status(201).json(responseData);
    } else {
      const message = 'O código de produto informado não existe, nenhum dado foi alterado!';
      res.status(404).send(message);
    }
  });
}

function deleteProduct (req, res) {
  // TODO: Validar dado de entrada
  const productId = req.params.productId;

  service.deleteProduct(productId, (error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    let message = '';
    if (result && result.affectedRows > 0) {
      message = 'O produto foi excluído!'
      res.status(200).json({message: message});
    } else {
      message = 'O código de produto informado não existe, nenhum dado foi excluído!';
      res.status(404).send(message);
    }
  });
}

module.exports = {
  getAllProducts,
  getProduct,
  postProduct,
  putProduct,
  deleteProduct
}