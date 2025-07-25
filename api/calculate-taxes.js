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
    const {
      gross_income,
      filing_status = 'single',
      pre_tax_deductions = 0,
      additional_deductions = 0,
      state_tax_rate = 0
    } = req.body;

    if (!gross_income || gross_income <= 0) {
      return res.status(400).json({ error: 'Invalid gross income' });
    }

    // 2025 Tax Brackets
    const taxBrackets = {
      single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11600, max: 47150, rate: 0.12 },
        { min: 47150, max: 100525, rate: 0.22 },
        { min: 100525, max: 191950, rate: 0.24 },
        { min: 191950, max: 243725, rate: 0.32 },
        { min: 243725, max: 626350, rate: 0.35 },
        { min: 626350, max: Infinity, rate: 0.37 }
      ],
      married_jointly: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23200, max: 94300, rate: 0.12 },
        { min: 94300, max: 201050, rate: 0.22 },
        { min: 201050, max: 383900, rate: 0.24 },
        { min: 383900, max: 487450, rate: 0.32 },
        { min: 487450, max: 751600, rate: 0.35 },
        { min: 751600, max: Infinity, rate: 0.37 }
      ]
    };

    // Standard deductions for 2025
    const standardDeductions = {
      single: 15000,
      married_jointly: 30000,
      married_separately: 15000,
      head_of_household: 22500
    };

    // Calculate taxable income
    const standardDeduction = standardDeductions[filing_status] || standardDeductions.single;
    const totalDeductions = pre_tax_deductions + additional_deductions + standardDeduction;
    const taxableIncome = Math.max(0, gross_income - totalDeductions);

    // Calculate federal income tax
    const brackets = taxBrackets[filing_status] || taxBrackets.single;
    let federalTax = 0;

    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAtThisBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
        federalTax += taxableAtThisBracket * bracket.rate;
      }
    }

    // Calculate FICA taxes
    const socialSecurityRate = 0.062;
    const medicareRate = 0.0145;
    const additionalMedicareRate = 0.009;
    const socialSecurityWageBase = 168600; // 2025 limit

    const socialSecurityTax = Math.min(gross_income, socialSecurityWageBase) * socialSecurityRate;
    let medicareTax = gross_income * medicareRate;

    // Additional Medicare tax for high earners
    const additionalMedicareThreshold = filing_status === 'married_jointly' ? 250000 : 200000;
    if (gross_income > additionalMedicareThreshold) {
      medicareTax += (gross_income - additionalMedicareThreshold) * additionalMedicareRate;
    }

    // Calculate state tax
    const stateTax = gross_income * (state_tax_rate / 100);

    // Calculate totals
    const totalTaxes = federalTax + socialSecurityTax + medicareTax + stateTax;
    const netIncome = gross_income - totalTaxes;
    const effectiveTaxRate = (totalTaxes / gross_income) * 100;

    const result = {
      gross_income: Math.round(gross_income * 100) / 100,
      taxable_income: Math.round(taxableIncome * 100) / 100,
      federal_tax: Math.round(federalTax * 100) / 100,
      fica_taxes: {
        social_security: Math.round(socialSecurityTax * 100) / 100,
        medicare: Math.round(medicareTax * 100) / 100
      },
      state_tax: Math.round(stateTax * 100) / 100,
      total_taxes: Math.round(totalTaxes * 100) / 100,
      net_income: Math.round(netIncome * 100) / 100,
      effective_tax_rate: Math.round(effectiveTaxRate * 100) / 100,
      monthly_net_income: Math.round((netIncome / 12) * 100) / 100,
      weekly_net_income: Math.round((netIncome / 52) * 100) / 100,
      biweekly_net_income: Math.round((netIncome / 26) * 100) / 100,
      standard_deduction: standardDeduction,
      total_deductions: Math.round(totalDeductions * 100) / 100
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Error calculating taxes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

