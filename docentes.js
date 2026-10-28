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
    const searchInput = document.getElementById('docentesSearchInput');
    const clearSearchBtn = document.getElementById('btnClearDocSearch');
    const degreePillsContainer = document.getElementById('degreePillsContainer');
    const linesChipsContainer = document.getElementById('linesChipsContainer');
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

        // Restaurar estado visual de los botones de grado
        if (degreePillsContainer) {
            degreePillsContainer.querySelectorAll('.degree-pill').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-grado') === 'all');
            });
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
            populateLineChips();
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
    }

    function showError(driveUrl) {
        if (loadingState) loadingState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            if (btnErrorDriveFile) btnErrorDriveFile.href = driveUrl || '#';
            if (window.lucide) lucide.createIcons();
        }
    }

    function showResults() {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';
    }

    // ==========================================================================
    // 6. Población del Filtro de Líneas (Chips Interactivos Horizontales)
    // ==========================================================================
    function populateLineChips() {
        if (!linesChipsContainer) return;
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
            <button type="button" class="line-chip ${selectedLine === 'all' ? 'active' : ''}" data-line="all">
                <i data-lucide="layers" class="chip-icon"></i>
                <span class="chip-text">Todas las Líneas</span>
                <span class="chip-badge">${data.docentes.length}</span>
            </button>
        `;

        linesArray.forEach(lineName => {
            const count = data.docentes.filter(d => d.linea === lineName).length;
            const isActive = (selectedLine === lineName);
            html += `
            <button type="button" class="line-chip ${isActive ? 'active' : ''}" data-line="${escapeHtml(lineName)}" title="${escapeHtml(lineName)}">
                <span class="chip-text">${escapeHtml(lineName)}</span>
                <span class="chip-badge">${count}</span>
            </button>
            `;
        });

        linesChipsContainer.innerHTML = html;
        if (window.lucide) {
            lucide.createIcons();
        }
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

                <div class="docentes-horizontal-list">
                    ${docs.map(doc => renderDocenteRow(doc)).join('')}
                </div>
            </div>
            `;
        });

        resultsContainer.innerHTML = html;
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function renderDocenteRow(doc) {
        const grado = doc.grado || 'Docente';
        const gradoClass = getGradoBadgeClass(grado);
        const cleanName = doc.docente;
        const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanName + ' UNSA')}`;

        return `
        <div class="docente-row">
            <div class="docente-row-main">
                <span class="grado-badge ${gradoClass}">${escapeHtml(grado)}</span>
                <span class="docente-row-name">${escapeHtml(cleanName)}</span>
            </div>
            <div class="docente-row-action">
                <a href="${scholarUrl}" target="_blank" rel="noopener noreferrer" class="btn-scholar-row" title="Ver publicaciones e investigaciones de ${escapeHtml(cleanName)} en Google Académico">
                    <i data-lucide="graduation-cap"></i>
                    <span>Google Académico</span>
                    <i data-lucide="arrow-up-right" class="row-arrow"></i>
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

    if (linesChipsContainer) {
        linesChipsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.line-chip');
            if (!btn) return;
            const line = btn.getAttribute('data-line');
            if (line) {
                selectedLine = line;
                linesChipsContainer.querySelectorAll('.line-chip').forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-line') === line);
                });
                renderDocentes();
            }
        });
    }

    if (degreePillsContainer) {
        degreePillsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.degree-pill');
            if (!btn) return;
            const grado = btn.getAttribute('data-grado');
            if (grado) {
                selectedGrado = grado;
                degreePillsContainer.querySelectorAll('.degree-pill').forEach(p => {
                    p.classList.toggle('active', p.getAttribute('data-grado') === grado);
                });
                renderDocentes();
            }
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
            if (degreePillsContainer) {
                degreePillsContainer.querySelectorAll('.degree-pill').forEach(p => {
                    p.classList.toggle('active', p.getAttribute('data-grado') === 'all');
                });
            }
            if (linesChipsContainer) {
                linesChipsContainer.querySelectorAll('.line-chip').forEach(c => {
                    c.classList.toggle('active', c.getAttribute('data-line') === 'all');
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
                populateLineChips();
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
