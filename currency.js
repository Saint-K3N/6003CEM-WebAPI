// Currency Converter JavaScript

async function handleCurrencyConversion(e) {
    e.preventDefault();
    const amount = document.getElementById('amount').value;
    const from = document.getElementById('fromCurrency').value;
    const to = document.getElementById('toCurrency').value;

    showLoading();
    try {
        const result = await apiRequest('/currency/convert', {
            method: 'POST',
            body: JSON.stringify({ amount, from, to })
        });
        displayCurrencyResult(result);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayCurrencyResult(result) {
    const resultDiv = document.getElementById('currencyResult');
    resultDiv.innerHTML = `
        <div class="conversion-result">
            <h3>Currency Conversion</h3>
            <div class="conversion-amount">
                ${result.amount} ${result.from} = ${result.convertedAmount} ${result.to}
            </div>
            <p>Exchange Rate: 1 ${result.from} = ${result.rate} ${result.to}</p>
            <p><small>Last updated: ${new Date(result.timestamp).toLocaleString()}</small></p>
        </div>
    `;
    resultDiv.style.display = 'block';
}

// Make functions globally available
window.handleCurrencyConversion = handleCurrencyConversion;
