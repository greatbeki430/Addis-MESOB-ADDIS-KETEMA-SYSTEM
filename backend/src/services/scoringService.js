// Weighted Scoring Service for Evaluation
const calculateTotalScore = (scores) => {
  const weights = { c1: 25, c2: 22, c3: 23, c4: 15, c5: 15 };

  let total = 0;
  Object.keys(weights).forEach((key) => {
    if (scores[key]) {
      total += (scores[key] || 0) * (weights[key] / 100);
    }
  });

  return Math.round(total);
};

const determineBestPerformer = (memberScores) => {
  return memberScores.reduce((best, current) =>
    current.total > best.total ? current : best,
  );
};

module.exports = { calculateTotalScore, determineBestPerformer };
