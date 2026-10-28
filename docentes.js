/**
 * FIPSPlanDeTesis - Directorio de Docentes y Líneas de Investigación
 * Controlador 100% EN VIVO desde Google Drive vía Google Visualization API (JSONP sin bloqueo de CORS)
 * Con normalización inteligente de líneas de investigación para todas las carreras.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Configuración de Carreras (Metadatos & Enlaces Oficiales de Google Drive)
    // ==========================================================================
    const FIPS_CARRERAS = {
        DAISI: {
            code: 'DAISI',
            name: 'Ingeniería de Sistemas',
            depto: 'Departamento Académico de Ingeniería de Sistemas e Informática',
            icon: 'laptop',
            drive_id: '1S4ss9Qzk36JsUynJutjDDgZoiQvIkXrN',
            drive_url: 'https://drive.google.com/file/d/1S4ss9Qzk36JsUynJutjDDgZoiQvIkXrN/view?usp=sharing',
            docentes: null
        },
        DAII: {
            code: 'DAII',
            name: 'Ingeniería Industrial',
            depto: 'Departamento Académico de Ingeniería Industrial',
            icon: 'factory',
            drive_id: '1CXS0i31DmiRzJ48RVhUfVtO04o6hDUOe',
            drive_url: 'https://drive.google.com/file/d/1CXS0i31DmiRzJ48RVhUfVtO04o6hDUOe/view?usp=sharing',
            docentes: null
        },
        DAIE: {
            code: 'DAIE',
            name: 'Ingeniería Electrónica',
            depto: 'Departamento Académico de Ingeniería Electrónica',
            icon: 'cpu',
            drive_id: '1LwWEuqLCI4_U7vcmHTdgu9UABjkmuXTh',
            drive_url: 'https://drive.google.com/file/d/1LwWEuqLCI4_U7vcmHTdgu9UABjkmuXTh/view?usp=sharing',
            docentes: null
        },
        DAIEL: {
            code: 'DAIEL',
            name: 'Ingeniería Eléctrica',
            depto: 'Departamento Académico de Ingeniería Eléctrica',
            icon: 'zap',
            drive_id: '1hYjjTbuiP1TBEbmRI7iJCQxwUfbnl97h',
            drive_url: 'https://drive.google.com/file/d/1hYjjTbuiP1TBEbmRI7iJCQxwUfbnl97h/view?usp=sharing',
            docentes: null
        },
        DAIME: {
            code: 'DAIME',
            name: 'Ingeniería Mecánica',
            depto: 'Departamento Académico de Ingeniería Mecánica',
            icon: 'cog',
            drive_id: '1Kh9XLwtl-4hznuoBibUs4wqsJRqwCtuU',
            drive_url: 'https://drive.google.com/file/d/1Kh9XLwtl-4hznuoBibUs4wqsJRqwCtuU/view?usp=sharing',
            docentes: null
        }
    };

    // ==========================================================================
    // Patrones de Normalización de Líneas de Investigación Oficiales
    // ==========================================================================
    const DAII_LINE_PATTERNS = [
        { regex: /bienes|diseño/i, name: 'Diseño y Desarrollo de Bienes y Servicios' },
        { regex: /mejora|productivo/i, name: 'Mejora Continua de los Procesos Productivos' },
        { regex: /operacion/i, name: 'Gestión de Operaciones' },
        { regex: /calidad|seguridad|ambiente|responsabilidad/i, name: 'Calidad, Seguridad, Medio Ambiente y Responsabilidad Social' },
        { regex: /emprend|innovaci/i, name: 'Emprendurismo e Innovación' },
        { regex: /tecnolog|informaci|comunicaci/i, name: 'Tecnologías de la Información y Comunicación' },
        { regex: /manufactura|avanzada/i, name: 'Manufactura Avanzada' },
        { regex: /direcci|estrat[eé]gica/i, name: 'Dirección Estratégica' },
        { regex: /inversi[oó]n|financiera/i, name: 'Proyectos de Inversión y Gestión Financiera' }
    ];

    const DAIEL_LINE_PATTERNS = [
        { regex: /generaci[oó]n/i, name: 'Generación Eléctrica: Planeamiento, Operación, Automatización y Mantenimiento' },
        { regex: /conversi[oó]n|m[aá]quinas/i, name: 'Conversión Electromecánica (Máquinas Eléctricas)' },
        { regex: /accionamiento|potencia/i, name: 'Accionamientos Eléctricos, Electrónica de Potencia' },
        { regex: /automati|industrial|dom[oó]tica|rer/i, name: 'Automatización Industrial y de Sistemas Eléctricos de Potencia' },
        { regex: /planeamiento|subestacion|transmisi/i, name: 'Planeamiento, Operación y Control de Sistemas Eléctricos' },
        { regex: /mercado|tarifaci|legislaci/i, name: 'Mercados Eléctricos, Valuación y Tarifación Eléctrica' },
        { regex: /renovable|energ[ií]as/i, name: 'Sistemas de Energías Renovables: Diseño, Operación y Mantenimiento' },
        { regex: /distribuci|utilizaci|minera/i, name: 'Sistemas de Distribución y Utilización, Electricidad Industrial' }
    ];

    const DAIE_AREA_PATTERNS = [
        { regex: /electr[oó]nica general|electrot[eé]cnica/i, name: 'Electrónica General y Electrotecnia' },
        { regex: /telecomunicaci/i, name: 'Telecomunicaciones' },
        { regex: /inform[aá]tica|computaci/i, name: 'Informática y Ciencias de la Computación' },
        { regex: /instrumentaci|control/i, name: 'Instrumentación y Control' }
    ];

    function formatTitleCase(str) {
        if (!str) return '';
        const smallWords = new Set(['de', 'y', 'e', 'en', 'los', 'las', 'la', 'el', 'del', 'para', 'o', 'al']);
        return str.toLowerCase().split(' ').map((w, i) => {
            if (!w) return '';
            if (i === 0 || !smallWords.has(w)) {
                return w.charAt(0).toUpperCase() + w.slice(1);
            }
            return w;
        }).join(' ');
    }

    // ==========================================================================
    // 2. Gestión de Tema (Oscuro / Claro)
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
    // 3. Estado & Elementos del DOM
    // ==========================================================================
    let currentCarreraKey = 'DAISI';
    let searchQuery = '';
    let selectedLine = 'all';
    let isSyncing = false;

    const careerTabsContainer = document.getElementById('careerTabsContainer');
    const bannerTitle = document.getElementById('bannerTitle');
    const bannerDepto = document.getElementById('bannerDepto');
    const bannerIcon = document.getElementById('bannerIcon');
    const bannerDriveLink = document.getElementById('bannerDriveLink');
    const searchInput = document.getElementById('docentesSearchInput');
    const clearSearchBtn = document.getElementById('btnClearDocSearch');
    const lineFilterSelect = document.getElementById('lineFilterSelect');
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
    // 4. Cambio de Carrera (Tabs)
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
        if (searchInput) {
            searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.style.display = 'none';
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
            populateLineFilter();
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
    // 5. Población del Filtro de Líneas (Dropdown Formateado Limpio)
    // ==========================================================================
    function populateLineFilter() {
        if (!lineFilterSelect) return;
        const data = FIPS_CARRERAS[currentCarreraKey];
        if (!data || !data.docentes) return;

        const linesSet = new Set();
        data.docentes.forEach(d => {
            if (d.linea && d.linea.trim().length > 2) {
                linesSet.add(d.linea.trim());
            }
        });

        const linesArray = Array.from(linesSet).sort((a, b) => a.localeCompare(b, 'es'));

        lineFilterSelect.innerHTML = '<option value="all">Todas las Líneas de Investigación</option>';
        linesArray.forEach(l => {
            const count = data.docentes.filter(d => d.linea === l).length;
            const opt = document.createElement('option');
            opt.value = l;
            opt.textContent = `${l} (${count} ${count === 1 ? 'docente' : 'docentes'})`;
            lineFilterSelect.appendChild(opt);
        });
        lineFilterSelect.value = selectedLine || 'all';
    }

    // ==========================================================================
    // 6. Renderizado de Tarjetas de Docentes
    // ==========================================================================
    function renderDocentes() {
        if (!resultsContainer) return;
        const carreraData = FIPS_CARRERAS[currentCarreraKey];
        if (!carreraData || !carreraData.docentes) return;

        const filtered = carreraData.docentes.filter(d => {
            if (selectedLine !== 'all' && d.linea !== selectedLine) {
                return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchDocente = (d.docente || '').toLowerCase().includes(q);
                const matchGrado = (d.grado || '').toLowerCase().includes(q);
                const matchLinea = (d.linea || '').toLowerCase().includes(q);
                const matchCondicion = (d.condicion || '').toLowerCase().includes(q);
                const matchArea = (d.area || '').toLowerCase().includes(q);
                return matchDocente || matchGrado || matchLinea || matchCondicion || matchArea;
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

        // Agrupar por línea
        const groups = {};
        filtered.forEach(d => {
            const l = d.linea || 'Línea de Investigación';
            if (!groups[l]) groups[l] = [];
            groups[l].push(d);
        });

        let html = '';
        Object.keys(groups).sort((a, b) => a.localeCompare(b, 'es')).forEach(lineaName => {
            const docs = groups[lineaName];
            html += `
            <div class="linea-group-block">
                <div class="linea-group-header">
                    <div class="linea-title-row">
                        <i data-lucide="book-open" class="linea-icon"></i>
                        <h3 class="linea-name">${escapeHtml(lineaName)}</h3>
                    </div>
                    <span class="linea-count-tag">${docs.length} ${docs.length === 1 ? 'docente' : 'docentes'}</span>
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
        const cleanName = formatTeacherName(doc.docente);
        const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanName + ' UNSA')}`;

        return `
        <div class="docente-card glass-panel">
            <div class="docente-card-header">
                <div class="docente-avatar">
                    <i data-lucide="user-check"></i>
                </div>
                <div class="docente-title-col">
                    <div class="docente-meta-row">
                        <span class="grado-badge ${gradoClass}">${escapeHtml(grado)}</span>
                        ${doc.condicion ? `<span class="tag-condicion">${escapeHtml(doc.condicion)}</span>` : ''}
                        ${doc.categoria ? `<span class="tag-categoria">${escapeHtml(doc.categoria)}</span>` : ''}
                        ${doc.regimen ? `<span class="tag-regimen">${escapeHtml(doc.regimen)}</span>` : ''}
                    </div>
                    <h4 class="docente-name" title="${escapeHtml(cleanName)}">${escapeHtml(cleanName)}</h4>
                </div>
            </div>

            <div class="docente-card-body">
                <div class="docente-detail-item">
                    <i data-lucide="compass" class="detail-icon"></i>
                    <span class="detail-text" title="${escapeHtml(doc.linea)}">${escapeHtml(doc.linea)}</span>
                </div>
                ${doc.area && doc.area !== 'Lineas de Investigación' && doc.area !== 'Área Académica' && doc.area !== 'Líneas de Investigación' ? `
                <div class="docente-detail-item area-item">
                    <i data-lucide="layers" class="detail-icon"></i>
                    <span class="detail-text">${escapeHtml(doc.area)}</span>
                </div>` : ''}
            </div>

            <div class="docente-card-footer">
                <button type="button" class="btn-doc-action btn-copy-name" data-name="${escapeHtml(cleanName)}" title="Copiar nombre completo">
                    <i data-lucide="copy"></i>
                    <span>Copiar Nombre</span>
                </button>
                <a href="${scholarUrl}" target="_blank" rel="noopener noreferrer" class="btn-doc-action btn-scholar" title="Buscar publicaciones en Google Scholar">
                    <i data-lucide="graduation-cap"></i>
                    <span>Google Académico</span>
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

    function formatTeacherName(name) {
        if (!name) return '';
        return name.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
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
    // 7. Buscador & Filtros
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

    if (lineFilterSelect) {
        lineFilterSelect.addEventListener('change', () => {
            selectedLine = lineFilterSelect.value;
            renderDocentes();
        });
    }

    if (btnResetDocFilter) {
        btnResetDocFilter.addEventListener('click', () => {
            searchQuery = '';
            selectedLine = 'all';
            if (searchInput) {
                searchInput.value = '';
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            }
            if (lineFilterSelect) {
                lineFilterSelect.value = 'all';
            }
            renderDocentes();
        });
    }

    // ==========================================================================
    // 8. Copiar Nombre
    // ==========================================================================
    document.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('.btn-copy-name');
        if (copyBtn) {
            const name = copyBtn.getAttribute('data-name');
            if (name) {
                try {
                    await navigator.clipboard.writeText(name);
                    showToast(`Copiado: "${name}"`);
                } catch (err) {
                    showToast(`Copiado al portapapeles`);
                }
            }
        }
    });

    function showToast(msg) {
        if (!toastNotification) return;
        toastNotification.textContent = msg;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    // ==========================================================================
    // 9. MOTOR EN VIVO: GOOGLE SPREADSHEET VISUALIZATION API (JSONP SIN CORS)
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
     * Parsea la tabla de Google Sheets y normaliza de forma inteligente las líneas de investigación
     */
    function parseGVizCareerTable(key, table) {
        const rows = table.rows || [];
        const docentes = [];
        let currentArea = '';
        let currentLinea = '';

        if (key === 'DAISI') {
            for (const r of rows) {
                const cArea = getGVizCell(r, 0);
                const cLinea = getGVizCell(r, 1);
                const cNum = getGVizCell(r, 2);
                const cGrado = getGVizCell(r, 3);
                const cDoc = getGVizCell(r, 4);

                if (cArea && (cArea.includes('Linea') || cArea.includes('Investiga') || cArea.includes('Area'))) {
                    currentArea = cArea;
                }
                if (cLinea && cLinea.length > 3) {
                    currentLinea = cLinea;
                }
                if (cDoc && cDoc.length > 3 && !cDoc.includes('Docente')) {
                    docentes.push({
                        docente: cDoc,
                        grado: cGrado,
                        linea: currentLinea || 'Línea de Investigación',
                        area: currentArea || 'Líneas de Investigación',
                        num: cNum
                    });
                }
            }
        } else if (key === 'DAII') {
            currentLinea = 'Diseño y Desarrollo de Bienes y Servicios';
            for (const r of rows) {
                const cArea = getGVizCell(r, 4);
                const cLinea = getGVizCell(r, 5);
                const cNum = getGVizCell(r, 6);
                const cGrado = getGVizCell(r, 7);
                const cDoc = getGVizCell(r, 8);

                if (cArea && (cArea.includes('Área') || cArea.includes('PRODUCCIÓN') || cArea.includes('GESTIÓN') || cArea.includes('FINANZAS') || cArea.includes('LOGÍSTICA') || cArea.length > 3)) {
                    currentArea = cArea;
                }
                if (cLinea && cLinea.length > 2 && !cLinea.includes('Línea de Investig')) {
                    // Emparejar con nombre oficial completo consolidando celdas rotas
                    for (const pat of DAII_LINE_PATTERNS) {
                        if (pat.regex.test(cLinea)) {
                            currentLinea = pat.name;
                            break;
                        }
                    }
                }
                if (cDoc && cDoc.length > 3 && !cDoc.includes('Docentes')) {
                    docentes.push({
                        docente: cDoc,
                        grado: cGrado,
                        linea: currentLinea,
                        area: currentArea || 'Área Académica',
                        num: cNum
                    });
                }
            }
        } else if (key === 'DAIE') {
            currentLinea = 'Electrónica General y Electrotecnia';
            for (const r of rows) {
                const cArea = getGVizCell(r, 1);
                const cLinea = getGVizCell(r, 2);
                const cDoc = getGVizCell(r, 3);
                const cCond = getGVizCell(r, 4);
                const cGrado = getGVizCell(r, 5);
                const cCateg = getGVizCell(r, 6);
                const cReg = getGVizCell(r, 7);

                if (cDoc.includes('DOCENTE')) continue;
                if (cArea && cArea.length > 2 && !cArea.includes('AREA')) {
                    // Usar área como la línea temática principal limpia
                    for (const pat of DAIE_AREA_PATTERNS) {
                        if (pat.regex.test(cArea)) {
                            currentLinea = pat.name;
                            break;
                        }
                    }
                    currentArea = cArea;
                }
                if (cDoc && cDoc.length > 3) {
                    docentes.push({
                        docente: cDoc,
                        grado: cGrado,
                        linea: currentLinea,
                        area: currentArea || 'Área Académica',
                        condicion: cCond,
                        categoria: cCateg,
                        regimen: cReg
                    });
                }
            }
        } else if (key === 'DAIEL') {
            currentLinea = 'Generación Eléctrica: Planeamiento, Operación, Automatización y Mantenimiento';
            for (const r of rows) {
                const cLinea = getGVizCell(r, 0);
                const cNum = getGVizCell(r, 1);
                const cGrado = getGVizCell(r, 2);
                const cDoc = getGVizCell(r, 3);
                const cCond = getGVizCell(r, 4);
                const cCateg = getGVizCell(r, 5);
                const cReg = getGVizCell(r, 6);

                if (cDoc.includes('Docentes Adscritos') || cLinea.includes('DAIEL') || cLinea.includes('NOTA') || cLinea.includes('solicitará')) continue;
                if (cLinea && cLinea.length > 2 && !cLinea.includes('Línea de Investig') && !cLinea.includes('NOTA') && !cLinea.includes('solicitará')) {
                    for (const pat of DAIEL_LINE_PATTERNS) {
                        if (pat.regex.test(cLinea)) {
                            currentLinea = pat.name;
                            break;
                        }
                    }
                }
                if (cDoc && cDoc.length > 3 && !cDoc.includes('Docentes') && !cDoc.includes('NOTA')) {
                    docentes.push({
                        docente: cDoc,
                        grado: cGrado,
                        linea: currentLinea,
                        area: 'Líneas de Investigación',
                        num: cNum,
                        condicion: cCond,
                        categoria: cCateg,
                        regimen: cReg
                    });
                }
            }
        } else if (key === 'DAIME') {
            currentLinea = 'Sistemas Mecánicos';
            for (const r of rows) {
                const cLinea = getGVizCell(r, 0);
                const cDoc = getGVizCell(r, 2);

                if (cDoc.includes('DOCENTES') || cLinea.includes('LÍNEAS')) continue;
                if (cLinea && cLinea.length > 2 && !['ING.', 'MG.', 'DR.', 'DRA.', 'LÍNEAS'].some(kw => cLinea.includes(kw))) {
                    currentLinea = formatTitleCase(cLinea);
                }
                if (cDoc && cDoc.length > 3 && !cDoc.includes('DOCENTES')) {
                    let grado = 'Docente';
                    let docName = cDoc;
                    const m = cDoc.match(/^(DR\.|DRA\.|MG\.|ING\.)\s*(.*)$/i);
                    if (m) {
                        grado = m[1].toUpperCase();
                        docName = m[2].trim();
                    }
                    docentes.push({
                        docente: docName,
                        grado: grado,
                        linea: currentLinea || 'Sistemas Mecánicos',
                        area: 'Líneas de Investigación'
                    });
                }
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
            const docentes = parseGVizCareerTable(carreraKey, table);

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
                populateLineFilter();
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
    // 10. Botones de Sincronización & Reintento
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
    // 11. Arranque Inicial: Conexión 100% en Vivo con Google Drive
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
