const apiBaseUrl = window.location.origin + '/webservice';
const apiProductUrl = apiBaseUrl + '/produto';
const apiStatsUrl = apiBaseUrl + '/stats';

$('.app-product-url').text(apiProductUrl+'/');
$('.app-stats-url').text(apiStatsUrl+'/');

const jsonFormattedProductTemplate = JSON.stringify({
  "productName": "string",
  "productDescription": "string",
  "productPrice": 0,
  "productStock": 0
}, null, 2);

$('.product-body-template').text(jsonFormattedProductTemplate);
$('#post-product-body').val(jsonFormattedProductTemplate);
$('#put-product-body').val(jsonFormattedProductTemplate);

function setContentToView(viewId, content) {
  $('#'+viewId).text(JSON.stringify(content, null, 2));
}

function getErrorObject(err) {
  function formatString(string) {
    while (string.includes('\n')) {
      string = string.replace('\n', ' ');
    }
    return string.trim();
  }

  return {
    status: err.status,
    message: formatString(err.responseText) || err.statusText
  }
}

function getAllProducts() {
  $.get(apiProductUrl, (result) => setContentToView('list-product-code', result))
  .fail((err) => setContentToView('list-product-code', getErrorObject(err)));
}

function getOneProduct() {
  const productId = $('#get-product-input').val();

  $.get(`${apiProductUrl}/${productId}`, (result) => setContentToView('get-product-code', result))
  .fail((err) => setContentToView('get-product-code', getErrorObject(err)));
}

function postProduct() {  
  const productData = JSON.parse($('#post-product-body').val());
  
  $.ajax({
    method: 'POST',
    url: apiProductUrl,
    data: JSON.stringify(productData),
    dataType: 'json',
    contentType: 'application/json',
    success: (result) => setContentToView('post-product-code', result)
  })
  .fail((err) => setContentToView('post-product-code', getErrorObject(err)));
}

function putProduct() {
  const productId = $('#put-product-input').val();
  const productData = JSON.parse($('#put-product-body').val());
  $.ajax({
    method: 'PUT',
    url: `${apiProductUrl}/${productId}`,
    data: JSON.stringify(productData),
    dataType: 'json',
    contentType: 'application/json',
    success: (result) => setContentToView('put-product-code', result)
  })
  .fail((err) => setContentToView('put-product-code', getErrorObject(err)));
}

function deleteProduct() {
  const productId = $('#delete-product-input').val();
  $.ajax({
    method: 'DELETE',
    url: `${apiProductUrl}/${productId}`,
    success: (result) => setContentToView('delete-product-code', result)
  })
  .fail((err) => setContentToView('delete-product-code', getErrorObject(err)));
}

function getStats() {
  $.get(apiStatsUrl, (result) => setContentToView('get-stats-code', result))
  .fail((err) => setContentToView('get-stats-code', getErrorObject(err)));
}

const formSubmitSettings = [
  {
    formId: 'list-product-form',
    submitMethod: getAllProducts
  },
  {
    formId: 'get-product-form',
    submitMethod: getOneProduct
  },
  {
    formId: 'post-product-form',
    submitMethod: postProduct
  },
  {
    formId: 'put-product-form',
    submitMethod: putProduct
  },
  {
    formId: 'delete-product-form',
    submitMethod: deleteProduct
  },
  {
    formId: 'get-stats-form',
    submitMethod: getStats
  }
];

formSubmitSettings.forEach((form) => {
  $('#'+form.formId).submit((e) => {
    e.preventDefault();
    form.submitMethod();
  });
});

