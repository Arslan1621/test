export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { income_type, amount, hours_per_week = 40, weeks_per_year = 52 } = req.body;

    if (!income_type || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid input parameters' });
    }

    let annualGrossIncome;

    // Convert to annual income based on type
    switch (income_type) {
      case 'annual':
        annualGrossIncome = amount;
        break;
      case 'monthly':
        annualGrossIncome = amount * 12;
        break;
      case 'weekly':
        annualGrossIncome = amount * 52;
        break;
      case 'biweekly':
        annualGrossIncome = amount * 26;
        break;
      case 'hourly':
        annualGrossIncome = amount * hours_per_week * weeks_per_year;
        break;
      default:
        return res.status(400).json({ error: 'Invalid income type' });
    }

    // Calculate other periods
    const monthlyGrossIncome = annualGrossIncome / 12;
    const weeklyGrossIncome = annualGrossIncome / 52;
    const biweeklyGrossIncome = annualGrossIncome / 26;
    const hourlyEquivalent = annualGrossIncome / (40 * 52); // Standard 40 hours/week, 52 weeks/year

    const result = {
      annual_gross_income: Math.round(annualGrossIncome * 100) / 100,
      monthly_gross_income: Math.round(monthlyGrossIncome * 100) / 100,
      weekly_gross_income: Math.round(weeklyGrossIncome * 100) / 100,
      biweekly_gross_income: Math.round(biweeklyGrossIncome * 100) / 100,
      hourly_equivalent: Math.round(hourlyEquivalent * 100) / 100
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating income:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

