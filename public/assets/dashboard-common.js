/**
 * MAVIS Telemetry Dashboard Common Script
 * Manages shared Notification Dropdown and Help Center Modal logic across all pages.
 */

const MAVIS_NOTIFICATIONS = [
    { id: 1, type: "Overspeed", level: "danger", message: "Kecepatan terdeteksi 88 km/jam (Melebihi batas 80 km/jam)", timestamp: "20 Aug 2026, 14:32:05" },
    { id: 2, type: "Sudut Kemiringan", level: "warning", message: "Lean Angle mencapai 41° saat menikung di tikungan R3", timestamp: "20 Aug 2026, 14:28:12" },
    { id: 3, type: "Getaran Extrem", level: "warning", message: "G-Force percepatan linier 2.1G terdeteksi (Guncangan keras)", timestamp: "20 Aug 2026, 14:15:40" },
    { id: 4, type: "Rem Mendadak", level: "danger", message: "Deselerasi ekstrim -2.7G terdeteksi pada turunan", timestamp: "20 Aug 2026, 13:50:22" }
];

document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
    initHelpCenter();
});

/**
 * Initialize Notification Dropdown
 */
function initNotifications() {
    const notifBtn = document.getElementById('notification-btn');
    const notifDropdown = document.getElementById('notification-dropdown');
    const notifList = document.getElementById('notification-list');
    const notifCount = document.getElementById('notification-count');
    const notifBadge = document.getElementById('notification-badge');

    if (!notifBtn || !notifDropdown) return;

    // Render Notifications
    if (notifList) {
        if (MAVIS_NOTIFICATIONS.length === 0) {
            notifList.innerHTML = `<div class="p-6 text-center text-on-surface-variant">Tidak ada notifikasi baru</div>`;
            if (notifCount) notifCount.textContent = '0 Alerts';
            if (notifBadge) notifBadge.classList.add('hidden');
        } else {
            if (notifCount) notifCount.textContent = `${MAVIS_NOTIFICATIONS.length} Alerts`;
            notifList.innerHTML = MAVIS_NOTIFICATIONS.map(item => {
                const isDanger = item.level === 'danger';
                const badgeBg = isDanger ? 'bg-error/15 text-error border-error/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                const icon = isDanger ? 'warning' : 'info';
                
                return `
                    <div class="p-3.5 hover:bg-surface-variant/30 transition-colors flex gap-3 items-start">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${badgeBg}">
                            <span class="material-symbols-outlined text-base">${icon}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-on-surface text-xs truncate">${item.type}</span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold font-mono ${badgeBg}">${item.level === 'danger' ? 'BAHAYA' : 'WASPADA'}</span>
                            </div>
                            <p class="text-[11px] text-on-surface-variant leading-snug mb-1">${item.message}</p>
                            <span class="text-[10px] font-mono text-outline leading-none block">${item.timestamp}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Toggle Dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        // Hide badge when clicked
        if (notifBadge) notifBadge.classList.add('hidden');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
            notifDropdown.classList.add('hidden');
        }
    });
}

/**
 * Initialize Help Center Modal
 */
function initHelpCenter() {
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.getElementById('help-modal-close');
    const helpBody = document.getElementById('help-modal-body');

    if (!helpBtn || !helpModal) return;

    let isHelpLoaded = false;

    helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
        if (!isHelpLoaded) {
            loadHelpContent();
        }
    });

    if (helpClose) {
        helpClose.addEventListener('click', () => {
            helpModal.classList.add('hidden');
        });
    }

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

    async function loadHelpContent() {
        try {
            const response = await fetch('/help.md');
            if (!response.ok) throw new Error('Gagal memuat dokumen help.md');
            const markdownText = await response.text();
            
            if (typeof marked !== 'undefined') {
                helpBody.innerHTML = marked.parse(markdownText);
            } else {
                // Basic fallback parser if marked CDN fails to load
                helpBody.innerHTML = formatMarkdownFallback(markdownText);
            }
            isHelpLoaded = true;
        } catch (err) {
            console.error(err);
            if (helpBody) {
                helpBody.innerHTML = `<div class="p-6 text-center text-error">Gagal memuat dokumen bantuan. Silakan pastikan file help.md tersedia.</div>`;
            }
        }
    }

    function formatMarkdownFallback(text) {
        return text
            .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-primary mb-3 pb-2 border-b border-outline-variant/30">$1</h1>')
            .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-on-surface mt-4 mb-2">$1</h2>')
            .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-secondary mt-3 mb-1">$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-primary">$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-on-surface-variant">$1</li>')
            .replace(/\n\n/gim, '<p class="mb-3 text-on-surface-variant text-xs leading-relaxed"></p>');
    }
}
