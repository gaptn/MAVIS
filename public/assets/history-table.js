/**
 * MAVIS Telemetry History Table Manager
 * Handles smart alert filtering (Default: Warning & Danger only) and CSV export.
 */

// Dataset: Includes alerts and raw telemetry samples
const RAW_TELEMETRY_DATA = [
    { timestamp: "2026-08-20 14:32:05", type: "Overspeed", level: "danger", value: "88 km/jam", icon: "speed", lat: "-6.2088", lng: "106.8456", speed: 88, roll: 12, pitch: 2, accelZ: 1.1 },
    { timestamp: "2026-08-20 14:28:12", type: "Sudut Kemiringan", level: "warning", value: "42° L", icon: "cycle", lat: "-6.2112", lng: "106.8421", speed: 55, roll: 42, pitch: 4, accelZ: 1.4 },
    { timestamp: "2026-08-20 14:15:40", type: "Getaran Extrem", level: "warning", value: "2.1 G", icon: "vibration", lat: "-6.2250", lng: "106.8310", speed: 48, roll: 10, pitch: 1, accelZ: 2.1 },
    { timestamp: "2026-08-20 13:50:22", type: "Rem Mendadak", level: "danger", value: "-2.7 G", icon: "warning", lat: "-6.2301", lng: "106.8290", speed: 32, roll: 8, pitch: -8, accelZ: -2.7 },
    { timestamp: "2026-08-20 13:10:05", type: "Sudut Kemiringan", level: "warning", value: "39° R", icon: "cycle", lat: "-6.2188", lng: "106.8350", speed: 45, roll: 39, pitch: 3, accelZ: 1.3 },
    { timestamp: "2026-08-20 12:45:18", type: "Overspeed", level: "danger", value: "92 km/jam", icon: "speed", lat: "-6.2045", lng: "106.8500", speed: 92, roll: 14, pitch: 1, accelZ: 1.2 },
    
    // Normal 1Hz Raw Data (Excluded by default in smart alert view)
    { timestamp: "2026-08-20 14:30:00", type: "Normal Stream", level: "safe", value: "45 km/jam", icon: "check_circle", lat: "-6.2100", lng: "106.8440", speed: 45, roll: 5, pitch: 1, accelZ: 1.0 },
    { timestamp: "2026-08-20 14:25:00", type: "Normal Stream", level: "safe", value: "42 km/jam", icon: "check_circle", lat: "-6.2120", lng: "106.8410", speed: 42, roll: 8, pitch: 2, accelZ: 0.98 },
    { timestamp: "2026-08-20 14:00:00", type: "Normal Stream", level: "safe", value: "50 km/jam", icon: "check_circle", lat: "-6.2200", lng: "106.8330", speed: 50, roll: 11, pitch: 0, accelZ: 1.02 }
];

let currentFilteredData = [];

document.addEventListener('DOMContentLoaded', () => {
    initHistoryTable();
    initExportCSV();
});

function initHistoryTable() {
    const tableBody = document.getElementById('history-table-body');
    const filterLevel = document.getElementById('filter-level');
    const filterType = document.getElementById('filter-type');
    const searchInput = document.getElementById('history-search');

    if (!tableBody) return;

    function renderTable() {
        const levelVal = filterLevel ? filterLevel.value : 'alerts_only';
        const typeVal = filterType ? filterType.value : 'all';
        const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

        currentFilteredData = RAW_TELEMETRY_DATA.filter(item => {
            // Level Filter
            if (levelVal === 'alerts_only' && item.level === 'safe') return false;
            if (levelVal === 'warning' && item.level !== 'warning') return false;
            if (levelVal === 'danger' && item.level !== 'danger') return false;

            // Type Filter
            if (typeVal !== 'all' && item.type !== typeVal) return false;

            // Search Query
            if (searchVal) {
                const matchText = `${item.timestamp} ${item.type} ${item.value} ${item.lat} ${item.lng}`.toLowerCase();
                if (!matchText.includes(searchVal)) return false;
            }

            return true;
        });

        if (currentFilteredData.length === 0) {
            tableBody.innerHTML = `
                <div class="p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-3xl mb-2 text-outline">search_off</span>
                    <p class="text-xs">Tidak ada log kejadian yang cocok dengan filter.</p>
                </div>
            `;
            return;
        }

        tableBody.innerHTML = currentFilteredData.map(item => {
            let badgeClass = 'bg-primary/20 border-primary/50 text-primary';
            let badgeText = 'Safe';
            let pulseDot = 'bg-primary';

            if (item.level === 'danger') {
                badgeClass = 'bg-error/20 border-error/50 text-error';
                badgeText = 'Bahaya';
                pulseDot = 'bg-error animate-pulse';
            } else if (item.level === 'warning') {
                badgeClass = 'bg-amber-500/20 border-amber-500/50 text-amber-400';
                badgeText = 'Waspada';
                pulseDot = 'bg-amber-400';
            }

            return `
                <div class="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-surface-variant/30 transition-colors text-xs">
                    <div class="col-span-2 font-data-num text-on-surface">
                        ${item.timestamp.split(' ')[1]}<br>
                        <span class="text-on-surface-variant text-[11px] font-mono">${item.timestamp.split(' ')[0]}</span>
                    </div>
                    <div class="col-span-3 font-body-md text-on-surface flex items-center gap-2">
                        <span class="material-symbols-outlined ${item.level === 'danger' ? 'text-error' : item.level === 'warning' ? 'text-amber-400' : 'text-primary'} text-base">${item.icon}</span>
                        ${item.type}
                    </div>
                    <div class="col-span-2 font-data-num font-semibold text-on-surface">${item.value}</div>
                    <div class="col-span-2">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${badgeClass} font-label-sm text-[11px] font-semibold">
                            <span class="w-1.5 h-1.5 rounded-full ${pulseDot}"></span> ${badgeText}
                        </span>
                    </div>
                    <div class="col-span-2 font-data-num text-on-surface-variant font-mono">
                        ${item.lat}, ${item.lng}
                    </div>
                    <div class="col-span-1 text-right">
                        <button class="text-secondary hover:text-primary transition-colors p-1 rounded hover:bg-secondary/10" onclick="openMapModal('${item.lat}', '${item.lng}')">
                            <span class="material-symbols-outlined text-base">map</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (filterLevel) filterLevel.addEventListener('change', renderTable);
    if (filterType) filterType.addEventListener('change', renderTable);
    if (searchInput) searchInput.addEventListener('input', renderTable);

    renderTable();
}

function openMapModal(lat, lng) {
    if (typeof toggleMapModal === 'function') {
        const coordsEl = document.querySelector('#map-modal .font-data-num');
        if (coordsEl) coordsEl.textContent = `LAT: ${lat} | LNG: ${lng}`;
        toggleMapModal();
    }
}

/**
 * CSV Export Functionality
 */
function initExportCSV() {
    const exportBtn = document.getElementById('export-csv-btn');
    const exportModal = document.getElementById('export-modal');
    const exportClose = document.getElementById('export-modal-close');
    const exportFilteredBtn = document.getElementById('export-filtered-btn');
    const exportRawBtn = document.getElementById('export-raw-btn');

    if (!exportBtn || !exportModal) return;

    exportBtn.addEventListener('click', () => {
        exportModal.classList.remove('hidden');
    });

    if (exportClose) {
        exportClose.addEventListener('click', () => {
            exportModal.classList.add('hidden');
        });
    }

    if (exportFilteredBtn) {
        exportFilteredBtn.addEventListener('click', () => {
            downloadCSV(currentFilteredData, 'mavis-telemetry-filtered');
            exportModal.classList.add('hidden');
        });
    }

    if (exportRawBtn) {
        exportRawBtn.addEventListener('click', () => {
            downloadCSV(RAW_TELEMETRY_DATA, 'mavis-telemetry-raw-1hz');
            exportModal.classList.add('hidden');
        });
    }
}

function downloadCSV(dataArray, filenamePrefix) {
    if (!dataArray || dataArray.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }

    const headers = ["Timestamp", "Event_Type", "Severity_Level", "Measured_Value", "Speed_kmh", "Roll_deg", "Pitch_deg", "Accel_Z_g", "Latitude", "Longitude"];
    
    const rows = dataArray.map(item => [
        `"${item.timestamp}"`,
        `"${item.type}"`,
        `"${item.level}"`,
        `"${item.value}"`,
        item.speed,
        item.roll,
        item.pitch,
        item.accelZ,
        item.lat,
        item.lng
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
