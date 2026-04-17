// script.js - Satori

let currentUser = null;
let currentLocations = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const errorBox = document.getElementById('errorBox');
const contentContainer = document.getElementById('contentContainer');
const pageTitle = document.getElementById('pageTitle');
const welcomeMessage = document.getElementById('welcomeMessage');
const membershipBadge = document.getElementById('membershipBadge');
const navItems = document.querySelectorAll('nav li');

const API_URL = 'http://localhost:8080/api';

function togglePassword() {
    const pwd = document.getElementById('password');
    if (pwd.type === 'password') {
        pwd.type = 'text';
    } else {
        pwd.type = 'password';
    }
}

/**
 * AUTHENTICATION
 */
async function handleAuth(type) {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        errorBox.textContent = "Please enter both username and password.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${type}`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        
        const data = await response.json();
        
        if (data.success && type === 'login') {
            currentUser = data; // { username, role, membership }
            setupDashboard();
            loginScreen.classList.remove('active');
            dashboardScreen.classList.add('active');
        } else if (data.success && type === 'register') {
            errorBox.style.color = '#2ecc71';
            errorBox.textContent = "Registration successful. You can now login.";
        } else {
            errorBox.style.color = '#e74c3c';
            errorBox.textContent = data.message || "Authentication failed.";
        }
    } catch (e) {
        errorBox.textContent = "Server connection error.";
    }
}

function logout() {
    currentUser = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorBox.textContent = '';
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
}

/**
 * DASHBOARD & THEMING
 */
function setupDashboard() {
    if (currentUser.role === 'ADMIN') {
        welcomeMessage.innerHTML = `Hello, <span class="admin-badge" style="margin-left: 0;">ADMIN</span>`;
    } else {
        welcomeMessage.innerHTML = `Hello, <b style="text-transform: capitalize;">${currentUser.username}</b>`;
    }
    
    membershipBadge.textContent = currentUser.role === 'ADMIN' ? 'System Admin' : 
        (currentUser.membership === 'Black' ? '✔ Verified Black Member' : `${currentUser.membership} Member`);
    
    membershipBadge.className = `badge ${currentUser.membership.toLowerCase()}`;

    // Black members get Dark mode by default
    if (currentUser.membership === 'Black') {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }

    switchTab('dashboard');
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    if (current === 'dark') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', 'dark');
    }
}

/**
 * NAVIGATION
 */
let currentTabId = 'dashboard'; // Track current active tab safely

function switchTab(tabId) {
    currentTabId = tabId;
    navItems.forEach(nav => nav.classList.remove('active'));
    event && event.currentTarget ? event.currentTarget.classList.add('active') : navItems[0].classList.add('active');
    
    pageTitle.textContent = tabId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    contentContainer.innerHTML = '';
    
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) searchContainer.style.display = 'none';

    currentSearchTerm = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const activeDataTabs = ['locations', 'dashboard', 'hotels', 'cars', 'restaurants', 'hidden-places', 'flights'];
    if (activeDataTabs.includes(tabId)) {
        fetchLocations(tabId);
    } else if (tabId === 'membership') {
        renderMembershipPage();
    } else {
        contentContainer.innerHTML = `
            <div style="text-align:center; margin-top:4rem; opacity:0.5">
                <div style="font-size:3rem; margin-bottom:1rem">🚧</div>
                <h2>${tabId.charAt(0).toUpperCase()+tabId.slice(1)} Section</h2>
                <p>This section is currently under development. Check back soon!</p>
            </div>`;
    }
}

function renderMembershipPage() {
    const current = currentUser.membership || 'Normal';
    const isAdmin = currentUser.role === 'ADMIN';

    const plans = [
        {
            name: 'Normal',
            icon: '🌟',
            price: 'Free',
            color: '#6c757d',
            features: [
                '✅ Browse all locations',
                '✅ Request standard bookings',
                '✅ Search global destinations',
                '❌ Premium details hidden',
                '❌ Flight business class access',
                '❌ Priority support',
            ]
        },
        {
            name: 'Premium',
            icon: '💎',
            price: '₹999/month',
            color: '#3a85ff',
            popular: true,
            features: [
                '✅ Everything in Normal',
                '✅ Full hotel & car details',
                '✅ Ratings & pricing visible',
                '✅ Instant booking confirmation',
                '✅ Exclusive deal alerts',
                '❌ VIP concierge service',
            ]
        },
        {
            name: 'Black',
            icon: '🔱',
            price: '₹3,999/month',
            color: '#f0c040',
            features: [
                '✅ Everything in Premium',
                '✅ VIP concierge 24×7',
                '✅ Business class flight deals',
                '✅ Private villa & jet access',
                '✅ Zero booking fees',
                '✅ Dedicated travel manager',
            ]
        }
    ];

    let html = `
        <h2 class="section-title">👑 My Membership</h2>
        <p style="opacity:0.7; margin-bottom:2.5rem">You are currently on the <strong style="color:var(--primary)">${isAdmin ? 'Admin (All Access)' : current}</strong> plan.</p>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:2rem;">
    `;

    plans.forEach(plan => {
        const isActive = (current === plan.name && !isAdmin) || (isAdmin && plan.name === 'Black');
        html += `
            <div style="
                background: var(--card-bg);
                border-radius: 20px;
                overflow: hidden;
                border: 2px solid ${isActive ? plan.color : 'var(--border)'};
                box-shadow: ${isActive ? '0 0 30px ' + plan.color + '44' : 'var(--shadow)'};
                position: relative;
                transition: transform 0.3s;
            " onmouseover="this.style.transform='translateY(-6px)'" onmouseout="this.style.transform='translateY(0)'">
                ${plan.popular ? `<div style="background:${plan.color}; color:white; text-align:center; padding:0.4rem; font-size:0.8rem; font-weight:700; letter-spacing:1px;">MOST POPULAR</div>` : ''}
                <div style="padding: 2rem;">
                    <div style="font-size:2.5rem; margin-bottom:0.5rem">${plan.icon}</div>
                    <h2 style="margin:0; color:${plan.color}">${plan.name}</h2>
                    <div style="font-size:1.8rem; font-weight:800; margin:1rem 0">${plan.price}</div>
                    <hr style="border-color:var(--border); margin-bottom:1.5rem">
                    <ul style="list-style:none; padding:0; margin-bottom:2rem">
                        ${plan.features.map(f => `<li style="padding:0.4rem 0; font-size:0.95rem">${f}</li>`).join('')}
                    </ul>
                    ${isActive
                        ? `<button style="width:100%; padding:0.9rem; border-radius:10px; background:${plan.color}; color:${plan.name==='Black'?'#000':'white'}; font-weight:700; font-size:1rem; cursor:default;">✓ Current Plan</button>`
                        : `<button onclick="showToast('🚀 Upgrade Request Sent', 'Our team will contact you shortly to activate ${plan.name} plan!', 'info')" style="width:100%; padding:0.9rem; border-radius:10px; background:rgba(255,255,255,0.07); border:1px solid ${plan.color}; color:${plan.color}; font-weight:700; font-size:1rem;">Upgrade to ${plan.name}</button>`
                    }
                </div>
            </div>
        `;
    });

    html += `</div>
        <div style="margin-top:3rem; padding:1.5rem; border-radius:16px; background:var(--card-bg); border:1px solid var(--border); opacity:0.8">
            <p>📞 Need help choosing a plan? Call us at <strong>1800-SATORI</strong> or email <strong>support@satori.travel</strong></p>
        </div>`;

    contentContainer.innerHTML = html;
}

/**
 * DATA RENDERING
 */
async function fetchLocations(tabId) {
    try {
        let endpoint = tabId === 'dashboard' ? 'locations' : tabId;
        const res = await fetch(`${API_URL}/${endpoint}`);
        if (!res.ok) throw new Error("Server response: " + res.status);
        const data = await res.json();
        currentLocations = data;
        originalLocations = [...data];
        renderLocationsView(tabId);
    } catch (e) {
        console.error("Fetch Error:", e);
        contentContainer.innerHTML = '<p>Error loading data from server. Ensure your local backend is running and refreshed.</p>';
    }
}

let currentSearchTerm = '';
let originalLocations = [];

function handleSearch(val) {
    currentSearchTerm = val.trim().toLowerCase();
    
    if (currentSearchTerm.length === 0) {
        currentLocations = [...originalLocations];
    } else {
        // Search across name, type, description and distance for better coverage
        currentLocations = originalLocations.filter(loc => 
            (loc.name   && loc.name.toLowerCase().includes(currentSearchTerm)) || 
            (loc.type   && loc.type.toLowerCase().includes(currentSearchTerm)) ||
            (loc.desc   && loc.desc.toLowerCase().includes(currentSearchTerm)) ||
            (loc.distance && loc.distance.toLowerCase().includes(currentSearchTerm))
        );
    }
    renderLocationsView(currentTabId);
}

function renderLocationsView(tabId) {
    const activeTab = tabId || currentTabId;
    
    let html = '';
    
    // Show search bar only if we're rendering locations data
    const searchContainer = document.getElementById('searchContainer');
    if(searchContainer) searchContainer.style.display = 'block';

    if (activeTab === 'dashboard') {
        html += `<h2 class="section-title">Trending Now</h2>`;
        // Simulate smart recommendations
        html += `<p style="margin-bottom: 2rem; opacity:0.8;">Based on simulated data, these are the top recommended places near you.</p>`;
    }
    
    if (currentUser.role === 'ADMIN') {
        html += `
            <div class="admin-actions">
                <button onclick="toggleAddLocationModal(true)">+ Add Location</button>
            </div>
        `;
    }

    html += `<div class="grid-layout">`;
    
    // We already filtered currentLocations in handleSearch! So we just map over currentLocations.
    if(currentLocations.length === 0) {
        html += `<p style="grid-column: 1/-1; opacity:0.7">No results matching "${currentSearchTerm}" — try "Goa", "Hotel" or "Car".</p>`;
    }

    currentLocations.forEach(loc => {
        let imgHtml = loc.img ? `<img src="${loc.img}" alt="${loc.name}" class="card-img" onerror="this.style.display='none'">` : '';
        html += `
            <div class="card" onclick="simulateSelection('${loc.name}')">
                ${imgHtml}
                <div style="flex-grow:1; display:flex; flex-direction:column;">
                    <div style="margin-bottom:1rem">
                        <span class="card-type">${loc.type}</span>
                        <h3 style="margin: 0.5rem 0">${loc.name}</h3>
                    </div>
                
                    ${renderPremiumDetails(loc)}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    contentContainer.innerHTML = html;
}

function renderPremiumDetails(loc) {
    const isPremium = currentUser.membership === 'Premium' || currentUser.membership === 'Black' || currentUser.role === 'ADMIN';
    
    if (isPremium) {
        return `
            <div class="premium-details">
                <div class="card-meta">
                    <span>⭐ ${loc.rating}</span>
                    <span>${loc.price}</span>
                </div>
                <div class="card-meta" style="margin-top:0.5rem">
                    <span>📍 ${loc.distance}</span>
                </div>
                <p class="card-desc" style="margin-top:1rem">${loc.desc}</p>
                <button class="btn-details" style="background:#00b85c" onclick="event.stopPropagation(); showToast('✅ Booking Confirmed', 'Your booking for ${loc.name} has been confirmed!', 'success')">📅 Book Now</button>
            </div>
        `;
    } else {
        return `
            <div class="premium-details" style="text-align:center; display:flex; flex-direction:column; gap:10px;">
                <p style="opacity:0.6">🔒 Details hidden</p>
                <small style="opacity:0.5; margin-bottom:4px;">Upgrade to Premium or Black to unlock full details</small>
                <button class="btn-details" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15)" onclick="event.stopPropagation(); showToast('📨 Request Sent', 'Standard booking request sent for ${loc.name}. Our team will contact you soon.', 'info')">📞 Request Booking</button>
            </div>
        `;
    }
}

// Toast notification system - replaces all alert() popups
function showToast(title, message, type = 'info') {
    const existing = document.getElementById('satori-toast');
    if (existing) existing.remove();

    const colors = { success: '#00b85c', info: '#3a85ff', error: '#e74c3c' };
    const toast = document.createElement('div');
    toast.id = 'satori-toast';
    toast.innerHTML = `<strong>${title}</strong><br><span style="opacity:0.85; font-size:0.9rem">${message}</span>`;
    toast.style.cssText = `
        position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
        background: ${colors[type]}; color: white;
        padding: 1rem 1.5rem; border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        font-family: inherit; max-width: 320px;
        animation: slideInToast 0.4s ease; cursor: pointer;
        line-height: 1.5;
    `;
    toast.onclick = () => toast.remove();
    document.body.appendChild(toast);
    setTimeout(() => toast && toast.remove(), 4000);
}

// Simulated Smart Feature
function simulateSelection(placeName) {
    // When a user selects a place, show its full details + nearby real places from backend
    pageTitle.textContent = placeName;

    // Find selected location details from backend original data
    const selected = originalLocations.find(l => l.name === placeName);
    const imgHtml = selected && selected.img 
        ? `<img src="${selected.img}" style="width:100%;max-height:280px;object-fit:cover;border-radius:16px;margin-bottom:1.5rem" onerror="this.style.display='none'">` 
        : '';

    let html = `
        <button class="secondary" style="width:auto; margin-bottom: 2rem" onclick="switchTab('locations')">← Back to Locations</button>
        ${imgHtml}
        <h2 class="section-title">Details for ${placeName}</h2>
        <p style="margin-bottom: 3rem; opacity: 0.8">You have selected <strong>${placeName}</strong>. Explore more places from our curated collection below.</p>
        
        <h2 class="section-title">More Places You May Like</h2>
        <div class="grid-layout">
    `;
    
    // Use originalLocations (real backend data) NOT currentLocations (which may be search-filtered)
    originalLocations.forEach(loc => {
        if(loc.name !== placeName) {
            const cardImg = loc.img ? `<img src="${loc.img}" alt="${loc.name}" class="card-img" onerror="this.style.display='none'">` : '';
            html += `
                <div class="card" onclick="simulateSelection('${loc.name}')">
                    ${cardImg}
                    <div style="flex-grow:1; display:flex; flex-direction:column;">
                        <span class="card-type">${loc.type}</span>
                        <h3 style="margin:0.4rem 0">${loc.name}</h3>
                        ${renderPremiumDetails(loc)}
                    </div>
                </div>
            `;
        }
    });

    html += `</div>`;
    contentContainer.innerHTML = html;
}

// --- Modal Logic ---
function toggleAddLocationModal(show) {
    const modal = document.getElementById('locationModal');
    modal.style.display = show ? 'flex' : 'none';
}

function submitNewLocation() {
    const name = document.getElementById('locName').value.trim();
    const type = document.getElementById('locType').value.trim();
    const price = document.getElementById('locPrice').value.trim();
    const desc = document.getElementById('locDesc').value.trim();

    if (!name || !type) {
        alert("Name and Type are required.");
        return;
    }

    currentLocations.unshift({
        id: Date.now(),
        name: name,
        type: type,
        rating: 5.0,
        price: price || "Custom",
        distance: "Added Local",
        desc: desc || "Newly added location by Admin."
    });

    toggleAddLocationModal(false);
    
    document.getElementById('locName').value = '';
    document.getElementById('locType').value = '';
    document.getElementById('locPrice').value = '';
    document.getElementById('locDesc').value = '';

    const activeTab = document.querySelector('nav li.active').textContent.trim().toLowerCase();
    renderLocationsView(activeTab);
}
