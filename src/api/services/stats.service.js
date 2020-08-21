const db = require('../database/connection');

function selectAllStats(callback) {

  const query = `
  SELECT\
    SUM(num_items_sold) AS totalProductsSold,\
    SUM(total_sales) AS totalProductRevenue,\
    (SUM(total_sales) / SUM(num_items_sold)) AS averageProductPrice\
  FROM wp_wc_order_stats`;

  db.getConnection().query(query, function (error, result) {
    if (error) {
      console.log('StatsService.selectAllStats() - error executing query.\n', error);
      callback(error);
      return;
    }

    callback(error, result);
  });
}

module.exports = {
  selectAllStats
};