// ============================================
// CIVILCALC — Main Application
// SPA Navigation | Dark Mode | Firebase Auth & Firestore
// ============================================

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

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
        if (isFirstVisit) {
            showScreen('screen-onboarding', false);
        } else if (!auth.currentUser) {
            showScreen('screen-login', false);
        }
    }, 1800);

    // Firebase Auth listener
    auth.onAuthStateChanged(user => {
        if (user) {
            state.user = {
                displayName: user.displayName || 'Usuario',
                email: user.email || '',
                photoURL: user.photoURL || '',
                uid: user.uid
            };
            populateUserData();
            if (state.currentScreen === 'screen-loading' || state.currentScreen === 'screen-login') {
                showScreen('screen-home', false);
                state.navigationHistory = [];
            }
        } else {
            state.user = null;
            const isFirstVisit = localStorage.getItem('cc_onboarding_done') !== 'true';
            if (!isFirstVisit && state.currentScreen !== 'screen-onboarding') {
                showScreen('screen-login', false);
            }
        }
    });
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
// AUTH — Firebase Google Auth
// ============================================

function initAuth() {
    const btnGoogle = document.getElementById('btn-google-login');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', loginWithGoogle);
    }

}

async function loginWithGoogle() {
    try {
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showToast('Login cancelado');
        } else if (error.code === 'auth/popup-blocked') {
            showToast('Permitir popups para este sitio');
        } else if (error.code === 'auth/unauthorized-domain') {
            showToast('Dominio no autorizado todavía. Refrescá la página.');
        } else {
            showToast('Error: ' + error.message, 5000);
        }
    }
}

async function logout() {
    try {
        await auth.signOut();
        state.user = null;
        state.navigationHistory = [];
        showToast('Sesion cerrada');
    } catch (error) {
        console.error('Logout error:', error);
    }
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
const DIAMETERS = ['6', '8', '10', '12', '16', '20', '25', '32'];

// Color palette for cut segments
const CUT_COLORS = [
    '#1B4D6E', '#0E8A7D', '#E67E22', '#8E44AD', '#E74C3C',
    '#2980B9', '#27AE60', '#F39C12', '#1ABC9C', '#D35400'
];

let corteCurrentStep = 0;
let lastCalcTypes = null;
let lastCalcResults = null;
let viewingProjectId = null;

// ---- Firestore project helpers ----
function getUserProjectsRef() {
    if (!state.user || !state.user.uid) return null;
    return db.collection('users').doc(state.user.uid).collection('projects');
}

async function getProjects() {
    const ref = getUserProjectsRef();
    if (!ref) return [];
    try {
        const snapshot = await ref.orderBy('fecha', 'desc').get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fecha: doc.data().fecha ? doc.data().fecha.toDate().toISOString() : new Date().toISOString()
        }));
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

async function addProject(name, types, resultsHTML) {
    const ref = getUserProjectsRef();
    if (!ref) return null;
    try {
        const project = {
            nombre: name,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            types: types,
            resultsHTML: resultsHTML
        };
        const docRef = await ref.add(project);
        return { id: docRef.id, ...project, fecha: new Date().toISOString() };
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error al guardar el proyecto');
        return null;
    }
}

async function deleteProject(id) {
    const ref = getUserProjectsRef();
    if (!ref) return;
    try {
        await ref.doc(id).delete();
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Error al eliminar');
    }
}

async function updateProjectsCountLabel() {
    const label = document.getElementById('proyectos-count-label');
    if (!label) return;
    try {
        const projects = await getProjects();
        const count = projects.length;
        label.textContent = count === 0
            ? 'No tenes proyectos guardados'
            : `${count} proyecto${count !== 1 ? 's' : ''} guardado${count !== 1 ? 's' : ''}`;
    } catch (e) {
        label.textContent = 'No tenes proyectos guardados';
    }
}


function initCorteBarras() {
    const card = document.getElementById('card-corte-barras');
    if (card) {
        card.addEventListener('click', () => {
            updateProjectsCountLabel();
            goToCorteStep(0);
            showScreen('screen-corte');
        });
    }

    const btnNuevo = document.getElementById('btn-nuevo-proyecto');
    if (btnNuevo) btnNuevo.addEventListener('click', () => { resetCorteForm(); goToCorteStep(1); });

    const btnVerProy = document.getElementById('btn-ver-proyectos');
    if (btnVerProy) btnVerProy.addEventListener('click', async () => { await renderProjectsList(); goToCorteStep('projects'); });

    const btnProjNuevo = document.getElementById('btn-projects-nuevo');
    if (btnProjNuevo) btnProjNuevo.addEventListener('click', () => { resetCorteForm(); goToCorteStep(1); });

    const btnProjBack = document.getElementById('btn-projects-back');
    if (btnProjBack) btnProjBack.addEventListener('click', () => goToCorteStep(0));

    const btnDetailBack = document.getElementById('btn-project-detail-back');
    if (btnDetailBack) btnDetailBack.addEventListener('click', async () => { await renderProjectsList(); goToCorteStep('projects'); });

    const btnDeleteProject = document.getElementById('btn-project-delete');
    if (btnDeleteProject) {
        btnDeleteProject.addEventListener('click', async () => {
            if (viewingProjectId) {
                await deleteProject(viewingProjectId);
                viewingProjectId = null;
                showToast('Proyecto eliminado');
                await updateProjectsCountLabel();
                await renderProjectsList();
                goToCorteStep('projects');
            }
        });
    }

    const btnMinus = document.getElementById('btn-tipos-minus');
    const btnPlus = document.getElementById('btn-tipos-plus');
    const inputCount = document.getElementById('input-tipos-count');

    if (btnMinus) btnMinus.addEventListener('click', () => { const v = parseInt(inputCount.value) || 2; inputCount.value = Math.max(1, v - 1); });
    if (btnPlus) btnPlus.addEventListener('click', () => { const v = parseInt(inputCount.value) || 2; inputCount.value = Math.min(50, v + 1); });

    const btnStep1Next = document.getElementById('btn-corte-step1-next');
    if (btnStep1Next) {
        btnStep1Next.addEventListener('click', () => {
            const count = parseInt(inputCount.value);
            if (!count || count < 1) { showToast('Ingresá al menos 1 tipo'); return; }
            generateTypeForms(count);
            goToCorteStep(2);
        });
    }

    const btnStep2Back = document.getElementById('btn-corte-step2-back');
    if (btnStep2Back) btnStep2Back.addEventListener('click', () => goToCorteStep(1));

    const btnCalc = document.getElementById('btn-calcular');
    if (btnCalc) btnCalc.addEventListener('click', runCuttingOptimization);

    const btnStep3Back = document.getElementById('btn-corte-step3-back');
    if (btnStep3Back) btnStep3Back.addEventListener('click', () => goToCorteStep(2));

    const btnNew = document.getElementById('btn-nuevo-calculo');
    if (btnNew) btnNew.addEventListener('click', () => { resetCorteForm(); goToCorteStep(1); });

    const btnGuardar = document.getElementById('btn-guardar-proyecto');
    let isSaving = false;
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            if (isSaving) return;
            const nameInput = document.getElementById('input-project-name');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) { showToast('Ingresá un nombre para el proyecto'); if (nameInput) nameInput.focus(); return; }
            if (!lastCalcTypes) { showToast('No hay cálculo para guardar'); return; }
            isSaving = true;
            btnGuardar.disabled = true;
            const resumenEl = document.getElementById('resultado-resumen');
            const detalleEl = document.getElementById('resultado-detalle');
            const html = (resumenEl ? resumenEl.innerHTML : '') + '<!--DETAIL-->' + (detalleEl ? detalleEl.innerHTML : '');
            const result = await addProject(name, lastCalcTypes, html);
            if (result) {
                showToast('¡Proyecto guardado en la nube!');
                if (nameInput) nameInput.value = '';
                await updateProjectsCountLabel();
                const bar = document.getElementById('save-project-bar');
                if (bar) { bar.classList.add('saved'); setTimeout(() => bar.classList.remove('saved'), 2000); }
            }
            isSaving = false;
            btnGuardar.disabled = false;
        });
    }

    const btnBack = document.getElementById('btn-back-corte');
    if (btnBack) {
        btnBack.addEventListener('click', async () => {
            if (corteCurrentStep === 'projects') goToCorteStep(0);
            else if (corteCurrentStep === 'project-detail') { await renderProjectsList(); goToCorteStep('projects'); }
            else if (corteCurrentStep > 1) goToCorteStep(corteCurrentStep - 1);
            else if (corteCurrentStep === 1) goToCorteStep(0);
            else goBack();
        });
    }
}

function goToCorteStep(step) {
    corteCurrentStep = step;
    document.querySelectorAll('#screen-corte .calc-step').forEach(s => s.classList.remove('active'));
    const stepsBar = document.getElementById('corte-steps-bar');

    if (step === 0 || step === 'projects' || step === 'project-detail') {
        if (stepsBar) stepsBar.style.display = 'none';
        const targetId = step === 0 ? 'corte-step-0' : step === 'projects' ? 'corte-step-projects' : 'corte-step-project-detail';
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
    } else {
        if (stepsBar) stepsBar.style.display = '';
        const target = document.getElementById(`corte-step-${step}`);
        if (target) target.classList.add('active');
        document.querySelectorAll('.step-item').forEach(si => {
            const s = parseInt(si.dataset.step);
            si.classList.remove('active', 'completed');
            if (s === step) si.classList.add('active');
            if (s < step) si.classList.add('completed');
        });
        document.querySelectorAll('.step-connector').forEach((c, i) => { c.classList.toggle('completed', i + 1 < step); });
    }
    const main = document.querySelector('#screen-corte .calc-main');
    if (main) main.scrollTop = 0;
}

function resetCorteForm() {
    lastCalcTypes = null;
    lastCalcResults = null;
    const input = document.getElementById('input-tipos-count');
    if (input) input.value = 2;
    const container = document.getElementById('tipos-form-container');
    if (container) container.innerHTML = '';
    const nameInput = document.getElementById('input-project-name');
    if (nameInput) nameInput.value = '';
}

async function renderProjectsList() {
    const container = document.getElementById('proyectos-list-container');
    if (!container) return;
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><div class="empty-text">Cargando proyectos...</div></div>';
    const projects = await getProjects();
    if (projects.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No tenés proyectos guardados</div><div class="empty-sub">Hacé un cálculo y guardalo con un nombre</div></div>';
        return;
    }
    container.innerHTML = projects.map(p => {
        const fecha = new Date(p.fecha);
        const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
        const totalTypes = p.types ? p.types.length : 0;
        const totalPieces = p.types ? p.types.reduce((s, t) => s + t.cantidad, 0) : 0;
        return `<button class="project-card" data-project-id="${p.id}">
            <div class="project-card-left"><div class="project-card-icon">📂</div></div>
            <div class="project-card-body">
                <div class="project-card-title">${p.nombre}</div>
                <div class="project-card-meta">${fechaStr} · ${totalTypes} tipo${totalTypes !== 1 ? 's' : ''} · ${totalPieces} cortes</div>
            </div>
            <div class="project-card-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
        </button>`;
    }).join('');
    container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => openProjectDetail(card.dataset.projectId));
    });
}

async function openProjectDetail(id) {
    const projects = await getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    viewingProjectId = id;
    const container = document.getElementById('project-detail-container');
    if (!container) return;
    const fecha = new Date(project.fecha);
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const parts = project.resultsHTML ? project.resultsHTML.split('<!--DETAIL-->') : ['', ''];
    container.innerHTML = `
        <div class="project-detail-header">
            <h3 class="project-detail-name">${project.nombre}</h3>
            <div class="project-detail-date">📅 ${fechaStr}</div>
        </div>
        <div class="resultado-resumen">${parts[0] || ''}</div>
        <div>${parts[1] || ''}</div>
    `;
    goToCorteStep('project-detail');
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
        if (!largo || largo <= 0) { showToast(`Tipo ${i + 1}: Ingresá un largo válido`); return null; }
        if (largo > BAR_LENGTH) { showToast(`Tipo ${i + 1}: El largo no puede superar ${BAR_LENGTH}m`); return null; }
        if (!cantidad || cantidad <= 0) { showToast(`Tipo ${i + 1}: Ingresá una cantidad válida`); return null; }
        types.push({ nombre, diametro, largo, cantidad, index: i });
    }
    return types;
}

function optimizeCutting(pieces) {
    const sorted = [...pieces].sort((a, b) => b.largo - a.largo);
    const bars = [];
    for (const piece of sorted) {
        let placed = false;
        for (const bar of bars) {
            if (bar.remaining >= piece.largo - 0.001) {
                bar.cuts.push(piece);
                bar.remaining = Math.round((bar.remaining - piece.largo) * 100) / 100;
                placed = true;
                break;
            }
        }
        if (!placed) {
            bars.push({ remaining: Math.round((BAR_LENGTH - piece.largo) * 100) / 100, cuts: [piece] });
        }
    }
    return bars;
}

function runCuttingOptimization() {
    const types = collectBarTypes();
    if (!types) return;
    lastCalcTypes = types;
    const piecesByDiameter = {};
    types.forEach((type, tIdx) => {
        const color = CUT_COLORS[tIdx % CUT_COLORS.length];
        if (!piecesByDiameter[type.diametro]) piecesByDiameter[type.diametro] = [];
        for (let q = 0; q < type.cantidad; q++) {
            piecesByDiameter[type.diametro].push({ nombre: type.nombre, largo: type.largo, color: color });
        }
    });
    const results = {};
    for (const [diam, pieces] of Object.entries(piecesByDiameter)) {
        results[diam] = optimizeCutting(pieces);
    }
    lastCalcResults = results;
    renderResults(results, types);
    goToCorteStep(3);
}

function renderResults(results, types) {
    const resumenEl = document.getElementById('resultado-resumen');
    const detalleEl = document.getElementById('resultado-detalle');
    if (!resumenEl || !detalleEl) return;

    let totalBars = 0;
    let totalWaste = 0;
    let resumenHTML = '<div class="resumen-grid">';
    for (const [diam, bars] of Object.entries(results)) {
        const waste = bars.reduce((sum, b) => sum + b.remaining, 0);
        totalBars += bars.length;
        totalWaste += waste;
        const wastePercent = ((waste / (bars.length * BAR_LENGTH)) * 100).toFixed(1);
        resumenHTML += `<div class="resumen-card"><div class="resumen-card-header"><span class="resumen-diam">Ø ${diam} mm</span></div><div class="resumen-card-value">${bars.length}</div><div class="resumen-card-label">barras de ${BAR_LENGTH}m</div><div class="resumen-card-waste">Desperdicio: ${waste.toFixed(2)}m (${wastePercent}%)</div></div>`;
    }
    resumenHTML += '</div>';

    const totalWastePercent = totalBars > 0 ? ((totalWaste / (totalBars * BAR_LENGTH)) * 100).toFixed(1) : 0;
    resumenHTML += `<div class="resumen-total"><div class="resumen-total-row"><span>Total barras a comprar</span><strong>${totalBars}</strong></div><div class="resumen-total-row"><span>Desperdicio total</span><strong>${totalWaste.toFixed(2)}m (${totalWastePercent}%)</strong></div></div>`;

    // Shopping list
    let listaHTML = `<div class="lista-compras"><div class="lista-compras-header"><span class="lista-compras-icon">🛒</span><h4 class="lista-compras-title">Lista de Compras</h4></div><ul class="lista-compras-items">`;
    for (const [diam, bars] of Object.entries(results)) {
        listaHTML += `<li class="lista-compras-item"><span class="lista-item-qty">${bars.length}</span><span class="lista-item-desc">Barras de <strong>Ø ${diam} mm</strong> × ${BAR_LENGTH}m</span></li>`;
    }
    listaHTML += `</ul><div class="lista-compras-detalle"><div class="lista-detalle-title">Detalle de cortes a realizar:</div><ul class="lista-detalle-items">`;
    types.forEach((type, tIdx) => {
        const color = CUT_COLORS[tIdx % CUT_COLORS.length];
        listaHTML += `<li class="lista-detalle-item"><span class="lista-detalle-dot" style="background:${color}"></span><span>${type.cantidad} cortes de <strong>${type.largo}m</strong> (Ø ${type.diametro}mm) — ${type.nombre}</span></li>`;
    });
    listaHTML += `</ul></div></div>`;
    resumenEl.innerHTML = resumenHTML + listaHTML;

    // Detail: bar diagrams
    let detalleHTML = '';
    for (const [diam, bars] of Object.entries(results)) {
        detalleHTML += `<div class="detalle-group"><h4 class="detalle-group-title">Ø ${diam} mm — Plan de corte</h4>`;
        bars.forEach((bar, barIdx) => {
            const cutsHTML = bar.cuts.map(cut => {
                const wp = (cut.largo / BAR_LENGTH) * 100;
                return `<div class="bar-segment" style="width:${wp}%;background:${cut.color};" title="${cut.nombre}: ${cut.largo}m"><span class="bar-segment-label">${cut.largo}m</span></div>`;
            }).join('');
            const wPct = (bar.remaining / BAR_LENGTH) * 100;
            const wasteHTML = bar.remaining > 0 ? `<div class="bar-segment bar-waste" style="width:${wPct}%;" title="Sobrante: ${bar.remaining}m"><span class="bar-segment-label">${bar.remaining}m</span></div>` : '';
            const uniqueCuts = []; const seen = new Set();
            bar.cuts.forEach(c => { const key = `${c.nombre}-${c.largo}`; if (!seen.has(key)) { seen.add(key); uniqueCuts.push({ ...c, count: bar.cuts.filter(x => x.nombre === c.nombre && x.largo === c.largo).length }); } });
            const legendHTML = uniqueCuts.map(c => `<span class="bar-legend-item"><span class="bar-legend-dot" style="background:${c.color}"></span>${c.nombre} (${c.largo}m) ×${c.count}</span>`).join('');
            detalleHTML += `<div class="bar-diagram-card"><div class="bar-diagram-label">Barra ${barIdx + 1}</div><div class="bar-visual">${cutsHTML}${wasteHTML}</div><div class="bar-legend">${legendHTML}</div></div>`;
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
