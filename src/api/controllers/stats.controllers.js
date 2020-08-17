const service = require('../services/stats.service');

function getStats(req, res) {
  service.selectAllStats((error, result) => {
    if (error) {
      res.status(500).json(error);
      return;
    }

    if (result && result.length) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).send();
    }
  });
}

module.exports = {
  getStats
};