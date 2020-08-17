const db = require('../database/connection');

function selectAllStats(callback) {
  const query = `
  SELECT\
    SUM(sales.total_sales) as totalProductsSold,\
    SUM(price.price) as totalProductRevenue,\
    AVG(price.price) as averageProductPrice\
  FROM wp_posts\
  JOIN (\
    SELECT post_id, meta_value AS total_sales FROM wp_postmeta WHERE meta_key='total_sales'\
  ) AS sales\
    ON sales.post_id=wp_posts.ID\
  JOIN (\
    SELECT post_id, meta_value AS price FROM wp_postmeta WHERE meta_key='_price'\
  ) as price\
    ON price.post_id=wp_posts.ID\
  WHERE post_type='product'`;

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