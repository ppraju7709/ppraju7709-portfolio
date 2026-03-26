let currentPage = 'dashboard';
let parcelsData = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadStats();
    loadParcels();
    setupEventListeners();
    setupSearch();
    setupNotifications();
}

// ============================================
// DATA FUNCTIONS
// ============================================
async function loadStats() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();
        document.getElementById('totalParcels').textContent = stats.total?.toLocaleString() || 0;
        document.getElementById('deliveredParcels').textContent = stats.delivered?.toLocaleString() || 0;
        document.getElementById('pendingParcels').textContent = stats.pending?.toLocaleString() || 0;
        document.getElementById('transitParcels').textContent = stats.transit?.toLocaleString() || 0;
    } catch (e) { console.error('Stats error:', e); }
}

async function loadParcels() {
    try {
        const res = await fetch('/api/parcels');
        parcelsData = await res.json();
        renderParcelsTable(parcelsData);
    } catch (e) { console.error('Parcels error:', e); }
}

function renderParcelsTable(parcels) {
    const tbody = document.getElementById('parcelsBody');
    if (!tbody) return;
    tbody.innerHTML = parcels.slice(0, 10).map(p => `
        <tr>
            <td><strong>${p.tracking_id}</strong></td>
            <td>${p.sender_name}</td>
            <td>${p.receiver_name}</td>
            <td><span class="status-tag">${p.parcel_type}</span></td>
            <td><span class="status-tag status-${p.status.toLowerCase().replace(/\s+/g,'-')}">${p.status}</span></td>
            <td>${new Date(p.expected_date).toLocaleDateString()}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="editParcel('${p.tracking_id}')" title="Update">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteParcel('${p.tracking_id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text2);">No parcels</td></tr>';
}

// ============================================
// SIDEBAR NAVIGATION (NOW ACTIVE!)
// ============================================
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const page = item.querySelector('span').textContent.trim().toLowerCase();
            currentPage = page;
            handlePageChange(page);
        });
    });

    // Quick actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const text = btn.textContent.toLowerCase();
            if (text.includes('add')) openModal('addParcelModal');
            if (text.includes('track')) trackParcel();
        });
    });

    // Add form
    const addForm = document.getElementById('addParcelForm');
    if (addForm) addForm.addEventListener('submit', handleAddParcel);

    // Refresh button
    document.querySelector('.btn-sm')?.addEventListener('click', refreshData);
}

// Handle page changes
function handlePageChange(page) {
    console.log('Nav to:', page); // Debug
    switch(page) {
        case 'dashboard':
            document.getElementById('dashboard')?.style.setProperty('display', 'block');
            loadStats();
            loadParcels();
            break;
        case 'add parcel':
            openModal('addParcelModal');
            break;
        case 'track parcel':
            trackParcel();
            break;
    }
}

// ============================================
// HEADER FEATURES (Search + Notifications)
// ============================================
function setupSearch() {
    const search = document.getElementById('searchTracking');
    if (search) {
        search.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = parcelsData.filter(p =>
                p.tracking_id.toLowerCase().includes(q) ||
                p.sender_name.toLowerCase().includes(q) ||
                p.receiver_name.toLowerCase().includes(q)
            );
            renderParcelsTable(filtered);
        });
    }
}

function setupNotifications() {
    const bell = document.querySelector('.notifications');
    if (bell) {
        bell.addEventListener('click', () => {
            showNotification('🔔 3 new parcels pending review!', 'info');
        });
    }
}

// ============================================
// CRUD OPERATIONS
// ============================================
async function handleAddParcel(e) {
    e.preventDefault();
    const data = {
        tracking_id: document.getElementById('trackingId').value,
        sender_name: document.getElementById('senderName').value,
        receiver_name: document.getElementById('receiverName').value,
        parcel_type: document.getElementById('parcelType').value,
        status: document.getElementById('parcelStatus').value,
        expected_date: document.getElementById('expectedDate').value
    };

    try {
        const res = await fetch('/api/parcels/add', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            showNotification('✅ Parcel added!', 'success');
            closeModal('addParcelModal');
            document.getElementById('addParcelForm').reset();
            loadStats();
            loadParcels();
        } else {
            showNotification(`❌ ${result.message}`, 'error');
        }
    } catch (e) {
        showNotification('❌ Add failed', 'error');
    }
}

async function deleteParcel(id) {
    if (confirm(`Delete ${id}?`)) {
        try {
            const res = await fetch(`/api/parcels/${id}`, {method: 'DELETE'});
            const result = await res.json();
            if (result.success) {
                showNotification('🗑️ Deleted!', 'success');
                loadStats();
                loadParcels();
            }
        } catch (e) {
            showNotification('❌ Delete failed', 'error');
        }
    }
}

async function editParcel(id) {
    const status = prompt('New status: Pending, In Transit, Delivered, Cancelled');
    if (status && ['Pending','In Transit','Delivered','Cancelled'].includes(status)) {
        try {
            const res = await fetch(`/api/parcels/${id}/status`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status})
            });
            if (await res.json().success) {
                showNotification('🔄 Status updated!', 'success');
                loadStats();
                loadParcels();
            }
        } catch (e) {
            showNotification('❌ Update failed', 'error');
        }
    }
}

async function trackParcel() {
    const id = prompt('Enter Tracking ID:');
    if (id) {
        try {
            const res = await fetch(`/api/parcels/${id}`);
            const data = await res.json();
            if (data.success) {
                alert(`📦 ${data.parcel.tracking_id}\n${data.parcel.status}\n${data.parcel.sender_name} → ${data.parcel.receiver_name}`);
            } else {
                alert('❌ Not found');
            }
        } catch (e) {
            alert('❌ Track error');
        }
    }
}

// ============================================
// UI FEATURES (Modals + Notifications)
// ============================================
function openModal(id) { 
    document.getElementById(id).style.display = 'block'; 
    document.body.style.overflow = 'hidden'; 
}

function closeModal(id) { 
    document.getElementById(id).style.display = 'none'; 
    document.body.style.overflow = 'auto'; 
}

window.onclick = e => {
    if (e.target.classList.contains('modal')) closeModal(e.target.id);
};

function showNotification(msg, type = 'success') {
    const n = document.createElement('div');
    n.innerHTML = `<i class="fas fa-${type==='success'?'check':'exclamation'}-circle"></i> ${msg}`;
    n.style.cssText = `
        position:fixed;top:20px;right:20px;background:${type==='success'?'#48bb78':'#f56565'};
        color:white;padding:15px 20px;border-radius:10px;z-index:9999;transform:translateX(350px);
        box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;gap:10px;font-weight:500;
        transition:all .3s;backdrop-filter:blur(10px);
    `;
    document.body.appendChild(n);
    setTimeout(() => n.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        n.style.transform = 'translateX(350px)';
        setTimeout(() => n.remove(), 300);
    }, 3500);
}

function refreshData() {
    loadStats();
    loadParcels();
    showNotification('🔄 Refreshed!', 'success');
}

// ============================================
// THEME TOGGLE (Dark/Light)
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('.theme-toggle i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    localStorage.theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
}

// Load theme
if (localStorage.theme === 'light') {
    document.body.classList.add('light-theme');
    document.querySelector('.theme-toggle i')?.classList.replace('fa-moon', 'fa-sun');
}

// ============================================
// FILTERS (Quick Filters)
document.addEventListener('click', e => {
    if (e.target.closest('.filter-btn')) {
        const btn = e.target.closest('.filter-btn');
        const status = btn.className.match(/delivered|pending|transit/)[0];
        const map = {delivered: 'Delivered', pending: 'Pending', transit: 'In Transit'};
        const filtered = parcelsData.filter(p => p.status === map[status]);
        renderParcelsTable(filtered);
        showNotification(`Filtered: ${map[status]} (${filtered.length})`, 'info');
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n') { e.preventDefault(); openModal('addParcelModal'); }
        if (e.key === 'r') { e.preventDefault(); refreshData(); }
        if (e.key === 't') { e.preventDefault(); trackParcel(); }
    }
    if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

// Auto refresh stats
setInterval(loadStats, 30000);

console.log('🚀 Courier Dashboard - ALL FEATURES ACTIVE!');
