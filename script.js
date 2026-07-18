/**
 * Plan de Tesis EPIS - UNSA
 * Interactive Scripting (2026)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    initScrollProgress();
    initStickyHeader();
    initThemeToggle();
    initMobileMenu();
    initScrollReveal();
    initSearchFilter();
    initChecklist();
    initRoadmapSync();
    initBackToTop();
});

/* ==========================================================================
   SCROLL PROGRESS INDICATOR
   ========================================================================== */
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgressBar');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        progressBar.style.width = scrolled + '%';
    });
}

/* ==========================================================================
   STICKY HEADER TRANSITIONS
   ========================================================================== */
function initStickyHeader() {
    const header = document.getElementById('mainHeader');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ==========================================================================
   DARK / LIGHT THEME TOGGLE
   ========================================================================== */
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // Check for saved theme preference, otherwise check system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';

        if (currentTheme === 'light') {
            newTheme = 'dark';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

/* ==========================================================================
   MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    if (!mobileMenuBtn || !navMenu) return;

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    // Close menu when a navigation link is clicked
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });
}

/* ==========================================================================
   SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Stop observing after anim triggers
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });
}

/* ==========================================================================
   CARD REAL-TIME SEARCH FILTER
   ========================================================================== */
function initSearchFilter() {
    const searchInput = document.getElementById('sectionSearch');
    const clearBtn = document.getElementById('clearSearch');
    const cardsGrid = document.getElementById('cardsGrid');
    const cards = cardsGrid ? cardsGrid.querySelectorAll('.thesis-card') : [];
    const emptyState = document.getElementById('emptySearchState');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query.length > 0) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }

        let matchCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const desc = card.querySelector('.card-description').textContent.toLowerCase();
            const category = card.querySelector('.card-category').textContent.toLowerCase();
            const badge = card.querySelector('.card-badge') ? card.querySelector('.card-badge').textContent.toLowerCase() : '';
            const keyPoints = Array.from(card.querySelectorAll('.card-key-points li'))
                .map(li => li.textContent.toLowerCase())
                .join(' ');

            const isMatch = title.includes(query) || 
                            desc.includes(query) || 
                            category.includes(query) || 
                            badge.includes(query) ||
                            keyPoints.includes(query);

            if (isMatch) {
                card.style.display = 'flex';
                matchCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle empty state if no matches
        if (matchCount === 0 && query.length > 0) {
            emptyState.style.display = 'block';
            cardsGrid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            cardsGrid.style.display = 'grid';
        }
    });

    clearBtn.addEventListener('click', resetSearch);
}

function resetSearch() {
    const searchInput = document.getElementById('sectionSearch');
    const clearBtn = document.getElementById('clearSearch');
    const cardsGrid = document.getElementById('cardsGrid');
    const cards = cardsGrid ? cardsGrid.querySelectorAll('.thesis-card') : [];
    const emptyState = document.getElementById('emptySearchState');

    if (searchInput) {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        
        cards.forEach(card => {
            card.style.display = 'flex';
        });

        emptyState.style.display = 'none';
        cardsGrid.style.display = 'grid';
        searchInput.focus();
    }
}

/* ==========================================================================
   INTERACTIVE CHECKLIST LOGIC (PERSISTENT STATE)
   ========================================================================== */
function initChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-cb');
    if (checkboxes.length === 0) return;

    // Load saved checklist states
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        const savedState = localStorage.getItem(`checklist-item-${id}`);
        if (savedState === 'checked') {
            cb.checked = true;
        }

        cb.addEventListener('change', () => {
            const state = cb.checked ? 'checked' : 'unchecked';
            localStorage.setItem(`checklist-item-${id}`, state);
            updateChecklistProgress();
        });
    });

    updateChecklistProgress();
}

function updateChecklistProgress() {
    const checkboxes = document.querySelectorAll('.checklist-cb');
    const circle = document.getElementById('checklistProgressCircle');
    const text = document.getElementById('checklistProgressText');
    const barFill = document.getElementById('checklistBarFill');
    const dynamicPercent = document.querySelector('.dynamic-percent');

    if (checkboxes.length === 0) return;

    const total = checkboxes.length;
    let checkedCount = 0;

    checkboxes.forEach(cb => {
        if (cb.checked) checkedCount++;
    });

    const percent = Math.round((checkedCount / total) * 100);

    // Update Text
    if (text) text.textContent = `${percent}%`;
    if (dynamicPercent) dynamicPercent.textContent = `${percent}%`;

    // Update Progress Bar
    if (barFill) barFill.style.width = `${percent}%`;

    // Update SVG Circle (dashoffset)
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius; // 314.16
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }
}

function resetChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-cb');
    checkboxes.forEach(cb => {
        const id = cb.getAttribute('data-id');
        cb.checked = false;
        localStorage.removeItem(`checklist-item-${id}`);
    });
    updateChecklistProgress();
}

function downloadChecklist() {
    // Generate beautiful text report of the checklist state, grouped by section
    const categoryCards = document.querySelectorAll('.checklist-category-card');
    let content = "========================================================\n";
    content += "   REPORTE DE AUTOEVALUACIÓN: PLAN DE TESIS - FIPS 2026\n";
    content += "========================================================\n\n";
    
    let totalCheckboxes = 0;
    let checkedCount = 0;

    categoryCards.forEach(card => {
        const titleEl = card.querySelector('.category-header h3');
        if (!titleEl) return;
        
        const title = titleEl.textContent.trim();
        content += `## ${title}\n`;
        content += `${"-".repeat(title.length + 3)}\n`;

        const cbs = card.querySelectorAll('.checklist-cb');
        cbs.forEach(cb => {
            totalCheckboxes++;
            const text = cb.parentNode.querySelector('.item-text').textContent.trim();
            const status = cb.checked ? "[X] CUMPLIDO " : "[ ] PENDIENTE";
            if (cb.checked) checkedCount++;
            content += `   ${status} - ${text}\n`;
        });
        content += `\n`;
    });

    const percent = totalCheckboxes > 0 ? Math.round((checkedCount / totalCheckboxes) * 100) : 0;
    content += "========================================================\n";
    content += `RESUMEN DE PROGRESO:\n`;
    content += `- Ítems Completados: ${checkedCount} de ${totalCheckboxes}\n`;
    content += `- Porcentaje de Avance: ${percent}%\n`;
    content += `- Fecha de Exportación: ${new Date().toLocaleString()}\n`;
    content += "========================================================\n";

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Checklist_Plan_De_Tesis_FIPS.txt';
    link.click();
    URL.revokeObjectURL(url);
}

/* ==========================================================================
   ROADMAP TIMELINE SYNC ON SCROLL & CLICKS
   ========================================================================== */
function initRoadmapSync() {
    const nodes = document.querySelectorAll('.roadmap-step-node');
    const cards = document.querySelectorAll('.thesis-card');
    const progress = document.getElementById('roadmapProgress');
    const navLinks = document.querySelectorAll('.nav-link');

    if (nodes.length === 0 || cards.length === 0) return;

    // Click handler for Node clicks
    window.scrollToStep = function(stepNumber) {
        const targetCard = Array.from(cards).find(card => card.getAttribute('data-step') === String(stepNumber));
        if (targetCard) {
            const headerOffset = 100;
            const elementPosition = targetCard.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Scroll tracker to sync active timeline states
    window.addEventListener('scroll', () => {
        let currentStep = 1;
        const triggerPoint = window.innerHeight / 2;

        cards.forEach(card => {
            const cardTop = card.getBoundingClientRect().top;
            if (cardTop < triggerPoint) {
                currentStep = parseInt(card.getAttribute('data-step'));
            }
        });

        // Update timeline nodes
        nodes.forEach(node => {
            const nodeStep = parseInt(node.getAttribute('data-step'));
            if (nodeStep <= currentStep) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        // Update progress line length (0% at first circle center, 100% at last circle center)
        if (progress) {
            const percent = ((currentStep - 1) / (nodes.length - 1)) * 100;
            progress.style.width = `${percent}%`;
        }

        // Center active node inside scroll wrapper for a comfortable visual experience
        const activeNode = document.querySelector(`.roadmap-step-node[data-step="${currentStep}"]`);
        const scrollWrapper = document.querySelector('.roadmap-scroll-wrapper');
        if (activeNode && scrollWrapper) {
            const wrapperWidth = scrollWrapper.offsetWidth;
            const nodeLeft = activeNode.offsetLeft;
            const nodeWidth = activeNode.offsetWidth;
            scrollWrapper.scrollTo({
                left: nodeLeft - (wrapperWidth / 2) + (nodeWidth / 2),
                behavior: 'smooth'
            });
        }

        // Active navigation link syncing
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const top = section.getBoundingClientRect().top;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (top < 150 && top + height > 150) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

/* ==========================================================================
   BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}


