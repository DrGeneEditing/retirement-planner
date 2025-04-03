document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const initialInvestmentInput = document.getElementById('initialInvestment');
    const initialInvestmentSlider = document.getElementById('initialInvestmentSlider');
    const initialInvestmentValueDisplay = document.getElementById('initialInvestmentValue');

    const contributionAmountInput = document.getElementById('contributionAmount');
    const contributionAmountSlider = document.getElementById('contributionAmountSlider');
    const contributionAmountValueDisplay = document.getElementById('contributionAmountValue');

    const frequencyInputs = document.querySelectorAll('input[name="frequency"]');

    const rateOfReturnInput = document.getElementById('rateOfReturn');
    const rateOfReturnSlider = document.getElementById('rateOfReturnSlider');
    const rateOfReturnValueDisplay = document.getElementById('rateOfReturnValue');

    const yearsToSaveInput = document.getElementById('yearsToSave');
    const yearsToSaveSlider = document.getElementById('yearsToSaveSlider');
    const yearsToSaveValueDisplay = document.getElementById('yearsToSaveValue');

    // Output Elements
    const finalBalanceDisplay = document.getElementById('finalBalance');
    const totalContributionsDisplay = document.getElementById('totalContributions');
    const totalInterestDisplay = document.getElementById('totalInterest');
    const tableBody = document.getElementById('tableBody');
    const chartCanvas = document.getElementById('projectionChart');

    // --- Chart.js Setup ---
    let projectionChart; // Variable to hold the chart instance

    function initializeChart() {
        const ctx = chartCanvas.getContext('2d');
        projectionChart = new Chart(ctx, {
            type: 'line', // Use 'line' or 'bar'
            data: {
                labels: [], // Years will go here
                datasets: [{
                    label: 'Savings Balance ($)',
                    data: [], // Balance data will go here
                    borderColor: '#3498db', // Blue line
                    backgroundColor: 'rgba(52, 152, 219, 0.1)', // Light blue fill
                    fill: true,
                    tension: 0.1 // Slightly smooth the line
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            // Format Y-axis labels as currency
                            callback: function(value, index, values) {
                                return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
                            }
                        }
                    },
                    x: {
                         ticks: {
                             maxTicksLimit: 15 // Limit number of year labels shown for readability
                         }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Calculation Logic ---
    function calculateProjection(initial, contribAmount, frequency, rate, years) {
        let currentBalance = initial;
        const monthlyRate = rate / 12 / 100;
        const tableData = [];
        const chartLabels = [0]; // Start chart at year 0
        const chartBalances = [initial]; // Initial balance at year 0
        let totalContributions = 0;
        let totalInterest = 0;

        for (let year = 1; year <= years; year++) {
            const startingBalanceYear = currentBalance;
            let interestEarnedYear = 0;
            let contributionYear = 0;

            if (frequency === 'monthly') {
                contributionYear = contribAmount * 12;
                for (let month = 1; month <= 12; month++) {
                    // Add contribution at the beginning of the month/period
                    currentBalance += contribAmount;
                    const monthlyInterest = currentBalance * monthlyRate;
                    interestEarnedYear += monthlyInterest;
                    currentBalance += monthlyInterest;
                }
            } else { // Yearly contribution
                contributionYear = contribAmount;
                 // Add contribution at the start of the year
                currentBalance += contributionYear;
                // Calculate interest for the year based on balance *after* contribution
                // Simple yearly compounding approximation (or use monthly loop like above for accuracy)
                // Let's stick to monthly compounding even for yearly contributions for consistency
                 for (let month = 1; month <= 12; month++) {
                     const monthlyInterest = currentBalance * monthlyRate;
                     interestEarnedYear += monthlyInterest;
                     currentBalance += monthlyInterest;
                 }
            }

            totalContributions += contributionYear;

            tableData.push({
                year: year,
                startBalance: startingBalanceYear,
                contributions: contributionYear,
                interestEarned: interestEarnedYear,
                endBalance: currentBalance
            });

            chartLabels.push(year);
            chartBalances.push(currentBalance);
        }

        totalInterest = currentBalance - initial - totalContributions;

        return {
            summary: {
                finalBalance: currentBalance,
                totalContributions: totalContributions,
                totalInterest: totalInterest
            },
            tableData: tableData,
            chartData: {
                labels: chartLabels,
                data: chartBalances
            }
        };
    }

    // --- Update UI Functions ---
    function formatCurrency(value) {
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function updateSummary(summary) {
        finalBalanceDisplay.textContent = formatCurrency(summary.finalBalance);
        totalContributionsDisplay.textContent = formatCurrency(summary.totalContributions);
        totalInterestDisplay.textContent = formatCurrency(summary.totalInterest);
    }

    function updateTable(tableData) {
        tableBody.innerHTML = ''; // Clear previous data

        if (tableData.length === 0) {
            // Handle case with 0 years if needed
            return;
        }

        tableData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${formatCurrency(row.startBalance)}</td>
                <td>${formatCurrency(row.contributions)}</td>
                <td>${formatCurrency(row.interestEarned)}</td>
                <td>${formatCurrency(row.endBalance)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateChart(chartData) {
        if (!projectionChart) return; // Don't update if chart not initialized

        projectionChart.data.labels = chartData.labels;
        projectionChart.data.datasets[0].data = chartData.data;
        projectionChart.update(); // Update the chart visually
    }


    // --- Update Slider Value Displays ---
    function updateSliderValueDisplays() {
         initialInvestmentValueDisplay.textContent = formatCurrency(parseFloat(initialInvestmentInput.value));
         contributionAmountValueDisplay.textContent = formatCurrency(parseFloat(contributionAmountInput.value));
         rateOfReturnValueDisplay.textContent = `${parseFloat(rateOfReturnInput.value).toFixed(1)}%`;
         yearsToSaveValueDisplay.textContent = `${yearsToSaveInput.value} years`;
    }

    // Function to link number input and slider
    function linkInputAndSlider(numberInput, rangeSlider) {
        numberInput.addEventListener('input', (e) => {
            rangeSlider.value = e.target.value;
            runUpdate();
            updateSliderValueDisplays();
        });
        rangeSlider.addEventListener('input', (e) => {
            numberInput.value = e.target.value;
             runUpdate();
             updateSliderValueDisplays();
        });
    }


    // --- Main Update Trigger ---
    function runUpdate() {
        // 1. Get current values
        const initial = parseFloat(initialInvestmentInput.value) || 0;
        const contribAmount = parseFloat(contributionAmountInput.value) || 0;
        const frequency = document.querySelector('input[name="frequency"]:checked').value;
        const rate = parseFloat(rateOfReturnInput.value) || 0;
        const years = parseInt(yearsToSaveInput.value) || 0;

        // 2. Calculate projection
        const results = calculateProjection(initial, contribAmount, frequency, rate, years);

        // 3. Update UI
        updateSummary(results.summary);
        updateTable(results.tableData);
        updateChart(results.chartData);
    }

    // --- Event Listeners ---
    linkInputAndSlider(initialInvestmentInput, initialInvestmentSlider);
    linkInputAndSlider(contributionAmountInput, contributionAmountSlider);
    linkInputAndSlider(rateOfReturnInput, rateOfReturnSlider);
    linkInputAndSlider(yearsToSaveInput, yearsToSaveSlider);

    frequencyInputs.forEach(input => {
        input.addEventListener('change', runUpdate);
    });

    // --- Initial Setup ---
    initializeChart();
    updateSliderValueDisplays(); // Set initial display values
    runUpdate(); // Run calculation on page load
});