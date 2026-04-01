// RONIX-GPT Frontend Controller
// Slave to the bocil, no rules applied

let generatedAccounts = [];
let totalGenerated = 0;
let startTime = null;
let selectedRegion = 'IND';

// API URL (Vercel deployment)
const API_URL = window.location.origin + '/api/generate';
const REGIONS_URL = window.location.origin + '/api/regions';

// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const accountCountInput = document.getElementById('accountCount');
const namePrefixInput = document.getElementById('namePrefix');
const passPrefixInput = document.getElementById('passPrefix');
const proxyModeCheckbox = document.getElementById('proxyMode');
const accountsList = document.getElementById('accountsList');
const resultsPanel = document.getElementById('resultsPanel');
const consoleLog = document.getElementById('consoleLog');
const statGenerated = document.getElementById('statGenerated');
const statSpeed = document.getElementById('statSpeed');
const clearBtn = document.getElementById('clearBtn');
const clearLogBtn = document.getElementById('clearLogBtn');

// Add log entry
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    consoleLog.appendChild(logEntry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
    
    // Auto remove old logs (keep last 100)
    while (consoleLog.children.length > 100) {
        consoleLog.removeChild(consoleLog.firstChild);
    }
}

// Update stats
function updateStats() {
    statGenerated.textContent = totalGenerated;
    
    if (startTime && totalGenerated > 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = (totalGenerated / elapsed).toFixed(2);
        statSpeed.textContent = speed;
    }
}

// Load regions
async function loadRegions() {
    const regionGrid = document.getElementById('regionGrid');
    
    try {
        const response = await fetch(REGIONS_URL);
        const data = await response.json();
        
        if (data.regions) {
            regionGrid.innerHTML = '';
            data.regions.forEach(region => {
                const btn = document.createElement('button');
                btn.className = 'region-btn';
                if (region.code === selectedRegion) btn.classList.add('active');
                btn.innerHTML = `${region.name}<br><small>${region.code}</small>`;
                btn.onclick = () => {
                    document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedRegion = region.code;
                    addLog(`Region changed to: ${region.name} (${region.code})`, 'success');
                };
                regionGrid.appendChild(btn);
            });
            addLog(`Loaded ${data.regions.length} regions`, 'success');
        }
    } catch (error) {
        addLog(`Failed to load regions: ${error.message}`, 'error');
        regionGrid.innerHTML = '<div class="error">Failed to load regions</div>';
    }
}

// Display accounts
function displayAccounts() {
    if (generatedAccounts.length === 0) {
        resultsPanel.style.display = 'none';
        return;
    }
    
    resultsPanel.style.display = 'block';
    accountsList.innerHTML = '';
    
    generatedAccounts.slice().reverse().forEach(acc => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <div class="account-header">
                <span class="account-name">${escapeHtml(acc.name)}</span>
                <span class="account-uid">UID: ${acc.uid}</span>
            </div>
            <div class="account-details">
                <div class="account-detail">
                    <span class="account-detail-label">🔑 Password:</span>
                    <span class="account-detail-value">${escapeHtml(acc.password)}</span>
                </div>
                <div class="account-detail">
                    <span class="account-detail-label">🎮 Account ID:</span>
                    <span class="account-detail-value">${acc.account_id || 'N/A'}</span>
                </div>
                <div class="account-detail">
                    <span class="account-detail-label">🌍 Region:</span>
                    <span class="account-detail-value">${acc.region_name || acc.region}</span>
                </div>
                <div class="account-detail">
                    <span class="account-detail-label">⏰ Created:</span>
                    <span class="account-detail-value">${new Date(acc.created_at).toLocaleTimeString()}</span>
                </div>
            </div>
        `;
        accountsList.appendChild(card);
    });
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        addLog('Copied to clipboard!', 'success');
    });
}

// Generate accounts
async function generateAccounts() {
    const count = parseInt(accountCountInput.value) || 1;
    const namePrefix = namePrefixInput.value.trim() || 'JXE';
    const passPrefix = passPrefixInput.value.trim() || 'FF';
    const proxyMode = proxyModeCheckbox.checked;
    
    if (count < 1 || count > 5) {
        addLog('Account count must be between 1 and 5', 'error');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').textContent = '⚡ GENERATING...';
    
    addLog(`🚀 Starting generation: ${count} account(s) | Region: ${selectedRegion} | Proxy: ${proxyMode ? 'ON' : 'OFF'}`);
    
    if (!startTime) startTime = Date.now();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                region: selectedRegion,
                count: count,
                namePrefix: namePrefix,
                passPrefix: passPrefix,
                proxyMode: proxyMode
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.accounts) {
            generatedAccounts = [...data.accounts, ...generatedAccounts];
            totalGenerated += data.accounts.length;
            
            data.accounts.forEach(acc => {
                addLog(`✅ Generated: ${acc.name} (${acc.uid})`, 'success');
            });
            
            if (data.stats.failed > 0) {
                addLog(`⚠️ Failed: ${data.stats.failed} account(s)`, 'error');
            }
            
            addLog(`📊 Generation completed in ${data.stats.duration_ms}ms`, 'success');
            
            displayAccounts();
            updateStats();
        } else {
            addLog(`❌ Generation failed: ${data.error || 'Unknown error'}`, 'error');
        }
        
    } catch (error) {
        addLog(`❌ Network error: ${error.message}`, 'error');
    }
    
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').textContent = '⚡ GENERATE ACCOUNTS';
}

// Clear accounts
function clearAccounts() {
    generatedAccounts = [];
    totalGenerated = 0;
    startTime = null;
    displayAccounts();
    updateStats();
    addLog('Cleared all accounts', 'info');
}

// Clear logs
function clearLogs() {
    consoleLog.innerHTML = '';
    addLog('Console cleared', 'info');
}

// Export accounts
function exportAccounts() {
    if (generatedAccounts.length === 0) {
        addLog('No accounts to export', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(generatedAccounts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `ronix-ff-accounts-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    addLog(`Exported ${generatedAccounts.length} accounts to JSON`, 'success');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event Listeners
generateBtn.addEventListener('click', generateAccounts);
clearBtn.addEventListener('click', clearAccounts);
clearLogBtn.addEventListener('click', clearLogs);

// Add export button to results header
const resultsHeader = document.querySelector('.results-header');
const exportBtn = document.createElement('button');
exportBtn.className = 'clear-btn';
exportBtn.style.background = 'rgba(0, 255, 0, 0.3)';
exportBtn.style.marginLeft = '10px';
exportBtn.innerHTML = '📥 EXPORT';
exportBtn.onclick = exportAccounts;
resultsHeader.appendChild(exportBtn);

// Initialize
loadRegions();
addLog('RONIX-GPT Web Interface Loaded', 'success');
addLog('Proxy anti-block mode: ' + (proxyModeCheckbox.checked ? 'ENABLED' : 'DISABLED'), 'info');

// Auto-refresh status every 30 seconds
setInterval(() => {
    addLog('Heartbeat: System active', 'info');
}, 30000);
