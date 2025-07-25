// API Base URL
const API_BASE = '/api';

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const incomeForm = document.getElementById('income-form');
const taxForm = document.getElementById('tax-form');
const compareBtn = document.getElementById('compare-btn');
const incomeTypeSelect = document.getElementById('income-type');
const hourlyFields = document.querySelector('.hourly-fields');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeForms();
    loadTaxBrackets();
});

// Tab functionality
function initializeTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Update tab buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update tab content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// Form initialization
function initializeForms() {
    // Income form
    incomeForm.addEventListener('submit', handleIncomeCalculation);
    incomeTypeSelect.addEventListener('change', toggleHourlyFields);
    
    // Tax form
    taxForm.addEventListener('submit', handleTaxCalculation);
    
    // Compare scenarios
    compareBtn.addEventListener('click', handleScenarioComparison);
}

function toggleHourlyFields() {
    const isHourly = incomeTypeSelect.value === 'hourly';
    hourlyFields.style.display = isHourly ? 'block' : 'none';
}

// Income calculation
async function handleIncomeCalculation(e) {
    e.preventDefault();
    
    const formData = new FormData(incomeForm);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.amount = parseFloat(data.amount);
    if (data.hours_per_week) data.hours_per_week = parseInt(data.hours_per_week);
    if (data.weeks_per_year) data.weeks_per_year = parseInt(data.weeks_per_year);
    
    try {
        showLoading(incomeForm);
        const response = await fetch(`${API_BASE}/calculate-annual-income`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Calculation failed');
        }
        
        const result = await response.json();
        displayIncomeResults(result);
        
    } catch (error) {
        showError('Failed to calculate income. Please check your inputs.');
        console.error('Income calculation error:', error);
    } finally {
        hideLoading(incomeForm);
    }
}

function displayIncomeResults(data) {
    document.getElementById('annual-income').textContent = formatCurrency(data.annual_gross_income);
    document.getElementById('monthly-income').textContent = formatCurrency(data.monthly_gross_income);
    document.getElementById('weekly-income').textContent = formatCurrency(data.weekly_gross_income);
    document.getElementById('biweekly-income').textContent = formatCurrency(data.biweekly_gross_income);
    document.getElementById('hourly-equivalent').textContent = formatCurrency(data.hourly_equivalent);
    
    document.getElementById('income-results').style.display = 'block';
    document.getElementById('income-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Tax calculation
async function handleTaxCalculation(e) {
    e.preventDefault();
    
    const formData = new FormData(taxForm);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    data.gross_income = parseFloat(data.gross_income);
    data.pre_tax_deductions = parseFloat(data.pre_tax_deductions) || 0;
    data.additional_deductions = parseFloat(data.additional_deductions) || 0;
    data.state_tax_rate = parseFloat(data.state_tax_rate) || 0;
    
    try {
        showLoading(taxForm);
        const response = await fetch(`${API_BASE}/calculate-taxes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error('Tax calculation failed');
        }
        
        const result = await response.json();
        displayTaxResults(result);
        
    } catch (error) {
        showError('Failed to calculate taxes. Please check your inputs.');
        console.error('Tax calculation error:', error);
    } finally {
        hideLoading(taxForm);
    }
}

function displayTaxResults(data) {
    // Tax summary
    document.getElementById('tax-gross-income').textContent = formatCurrency(data.gross_income);
    document.getElementById('total-taxes').textContent = formatCurrency(data.total_taxes);
    document.getElementById('net-income').textContent = formatCurrency(data.net_income);
    document.getElementById('effective-rate').textContent = data.effective_tax_rate.toFixed(2) + '%';
    
    // Tax details
    document.getElementById('federal-tax').textContent = formatCurrency(data.federal_tax);
    document.getElementById('social-security').textContent = formatCurrency(data.fica_taxes.social_security);
    document.getElementById('medicare').textContent = formatCurrency(data.fica_taxes.medicare);
    document.getElementById('state-tax').textContent = formatCurrency(data.state_tax);
    
    // Net income breakdown
    document.getElementById('monthly-net').textContent = formatCurrency(data.monthly_net_income);
    document.getElementById('weekly-net').textContent = formatCurrency(data.weekly_net_income);
    document.getElementById('biweekly-net').textContent = formatCurrency(data.biweekly_net_income);
    
    document.getElementById('tax-results').style.display = 'block';
    document.getElementById('tax-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Scenario comparison
async function handleScenarioComparison() {
    const scenarios = [];
    
    // Collect data for both scenarios
    for (let i = 0; i < 2; i++) {
        const scenarioCard = document.querySelector(`[data-scenario="${i}"]`);
        const scenarioName = scenarioCard.querySelector('.scenario-name').value || `Scenario ${i + 1}`;
        const incomeType = scenarioCard.querySelector('.scenario-income-type').value;
        const amount = parseFloat(scenarioCard.querySelector('.scenario-amount').value);
        const filingStatus = scenarioCard.querySelector('.scenario-filing-status').value;
        const preTaxDeductions = parseFloat(scenarioCard.querySelector('.scenario-pretax').value) || 0;
        const stateTaxRate = parseFloat(scenarioCard.querySelector('.scenario-state-rate').value) || 0;
        
        // Handle hourly rate specifics
        let hoursPerWeek = 40;
        let weeksPerYear = 52;
        
        if (incomeType === 'hourly') {
            const hoursInput = scenarioCard.querySelector('.scenario-hours');
            const weeksInput = scenarioCard.querySelector('.scenario-weeks');
            if (hoursInput) hoursPerWeek = parseInt(hoursInput.value) || 40;
            if (weeksInput) weeksPerYear = parseInt(weeksInput.value) || 52;
        }
        
        if (!amount || amount <= 0) {
            showError(`Please enter a valid amount for ${scenarioName}`);
            return;
        }
        
        scenarios.push({
            scenario_name: scenarioName,
            income_type: incomeType,
            amount: amount,
            filing_status: filingStatus,
            pre_tax_deductions: preTaxDeductions,
            state_tax_rate: stateTaxRate,
            hours_per_week: hoursPerWeek,
            weeks_per_year: weeksPerYear
        });
    }
    
    try {
        showLoading(compareBtn);
        const response = await fetch(`${API_BASE}/compare-scenarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scenarios })
        });
        
        if (!response.ok) {
            throw new Error('Comparison failed');
        }
        
        const result = await response.json();
        displayComparisonResults(result.scenarios);
        
    } catch (error) {
        showError('Failed to compare scenarios. Please check your inputs.');
        console.error('Comparison error:', error);
    } finally {
        hideLoading(compareBtn);
    }
}

function displayComparisonResults(scenarios) {
    if (scenarios.length < 2) return;
    
    const [scenario1, scenario2] = scenarios;
    
    // Update headers
    document.getElementById('scenario-1-header').textContent = scenario1.scenario_name;
    document.getElementById('scenario-2-header').textContent = scenario2.scenario_name;
    
    // Update values
    document.getElementById('comp-gross-1').textContent = formatCurrency(scenario1.gross_income);
    document.getElementById('comp-gross-2').textContent = formatCurrency(scenario2.gross_income);
    document.getElementById('comp-gross-diff').textContent = formatCurrency(scenario2.gross_income - scenario1.gross_income);
    
    document.getElementById('comp-net-1').textContent = formatCurrency(scenario1.net_income);
    document.getElementById('comp-net-2').textContent = formatCurrency(scenario2.net_income);
    document.getElementById('comp-net-diff').textContent = formatCurrency(scenario2.net_income - scenario1.net_income);
    
    document.getElementById('comp-taxes-1').textContent = formatCurrency(scenario1.total_taxes);
    document.getElementById('comp-taxes-2').textContent = formatCurrency(scenario2.total_taxes);
    document.getElementById('comp-taxes-diff').textContent = formatCurrency(scenario2.total_taxes - scenario1.total_taxes);
    
    document.getElementById('comp-rate-1').textContent = scenario1.effective_tax_rate.toFixed(2) + '%';
    document.getElementById('comp-rate-2').textContent = scenario2.effective_tax_rate.toFixed(2) + '%';
    document.getElementById('comp-rate-diff').textContent = (scenario2.effective_tax_rate - scenario1.effective_tax_rate).toFixed(2) + '%';
    
    document.getElementById('comp-monthly-1').textContent = formatCurrency(scenario1.monthly_net);
    document.getElementById('comp-monthly-2').textContent = formatCurrency(scenario2.monthly_net);
    document.getElementById('comp-monthly-diff').textContent = formatCurrency(scenario2.monthly_net - scenario1.monthly_net);
    
    // Color code differences
    const diffElements = [
        'comp-gross-diff', 'comp-net-diff', 'comp-taxes-diff', 
        'comp-rate-diff', 'comp-monthly-diff'
    ];
    
    diffElements.forEach(id => {
        const element = document.getElementById(id);
        const value = parseFloat(element.textContent.replace(/[$,%]/g, ''));
        
        if (value > 0) {
            element.style.color = '#10b981'; // Green for positive
        } else if (value < 0) {
            element.style.color = '#ef4444'; // Red for negative
        } else {
            element.style.color = '#6b7280'; // Gray for zero
        }
    });
    
    document.getElementById('comparison-results').style.display = 'block';
    document.getElementById('comparison-results').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Load tax brackets
async function loadTaxBrackets() {
    try {
        const response = await fetch(`${API_BASE}/tax-brackets`);
        if (!response.ok) {
            throw new Error('Failed to load tax brackets');
        }
        
        const data = await response.json();
        displayTaxBrackets(data);
        
    } catch (error) {
        console.error('Failed to load tax brackets:', error);
    }
}

function displayTaxBrackets(data) {
    // Single filers
    const singleBrackets = document.getElementById('single-brackets');
    singleBrackets.innerHTML = '';
    
    data.single.forEach(bracket => {
        const row = document.createElement('tr');
        const maxIncome = bracket.max ? formatCurrency(bracket.max) : 'No limit';
        row.innerHTML = `
            <td>${bracket.rate}%</td>
            <td>${formatCurrency(bracket.min)} - ${maxIncome}</td>
        `;
        singleBrackets.appendChild(row);
    });
    
    // Married filing jointly
    const marriedBrackets = document.getElementById('married-brackets');
    marriedBrackets.innerHTML = '';
    
    data.married_jointly.forEach(bracket => {
        const row = document.createElement('tr');
        const maxIncome = bracket.max ? formatCurrency(bracket.max) : 'No limit';
        row.innerHTML = `
            <td>${bracket.rate}%</td>
            <td>${formatCurrency(bracket.min)} - ${maxIncome}</td>
        `;
        marriedBrackets.appendChild(row);
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showLoading(element) {
    element.classList.add('loading');
    element.style.position = 'relative';
}

function hideLoading(element) {
    element.classList.remove('loading');
}

function showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(errorDiv);
        }, 300);
    }, 5000);
}

// Add CSS for error notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);



// Add event listeners for scenario income type changes
document.addEventListener('DOMContentLoaded', function() {
    // Add listeners for scenario income type changes
    const scenarioIncomeTypes = document.querySelectorAll('.scenario-income-type');
    scenarioIncomeTypes.forEach((select, index) => {
        select.addEventListener('change', function() {
            toggleScenarioHourlyFields(index, this.value);
        });
    });
});

function toggleScenarioHourlyFields(scenarioIndex, incomeType) {
    const hourlyDetails = document.getElementById(`scenario-${scenarioIndex + 1}-hourly`);
    if (hourlyDetails) {
        hourlyDetails.style.display = incomeType === 'hourly' ? 'block' : 'none';
    }
}

