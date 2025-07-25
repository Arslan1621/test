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
    const { scenarios } = req.body;

    if (!scenarios || !Array.isArray(scenarios) || scenarios.length < 2) {
      return res.status(400).json({ error: 'At least 2 scenarios required' });
    }

    const processedScenarios = scenarios.map(scenario => {
      const {
        scenario_name,
        income_type,
        amount,
        filing_status = 'single',
        pre_tax_deductions = 0,
        state_tax_rate = 0,
        hours_per_week = 40,
        weeks_per_year = 52
      } = scenario;

      // Calculate annual gross income
      let grossIncome;
      switch (income_type) {
        case 'annual':
          grossIncome = amount;
          break;
        case 'monthly':
          grossIncome = amount * 12;
          break;
        case 'weekly':
          grossIncome = amount * 52;
          break;
        case 'biweekly':
          grossIncome = amount * 26;
          break;
        case 'hourly':
          grossIncome = amount * hours_per_week * weeks_per_year;
          break;
        default:
          grossIncome = amount;
      }

      // Calculate taxes (simplified version)
      const standardDeductions = {
        single: 15000,
        married_jointly: 30000,
        married_separately: 15000,
        head_of_household: 22500
      };

      const standardDeduction = standardDeductions[filing_status] || 15000;
      const taxableIncome = Math.max(0, grossIncome - pre_tax_deductions - standardDeduction);

      // Simplified tax calculation (approximate)
      let federalTax = 0;
      if (taxableIncome > 0) {
        if (taxableIncome <= 11600) {
          federalTax = taxableIncome * 0.10;
        } else if (taxableIncome <= 47150) {
          federalTax = 1160 + (taxableIncome - 11600) * 0.12;
        } else if (taxableIncome <= 100525) {
          federalTax = 5426 + (taxableIncome - 47150) * 0.22;
        } else if (taxableIncome <= 191950) {
          federalTax = 17168.5 + (taxableIncome - 100525) * 0.24;
        } else {
          federalTax = 39110.5 + (taxableIncome - 191950) * 0.32;
        }
      }

      // FICA taxes
      const socialSecurityTax = Math.min(grossIncome, 168600) * 0.062;
      const medicareTax = grossIncome * 0.0145;

      // State tax
      const stateTax = grossIncome * (state_tax_rate / 100);

      const totalTaxes = federalTax + socialSecurityTax + medicareTax + stateTax;
      const netIncome = grossIncome - totalTaxes;
      const effectiveTaxRate = (totalTaxes / grossIncome) * 100;

      return {
        scenario_name,
        gross_income: Math.round(grossIncome * 100) / 100,
        net_income: Math.round(netIncome * 100) / 100,
        total_taxes: Math.round(totalTaxes * 100) / 100,
        effective_tax_rate: Math.round(effectiveTaxRate * 100) / 100,
        monthly_net: Math.round((netIncome / 12) * 100) / 100
      };
    });

    res.status(200).json({ scenarios: processedScenarios });
  } catch (error) {
    console.error('Error comparing scenarios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

