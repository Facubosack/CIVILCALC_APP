// ============================================
// CIVILCALC — Main Application
// SPA Navigation | Dark Mode | Onboarding
// (Firebase Auth & Firestore se agregan después)
// ============================================

// ---- App State ----
const state = {
    currentScreen: 'screen-loading',
    previousScreen: null,
    user: null,
    darkMode: false,
    isFirstVisit: true,
    navigationHistory: [],
    authMode: 'login' // 'login' or 'register'
};

// ---- Push Server URL ----
const PUSH_SERVER_URL = 'http://localhost:3001';

// ============================================
// SPA NAVIGATION
// ============================================

function showScreen(targetId, addToHistory = true) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');

        if (addToHistory && state.currentScreen !== targetId) {
            state.navigationHistory.push(state.currentScreen);
        }
        state.previousScreen = state.currentScreen;
        state.currentScreen = targetId;
    }
}

function goHome() {
    showScreen('screen-home', false);
    state.navigationHistory = [];
}

function goBack() {
    if (state.navigationHistory.length > 0) {
        const prev = state.navigationHistory.pop();
        if (prev === 'screen-loading' || prev === 'screen-onboarding' || prev === 'screen-login') {
            goHome();
        } else {
            showScreen(prev, false);
        }
    } else {
        goHome();
    }
}

// ============================================
// LOADING SCREEN
// ============================================
function initLoadingScreen() {
    setTimeout(() => {
        const isFirstVisit = localStorage.getItem('cc_onboarding_done') !== 'true';
        const isLoggedIn = localStorage.getItem('cc_logged_in') === 'true';

        if (isFirstVisit) {
            showScreen('screen-onboarding', false);
        } else if (!isLoggedIn) {
            showScreen('screen-login', false);
        } else {
            // Restore user data
            restoreUser();
            showScreen('screen-home', false);
        }
    }, 1800);
}

// ============================================
// ONBOARDING
// ============================================
let currentSlide = 0;
const totalSlides = 3;

function initOnboarding() {
    const btnNext = document.getElementById('btn-onboarding-next');
    const btnSkip = document.getElementById('btn-onboarding-skip');

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentSlide < totalSlides - 1) {
                currentSlide++;
                updateOnboardingSlide();
            } else {
                finishOnboarding();
            }
        });
    }

    if (btnSkip) {
        btnSkip.addEventListener('click', finishOnboarding);
    }

    // Dot clicks
    document.querySelectorAll('.onboarding-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            currentSlide = parseInt(dot.dataset.dot);
            updateOnboardingSlide();
        });
    });
}

function updateOnboardingSlide() {
    // Update slides
    document.querySelectorAll('.onboarding-slide').forEach(slide => {
        slide.classList.remove('active');
    });
    const activeSlide = document.querySelector(`.onboarding-slide[data-slide="${currentSlide}"]`);
    if (activeSlide) activeSlide.classList.add('active');

    // Update dots
    document.querySelectorAll('.onboarding-dot').forEach(dot => {
        dot.classList.remove('active');
        if (parseInt(dot.dataset.dot) === currentSlide) {
            dot.classList.add('active');
        }
    });

    // Update button text
    const btnNext = document.getElementById('btn-onboarding-next');
    if (btnNext) {
        btnNext.textContent = currentSlide === totalSlides - 1 ? 'Empezar' : 'Siguiente';
    }

    // Hide skip on last slide
    const btnSkip = document.getElementById('btn-onboarding-skip');
    if (btnSkip) {
        btnSkip.style.display = currentSlide === totalSlides - 1 ? 'none' : 'block';
    }
}

function finishOnboarding() {
    localStorage.setItem('cc_onboarding_done', 'true');
    showScreen('screen-login', false);
}

// ============================================
// AUTH (Visual — sin Firebase por ahora)
// ============================================

function initAuth() {
    // Google login button
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', loginWithGoogle);
    }

    // Email auth button
    const btnEmail = document.getElementById('btn-email-auth');
    if (btnEmail) {
        btnEmail.addEventListener('click', loginWithEmail);
    }

    // Toggle auth mode
    const btnToggle = document.getElementById('btn-toggle-auth');
    if (btnToggle) {
        btnToggle.addEventListener('click', toggleAuthMode);
    }
}

function loginWithGoogle() {
    // TODO: Integrar Firebase Auth
    showToast('Login con Google — próximamente con Firebase');

    // Simular login exitoso
    simulateLogin('Usuario', 'usuario@gmail.com');
}

function loginWithEmail() {
    const email = document.getElementById('input-login-email')?.value?.trim();
    const password = document.getElementById('input-login-password')?.value;

    if (!email || !password) {
        showToast('Ingresá email y contraseña');
        return;
    }

    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (state.authMode === 'register') {
        showToast('Cuenta creada correctamente 🎉');
    } else {
        showToast('¡Bienvenido/a! 🎉');
    }

    const name = email.split('@')[0];
    simulateLogin(name, email);
}

function simulateLogin(name, email) {
    state.user = {
        displayName: name,
        email: email,
        photoURL: ''
    };

    localStorage.setItem('cc_logged_in', 'true');
    localStorage.setItem('cc_user_name', name);
    localStorage.setItem('cc_user_email', email);

    populateUserData();
    showScreen('screen-home', false);
    state.navigationHistory = [];
}

function restoreUser() {
    const name = localStorage.getItem('cc_user_name') || 'Usuario';
    const email = localStorage.getItem('cc_user_email') || '';
    state.user = { displayName: name, email: email, photoURL: '' };
    populateUserData();
}

function toggleAuthMode(e) {
    if (e) e.preventDefault();
    state.authMode = state.authMode === 'login' ? 'register' : 'login';

    const btnAuth = document.getElementById('btn-email-auth');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleBtn = document.getElementById('btn-toggle-auth');

    if (state.authMode === 'login') {
        if (btnAuth) btnAuth.textContent = 'Iniciar Sesión';
        if (toggleText) toggleText.textContent = '¿No tenés cuenta?';
        if (toggleBtn) toggleBtn.textContent = ' Crear una';
    } else {
        if (btnAuth) btnAuth.textContent = 'Crear Cuenta';
        if (toggleText) toggleText.textContent = '¿Ya tenés cuenta?';
        if (toggleBtn) toggleBtn.textContent = ' Iniciar Sesión';
    }
}

function logout() {
    state.user = null;
    localStorage.removeItem('cc_logged_in');
    localStorage.removeItem('cc_user_name');
    localStorage.removeItem('cc_user_email');
    showScreen('screen-login', false);
    state.navigationHistory = [];
    showToast('Sesión cerrada');
}

// ---- Populate User Data ----
function populateUserData() {
    if (!state.user) return;

    const firstName = getFirstName(state.user.displayName);

    // Home greeting
    const greeting = document.getElementById('greeting-text');
    if (greeting) {
        greeting.textContent = getGreeting() + ', ' + firstName + '!';
    }

    // Header avatar initials
    const avatarInitials = document.getElementById('user-avatar-initials');
    if (avatarInitials) {
        avatarInitials.textContent = getInitials(state.user.displayName);
    }

    // Settings
    const settingsAvatar = document.getElementById('settings-avatar');
    if (settingsAvatar) {
        settingsAvatar.textContent = getInitials(state.user.displayName);
    }

    const settingsName = document.getElementById('settings-user-name');
    if (settingsName) {
        settingsName.textContent = state.user.displayName || 'Usuario';
    }

    const settingsEmail = document.getElementById('settings-user-email');
    if (settingsEmail) {
        settingsEmail.textContent = state.user.email || '';
    }
}

// ---- Greeting based on time ----
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '¡Buenas noches';
    if (hour < 12) return '¡Buen día';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
}

function getFirstName(fullName) {
    if (!fullName) return 'amigo/a';
    return fullName.split(' ')[0].charAt(0).toUpperCase() + fullName.split(' ')[0].slice(1);
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ============================================
// DARK MODE
// ============================================

function initDarkMode() {
    const savedTheme = localStorage.getItem('cc_theme');
    if (savedTheme === 'dark') {
        enableDarkMode(true);
    } else if (savedTheme === 'light') {
        enableDarkMode(false);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        enableDarkMode(prefersDark);
    }
}

function enableDarkMode(enable) {
    state.darkMode = enable;
    document.documentElement.setAttribute('data-theme', enable ? 'dark' : 'light');
    localStorage.setItem('cc_theme', enable ? 'dark' : 'light');

    const toggle = document.getElementById('toggle-dark-mode');
    if (toggle) {
        toggle.checked = enable;
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.content = enable ? '#0D1117' : '#1B4D6E';
    }
}

// ============================================
// CORTE DE BARRAS — Full Feature
// ============================================

const BAR_LENGTH = 12; // meters, standard rebar length in Argentina
const DIAMETERS = ['4.2', '6', '8', '10', '12', '16', '20', '25', '32'];

// Color palette for cut segments
const CUT_COLORS = [
    '#1B4D6E', '#0E8A7D', '#E67E22', '#8E44AD', '#E74C3C',
    '#2980B9', '#27AE60', '#F39C12', '#1ABC9C', '#D35400'
];

let corteCurrentStep = 1;

function initCorteBarras() {
    // Home card click
    const card = document.getElementById('card-corte-barras');
    if (card) {
        card.addEventListener('click', () => {
            resetCorteForm();
            showScreen('screen-corte');
        });
    }

    // Step 1: ± buttons
    const btnMinus = document.getElementById('btn-tipos-minus');
    const btnPlus = document.getElementById('btn-tipos-plus');
    const inputCount = document.getElementById('input-tipos-count');

    if (btnMinus) {
        btnMinus.addEventListener('click', () => {
            const v = parseInt(inputCount.value) || 2;
            inputCount.value = Math.max(1, v - 1);
        });
    }
    if (btnPlus) {
        btnPlus.addEventListener('click', () => {
            const v = parseInt(inputCount.value) || 2;
            inputCount.value = Math.min(50, v + 1);
        });
    }

    // Step 1 → Step 2
    const btnStep1Next = document.getElementById('btn-corte-step1-next');
    if (btnStep1Next) {
        btnStep1Next.addEventListener('click', () => {
            const count = parseInt(inputCount.value);
            if (!count || count < 1) {
                showToast('Ingresá al menos 1 tipo');
                return;
            }
            generateTypeForms(count);
            goToCorteStep(2);
        });
    }

    // Step 2 → back to Step 1
    const btnStep2Back = document.getElementById('btn-corte-step2-back');
    if (btnStep2Back) {
        btnStep2Back.addEventListener('click', () => goToCorteStep(1));
    }

    // Step 2 → Calculate → Step 3
    const btnCalc = document.getElementById('btn-calcular');
    if (btnCalc) {
        btnCalc.addEventListener('click', runCuttingOptimization);
    }

    // Step 3 → back to Step 2
    const btnStep3Back = document.getElementById('btn-corte-step3-back');
    if (btnStep3Back) {
        btnStep3Back.addEventListener('click', () => goToCorteStep(2));
    }

    // New calculation
    const btnNew = document.getElementById('btn-nuevo-calculo');
    if (btnNew) {
        btnNew.addEventListener('click', () => {
            resetCorteForm();
            goToCorteStep(1);
        });
    }

    // Back button from corte screen
    const btnBack = document.getElementById('btn-back-corte');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (corteCurrentStep > 1) {
                goToCorteStep(corteCurrentStep - 1);
            } else {
                goBack();
            }
        });
    }
}

function goToCorteStep(step) {
    corteCurrentStep = step;

    // Hide all steps
    document.querySelectorAll('.calc-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`corte-step-${step}`);
    if (target) target.classList.add('active');

    // Update step indicator
    document.querySelectorAll('.step-item').forEach(si => {
        const s = parseInt(si.dataset.step);
        si.classList.remove('active', 'completed');
        if (s === step) si.classList.add('active');
        if (s < step) si.classList.add('completed');
    });

    // Update connector lines
    const connectors = document.querySelectorAll('.step-connector');
    connectors.forEach((c, i) => {
        c.classList.toggle('completed', i + 1 < step);
    });

    // Scroll to top
    const main = document.querySelector('#screen-corte .calc-main');
    if (main) main.scrollTop = 0;
}

function resetCorteForm() {
    corteCurrentStep = 1;
    const input = document.getElementById('input-tipos-count');
    if (input) input.value = 2;
    const container = document.getElementById('tipos-form-container');
    if (container) container.innerHTML = '';
    goToCorteStep(1);
}

// ---- Generate dynamic form cards ----
function generateTypeForms(count) {
    const container = document.getElementById('tipos-form-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const card = document.createElement('div');
        card.className = 'tipo-form-card';
        card.innerHTML = `
            <div class="tipo-form-header">
                <span class="tipo-form-number">${i + 1}</span>
                <span class="tipo-form-label">Tipo ${i + 1}</span>
            </div>
            <div class="tipo-form-fields">
                <div class="form-row-2col">
                    <div class="form-group">
                        <label class="form-label">Nombre</label>
                        <input type="text" class="form-input tipo-nombre" placeholder="Ej: Estribo C1" data-index="${i}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Diámetro (mm)</label>
                        <select class="form-input tipo-diametro" data-index="${i}">
                            ${DIAMETERS.map(d => `<option value="${d}"${d === '8' ? ' selected' : ''}>Ø ${d} mm</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row-2col">
                    <div class="form-group">
                        <label class="form-label">Largo (m)</label>
                        <input type="number" class="form-input tipo-largo" placeholder="Ej: 1.60" step="0.01" min="0.01" max="12" data-index="${i}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cantidad</label>
                        <input type="number" class="form-input tipo-cantidad" placeholder="Ej: 50" min="1" max="9999" data-index="${i}">
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
}

// ---- Collect form data ----
function collectBarTypes() {
    const nombres = document.querySelectorAll('.tipo-nombre');
    const diametros = document.querySelectorAll('.tipo-diametro');
    const largos = document.querySelectorAll('.tipo-largo');
    const cantidades = document.querySelectorAll('.tipo-cantidad');

    const types = [];
    for (let i = 0; i < nombres.length; i++) {
        const nombre = nombres[i].value.trim() || `Tipo ${i + 1}`;
        const diametro = parseFloat(diametros[i].value);
        const largo = parseFloat(largos[i].value);
        const cantidad = parseInt(cantidades[i].value);

        if (!largo || largo <= 0) {
            showToast(`Tipo ${i + 1}: Ingresá un largo válido`);
            return null;
        }
        if (largo > BAR_LENGTH) {
            showToast(`Tipo ${i + 1}: El largo no puede superar ${BAR_LENGTH}m`);
            return null;
        }
        if (!cantidad || cantidad <= 0) {
            showToast(`Tipo ${i + 1}: Ingresá una cantidad válida`);
            return null;
        }

        types.push({ nombre, diametro, largo, cantidad, index: i });
    }
    return types;
}

// ---- Cutting Optimization (First Fit Decreasing) ----
function optimizeCutting(pieces) {
    // Sort by length descending (FFD)
    const sorted = [...pieces].sort((a, b) => b.largo - a.largo);
    const bars = []; // { remaining, cuts: [{nombre, largo, color}] }

    for (const piece of sorted) {
        let placed = false;
        for (const bar of bars) {
            if (bar.remaining >= piece.largo - 0.001) { // small tolerance for float
                bar.cuts.push(piece);
                bar.remaining = Math.round((bar.remaining - piece.largo) * 100) / 100;
                placed = true;
                break;
            }
        }
        if (!placed) {
            bars.push({
                remaining: Math.round((BAR_LENGTH - piece.largo) * 100) / 100,
                cuts: [piece]
            });
        }
    }
    return bars;
}

// ---- Run the optimization ----
function runCuttingOptimization() {
    const types = collectBarTypes();
    if (!types) return;

    // Expand types into individual pieces, assign colors
    const piecesByDiameter = {};
    types.forEach((type, tIdx) => {
        const color = CUT_COLORS[tIdx % CUT_COLORS.length];
        if (!piecesByDiameter[type.diametro]) {
            piecesByDiameter[type.diametro] = [];
        }
        for (let q = 0; q < type.cantidad; q++) {
            piecesByDiameter[type.diametro].push({
                nombre: type.nombre,
                largo: type.largo,
                color: color
            });
        }
    });

    // Run optimization per diameter
    const results = {};
    for (const [diam, pieces] of Object.entries(piecesByDiameter)) {
        results[diam] = optimizeCutting(pieces);
    }

    renderResults(results, types);
    goToCorteStep(3);
}

// ---- Render Results ----
function renderResults(results, types) {
    const resumenEl = document.getElementById('resultado-resumen');
    const detalleEl = document.getElementById('resultado-detalle');
    if (!resumenEl || !detalleEl) return;

    // Summary cards
    let totalBars = 0;
    let totalWaste = 0;
    let resumenHTML = '<div class="resumen-grid">';

    for (const [diam, bars] of Object.entries(results)) {
        const waste = bars.reduce((sum, b) => sum + b.remaining, 0);
        totalBars += bars.length;
        totalWaste += waste;
        const wastePercent = ((waste / (bars.length * BAR_LENGTH)) * 100).toFixed(1);

        resumenHTML += `
            <div class="resumen-card">
                <div class="resumen-card-header">
                    <span class="resumen-diam">Ø ${diam} mm</span>
                </div>
                <div class="resumen-card-value">${bars.length}</div>
                <div class="resumen-card-label">barras de ${BAR_LENGTH}m</div>
                <div class="resumen-card-waste">Desperdicio: ${waste.toFixed(2)}m (${wastePercent}%)</div>
            </div>
        `;
    }
    resumenHTML += '</div>';

    // Total summary
    const totalWastePercent = totalBars > 0 ? ((totalWaste / (totalBars * BAR_LENGTH)) * 100).toFixed(1) : 0;
    resumenHTML += `
        <div class="resumen-total">
            <div class="resumen-total-row">
                <span>Total barras a comprar</span>
                <strong>${totalBars}</strong>
            </div>
            <div class="resumen-total-row">
                <span>Desperdicio total</span>
                <strong>${totalWaste.toFixed(2)}m (${totalWastePercent}%)</strong>
            </div>
        </div>
    `;
    resumenEl.innerHTML = resumenHTML;

    // Detail: visual bar diagrams per diameter
    let detalleHTML = '';
    for (const [diam, bars] of Object.entries(results)) {
        detalleHTML += `
            <div class="detalle-group">
                <h4 class="detalle-group-title">Ø ${diam} mm — Plan de corte</h4>
        `;

        bars.forEach((bar, barIdx) => {
            const cutsHTML = bar.cuts.map(cut => {
                const widthPercent = (cut.largo / BAR_LENGTH) * 100;
                return `
                    <div class="bar-segment" style="width:${widthPercent}%;background:${cut.color};" title="${cut.nombre}: ${cut.largo}m">
                        <span class="bar-segment-label">${cut.largo}m</span>
                    </div>
                `;
            }).join('');

            const wastePercent = (bar.remaining / BAR_LENGTH) * 100;
            const wasteHTML = bar.remaining > 0 ? `
                <div class="bar-segment bar-waste" style="width:${wastePercent}%;" title="Sobrante: ${bar.remaining}m">
                    <span class="bar-segment-label">${bar.remaining}m</span>
                </div>
            ` : '';

            // Build legend for this bar
            const uniqueCuts = [];
            const seen = new Set();
            bar.cuts.forEach(c => {
                const key = `${c.nombre}-${c.largo}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    const count = bar.cuts.filter(x => x.nombre === c.nombre && x.largo === c.largo).length;
                    uniqueCuts.push({ ...c, count });
                }
            });
            const legendHTML = uniqueCuts.map(c =>
                `<span class="bar-legend-item"><span class="bar-legend-dot" style="background:${c.color}"></span>${c.nombre} (${c.largo}m) ×${c.count}</span>`
            ).join('');

            detalleHTML += `
                <div class="bar-diagram-card">
                    <div class="bar-diagram-label">Barra ${barIdx + 1}</div>
                    <div class="bar-visual">
                        ${cutsHTML}
                        ${wasteHTML}
                    </div>
                    <div class="bar-legend">${legendHTML}</div>
                </div>
            `;
        });

        detalleHTML += '</div>';
    }
    detalleEl.innerHTML = detalleHTML;
}

// ============================================
// SETTINGS
// ============================================

function initSettings() {
    // Dark mode toggle
    const toggleDM = document.getElementById('toggle-dark-mode');
    if (toggleDM) {
        toggleDM.addEventListener('change', () => {
            enableDarkMode(toggleDM.checked);
        });
    }

    // Push notifications toggle
    const togglePush = document.getElementById('toggle-push');
    if (togglePush) {
        togglePush.addEventListener('change', () => {
            if (togglePush.checked) {
                showToast('Notificaciones — próximamente');
            }
        });
    }

    // Reminders toggle
    const toggleReminders = document.getElementById('toggle-reminders');
    if (toggleReminders) {
        toggleReminders.addEventListener('change', () => {
            if (toggleReminders.checked) {
                showToast('Recordatorios — próximamente');
            }
        });
    }

    // Reset data
    const btnReset = document.getElementById('btn-reset-data');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            showConfirmModal('¿Borrar todos tus datos? Esta acción no se puede deshacer.', () => {
                localStorage.clear();
                showToast('Datos eliminados');
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            });
        });
    }

    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            showConfirmModal('¿Cerrar sesión?', logout);
        });
    }
}

// ============================================
// MODALS
// ============================================

let confirmCallback = null;

function showConfirmModal(text, onConfirm) {
    const modal = document.getElementById('modal-confirm');
    const textEl = document.getElementById('modal-confirm-text');

    if (textEl) textEl.textContent = text;
    confirmCallback = onConfirm;

    if (modal) modal.classList.add('active');
}

function hideConfirmModal() {
    const modal = document.getElementById('modal-confirm');
    if (modal) modal.classList.remove('active');
    confirmCallback = null;
}

function initModals() {
    // Confirm modal
    const btnCancel = document.getElementById('modal-confirm-cancel');
    const btnOk = document.getElementById('modal-confirm-ok');

    if (btnCancel) {
        btnCancel.addEventListener('click', hideConfirmModal);
    }

    if (btnOk) {
        btnOk.addEventListener('click', () => {
            if (confirmCallback) confirmCallback();
            hideConfirmModal();
        });
    }

    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

// ============================================
// TOAST
// ============================================

let toastTimeout = null;

function showToast(message, duration = 2500) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toast-text');

    if (!toast || !text) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    text.textContent = message;
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ============================================
// NAVIGATION BUTTONS
// ============================================

function initNavButtons() {
    // Settings button (header)
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => showScreen('screen-settings'));
    }

    // Back from settings
    const btnBackSettings = document.getElementById('btn-back-settings');
    if (btnBackSettings) {
        btnBackSettings.addEventListener('click', goBack);
    }

    // Profile button
    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) {
        btnProfile.addEventListener('click', () => showScreen('screen-settings'));
    }
}

// ============================================
// HARDWARE BACK BUTTON (Android)
// ============================================

window.addEventListener('popstate', (e) => {
    e.preventDefault();
    if (state.currentScreen !== 'screen-home') {
        goBack();
    }
});

// Push initial state
if (window.history && window.history.pushState) {
    window.history.pushState({}, '');
    window.addEventListener('popstate', () => {
        window.history.pushState({}, '');
    });
}

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('[App] Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('[App] Service Worker registration failed:', error);
        }
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Core init
    initDarkMode();
    initOnboarding();
    initAuth();
    initCorteBarras();
    initSettings();
    initModals();
    initNavButtons();

    // Start loading
    initLoadingScreen();

    // Register SW
    registerServiceWorker();

    console.log('🏗️ CivilCalc v1.0.0 — Ready');
});
