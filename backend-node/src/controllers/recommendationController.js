const matchEngine = require('../services/matchEngine');

const recommendJobs = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Missing studentId parameter' });
    }

    const recommendations = await matchEngine.getRecommendations(studentId);
    
    res.status(200).json({
      message: 'Recommendations generated',
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: error.message || 'Failed to get recommendations' });
  }
};

module.exports = {
  recommendJobs
};
