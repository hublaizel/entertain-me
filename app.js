// ==========================================
// ENTERTAIN ME - APP LOGIC & STATE MANAGEMENT
// ==========================================

// --- State Definition ---
let state = {
    currentUser: 'planner', // 'planner' (Flavio) or 'provider' (Martin)
    activeView: 'home',
    plannerName: 'Flavio',
    providerName: 'Martin',
    
    // Core data lists
    events: [],
    providerOffers: [],
    matches: [],
    chatMessages: [],
    
    // Match view mode for planner: 'provider' or 'service'
    matchViewMode: 'provider'
};

// --- Default Data Initialization (Mocking the Slides scenario) ---
const DEFAULT_STATE = {
    currentUser: 'planner',
    activeView: 'home',
    plannerName: 'Flavio',
    providerName: 'Martin',
    matchViewMode: 'provider',
    
    events: [
        {
            id: 'event-flavio-1',
            plannerId: 'flavio',
            name: 'Flavios Geburtstagsparty',
            type: 'Geburtstagsparty',
            needs: ['Raum', 'Catering'],
            date: '2026-11-05',
            time: '12:00 – 02:00',
            people: 'Ca. 30 Personen',
            location: '8050 Zürich',
            radius: 15,
            wishes: {
                raum: ['Musikanlage', 'Beamer'],
                catering: ['Nur Getränke']
            },
            status: 'active',
            createdAt: new Date().toISOString()
        }
    ],
    
    providerOffers: [
        {
            id: 'offer-martin-raum',
            providerId: 'martin',
            category: 'Raum',
            location: '8057 Zürich',
            radius: 50,
            eventTypes: ['Geburtstagsparty', 'Hochzeit', 'Firmenfest', 'Vereinsfest', 'Andere'],
            specs: ['Musikanlage', 'Aussenplatz', 'Keine andere Gäste', 'Nur mit Verpflegung'], // Note: lacks 'Beamer'
            description: 'Unser Eventraum in Zürich Oerlikon bietet Platz für bis zu 50 Personen. Perfekt für Geburtstage und Vereinsfeste. Wir brauen unser eigenes Bier!',
            createdAt: new Date().toISOString()
        },
        {
            id: 'offer-martin-catering',
            providerId: 'martin',
            category: 'Catering',
            location: '8057 Zürich',
            radius: 50,
            eventTypes: ['Geburtstagsparty', 'Hochzeit', 'Firmenfest', 'Vereinsfest', 'Andere'],
            specs: ['Nur Getränke', 'Vegetarische Optionen'],
            description: 'Hausgebrautes Bier, erlesene Weine und Cateringservice für Events in Zürich und Umgebung.',
            createdAt: new Date().toISOString()
        }
    ],
    
    matches: [
        {
            id: 'match-martin-raum',
            eventId: 'event-flavio-1',
            offerId: 'offer-martin-raum',
            category: 'Raum',
            // States: 'potential' -> 'provider_sent' -> 'planner_interested' / 'rejected' -> 'accepted'
            status: 'potential', 
            providerMessage: '',
            updatedAt: new Date().toISOString()
        },
        {
            id: 'match-martin-catering',
            eventId: 'event-flavio-1',
            offerId: 'offer-martin-catering',
            category: 'Catering',
            status: 'potential',
            providerMessage: '',
            updatedAt: new Date().toISOString()
        }
    ],
    
    chatMessages: [
        // Message template: { matchId, senderId, text, timestamp, isDocument, docName }
    ]
};

// --- Initialization on Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateNavigationWelcome();
    navigateTo(state.activeView);
    updateBadges();
});

// --- State Persistence ---
function saveState() {
    localStorage.setItem('entertainme_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('entertainme_state');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error('Fehler beim Laden des States. Setze zurück.', e);
            state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    } else {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveState();
    }
}

function resetState() {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    showToast('Prototyp zurückgesetzt', 'info');
    updateNavigationWelcome();
    navigateTo('home');
    updateBadges();
}

// --- Toast Notifications ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${type === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
        </svg>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- Navigation / Routing ---
function navigateTo(viewId, params = {}) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) {
        activeView.classList.add('active');
        state.activeView = viewId;
        saveState();
        
        // Trigger specific view renders
        if (viewId === 'planner-dashboard') renderPlannerDashboard();
        if (viewId === 'provider-dashboard') renderProviderDashboard();
        if (viewId === 'planner-matches') renderPlannerMatches(params.eventId || 'event-flavio-1');
        if (viewId === 'match-details') renderMatchDetails(params.matchId);
        
        window.scrollTo(0, 0);
    } else {
        console.error(`View 'view-${viewId}' existiert nicht.`);
    }
}

function goToDashboard() {
    if (state.currentUser === 'planner') {
        navigateTo('planner-dashboard');
    } else {
        navigateTo('provider-dashboard');
    }
}

// --- Role Switcher Logic ---
function switchRole(role) {
    state.currentUser = role;
    saveState();
    
    // Update Role Switcher Buttons UI
    document.getElementById('btn-role-planner').classList.toggle('active', role === 'planner');
    document.getElementById('btn-role-provider').classList.toggle('active', role === 'provider');
    
    updateNavigationWelcome();
    updateBadges();
    
    // Redirect to respective dashboard
    if (role === 'planner') {
        navigateTo('planner-dashboard');
        showToast('Zu Planer-Rolle (Flavio) gewechselt', 'info');
    } else {
        navigateTo('provider-dashboard');
        showToast('Zu Anbieter-Rolle (Martin) gewechselt', 'info');
    }
}

function updateNavigationWelcome() {
    const welcomeSpan = document.getElementById('user-display-name');
    if (state.currentUser === 'planner') {
        welcomeSpan.textContent = `Hoi ${state.plannerName}`;
    } else {
        welcomeSpan.textContent = `Hoi ${state.providerName}`;
    }
}

function updateBadges() {
    // Calculate new messages for planner (sent by provider but not yet handled by planner)
    // Matches where status is 'provider_sent'
    const plannerNewMatches = state.matches.filter(m => m.status === 'provider_sent').length;
    const plannerBadge = document.getElementById('badge-planner-nav');
    plannerBadge.textContent = plannerNewMatches;
    plannerBadge.classList.toggle('zero', plannerNewMatches === 0);
    
    // Calculate new potential matches for provider
    // Matches where status is 'potential'
    const providerNewMatches = state.matches.filter(m => m.status === 'potential').length;
    const providerBadge = document.getElementById('badge-provider-nav');
    providerBadge.textContent = providerNewMatches;
    providerBadge.classList.toggle('zero', providerNewMatches === 0);
}

// --- Business Flows: Initial Decision Card Triggers ---
function startPlannerFlow() {
    switchRole('planner');
}

function startProviderFlow() {
    switchRole('provider');
}

// --- Register Flow ---
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    
    if (state.currentUser === 'planner') {
        state.plannerName = name;
        showToast(`Profil für Planer ${name} erstellt!`, 'success');
        navigateTo('event-create');
    } else {
        state.providerName = name;
        showToast(`Profil für Anbieter ${name} erstellt!`, 'success');
        navigateTo('offer-create');
    }
    
    updateNavigationWelcome();
    saveState();
}

// ==========================================
// WIZARD FOR EVENT CREATION (PLANNER)
// ==========================================
let currentWizardStep = 1;

function nextWizardStep(step) {
    // Basic validation
    if (step > currentWizardStep) {
        if (currentWizardStep === 1) {
            const name = document.getElementById('event-name').value;
            if (!name) {
                showToast('Bitte gib einen Event-Namen ein.', 'info');
                return;
            }
        }
    }
    
    // Hide all steps
    document.querySelectorAll('.wizard-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`wizard-step-${step}`).classList.add('active');
    
    // Update step dots
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        dot.classList.remove('active', 'complete');
        if (i < step) {
            dot.classList.add('complete');
        } else if (i === step) {
            dot.classList.add('active');
        }
    }
    
    currentWizardStep = step;
}

function handleCreateEvent(event) {
    event.preventDefault();
    
    const name = document.getElementById('event-name').value;
    const type = document.querySelector('input[name="event-type"]:checked').value;
    
    // Needs
    const needs = [];
    if (document.getElementById('need-raum').checked) needs.push('Raum');
    if (document.getElementById('need-catering').checked) needs.push('Catering');
    if (document.getElementById('need-unterhaltung').checked) needs.push('Unterhaltung');
    if (document.getElementById('need-fotografie').checked) needs.push('Fotografie');
    
    if (needs.length === 0) {
        showToast('Bitte wähle mindestens einen Bedarf aus.', 'info');
        return;
    }
    
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const people = document.getElementById('event-people').value;
    const location = document.getElementById('event-location').value;
    const radius = parseInt(document.getElementById('event-radius').value);
    
    // Wishes
    const wishesRaum = Array.from(document.querySelectorAll('input[name="wish-raum"]:checked')).map(el => el.value);
    const wishesCatering = Array.from(document.querySelectorAll('input[name="wish-catering"]:checked')).map(el => el.value);
    
    const newEvent = {
        id: `event-${Date.now()}`,
        plannerId: 'flavio',
        name,
        type,
        needs,
        date,
        time,
        people,
        location,
        radius,
        wishes: {
            raum: wishesRaum,
            catering: wishesCatering
        },
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    state.events.push(newEvent);
    
    // Re-evaluate matching with existing provider offers
    generateMatchesForEvent(newEvent);
    
    showToast('Event erfolgreich angelegt!', 'success');
    saveState();
    updateBadges();
    
    // Reset wizard
    document.getElementById('event-create-form').reset();
    currentWizardStep = 1;
    nextWizardStep(1);
    
    navigateTo('planner-dashboard');
}

function generateMatchesForEvent(newEvent) {
    state.providerOffers.forEach(offer => {
        // Simple mock matching engine:
        // Matches if Category matches any of the event needs, and locations overlap
        if (newEvent.needs.includes(offer.category)) {
            // Check if match already exists
            const exists = state.matches.some(m => m.eventId === newEvent.id && m.offerId === offer.id);
            if (!exists) {
                state.matches.push({
                    id: `match-${newEvent.id}-${offer.id}`,
                    eventId: newEvent.id,
                    offerId: offer.id,
                    category: offer.category,
                    status: 'potential',
                    providerMessage: '',
                    updatedAt: new Date().toISOString()
                });
            }
        }
    });
}

// ==========================================
// RENDER: PLANNER DASHBOARD (FLAVIO)
// ==========================================
function renderPlannerDashboard() {
    const listBody = document.getElementById('planner-events-list');
    listBody.innerHTML = '';
    
    const plannerEvents = state.events.filter(e => e.plannerId === 'flavio');
    
    // Calculate total planned events
    document.getElementById('planner-stats-text').textContent = 
        `Momentan hast du ${plannerEvents.length} geplante${plannerEvents.length === 1 ? 'n' : 'e'} Event${plannerEvents.length === 1 ? '' : 's'} in der Zukunft`;
    
    if (plannerEvents.length === 0) {
        listBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">Keine Events angelegt. Erstelle dein erstes Event!</td></tr>`;
        return;
    }
    
    plannerEvents.forEach(e => {
        // Calculate new messages for this specific event (matches with status 'provider_sent')
        const eventMatches = state.matches.filter(m => m.eventId === e.id);
        const newMsgsCount = eventMatches.filter(m => m.status === 'provider_sent').length;
        
        // Date formatting: Calculate days remaining
        const diffTime = new Date(e.date) - new Date();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysLabel = diffDays > 0 ? `in ${diffDays} Tagen` : 'heute';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(e.name)}</strong></td>
            <td>${formatDateGerman(e.date)} <span style="font-size:0.8rem; color:var(--text-muted); block">${daysLabel}</span></td>
            <td>${escapeHtml(e.type)}</td>
            <td>${e.needs.join(', ')}</td>
            <td>
                <span class="badge-count ${newMsgsCount === 0 ? 'zero' : ''}">${newMsgsCount}</span>
            </td>
        `;
        row.onclick = () => navigateTo('planner-matches', { eventId: e.id });
        listBody.appendChild(row);
    });
}

// ==========================================
// RENDER: PLANNER MATCH LIST (APPLICATION VIEW)
// ==========================================
function setMatchViewMode(mode) {
    state.matchViewMode = mode;
    document.getElementById('btn-toggle-provider').classList.toggle('active', mode === 'provider');
    document.getElementById('btn-toggle-service').classList.toggle('active', mode === 'service');
    saveState();
    
    // Find active event from UI context (we search the current event ID in DOM)
    const activeEventId = document.getElementById('planner-event-bar-info').getAttribute('data-event-id');
    renderPlannerMatches(activeEventId);
}

function renderPlannerMatches(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Render Event Info Header
    const eventBar = document.getElementById('planner-event-bar-info');
    eventBar.setAttribute('data-event-id', eventId);
    
    const diffTime = new Date(event.date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    eventBar.innerHTML = `
        <div class="event-info-main">
            <h2>${escapeHtml(event.name)}</h2>
            <div class="event-meta-tags">
                <div class="event-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
                    ${formatDateGerman(event.date)} (in ${diffDays} Tagen)
                </div>
                <div class="event-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${escapeHtml(event.location)} (+${event.radius}km)
                </div>
                <div class="event-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    ${escapeHtml(event.people)}
                </div>
            </div>
        </div>
        <div class="event-info-needs">
            <span style="font-size:0.8rem; color:var(--text-muted); display:block; text-align:right">Gesucht:</span>
            <strong>${event.needs.join(', ')}</strong>
        </div>
    `;
    
    // Find all matches for this event (excluding 'potential' - planner only sees matches that are sent, accepted, rejected, etc. as in Slide 27/28)
    const matches = state.matches.filter(m => m.eventId === eventId && m.status !== 'potential');
    const container = document.getElementById('planner-matches-container');
    container.innerHTML = '';
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="section-card" style="text-align:center; padding: 50px 20px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:15px"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                <h3>Noch keine Bewerbungen erhalten</h3>
                <p>Sobald passende Dienstleister sich auf deine Ausschreibung bewerben, werden sie hier angezeigt.</p>
                <p style="font-size:0.85rem">[SYSTEM_INFO] <em>Tipp: Wechsle in der Prototyp-Steuerung unten zu <strong>Martin (Anbieter)</strong> und reiche seine Bewerbung ein!</em></p>
            </div>
        `;
        return;
    }
    
    if (state.matchViewMode === 'provider') {
        // Group by Provider
        // Our mock provider is Martin (we can mock Gottfried or others if needed)
        // Group matches by providerName. In our mock state, all matching offers are from Martin.
        const providerGroups = {};
        
        matches.forEach(m => {
            const offer = state.providerOffers.find(o => o.id === m.offerId);
            if (!offer) return;
            const providerName = 'Martin'; // Martin is the mock provider
            
            if (!providerGroups[providerName]) {
                providerGroups[providerName] = {
                    providerName,
                    matches: [],
                    categories: []
                };
            }
            providerGroups[providerName].matches.push(m);
            providerGroups[providerName].categories.push(m.category);
        });
        
        Object.values(providerGroups).forEach(group => {
            // Determine overall status for this provider group:
            // If any match is 'provider_sent', action needed is "Schau dir das Profil an"
            // If all matches are accepted/rejected, display that status.
            let overallStatusText = 'Schau dir das Profil an';
            let overallStatusClass = 'status-sent';
            
            const hasSent = group.matches.some(m => m.status === 'provider_sent');
            const hasAccepted = group.matches.some(m => m.status === 'accepted' || m.status === 'planner_interested');
            const allRejected = group.matches.every(m => m.status === 'rejected');
            
            if (allRejected) {
                overallStatusText = 'Abgelehnt';
                overallStatusClass = 'status-rejected';
            } else if (hasAccepted) {
                overallStatusText = 'Chat aktiv';
                overallStatusClass = 'status-accepted';
            } else if (hasSent) {
                overallStatusText = 'Schau dir das Profil an';
                overallStatusClass = 'status-sent';
            }
            
            const card = document.createElement('div');
            card.className = `match-card ${hasSent ? 'provider-sent' : ''}`;
            card.innerHTML = `
                <div class="match-card-main">
                    <div class="match-avatar">${group.providerName[0]}</div>
                    <div class="match-details-body">
                        <h4>${group.providerName}</h4>
                        <div class="match-specs-inline">
                            <span>Bietet: <strong>${group.categories.join(', ')}</strong></span>
                        </div>
                    </div>
                </div>
                <div class="match-card-action">
                    <span class="match-status-tag ${overallStatusClass}" style="margin-right:15px">${overallStatusText}</span>
                    <button class="btn btn-secondary" onclick="openCombinedProviderMatches('${group.providerName}', '${eventId}')">Details</button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } else {
        // Group/List by Service
        matches.forEach(m => {
            const offer = state.providerOffers.find(o => o.id === m.offerId);
            if (!offer) return;
            
            let statusText = 'Schau dir das Profil an';
            let statusClass = 'status-sent';
            
            if (m.status === 'provider_sent') {
                statusText = 'Schau dir das Profil an';
                statusClass = 'status-sent';
            } else if (m.status === 'planner_interested') {
                statusText = 'Interesse bekundet';
                statusClass = 'status-interested';
            } else if (m.status === 'accepted') {
                statusText = 'Profil angenommen';
                statusClass = 'status-accepted';
            } else if (m.status === 'rejected') {
                statusText = 'Profil abgelehnt';
                statusClass = 'status-rejected';
            }
            
            const card = document.createElement('div');
            card.className = `match-card ${m.status === 'provider_sent' ? 'provider-sent' : ''}`;
            card.innerHTML = `
                <div class="match-card-main">
                    <div class="match-avatar">${offer.category === 'Raum' ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="16"/><line x1="15" y1="22" x2="15" y2="16"/><line x1="9" y1="16" x2="15" y2="16"/><path d="M9 6h6M9 10h6"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v4M12 15V2a1 1 0 0 1 1-1h1a7 7 0 0 1 7 7v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1zm0 0v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-5M8 12v5c0 2.2 1.8 4 4 4"/></svg>' }</div>
                    <div class="match-details-body">
                        <h4>${offer.category}</h4>
                        <div class="match-specs-inline">
                            <span>Wer: <strong>Martin</strong></span>
                        </div>
                    </div>
                </div>
                <div class="match-card-action">
                    <span class="match-status-tag ${statusClass}" style="margin-right:15px">${statusText}</span>
                    <button class="btn btn-secondary" onclick="navigateTo('match-details', { matchId: '${m.id}' })">Details</button>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Redirect combined provider click (e.g. Martin click) to either their Room or Catering details
function openCombinedProviderMatches(providerName, eventId) {
    // In our prototype, if we click Martin, we go to Room match details first (which leads into the slides scenario)
    // Or Catering, depending on what is active.
    const martinRoomMatch = state.matches.find(m => m.eventId === eventId && m.category === 'Raum');
    if (martinRoomMatch && martinRoomMatch.status !== 'potential') {
        navigateTo('match-details', { matchId: martinRoomMatch.id });
    } else {
        const martinCateringMatch = state.matches.find(m => m.eventId === eventId && m.category === 'Catering');
        if (martinCateringMatch) {
            navigateTo('match-details', { matchId: martinCateringMatch.id });
        }
    }
}

// Helper to determine back routing
function goBackToMatchesOrDashboard() {
    navigateTo('planner-matches', { eventId: 'event-flavio-1' });
}

// ==========================================
// RENDER: MATCH DETAILS & SOLL/IST COMPARE & CHAT
// ==========================================
let currentActiveMatchId = null;

function renderMatchDetails(matchId) {
    currentActiveMatchId = matchId;
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const event = state.events.find(e => e.id === match.eventId);
    const offer = state.providerOffers.find(o => o.id === match.offerId);
    
    if (!event || !offer) return;
    
    // --- Render Left Side: Soll/Ist Evaluation ---
    const evalCard = document.getElementById('match-eval-card');
    
    // Evaluate matching checklist
    let wishesList = [];
    let offerSpecs = offer.specs;
    let category = match.category;
    let evalListHTML = '';
    
    if (category === 'Raum') {
        wishesList = event.wishes.raum;
        const allPossibleWishes = ['Musikanlage', 'Aussenplatz', 'Beamer', 'Keine andere Gäste', 'Nur mit Verpflegung', 'Nur ohne Verpflegung'];
        
        // Draw comparison list
        allPossibleWishes.forEach(wish => {
            const isRequired = wishesList.includes(wish);
            const isProvided = offerSpecs.includes(wish);
            
            let statusIcon = '';
            let statusText = '';
            
            if (isRequired && isProvided) {
                statusIcon = '<div class="eval-status-icon icon-ok">✓</div>';
                statusText = 'Soll erfüllt';
            } else if (isRequired && !isProvided) {
                statusIcon = '<div class="eval-status-icon icon-missing">✗</div>';
                statusText = 'Soll fehlt';
            } else if (!isRequired && isProvided) {
                statusIcon = '<div class="eval-status-icon icon-neutral">✓</div>';
                statusText = 'Zusatzangebot';
            } else {
                // Not required, not provided
                return; 
            }
            
            evalListHTML += `
                <div class="eval-item">
                    <div class="eval-item-label">
                        ${statusIcon}
                        <span>${wish}</span>
                    </div>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${statusText}</span>
                </div>
            `;
        });
    } else if (category === 'Catering') {
        wishesList = event.wishes.catering;
        const allPossibleWishes = ['Nur Getränke', 'Nur Essen', 'Vegetarische Optionen', 'Vegane Optionen', 'Nur Vegetarisch', 'Kein Alkohol'];
        
        allPossibleWishes.forEach(wish => {
            const isRequired = wishesList.includes(wish);
            const isProvided = offerSpecs.includes(wish);
            
            let statusIcon = '';
            let statusText = '';
            
            if (isRequired && isProvided) {
                statusIcon = '<div class="eval-status-icon icon-ok">✓</div>';
                statusText = 'Soll erfüllt';
            } else if (isRequired && !isProvided) {
                statusIcon = '<div class="eval-status-icon icon-missing">✗</div>';
                statusText = 'Soll fehlt';
            } else if (!isRequired && isProvided) {
                statusIcon = '<div class="eval-status-icon icon-neutral">✓</div>';
                statusText = 'Zusatzangebot';
            } else {
                return;
            }
            
            evalListHTML += `
                <div class="eval-item">
                    <div class="eval-item-label">
                        ${statusIcon}
                        <span>${wish}</span>
                    </div>
                    <span style="font-size:0.8rem; color:var(--text-muted);">${statusText}</span>
                </div>
            `;
        });
    }
    
    // Compile Evaluation HTML
    const providerName = 'Martin';
    let extraNotesHTML = '';
    
    // Specific business rules from the concept:
    if (category === 'Raum' && offerSpecs.includes('Nur mit Verpflegung')) {
        extraNotesHTML = `
            <div class="eval-note">
                <div class="eval-note-title">Wichtige Info von Martin:</div>
                Für diesen Raum muss zumindest zum Teil Verpflegung von Martin bezogen werden!
            </div>
        `;
    }
    
    evalCard.innerHTML = `
        <div class="eval-header">
            <h3>Matching-Detail</h3>
            <p style="margin-bottom:0">Soll/Ist-Vergleich für <strong>${category}</strong></p>
        </div>
        
        <div class="eval-matching-summary">
            ${providerName}s Angebot deckt sich gut mit deinen Wünschen.
        </div>
        
        <div class="eval-list">
            ${evalListHTML}
        </div>
        
        ${extraNotesHTML}
        
        <div style="margin-top: 30px; border-top: 1px solid var(--border-color); padding-top:20px">
            <span style="font-size:0.8rem; color:var(--text-muted); display:block; margin-bottom:5px">Beschreibung des Anbieters:</span>
            <p style="font-size:0.85rem; font-style:italic; line-height:1.4">${escapeHtml(offer.description)}</p>
        </div>
    `;
    
    // --- Render Right Side: Chat and Actions ---
    document.querySelector('.chat-input-bar').style.display = 'flex';
    
    // Header Partner Name
    document.getElementById('chat-partner-name').textContent = state.currentUser === 'planner' ? providerName : state.plannerName;
    document.getElementById('chat-partner-avatar').textContent = state.currentUser === 'planner' ? providerName[0] : state.plannerName[0];
    
    // Action Buttons in Header depending on match status and active user
    const headerActions = document.getElementById('chat-header-actions');
    headerActions.innerHTML = '';
    
    // Only show PDF document panel if there's a document shared in this match chat
    const matchMessages = state.chatMessages.filter(msg => msg.matchId === matchId);
    const hasDoc = matchMessages.some(m => m.isDocument);
    const docPanel = document.getElementById('chat-documents-list');
    
    if (hasDoc) {
        docPanel.style.display = 'block';
        const docMsg = matchMessages.find(m => m.isDocument);
        document.getElementById('doc-file-name').textContent = docMsg.docName;
    } else {
        docPanel.style.display = 'none';
    }
    
    // Render Actions based on user and status
    if (state.currentUser === 'planner') {
        // Hiding upload file button for planners
        document.getElementById('chat-upload-offer-btn').style.display = 'none';
        
        if (match.status === 'provider_sent') {
            // Planner has to decide whether they are interested (Slide 29 / 31)
            headerActions.innerHTML = `
                <button class="btn btn-danger" onclick="setMatchStatus('${matchId}', 'rejected')" style="padding: 6px 12px; font-size:0.8rem">Das passt nicht</button>
                <button class="btn btn-success" onclick="setMatchStatus('${matchId}', 'planner_interested')" style="padding: 6px 12px; font-size:0.8rem; margin-left: 8px;">Ich bin interessiert</button>
            `;
        } else if (match.status === 'planner_interested') {
            // Planner is interested, can accept/hire (Slide 32)
            headerActions.innerHTML = `
                <button class="btn btn-secondary" onclick="setMatchStatus('${matchId}', 'rejected')" style="padding: 6px 12px; font-size:0.8rem">Profil ablehnen</button>
                <button class="btn btn-success" onclick="setMatchStatus('${matchId}', 'accepted')" style="padding: 6px 12px; font-size:0.8rem; margin-left: 8px;">Profil annehmen</button>
            `;
        } else if (match.status === 'accepted') {
            headerActions.innerHTML = `<span class="match-status-tag status-accepted">Profil Angenommen</span>`;
        } else if (match.status === 'rejected') {
            headerActions.innerHTML = `<span class="match-status-tag status-rejected">Profil Abgelehnt</span>`;
        }
    } else {
        // Provider Martin View
        document.getElementById('chat-upload-offer-btn').style.display = 'flex';
        
        if (match.status === 'provider_sent') {
            headerActions.innerHTML = `<span class="match-status-tag status-sent">Bewerbung gesendet</span>`;
        } else if (match.status === 'planner_interested') {
            headerActions.innerHTML = `<span class="match-status-tag status-interested">Planer ist interessiert</span>`;
        } else if (match.status === 'accepted') {
            headerActions.innerHTML = `<span class="match-status-tag status-accepted">Auftrag Erhalten!</span>`;
        } else if (match.status === 'rejected') {
            headerActions.innerHTML = `<span class="match-status-tag status-rejected">Abgelehnt</span>`;
        }
    }
    
    // --- Render Chat Messages ---
    renderChatMessages(matchId, match.providerMessage);
}

function renderChatMessages(matchId, initialProviderMsg) {
    const msgContainer = document.getElementById('chat-messages-container');
    msgContainer.innerHTML = '';
    
    // If provider has sent the profile, display their initial note as the first message
    if (initialProviderMsg) {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble msg-received`;
        // If Martin is viewing, he sent this message, so make it right-aligned (msg-sent)
        if (state.currentUser === 'provider') {
            bubble.className = `msg-bubble msg-sent`;
        }
        
        bubble.innerHTML = `
            <div>${escapeHtml(initialProviderMsg)}</div>
            <div class="msg-meta">
                <span>${state.currentUser === 'planner' ? 'Martin' : 'Ich'} (Bewerbungs-Nachricht)</span>
            </div>
        `;
        msgContainer.appendChild(bubble);
    }
    
    // Filter messages for this match
    const messages = state.chatMessages.filter(m => m.matchId === matchId);
    
    messages.forEach(msg => {
        const bubble = document.createElement('div');
        
        const isMyMessage = (state.currentUser === 'planner' && msg.senderId === 'flavio') || 
                            (state.currentUser === 'provider' && msg.senderId === 'martin');
        
        bubble.className = `msg-bubble ${isMyMessage ? 'msg-sent' : 'msg-received'}`;
        
        let msgContent = escapeHtml(msg.text);
        if (msg.isDocument) {
            msgContent = `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <strong>${escapeHtml(msg.docName)}</strong>
                </div>
                <span>${escapeHtml(msg.text)}</span>
            `;
        }
        
        bubble.innerHTML = `
            <div>${msgContent}</div>
            <div class="msg-meta">
                <span>${msg.senderId === 'flavio' ? 'Flavio' : 'Martin'}</span>
                <span>${formatTime(msg.timestamp)}</span>
            </div>
        `;
        msgContainer.appendChild(bubble);
    });
    
    // Scroll to bottom
    msgContainer.scrollTop = msgContainer.scrollHeight;
}

// --- Send Chat Message ---
function handleSendChatMessage(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input-field');
    const text = input.value.trim();
    if (!text || !currentActiveMatchId) return;
    
    const newMessage = {
        matchId: currentActiveMatchId,
        senderId: state.currentUser === 'planner' ? 'flavio' : 'martin',
        text: text,
        timestamp: new Date().toISOString(),
        isDocument: false
    };
    
    state.chatMessages.push(newMessage);
    saveState();
    
    input.value = '';
    
    // Re-render chat
    const match = state.matches.find(m => m.id === currentActiveMatchId);
    renderChatMessages(currentActiveMatchId, match.providerMessage);
    
    // If planner sent a message, auto-respond to simulate a conversational partner after 1.5s
    if (state.currentUser === 'planner') {
        simulateProviderResponse(currentActiveMatchId, text);
    }
}

// Simulated automated provider responses for interactive feel
function simulateProviderResponse(matchId, plannerText) {
    setTimeout(() => {
        let replyText = 'Danke für deine Nachricht! Ich schaue mir das an.';
        
        if (plannerText.toLowerCase().includes('bier') || plannerText.toLowerCase().includes('alkoholfrei')) {
            replyText = 'Ja klar, wir haben auch alkoholfreies IPA und Weizenbier im Sortiment. Ich passe das in der Offerte an!';
        } else if (plannerText.toLowerCase().includes('preis') || plannerText.toLowerCase().includes('kosten')) {
            replyText = 'Das Angebot liegt im normalen Rahmen. Gerne können wir eine genaue Offerte per Telefon besprechen.';
        }
        
        state.chatMessages.push({
            matchId: matchId,
            senderId: 'martin',
            text: replyText,
            timestamp: new Date().toISOString(),
            isDocument: false
        });
        saveState();
        
        if (state.activeView === 'match-details' && currentActiveMatchId === matchId) {
            const match = state.matches.find(m => m.id === matchId);
            renderChatMessages(matchId, match.providerMessage);
            showToast('Neue Nachricht von Martin erhalten', 'info');
        }
    }, 1500);
}

// --- Simulate Upload PDF Offer ---
function simulateOfferUpload() {
    if (!currentActiveMatchId) return;
    
    const docName = `Offerte_1_${state.currentUser === 'provider' ? 'Martin' : 'Gottfried'}.pdf`;
    
    const docMessage = {
        matchId: currentActiveMatchId,
        senderId: 'martin',
        text: 'Hier ist das detaillierte PDF-Angebot für deinen Event. Bitte schau es dir an.',
        timestamp: new Date().toISOString(),
        isDocument: true,
        docName: docName
    };
    
    state.chatMessages.push(docMessage);
    saveState();
    
    const match = state.matches.find(m => m.id === currentActiveMatchId);
    renderChatMessages(currentActiveMatchId, match.providerMessage);
    
    // Toggle Document View list
    document.getElementById('chat-documents-list').style.display = 'block';
    document.getElementById('doc-file-name').textContent = docName;
    
    showToast('Offerte (PDF) erfolgreich hochgeladen', 'success');
}

function simulateDownload(event) {
    event.preventDefault();
    showToast('Download der Datei gestartet...', 'success');
}

// --- Action Setter: Accept/Reject/Submit matches ---
function setMatchStatus(matchId, status) {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;
    
    match.status = status;
    match.updatedAt = new Date().toISOString();
    saveState();
    updateBadges();
    
    let msg = '';
    if (status === 'planner_interested') {
        msg = 'Interesse bekundet! Chat ist jetzt freigeschaltet.';
        
        // Also simulate Martin sending an initial chat offer (Slide 34)
        state.chatMessages.push({
            matchId: matchId,
            senderId: 'martin',
            text: 'Hoi Flavio, Ich habe dir mal in den Dokumenten aufgrund deiner Angaben eine Offerte zukommen lassen - Martin',
            timestamp: new Date().toISOString(),
            isDocument: false
        });
        state.chatMessages.push({
            matchId: matchId,
            senderId: 'martin',
            text: 'Gerne kannst du mir hier eine Rückmeldung geben - Martin',
            timestamp: new Date().toISOString(),
            isDocument: false
        });
        // Also pre-add the Gottfried/Martin PDF
        state.chatMessages.push({
            matchId: matchId,
            senderId: 'martin',
            text: 'Hier ist die Preisauflistung.',
            timestamp: new Date().toISOString(),
            isDocument: true,
            docName: 'Offerte 1_Gottfried.pdf'
        });
        saveState();
    } else if (status === 'accepted') {
        msg = 'Profil erfolgreich angenommen!';
    } else if (status === 'rejected') {
        msg = 'Profil wurde abgelehnt.';
    }
    
    showToast(msg, status === 'rejected' ? 'info' : 'success');
    
    // Re-render view
    renderMatchDetails(matchId);
}

// ==========================================
// RENDER: PROVIDER DASHBOARD (MARTIN)
// ==========================================
function renderProviderDashboard() {
    const providerName = 'Martin';
    document.getElementById('provider-welcome-title').textContent = `Hoi ${providerName}!`;
    
    const providerOffers = state.providerOffers.filter(o => o.providerId === 'martin');
    const offersText = providerOffers.map(o => o.category).join(' und ');
    document.getElementById('provider-stats-text').textContent = `Momentan bietest du deinen ${offersText || 'Service'} an`;
    
    // Update Stats counts
    document.getElementById('stat-active-offers').textContent = providerOffers.length;
    
    // Calculate stats based on matches linked to Martin's offers
    const offerIds = providerOffers.map(o => o.id);
    const martinMatches = state.matches.filter(m => offerIds.includes(m.offerId));
    
    const openOffersCount = martinMatches.filter(m => m.status === 'planner_interested').length;
    const openMatchesCount = martinMatches.filter(m => m.status === 'accepted').length;
    const potentialMatchesCount = martinMatches.filter(m => m.status === 'potential').length;
    
    document.getElementById('stat-active-quotes').textContent = openOffersCount;
    document.getElementById('stat-active-matches').textContent = openMatchesCount;
    document.getElementById('stat-potential-matches').textContent = potentialMatchesCount;
    
    // Fill Potential Matches Table
    const potentialTable = document.getElementById('provider-potential-matches-list');
    potentialTable.innerHTML = '';
    
    const listMatches = martinMatches; // Show all states for Martin to click through
    
    if (listMatches.length === 0) {
        potentialTable.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">Keine passenden Ausschreibungen gefunden.</td></tr>`;
        return;
    }
    
    listMatches.forEach(m => {
        const event = state.events.find(e => e.id === m.eventId);
        const offer = state.providerOffers.find(o => o.id === m.offerId);
        if (!event || !offer) return;
        
        let statusBadge = '';
        if (m.status === 'potential') {
            statusBadge = '<span class="match-status-tag status-potential">Offen</span>';
        } else if (m.status === 'provider_sent') {
            statusBadge = '<span class="match-status-tag status-sent">Profil gesendet</span>';
        } else if (m.status === 'planner_interested') {
            statusBadge = '<span class="match-status-tag status-interested">Interesse bekundet (Chat)</span>';
        } else if (m.status === 'accepted') {
            statusBadge = '<span class="match-status-tag status-accepted">Angenommen</span>';
        } else if (m.status === 'rejected') {
            statusBadge = '<span class="match-status-tag status-rejected">Abgelehnt</span>';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(event.name)}</strong></td>
            <td>${formatDateGerman(event.date)}</td>
            <td>${escapeHtml(event.type)}</td>
            <td>${offer.category}</td>
            <td>${escapeHtml(event.location)}</td>
            <td>${statusBadge}</td>
        `;
        
        row.onclick = () => {
            if (m.status === 'potential') {
                openPotentialMatchDetails(m.id);
            } else {
                // If already submitted/active, open chat details directly
                navigateTo('match-details', { matchId: m.id });
            }
        };
        potentialTable.appendChild(row);
    });
}

// Martin views potential match: Slide 21/22/23
function openPotentialMatchDetails(matchId) {
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const event = state.events.find(e => e.id === match.eventId);
    const offer = state.providerOffers.find(o => o.id === match.offerId);
    if (!event || !offer) return;
    
    // We navigate to a custom modal-style detail view or reuse match-details view.
    // For simple implementation, we render the match details split view but adjust the left panel
    // to have the "Bewerbung senden" form (Slide 22/23)!
    
    navigateTo('match-details', { matchId: match.id });
    
    // Custom rewrite of the Left Eval Card to match Slide 21/22/23
    const evalCard = document.getElementById('match-eval-card');
    
    // Evaluate matching checklist
    let wishesList = [];
    let offerSpecs = offer.specs;
    let category = match.category;
    let evalListHTML = '';
    
    if (category === 'Raum') {
        wishesList = event.wishes.raum;
        const allPossibleWishes = ['Musikanlage', 'Aussenplatz', 'Beamer', 'Keine andere Gäste', 'Nur mit Verpflegung', 'Nur ohne Verpflegung'];
        
        allPossibleWishes.forEach(wish => {
            const isRequired = wishesList.includes(wish);
            const isProvided = offerSpecs.includes(wish);
            
            let statusIcon = '';
            if (isRequired && isProvided) statusIcon = '<span style="color:var(--color-teal); font-weight:bold">✓</span>';
            else if (isRequired && !isProvided) statusIcon = '<span style="color:var(--color-rose); font-weight:bold">✗</span>';
            else if (!isRequired && isProvided) statusIcon = '<span style="color:var(--text-muted);">✓</span>';
            else return;
            
            evalListHTML += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                    <span>${statusIcon} ${wish}</span>
                    <span style="color:var(--text-muted); font-size:0.8rem">${isRequired ? 'Erforderlich' : 'Zusatz'}</span>
                </div>
            `;
        });
    } else {
        wishesList = event.wishes.catering;
        const allPossibleWishes = ['Nur Getränke', 'Nur Essen', 'Vegetarische Optionen', 'Vegane Optionen', 'Nur Vegetarisch', 'Kein Alkohol'];
        
        allPossibleWishes.forEach(wish => {
            const isRequired = wishesList.includes(wish);
            const isProvided = offerSpecs.includes(wish);
            
            let statusIcon = '';
            if (isRequired && isProvided) statusIcon = '<span style="color:var(--color-teal); font-weight:bold">✓</span>';
            else if (isRequired && !isProvided) statusIcon = '<span style="color:var(--color-rose); font-weight:bold">✗</span>';
            else if (!isRequired && isProvided) statusIcon = '<span style="color:var(--text-muted);">✓</span>';
            else return;
            
            evalListHTML += `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                    <span>${statusIcon} ${wish}</span>
                    <span style="color:var(--text-muted); font-size:0.8rem">${isRequired ? 'Erforderlich' : 'Zusatz'}</span>
                </div>
            `;
        });
    }
    
    // Check if Beamer is lacking for the Room (Slide 22)
    let comparisonText = '';
    let customInitialMessage = '';
    
    if (category === 'Raum') {
        comparisonText = `
            <p style="font-size:0.9rem; margin-bottom:15px">
                Flavios Wünsche für einen Raum und dein Angebot passen gut übereinander.<br>
                <span style="color:var(--text-muted)">Du bietest einige Extras die Flavio nicht braucht:</span> <strong>Aussenplatz, keine Andere Gäste</strong><br>
                <span style="color:var(--color-rose)">Flavio braucht was, was du nicht anbietest:</span> <strong>Beamer</strong>
            </p>
        `;
        customInitialMessage = 'Grundsätzlich hat es Platz für ein Beamer und eine Leinwand und könnte auch organisiert werden. Wir brauen unser eigenes Bier, welches konsumiert werden muss. Essen und andere Getränke sind frei wählbar und können auch von dir selber mitgebracht werden.';
    } else {
        comparisonText = `
            <p style="font-size:0.9rem; margin-bottom:15px">
                Flavios Wünsche für das Catering und dein Angebot passen gut übereinander.
            </p>
        `;
        customInitialMessage = 'Falls unser Raum für dich nicht passt, bieten wir unser Bier und Weine auch zur Lieferung an. Gerne kannst du auch für eine Degustation vorbeikommen.';
    }
    
    evalCard.innerHTML = `
        <div class="eval-header">
            <h3>Bewerbung senden</h3>
            <p style="margin-bottom:0">Projekt: <strong>${event.name}</strong></p>
        </div>
        
        ${comparisonText}
        
        <div style="background: rgba(255,255,255,0.02); padding:15px; border-radius:var(--radius-md); border:1px solid var(--border-color); margin-bottom:20px">
            <h5 style="margin-bottom:8px; font-size:0.85rem; color:var(--text-muted)">Soll/Ist Check:</h5>
            ${evalListHTML}
        </div>
        
        <form onsubmit="submitProviderApplication(event, '${matchId}')">
            <div class="form-group">
                <label for="apply-message">Kurze Mitteilung an ${event.plannerId === 'flavio' ? 'Flavio' : 'Kunden'} (2-3 Sätze):</label>
                <textarea id="apply-message" rows="4" required placeholder="Nachricht eingeben...">${customInitialMessage}</textarea>
            </div>
            
            <label class="inline-checkbox" style="margin-bottom:20px; display:flex">
                <input type="checkbox" required checked>
                <span>Ich möchte mein Profil für ${category} an ${state.plannerName} senden</span>
            </label>
            
            <button type="submit" class="btn btn-success btn-block">Profil absenden</button>
        </form>
    `;
    
    // Clear Chat area on the right, as it is not yet active
    const msgContainer = document.getElementById('chat-messages-container');
    msgContainer.innerHTML = `
        <div style="text-align:center; margin:auto; color:var(--text-muted); padding:30px">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:10px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>Der Chat wird freigeschaltet, sobald ${state.plannerName} Interesse an deiner Bewerbung bekundet hat.</p>
        </div>
    `;
    
    // Hide inputs/send buttons
    document.querySelector('.chat-input-bar').style.display = 'none';
    document.getElementById('chat-header-actions').innerHTML = `<span class="match-status-tag status-potential">Ungebucht</span>`;
}

function submitProviderApplication(event, matchId) {
    event.preventDefault();
    const match = state.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const message = document.getElementById('apply-message').value;
    
    match.status = 'provider_sent';
    match.providerMessage = message;
    match.updatedAt = new Date().toISOString();
    saveState();
    
    updateBadges();
    showToast('Profil erfolgreich gesendet!', 'success');
    
    // Go back to provider dashboard
    navigateTo('provider-dashboard');
}

// ==========================================
// RENDER: CREATE PROVIDER OFFER (MARTIN)
// ==========================================
function toggleOfferSpecFields() {
    const category = document.getElementById('offer-category').value;
    document.getElementById('spec-raum-fields').style.display = category === 'Raum' ? 'block' : 'none';
    document.getElementById('spec-catering-fields').style.display = category === 'Catering' ? 'block' : 'none';
}

function handleCreateOffer(event) {
    event.preventDefault();
    
    const category = document.getElementById('offer-category').value;
    const location = document.getElementById('offer-location').value;
    const radius = parseInt(document.getElementById('offer-radius').value);
    const desc = document.getElementById('offer-desc').value;
    
    const eventTypes = Array.from(document.querySelectorAll('input[name="offer-event-types"]:checked')).map(el => el.value);
    
    let specs = [];
    if (category === 'Raum') {
        specs = Array.from(document.querySelectorAll('input[name="spec-raum-item"]:checked')).map(el => el.value);
    } else if (category === 'Catering') {
        specs = Array.from(document.querySelectorAll('input[name="spec-catering-item"]:checked')).map(el => el.value);
    }
    
    const newOffer = {
        id: `offer-${Date.now()}`,
        providerId: 'martin',
        category,
        location,
        radius,
        eventTypes,
        specs,
        description: desc || `Unser professionelles Angebot in der Kategorie ${category}.`,
        createdAt: new Date().toISOString()
    };
    
    state.providerOffers.push(newOffer);
    
    // Evaluate if this matches any existing active events
    state.events.forEach(ev => {
        if (ev.needs.includes(category)) {
            const exists = state.matches.some(m => m.eventId === ev.id && m.offerId === newOffer.id);
            if (!exists) {
                state.matches.push({
                    id: `match-${ev.id}-${newOffer.id}`,
                    eventId: ev.id,
                    offerId: newOffer.id,
                    category: category,
                    status: 'potential',
                    providerMessage: '',
                    updatedAt: new Date().toISOString()
                });
            }
        }
    });
    
    showToast('Angebot erfolgreich hinzugefügt!', 'success');
    saveState();
    updateBadges();
    
    document.getElementById('offer-create-form').reset();
    navigateTo('provider-dashboard');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatDateGerman(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function formatTime(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const hrs = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hrs}:${mins}`;
}

function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
