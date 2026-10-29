/**
 * FIPSPlanDeTesis - Directorio de Docentes y Líneas de Investigación
 * Controlador 100% EN VIVO desde Google Drive (Google Sheets Unificados)
 * Formato unificado: Col 0 (Línea) · Col 1 (No) · Col 2 (Grado) · Col 3 (Docentes)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Configuración de Carreras (Metadatos & Nuevos Enlaces Nativos de Google Sheets)
    // ==========================================================================
    const FIPS_CARRERAS = {
        DAISI: {
            code: 'DAISI',
            name: 'Ingeniería de Sistemas',
            depto: 'Departamento Académico de Ingeniería de Sistemas e Informática',
            icon: 'laptop',
            drive_id: '1mm4t1oeJZbbQAz-5srWMO094Agcp_B0eNNYQjGeBRuY',
            drive_url: 'https://docs.google.com/spreadsheets/d/1mm4t1oeJZbbQAz-5srWMO094Agcp_B0eNNYQjGeBRuY/edit?usp=sharing',
            docentes: null
        },
        DAII: {
            code: 'DAII',
            name: 'Ingeniería Industrial',
            depto: 'Departamento Académico de Ingeniería Industrial',
            icon: 'factory',
            drive_id: '18lY89v-LqzC-jwuRbbG_1NpuPtNuAgPiRM525MatIwA',
            drive_url: 'https://docs.google.com/spreadsheets/d/18lY89v-LqzC-jwuRbbG_1NpuPtNuAgPiRM525MatIwA/edit?usp=sharing',
            docentes: null
        },
        DAIE: {
            code: 'DAIE',
            name: 'Ingeniería Electrónica',
            depto: 'Departamento Académico de Ingeniería Electrónica',
            icon: 'cpu',
            drive_id: '1Aq8Em6RPryg4OkMj4nbnRN_iMvcz0tUNwha559QktFc',
            drive_url: 'https://docs.google.com/spreadsheets/d/1Aq8Em6RPryg4OkMj4nbnRN_iMvcz0tUNwha559QktFc/edit?usp=sharing',
            docentes: null
        },
        DAIEL: {
            code: 'DAIEL',
            name: 'Ingeniería Eléctrica',
            depto: 'Departamento Académico de Ingeniería Eléctrica',
            icon: 'zap',
            drive_id: '1vVXsedy4u2NzkazNT-Lf4sOB9AKzZ6XK2tWs2bKsvbM',
            drive_url: 'https://docs.google.com/spreadsheets/d/1vVXsedy4u2NzkazNT-Lf4sOB9AKzZ6XK2tWs2bKsvbM/edit?usp=sharing',
            docentes: null
        },
        DAIME: {
            code: 'DAIME',
            name: 'Ingeniería Mecánica',
            depto: 'Departamento Académico de Ingeniería Mecánica',
            icon: 'cog',
            drive_id: '1cq2fxtjHvYkJydFDexPswKomXQeefZHXvwztGUmg8D4',
            drive_url: 'https://docs.google.com/spreadsheets/d/1cq2fxtjHvYkJydFDexPswKomXQeefZHXvwztGUmg8D4/edit?usp=sharing',
            docentes: null
        }
    };

    // ==========================================================================
    // 2. Funciones de Limpieza y Normalización Unificadas
    // ==========================================================================
    function formatTitleCase(strIn) {
        if (!strIn) return '';
        const smallWords = new Set(['de', 'y', 'e', 'en', 'los', 'las', 'la', 'el', 'del', 'para', 'o', 'al']);
        const acronyms = new Set(['RER', 'DAIE', 'DAISI', 'DAII', 'DAIEL', 'DAIME', 'TIC', 'IOT', 'IA']);

        return strIn.split(' ').map((w, i) => {
            if (!w) return '';
            const cleanUpper = w.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').toUpperCase();
            if (acronyms.has(cleanUpper)) {
                return w.toUpperCase();
            }
            const lower = w.toLowerCase();
            if (i > 0 && smallWords.has(lower)) {
                return lower;
            }
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        }).join(' ');
    }

    function cleanRawLineName(raw) {
        if (!raw) return '';
        let str = String(raw).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        // Eliminar numeración existente previa (ej. "1.-", "1.", "1 -", "1)")
        str = str.replace(/^\d+[\.\s\-\)]+\s*/, '').trim();

        // Corrección puntual de la primera línea de Industrial
        if (str.startsWith('Diseño y Desarrollo')) {
            return 'Diseño y Desarrollo de Bienes y Servicios';
        }

        // Si está en MAYÚSCULAS completas, convertir a Title Case preservando siglas
        if (str === str.toUpperCase() && str.length > 3) {
            return formatTitleCase(str);
        }

        return str;
    }

    function extractLineNumber(lineName) {
        const m = (lineName || '').match(/^(\d+)[\.\-]/);
        return m ? parseInt(m[1], 10) : 999;
    }

    function formatGrado(raw) {
        if (!raw) return 'Docente';
        const g = String(raw).toUpperCase().trim();
        if (g.includes('DRA')) return 'Dra.';
        if (g.includes('DR')) return 'Dr.';
        if (g.includes('MG') || g.includes('MAG')) return 'Mg.';
        if (g.includes('ING')) return 'Ing.';
        return String(raw).trim() || 'Docente';
    }

    function cleanTeacherName(raw) {
        if (!raw) return '';
        let str = String(raw).replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
        // Remover prefijos de grado si vinieran erróneamente en la celda de nombre
        str = str.replace(/^(DR\.|DRA\.|MG\.|ING\.)\s*/i, '').trim();

        const smallWords = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'san']);
        const words = str.split(' ');
        return words.map((w, i) => {
            if (!w) return '';
            const lower = w.toLowerCase();
            if (i > 0 && smallWords.has(lower)) {
                return lower;
            }
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        }).join(' ');
    }


    // ==========================================================================
    // 3. Gestión de Tema (Oscuro / Claro)
    // ==========================================================================
    const themeToggleBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || localStorage.getItem('fips_theme') || 'light';
    setTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        localStorage.setItem('fips_theme', theme);
    }

    // ==========================================================================
    // 4. Estado & Elementos del DOM
    // ==========================================================================
    let currentCarreraKey = 'DAISI';
    let searchQuery = '';
    let selectedLine = 'all';
    let selectedGrado = 'all';
    let isSyncing = false;

    const careerTabsContainer = document.getElementById('careerTabsContainer');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerDepto = document.getElementById('bannerDepto');
    const bannerIcon = document.getElementById('bannerIcon');
    const bannerDriveLink = document.getElementById('bannerDriveLink');
    const liveStatusPill = document.getElementById('liveStatusPill');
    const searchInput = document.getElementById('docentesSearchInput');
    const clearSearchBtn = document.getElementById('btnClearDocSearch');
    const linesTabsContainer = document.getElementById('linesTabsContainer');
    const linesHeaderHint = document.getElementById('linesHeaderHint');
    const btnLinesCarouselPrev = document.getElementById('btnLinesCarouselPrev');
    const btnLinesCarouselNext = document.getElementById('btnLinesCarouselNext');
    const linesCarouselViewport = document.getElementById('linesCarouselViewport');
    const gradoDropdownWrapper = document.getElementById('gradoDropdownWrapper');
    const gradoDropdownBtn = document.getElementById('gradoDropdownBtn');
    const gradoDropdownSelectedText = document.getElementById('gradoDropdownSelectedText');
    const gradoDropdownMenu = document.getElementById('gradoDropdownMenu');
    const statsDocCount = document.getElementById('statsDocCount');
    const loadingState = document.getElementById('docentesLoadingState');
    const errorState = document.getElementById('docentesErrorState');
    const btnErrorDriveFile = document.getElementById('btnErrorDriveFile');
    const btnRetrySync = document.getElementById('btnRetrySync');
    const resultsContainer = document.getElementById('docentesResultsContainer');
    const emptyState = document.getElementById('emptyDocState');
    const btnResetDocFilter = document.getElementById('btnResetDocFilter');
    const btnSyncDrive = document.getElementById('btnSyncDrive');
    const syncIcon = document.getElementById('syncIcon');
    const syncText = document.getElementById('syncText');
    const toastNotification = document.getElementById('toastNotification');

    // ==========================================================================
    // 5. Cambio de Carrera (Tabs)
    // ==========================================================================
    if (careerTabsContainer) {
        careerTabsContainer.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.career-tab-card');
            if (!tabBtn) return;
            const carreraKey = tabBtn.getAttribute('data-carrera');
            if (carreraKey && carreraKey !== currentCarreraKey) {
                switchCarrera(carreraKey);
            }
        });
    }

    function switchCarrera(carreraKey) {
        currentCarreraKey = carreraKey;
        searchQuery = '';
        selectedLine = 'all';
        selectedGrado = 'all';
        if (searchInput) {
            searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        }

        // Restaurar estado visual del selector de líneas y desplegable de grados
        if (linesTabsContainer) {
            linesTabsContainer.querySelectorAll('.line-tab-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-line') === 'all');
            });
        }

        if (gradoDropdownSelectedText) {
            gradoDropdownSelectedText.textContent = 'Todos los Grados';
        }
        if (gradoDropdownMenu) {
            gradoDropdownMenu.querySelectorAll('.custom-dropdown-item').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-grado') === 'all');
            });
        }
        if (gradoDropdownWrapper) {
            gradoDropdownWrapper.classList.remove('open');
            if (gradoDropdownBtn) gradoDropdownBtn.setAttribute('aria-expanded', 'false');
        }

        // Actualizar pestañas activas
        document.querySelectorAll('.career-tab-card').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-carrera') === carreraKey);
        });

        // Actualizar Banner
        const data = FIPS_CARRERAS[carreraKey];
        if (data) {
            if (bannerTitle) bannerTitle.textContent = data.name;
            if (bannerDepto) bannerDepto.textContent = data.depto;
            if (bannerDriveLink) bannerDriveLink.href = data.drive_url;
            if (bannerIcon) {
                bannerIcon.innerHTML = `<i data-lucide="${data.icon}"></i>`;
                if (window.lucide) lucide.createIcons();
            }
            if (btnErrorDriveFile) {
                btnErrorDriveFile.href = data.drive_url;
            }
        }

        // Si ya fueron descargados los docentes de esta carrera, renderizar de inmediato
        if (data && data.docentes && data.docentes.length > 0) {
            showResults();
            populateLineTabs();
            renderDocentes();
        } else {
            // Cargar en vivo desde Google Drive (prioritario)
            loadCareerLive(carreraKey, false);
        }
    }

    function showLoading() {
        if (loadingState) loadingState.style.display = 'block';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (liveStatusPill) {
            liveStatusPill.className = 'live-status-pill';
            liveStatusPill.innerHTML = `
                <span class="loading-spinner-circle" style="width: 10px; height: 10px; border-width: 2px; margin: 0; display: inline-block;"></span>
                <span>Conectando...</span>
            `;
        }
    }

    function showError(driveUrl) {
        if (loadingState) loadingState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            if (btnErrorDriveFile) btnErrorDriveFile.href = driveUrl || '#';
        }

        // Si la transmisión en vivo NO carga: MOSTRAR SÍ O SÍ EL BOTÓN DE GOOGLE DRIVE DE FORMA PROMINENTE
        if (bannerDriveLink) {
            bannerDriveLink.className = 'btn btn-primary btn-drive-prominent';
            bannerDriveLink.style.display = 'inline-flex';
            bannerDriveLink.innerHTML = `
                <i data-lucide="external-link"></i>
                <span>Abrir en Google Drive</span>
                <i data-lucide="arrow-up-right"></i>
            `;
            if (driveUrl) bannerDriveLink.href = driveUrl;
        }

        if (liveStatusPill) {
            liveStatusPill.className = 'live-status-pill offline';
            liveStatusPill.innerHTML = `
                <span class="live-status-dot offline"></span>
                <span>Sin conexión en vivo</span>
            `;
        }

        if (window.lucide) lucide.createIcons();
    }

    function showResults() {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        // Ocultar un poco el botón de Google Drive cuando la transmisión en vivo está activa
        if (bannerDriveLink) {
            bannerDriveLink.className = 'btn-banner-drive-subtle';
            bannerDriveLink.style.display = 'inline-flex';
            bannerDriveLink.innerHTML = `
                <i data-lucide="file-spreadsheet"></i>
                <span>Hoja en Drive</span>
                <i data-lucide="arrow-up-right" class="subtle-arrow"></i>
            `;
        }

        if (liveStatusPill) {
            liveStatusPill.className = 'live-status-pill online';
            liveStatusPill.innerHTML = `
                <span class="live-status-dot online"></span>
                <span>En vivo</span>
            `;
        }

        if (window.lucide) lucide.createIcons();
    }

    // ==========================================================================
    // 6. Población de Tarjetas de Líneas de Investigación (Formato Escuelas)
    // ==========================================================================
    function getLineIconMeta(name, idx) {
        const n = (name || '').toLowerCase();
        if (n.includes('inteligencia') || n.includes('artificial') || /\bia\b/.test(n) || n.includes('machine learning')) {
            return { icon: 'brain', colorClass: 'icon-line-ai' };
        }
        if (n.includes('gráfico') || n.includes('grafic') || n.includes('imagen') || n.includes('visión') || n.includes('vision') || n.includes('virtual')) {
            return { icon: 'image', colorClass: 'icon-line-media' };
        }
        if (n.includes('base de datos') || n.includes('ciencia de datos') || n.includes('data') || n.includes('información') || n.includes('informacion') || n.includes('conocimiento')) {
            return { icon: 'database', colorClass: 'icon-line-data' };
        }
        if (n.includes('software') || n.includes('programación') || n.includes('programacion') || n.includes('algoritmo') || n.includes('código')) {
            return { icon: 'code-2', colorClass: 'icon-line-code' };
        }
        if (n.includes('red') || n.includes('telecomunicac') || n.includes('distribuid') || n.includes('comunicación')) {
            return { icon: 'network', colorClass: 'icon-line-network' };
        }
        if (n.includes('electrónic') || n.includes('electronic') || n.includes('electrotecnia') || n.includes('circuito') || n.includes('micro') || n.includes('hardware')) {
            return { icon: 'cpu', colorClass: 'icon-line-cpu' };
        }
        if (n.includes('eléctric') || n.includes('electric') || n.includes('potencia') || n.includes('energía') || n.includes('energia') || n.includes('renovable') || n.includes('generación') || n.includes('generacion') || n.includes('térmica') || n.includes('termica')) {
            return { icon: 'zap', colorClass: 'icon-line-energy' };
        }
        if (n.includes('mecánic') || n.includes('mecanic') || n.includes('máquina') || n.includes('maquina') || n.includes('hidromecánic') || n.includes('hidro')) {
            return { icon: 'cog', colorClass: 'icon-line-mech' };
        }
        if (n.includes('automatiz') || n.includes('control') || n.includes('robótic') || n.includes('robotic') || n.includes('domótica') || n.includes('instrumentación') || n.includes('instrumentacion')) {
            return { icon: 'bot', colorClass: 'icon-line-robot' };
        }
        if (n.includes('gestión') || n.includes('gestion') || n.includes('operacion') || n.includes('operación') || n.includes('proceso') || n.includes('estrateg') || n.includes('financier') || n.includes('inversión') || n.includes('inversion') || n.includes('emprend')) {
            return { icon: 'briefcase', colorClass: 'icon-line-biz' };
        }
        if (n.includes('calidad') || n.includes('seguridad') || n.includes('ambiente') || n.includes('mantenimiento')) {
            return { icon: 'shield-check', colorClass: 'icon-line-shield' };
        }
        if (n.includes('manufactura') || n.includes('producción') || n.includes('produccion') || n.includes('diseño') || n.includes('industrial')) {
            return { icon: 'factory', colorClass: 'icon-line-prod' };
        }
        if (n.includes('sistemas')) {
            return { icon: 'layers', colorClass: 'icon-line-code' };
        }
        if (n.includes('informática') || n.includes('informatica') || n.includes('computación') || n.includes('computacion')) {
            return { icon: 'terminal', colorClass: 'icon-line-cpu' };
        }

        const fallbacks = [
            { icon: 'compass', colorClass: 'icon-line-default' },
            { icon: 'sparkles', colorClass: 'icon-line-ai' },
            { icon: 'layers', colorClass: 'icon-line-data' },
            { icon: 'cpu', colorClass: 'icon-line-cpu' },
            { icon: 'activity', colorClass: 'icon-line-energy' }
        ];
        return fallbacks[idx % fallbacks.length];
    }

    function populateLineTabs() {
        if (!linesTabsContainer) return;
        const data = FIPS_CARRERAS[currentCarreraKey];
        if (!data || !data.docentes) return;

        const linesSet = new Set();
        data.docentes.forEach(d => {
            if (d.linea && d.linea.trim().length > 2) {
                linesSet.add(d.linea.trim());
            }
        });

        const linesArray = Array.from(linesSet).sort((a, b) => {
            const numA = extractLineNumber(a);
            const numB = extractLineNumber(b);
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b, 'es');
        });

        let html = `
            <button type="button" class="line-tab-card ${selectedLine === 'all' ? 'active' : ''}" data-line="all">
                <div class="tab-icon-box icon-line-all">
                    <i data-lucide="layers"></i>
                </div>
                <div class="tab-info">
                    <h4 class="tab-name">Todas las Líneas</h4>
                    <span class="tab-depto">${escapeHtml(currentCarreraKey)} · General</span>
                    <span class="tab-count-badge">${data.docentes.length} Docentes</span>
                </div>
            </button>
        `;

        linesArray.forEach((lineName, idx) => {
            const count = data.docentes.filter(d => d.linea === lineName).length;
            const isActive = (selectedLine === lineName);
            const lineNum = extractLineNumber(lineName);
            const lineNumStr = lineNum < 999 ? `Línea ${String(lineNum).padStart(2, '0')}` : `Línea ${String(idx + 1).padStart(2, '0')}`;
            const cleanName = cleanRawLineName(lineName);
            const iconMeta = getLineIconMeta(cleanName, idx);

            html += `
            <button type="button" class="line-tab-card ${isActive ? 'active' : ''}" data-line="${escapeHtml(lineName)}" title="${escapeHtml(cleanName)}">
                <div class="tab-icon-box ${iconMeta.colorClass}">
                    <i data-lucide="${iconMeta.icon}"></i>
                </div>
                <div class="tab-info">
                    <h4 class="tab-name">${escapeHtml(cleanName)}</h4>
                    <span class="tab-depto">${escapeHtml(lineNumStr)}</span>
                    <span class="tab-count-badge">${count} Docentes</span>
                </div>
            </button>
            `;
        });

        linesTabsContainer.innerHTML = html;
        linesTabsContainer.scrollLeft = 0;
        if (window.lucide) {
            lucide.createIcons();
        }
        setTimeout(updateLinesCarouselButtons, 60);
    }

    // ==========================================================================
    // 7. Renderizado de Listas Horizontales de Docentes (Didáctico & Anti-cajitas)
    // ==========================================================================
    function renderDocentes() {
        if (!resultsContainer) return;
        const carreraData = FIPS_CARRERAS[currentCarreraKey];
        if (!carreraData || !carreraData.docentes) return;

        const filtered = carreraData.docentes.filter(d => {
            // Filtro por línea
            if (selectedLine !== 'all' && d.linea !== selectedLine) {
                return false;
            }
            // Filtro por grado académico
            if (selectedGrado !== 'all') {
                const g = (d.grado || '').toUpperCase();
                if (selectedGrado === 'dr' && !g.includes('DR')) return false;
                if (selectedGrado === 'mg' && !g.includes('MG')) return false;
                if (selectedGrado === 'ing' && !g.includes('ING')) return false;
            }
            // Filtro por texto de búsqueda
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchDocente = (d.docente || '').toLowerCase().includes(q);
                const matchGrado = (d.grado || '').toLowerCase().includes(q);
                const matchLinea = (d.linea || '').toLowerCase().includes(q);
                return matchDocente || matchGrado || matchLinea;
            }
            return true;
        });

        if (statsDocCount) {
            statsDocCount.textContent = filtered.length;
        }

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

        // Agrupar docentes por línea de investigación
        const groups = {};
        filtered.forEach(d => {
            const l = d.linea || 'Línea de Investigación';
            if (!groups[l]) groups[l] = [];
            groups[l].push(d);
        });

        let html = '';
        Object.keys(groups).sort((a, b) => {
            const numA = extractLineNumber(a);
            const numB = extractLineNumber(b);
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b, 'es');
        }).forEach(lineaName => {
            const docs = groups[lineaName];
            const countDr = docs.filter(d => (d.grado || '').toUpperCase().includes('DR')).length;
            const countMg = docs.filter(d => (d.grado || '').toUpperCase().includes('MG')).length;
            const countIng = docs.filter(d => (d.grado || '').toUpperCase().includes('ING')).length;

            html += `
            <div class="linea-section-card glass-panel">
                <div class="linea-section-header">
                    <div class="linea-header-info">
                        <div class="linea-icon-circle">
                            <i data-lucide="compass"></i>
                        </div>
                        <div class="linea-title-col">
                            <h3 class="linea-title">${escapeHtml(lineaName)}</h3>
                            <div class="linea-meta-row">
                                <span class="linea-doc-total">${docs.length} ${docs.length === 1 ? 'docente adscrito' : 'docentes adscritos'}</span>
                                <span class="meta-dot">·</span>
                                <div class="linea-breakdown-tags">
                                    ${countDr > 0 ? `<span class="badge-mini badge-dr">${countDr} Dr.</span>` : ''}
                                    ${countMg > 0 ? `<span class="badge-mini badge-mg">${countMg} Mg.</span>` : ''}
                                    ${countIng > 0 ? `<span class="badge-mini badge-ing">${countIng} Ing.</span>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="docentes-cards-grid">
                    ${docs.map(doc => renderDocenteCard(doc)).join('')}
                </div>
            </div>
            `;
        });

        resultsContainer.innerHTML = html;
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function renderDocenteCard(doc) {
        const grado = doc.grado || 'Docente';
        const gradoClass = getGradoBadgeClass(grado);
        const cleanName = doc.docente;
        const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanName + ' UNSA')}`;

        return `
        <div class="docente-card">
            <div class="docente-card-top">
                <div class="docente-meta-row">
                    <span class="grado-badge ${gradoClass}">${escapeHtml(grado)}</span>
                </div>
                <h4 class="docente-name" title="${escapeHtml(cleanName)}">${escapeHtml(cleanName)}</h4>
            </div>
            <div class="docente-card-footer">
                <a href="${scholarUrl}" target="_blank" rel="noopener noreferrer" class="btn-scholar-card" title="Ver publicaciones e investigaciones de ${escapeHtml(cleanName)} en Google Académico">
                    <div class="btn-scholar-label">
                        <i data-lucide="graduation-cap"></i>
                        <span>Google Académico</span>
                    </div>
                    <i data-lucide="arrow-up-right" class="scholar-arrow"></i>
                </a>
            </div>
        </div>
        `;
    }

    function getGradoBadgeClass(grado) {
        const g = (grado || '').toUpperCase();
        if (g.includes('DR') || g.includes('DRA')) return 'badge-dr';
        if (g.includes('MG') || g.includes('MAG')) return 'badge-mg';
        if (g.includes('ING')) return 'badge-ing';
        return 'badge-default';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================================================
    // 8. Eventos de Buscador & Filtros Interactivos
    // ==========================================================================
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim();
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchQuery.length > 0 ? 'flex' : 'none';
            }
            renderDocentes();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                searchQuery = '';
                clearSearchBtn.style.display = 'none';
                searchInput.focus();
                renderDocentes();
            }
        });
    }

    // ==========================================================================
    // 8. Carrusel de Líneas de Investigación (Navegación & Drag)
    // ==========================================================================
    function updateLinesCarouselButtons() {
        if (!linesTabsContainer || !btnLinesCarouselPrev || !btnLinesCarouselNext) return;
        const sl = linesTabsContainer.scrollLeft;
        const maxSl = linesTabsContainer.scrollWidth - linesTabsContainer.clientWidth - 4;
        btnLinesCarouselPrev.disabled = (sl <= 2);
        btnLinesCarouselNext.disabled = (sl >= maxSl);
    }

    if (btnLinesCarouselPrev && linesTabsContainer) {
        btnLinesCarouselPrev.addEventListener('click', () => {
            linesTabsContainer.scrollBy({ left: -290, behavior: 'smooth' });
        });
    }

    if (btnLinesCarouselNext && linesTabsContainer) {
        btnLinesCarouselNext.addEventListener('click', () => {
            linesTabsContainer.scrollBy({ left: 290, behavior: 'smooth' });
        });
    }

    if (linesTabsContainer) {
        linesTabsContainer.addEventListener('scroll', () => {
            updateLinesCarouselButtons();
        }, { passive: true });

        // Soporte de arrastre con mouse (Drag-to-Scroll suave)
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        let hasDragged = false;

        linesTabsContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            hasDragged = false;
            startX = e.pageX - linesTabsContainer.offsetLeft;
            scrollStart = linesTabsContainer.scrollLeft;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown || !linesTabsContainer) return;
            const x = e.pageX - linesTabsContainer.offsetLeft;
            const walk = (x - startX) * 1.35;
            if (Math.abs(walk) > 5) {
                hasDragged = true;
            }
            linesTabsContainer.scrollLeft = scrollStart - walk;
        });

        window.addEventListener('mouseup', () => {
            isDown = false;
        });

        // Clic en tarjetas del carrusel de Líneas
        linesTabsContainer.addEventListener('click', (e) => {
            if (hasDragged) return; // Si fue arrastre para ver más tarjetas, ignorar selección
            const btn = e.target.closest('.line-tab-card');
            if (!btn) return;
            const line = btn.getAttribute('data-line') || 'all';
            selectedLine = line;
            linesTabsContainer.querySelectorAll('.line-tab-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-line') === line);
            });
            // Centrar suavemente la tarjeta seleccionada en el carrusel
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            renderDocentes();
        });
    }

    // Toggle dropdown de Grados
    if (gradoDropdownBtn && gradoDropdownWrapper) {
        gradoDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = gradoDropdownWrapper.classList.contains('open');
            gradoDropdownWrapper.classList.toggle('open', !isOpen);
            gradoDropdownBtn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        });
    }

    // Cerrar desplegable al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (gradoDropdownWrapper && !gradoDropdownWrapper.contains(e.target)) {
            gradoDropdownWrapper.classList.remove('open');
            if (gradoDropdownBtn) gradoDropdownBtn.setAttribute('aria-expanded', 'false');
        }
    });

    // Selección en desplegable de Grados
    if (gradoDropdownMenu) {
        gradoDropdownMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.custom-dropdown-item');
            if (!item) return;
            const grado = item.getAttribute('data-grado') || 'all';
            selectedGrado = grado;
            const textSpan = item.querySelector('span:not(.dot-indicator)');
            const label = textSpan ? textSpan.textContent.trim() : 'Todos los Grados';
            if (gradoDropdownSelectedText) {
                gradoDropdownSelectedText.textContent = label;
            }
            gradoDropdownMenu.querySelectorAll('.custom-dropdown-item').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-grado') === grado);
            });
            if (gradoDropdownWrapper) {
                gradoDropdownWrapper.classList.remove('open');
                if (gradoDropdownBtn) gradoDropdownBtn.setAttribute('aria-expanded', 'false');
            }
            renderDocentes();
        });
    }

    if (btnResetDocFilter) {
        btnResetDocFilter.addEventListener('click', () => {
            searchQuery = '';
            selectedLine = 'all';
            selectedGrado = 'all';
            if (searchInput) {
                searchInput.value = '';
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            }
            if (linesTabsContainer) {
                linesTabsContainer.querySelectorAll('.line-tab-card').forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-line') === 'all');
                });
                linesTabsContainer.scrollTo({ left: 0, behavior: 'smooth' });
                setTimeout(updateLinesCarouselButtons, 100);
            }
            if (gradoDropdownSelectedText) {
                gradoDropdownSelectedText.textContent = 'Todos los Grados';
            }
            if (gradoDropdownMenu) {
                gradoDropdownMenu.querySelectorAll('.custom-dropdown-item').forEach(p => {
                    p.classList.toggle('active', p.getAttribute('data-grado') === 'all');
                });
            }
            renderDocentes();
        });
    }

    // ==========================================================================
    // 9. Notificaciones Toast (Feedback de Sincronización)
    // ==========================================================================

    function showToast(msg) {
        if (!toastNotification) return;
        toastNotification.textContent = msg;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    // ==========================================================================
    // 10. MOTOR EN VIVO: GOOGLE SPREADSHEET VISUALIZATION API (JSONP SIN CORS)
    // ==========================================================================
    function fetchGoogleSheetGViz(driveId) {
        return new Promise((resolve, reject) => {
            const callbackName = 'fipsGvizCb_' + Math.floor(Math.random() * 10000000);
            const script = document.createElement('script');
            script.id = callbackName;

            const timeout = setTimeout(() => {
                cleanUp();
                reject(new Error("Tiempo de espera agotado al conectar con Google Drive"));
            }, 12000);

            function cleanUp() {
                clearTimeout(timeout);
                try {
                    delete window[callbackName];
                } catch (e) {
                    window[callbackName] = undefined;
                }
                const el = document.getElementById(callbackName);
                if (el) el.remove();
            }

            window[callbackName] = function(jsonResponse) {
                cleanUp();
                if (jsonResponse && jsonResponse.table) {
                    resolve(jsonResponse.table);
                } else {
                    reject(new Error("Formato de respuesta no reconocido de Google Drive"));
                }
            };

            script.onerror = function() {
                cleanUp();
                reject(new Error("Error al conectar con el servidor de Google Drive"));
            };

            script.src = `https://docs.google.com/spreadsheets/d/${driveId}/gviz/tq?tqx=responseHandler:${callbackName}&t=${Date.now()}`;
            document.head.appendChild(script);
        });
    }

    function getGVizCell(row, idx) {
        if (!row || !row.c || idx >= row.c.length || !row.c[idx]) return '';
        const cell = row.c[idx];
        const val = cell.v !== undefined && cell.v !== null ? cell.v : (cell.f || '');
        return String(val).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /**
     * Parsea la tabla de Google Sheets con el formato UNIFICADO para las 5 carreras:
     * Col 0: Línea de Investigación (Enumerada automáticamente 1.-, 2.-, ...)
     * Col 1: No
     * Col 2: Grado Académico
     * Col 3: Docentes Adscritos
     */
    function parseUnifiedCareerTable(key, table) {
        const rows = table.rows || [];
        const docentes = [];
        const lineMap = new Map();
        let currentLinea = '';

        for (const r of rows) {
            const rawLinea = getGVizCell(r, 0);
            const rawNum = getGVizCell(r, 1);
            const rawGrado = getGVizCell(r, 2);
            const rawDoc = getGVizCell(r, 3);

            // Forward-fill y numeración secuencial de las líneas de investigación oficiales
            if (rawLinea && rawLinea.length > 2 && !rawLinea.toUpperCase().includes('LINEAS DE INVESTIGAC')) {
                const cleanName = cleanRawLineName(rawLinea);
                if (cleanName) {
                    if (!lineMap.has(cleanName)) {
                        const num = lineMap.size + 1;
                        lineMap.set(cleanName, `${num}.- ${cleanName}`);
                    }
                    currentLinea = lineMap.get(cleanName);
                }
            }

            // Filtro de filas válidas de docentes
            if (rawDoc && rawDoc.length > 3 && !rawDoc.toUpperCase().includes('DOCENTES ADSCRITOS')) {
                const numClean = rawNum ? String(parseInt(rawNum) || rawNum) : '';
                docentes.push({
                    docente: cleanTeacherName(rawDoc),
                    grado: formatGrado(rawGrado),
                    linea: currentLinea || '1.- Línea de Investigación General',
                    num: numClean
                });
            }
        }

        return docentes;
    }

    /**
     * Descarga en vivo la tabla desde Google Drive vía GViz JSONP
     * @param {string} carreraKey
     * @param {boolean} isBackground - Si es true, no toca la pantalla principal de carga
     */
    async function loadCareerLive(carreraKey, isBackground = false) {
        const carrera = FIPS_CARRERAS[carreraKey];
        if (!carrera) return;

        const isCurrent = (currentCarreraKey === carreraKey);

        if (isCurrent && !isBackground && (!carrera.docentes || carrera.docentes.length === 0)) {
            showLoading();
        }

        try {
            const table = await fetchGoogleSheetGViz(carrera.drive_id);
            const docentes = parseUnifiedCareerTable(carreraKey, table);

            if (!docentes || docentes.length === 0) {
                throw new Error("No se encontraron docentes en la hoja");
            }

            // Guardar en memoria (sesión en vivo)
            carrera.docentes = docentes;

            // Actualizar badge en la pestaña
            const badgeEl = document.getElementById(`badge-count-${carreraKey}`);
            if (badgeEl) {
                badgeEl.textContent = `${docentes.length} Docentes`;
            }

            // Si el usuario sigue en esta carrera, renderizar de inmediato
            if (currentCarreraKey === carreraKey) {
                showResults();
                populateLineTabs();
                renderDocentes();
            }
        } catch (err) {
            console.error(`[Error Google Drive en Vivo] (${carreraKey}):`, err);
            if (currentCarreraKey === carreraKey && (!carrera.docentes || carrera.docentes.length === 0)) {
                showError(carrera.drive_url);
            }
            const badgeEl = document.getElementById(`badge-count-${carreraKey}`);
            if (badgeEl && (!carrera.docentes || carrera.docentes.length === 0)) {
                badgeEl.textContent = 'Ver en Drive';
            }
        }
    }

    /**
     * Sincroniza todas las carreras en vivo
     */
    async function syncAllCareersLive() {
        if (isSyncing) return;
        isSyncing = true;

        if (syncIcon) syncIcon.classList.add('spinning');
        if (syncText) syncText.textContent = 'Consultando Drive...';

        try {
            const keys = Object.keys(FIPS_CARRERAS);
            await Promise.allSettled(keys.map(k => loadCareerLive(k, k !== currentCarreraKey)));

            if (syncIcon) syncIcon.classList.remove('spinning');
            if (syncText) syncText.textContent = 'Actualizado en Vivo';
            showToast('¡Docentes actualizados en vivo desde Google Drive!');
        } catch (e) {
            if (syncIcon) syncIcon.classList.remove('spinning');
            if (syncText) syncText.textContent = 'Sincronizar en Vivo';
        } finally {
            isSyncing = false;
            setTimeout(() => {
                if (syncText) syncText.textContent = 'Sincronizar en Vivo';
            }, 3000);
        }
    }

    // ==========================================================================
    // 11. Botones de Sincronización & Reintento
    // ==========================================================================
    if (btnSyncDrive) {
        btnSyncDrive.addEventListener('click', () => {
            syncAllCareersLive();
        });
    }

    if (btnRetrySync) {
        btnRetrySync.addEventListener('click', () => {
            loadCareerLive(currentCarreraKey, false);
        });
    }

    // ==========================================================================
    // 12. Arranque Inicial: Conexión 100% en Vivo con Google Drive
    // ==========================================================================
    // 1) Cargar primero y de forma exclusiva la carrera activa (Sistemas DAISI)
    switchCarrera('DAISI');

    // 2) Consultar el resto de carreras en segundo plano de manera silenciosa para poblar badges
    setTimeout(() => {
        ['DAII', 'DAIE', 'DAIEL', 'DAIME'].forEach(k => {
            loadCareerLive(k, true).catch(() => {});
        });
    }, 800);
});
