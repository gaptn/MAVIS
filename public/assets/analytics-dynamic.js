/**
 * MAVIS Telemetry Analytics Dynamic Filter Manager
 * Handles Session selection dropdown (Hover/Click) and Time Range filter tabs (Today, Weekly, Monthly)
 * Updates Safety Score, Donut Chart, and Chart Data dynamically.
 */

const ANALYTICS_DATASETS = {
    "today": {
        "all": { score: 94, dashOffset: 15.07, status: "Excellent overall safety.", comparison: "+2% vs kemarin", speedRollAvg: "48 km/h | 28°", maxRoll: "42°", harshBrakeCount: "1", tripCount: "4 Trips" },
        "trip_a942": { score: 96, dashOffset: 10.05, status: "Very Smooth Ride.", comparison: "Session #A-942 (Today 14:00)", speedRollAvg: "52 km/h | 24°", maxRoll: "38°", harshBrakeCount: "0", tripCount: "Trip #A-942" },
        "trip_a941": { score: 91, dashOffset: 22.6, status: "Moderate lean angles detected.", comparison: "Session #A-941 (Today 10:15)", speedRollAvg: "44 km/h | 35°", maxRoll: "42°", harshBrakeCount: "1", tripCount: "Trip #A-941" }
    },
    "weekly": {
        "all": { score: 89, dashOffset: 27.6, status: "Good weekly consistency.", comparison: "+5% vs last week", speedRollAvg: "46 km/h | 30°", maxRoll: "44°", harshBrakeCount: "3", tripCount: "22 Trips" },
        "trip_a942": { score: 96, dashOffset: 10.05, status: "Very Smooth Ride.", comparison: "Session #A-942", speedRollAvg: "52 km/h | 24°", maxRoll: "38°", harshBrakeCount: "0", tripCount: "Trip #A-942" },
        "trip_a941": { score: 91, dashOffset: 22.6, status: "Moderate lean angles detected.", comparison: "Session #A-941", speedRollAvg: "44 km/h | 35°", maxRoll: "42°", harshBrakeCount: "1", tripCount: "Trip #A-941" }
    },
    "monthly": {
        "all": { score: 92, dashOffset: 20.1, status: "High long-term safety rating.", comparison: "+8% vs last month", speedRollAvg: "45 km/h | 26°", maxRoll: "45°", harshBrakeCount: "7", tripCount: "86 Trips" },
        "trip_a942": { score: 96, dashOffset: 10.05, status: "Very Smooth Ride.", comparison: "Session #A-942", speedRollAvg: "52 km/h | 24°", maxRoll: "38°", harshBrakeCount: "0", tripCount: "Trip #A-942" },
        "trip_a941": { score: 91, dashOffset: 22.6, status: "Moderate lean angles detected.", comparison: "Session #A-941", speedRollAvg: "44 km/h | 35°", maxRoll: "42°", harshBrakeCount: "1", tripCount: "Trip #A-941" }
    }
};

let selectedTimeRange = "weekly"; // Default
let selectedSession = "all";

document.addEventListener('DOMContentLoaded', () => {
    initAnalyticsFilters();
});

function initAnalyticsFilters() {
    const sessionBtn = document.getElementById('session-select-btn');
    const sessionDropdown = document.getElementById('session-dropdown');
    const sessionLabel = document.getElementById('session-current-label');
    const timeFilterContainer = document.getElementById('time-filter-container');

    if (!sessionBtn || !sessionDropdown) return;

    // Toggle session dropdown on click
    sessionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sessionDropdown.classList.toggle('hidden');
    });

    // Also support hover trigger
    const sessionWrapper = document.getElementById('session-selector-wrapper');
    if (sessionWrapper) {
        sessionWrapper.addEventListener('mouseenter', () => {
            sessionDropdown.classList.remove('hidden');
        });
        sessionWrapper.addEventListener('mouseleave', () => {
            sessionDropdown.classList.add('hidden');
        });
    }

    // Handle Session Item Click
    document.querySelectorAll('.session-option').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectedSession = item.dataset.session || 'all';
            if (sessionLabel) sessionLabel.textContent = item.dataset.label || 'Semua Sesi';
            sessionDropdown.classList.add('hidden');
            updateAnalyticsUI();
        });
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!sessionDropdown.contains(e.target) && !sessionBtn.contains(e.target)) {
            sessionDropdown.classList.add('hidden');
        }
    });

    // Time Filter Buttons
    if (timeFilterContainer) {
        const timeBtns = timeFilterContainer.querySelectorAll('button');
        timeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                timeBtns.forEach(b => {
                    b.className = "px-3 py-1 rounded font-label-md text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer";
                });
                btn.className = "px-3 py-1 rounded bg-primary-container/20 font-label-md text-xs text-primary font-semibold cursor-pointer";
                selectedTimeRange = btn.dataset.time || 'weekly';
                updateAnalyticsUI();
            });
        });
    }
}

function updateAnalyticsUI() {
    const periodData = ANALYTICS_DATASETS[selectedTimeRange] || ANALYTICS_DATASETS["weekly"];
    const dataset = periodData[selectedSession] || periodData["all"];

    // Update Safety Score Number & Donut Chart SVG
    const scoreEl = document.getElementById('safety-score-num');
    const donutCircle = document.getElementById('safety-score-circle');
    const statusText = document.getElementById('safety-status-text');
    const comparisonText = document.getElementById('safety-comparison-text');

    if (scoreEl) scoreEl.textContent = dataset.score;
    if (donutCircle) donutCircle.setAttribute('stroke-dashoffset', dataset.dashOffset);
    if (statusText) statusText.textContent = dataset.status;
    if (comparisonText) {
        comparisonText.innerHTML = `<span class="material-symbols-outlined text-[14px]">trending_up</span> ${dataset.comparison}`;
    }

    // Update Secondary Metrics
    const avgSpeedRoll = document.getElementById('metric-speed-roll');
    const maxRollEl = document.getElementById('metric-max-roll');
    const harshBrakeEl = document.getElementById('metric-harsh-brake');

    if (avgSpeedRoll) avgSpeedRoll.textContent = dataset.speedRollAvg;
    if (maxRollEl) maxRollEl.textContent = dataset.maxRoll;
    if (harshBrakeEl) harshBrakeEl.textContent = dataset.harshBrakeCount;
}
