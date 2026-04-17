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
function switchTab(tabId) {
    navItems.forEach(nav => nav.classList.remove('active'));
    event && event.currentTarget ? event.currentTarget.classList.add('active') : navItems[0].classList.add('active');
    
    pageTitle.textContent = tabId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    contentContainer.innerHTML = ''; // clear
    
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer) searchContainer.style.display = 'none';

    currentSearchTerm = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    const activeDataTabs = ['locations', 'dashboard', 'hotels', 'cars', 'restaurants', 'hidden-places'];
    if (activeDataTabs.includes(tabId)) {
        fetchLocations(tabId);
    } else {
        contentContainer.innerHTML = `<p style="opacity:0.7">This is the ${tabId} section. It is currently under development.</p>`;
    }
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
        currentLocations = originalLocations.filter(loc => 
            loc.name.toLowerCase().includes(currentSearchTerm) || 
            loc.type.toLowerCase().includes(currentSearchTerm)
        );
    }
    renderLocationsView(null);
}

function renderLocationsView(tabId) {
    const activeTab = tabId || document.querySelector('nav ul li.active').textContent.toLowerCase().replace(' ', '-');
    
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
        html += `<p style="grid-column: 1/-1; opacity:0.7">No results found for "${currentSearchTerm}". Try searching for specific global tourist places like 'Paris' or 'London'!</p>`;
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
                    <span>Distance: ${loc.distance}</span>
                </div>
                <p class="card-desc" style="margin-top:1rem">${loc.desc}</p>
                <button class="btn-details" style="background:#00b85c" onclick="event.stopPropagation(); alert('Premium Booking Confirmed for ${loc.name}!')">Book Now</button>
            </div>
        `;
    } else {
        return `
            <div class="premium-details" style="opacity:0.6; text-align:center; display:flex; flex-direction:column; gap:10px;">
                <p>Advanced details hidden</p>
                <small style="margin-bottom:10px;">Upgrade to Premium or Black to view details</small>
                <button class="btn-details" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2)" onclick="event.stopPropagation(); alert('Standard Booking Requested for ${loc.name}!')">Request Standard Booking</button>
            </div>
        `;
    }
}

// Simulated Smart Feature
function simulateSelection(placeName) {
    // When a user selects a place, simulate showing "nearby places"
    pageTitle.textContent = placeName;
    let html = `
        <button class="secondary" style="width:auto; margin-bottom: 2rem" onclick="switchTab('locations')">← Back to Locations</button>
        <h2 class="section-title">Details for ${placeName}</h2>
        <p style="margin-bottom: 3rem; opacity: 0.8">You have selected ${placeName}. Here are the smart recommendations.</p>
        
        <h2 class="section-title">Nearby Places Based On Your Location</h2>
        <div class="grid-layout">
    `;
    
    currentLocations.forEach(loc => {
        if(loc.name !== placeName) {
            html += `
                <div class="card">
                    <span class="card-type">${loc.type}</span>
                    <h3>${loc.name}</h3>
                    ${renderPremiumDetails(loc)}
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
