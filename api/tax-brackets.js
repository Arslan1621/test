export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const taxBrackets = {
      single: [
        { rate: 10, min: 0, max: 11600 },
        { rate: 12, min: 11600, max: 47150 },
        { rate: 22, min: 47150, max: 100525 },
        { rate: 24, min: 100525, max: 191950 },
        { rate: 32, min: 191950, max: 243725 },
        { rate: 35, min: 243725, max: 626350 },
        { rate: 37, min: 626350, max: null }
      ],
      married_jointly: [
        { rate: 10, min: 0, max: 23200 },
        { rate: 12, min: 23200, max: 94300 },
        { rate: 22, min: 94300, max: 201050 },
        { rate: 24, min: 201050, max: 383900 },
        { rate: 32, min: 383900, max: 487450 },
        { rate: 35, min: 487450, max: 751600 },
        { rate: 37, min: 751600, max: null }
      ],
      standard_deductions: {
        single: 15000,
        married_jointly: 30000,
        married_separately: 15000,
        head_of_household: 22500
      },
      fica_rates: {
        social_security: 6.2,
        medicare: 1.45,
        additional_medicare: 0.9,
        social_security_wage_base: 168600
      }
    };

    res.status(200).json(taxBrackets);
  } catch (error) {
    console.error('Error fetching tax brackets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

