/* ===========================
   STATE
   =========================== */
let state = {
    mode: "de-en",
    activeCategory: "Chap",
    selectedChapters: [],
    selectedVerbFamilies: [],
    wordLimit: "all",
    currentIndex: 0,
    score: { correct: 0, wrong: 0 },
    questions: [],
    answered: false,
    missedWords: [],
};

/* ===========================
   CATEGORY CONFIG
   =========================== */
const CATEGORIES = ["Chap", "Kapi", "Lek", "Prac", "Class", "VerbFam"];

function getCategory(key) {
    if (key.startsWith("VF:")) return "VerbFam";
    for (const cat of ["Chap", "Kapi", "Lek", "Prac", "Class"]) {
        if (key.startsWith(cat)) return cat;
    }
    return null;
}

/* ===========================
   DOM
   =========================== */
const $ = (id) => document.getElementById(id);
const dom = {
    startScreen: $("startScreen"),
    quizScreen: $("quizScreen"),
    resultsScreen: $("resultsScreen"),
    startBtn: $("startBtn"),
    modeDeEn: $("modeDeEn"),
    modeEnDe: $("modeEnDe"),
    categoryTabs: $("categoryTabs"),
    selectionInfo: $("selectionInfo"),
    selectionLabel: $("selectionLabel"),
    selectionCount: $("selectionCount"),
    limitButtons: $("limitButtons"),
    progressBar: $("progressBar"),
    questionCounter: $("questionCounter"),
    scoreCorrect: $("scoreCorrect"),
    scoreWrong: $("scoreWrong"),
    questionCard: $("questionCard"),
    genderBadge: $("genderBadge"),
    questionWord: $("questionWord"),
    questionHint: $("questionHint"),
    optionsGrid: $("optionsGrid"),
    feedbackOverlay: $("feedbackOverlay"),
    feedbackIcon: $("feedbackIcon"),
    feedbackText: $("feedbackText"),
    nextBtn: $("nextBtn"),
    backBtn: $("backBtn"),
    quizChapterLabel: $("quizChapterLabel"),
    resultsEmoji: $("resultsEmoji"),
    resultsTitle: $("resultsTitle"),
    resultsSubtitle: $("resultsSubtitle"),
    ringProgress: $("ringProgress"),
    resultsPercent: $("resultsPercent"),
    finalCorrect: $("finalCorrect"),
    finalWrong: $("finalWrong"),
    finalTotal: $("finalTotal"),
    missedSection: $("missedSection"),
    missedList: $("missedList"),
    restartBtn: $("restartBtn"),
    switchModeBtn: $("switchModeBtn"),
    homeBtn: $("homeBtn"),
    vfSearch: $("vfSearch"),
    clearAllBtn: $("clearAllBtn"),
};

/* ===========================
   PARTICLES
   =========================== */
function createParticles() {
    const c = $("bgParticles");
    for (let i = 0; i < 18; i++) {
        const p = document.createElement("div");
        p.classList.add("particle");
        const s = Math.random() * 4 + 2;
        p.style.width = s + "px";
        p.style.height = s + "px";
        p.style.left = Math.random() * 100 + "%";
        p.style.animationDuration = Math.random() * 15 + 10 + "s";
        p.style.animationDelay = Math.random() * 10 + "s";
        c.appendChild(p);
    }
}

/* ===========================
   UTILITY
   =========================== */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function showScreen(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    screen.classList.add("active");
}

/* ===========================
   BUILD CHAPTER GRIDS
   =========================== */
function buildChapterButtons() {
    const allKeys = Object.keys(ALL_VOCAB_DATA);

    // Standard categories
    ["Chap", "Kapi", "Lek", "Prac", "Class"].forEach(cat => {
        const grid = $(`grid-${cat}`);
        if (!grid) return;
        grid.innerHTML = "";

        const keys = allKeys.filter(k => getCategory(k) === cat);

        keys.forEach(key => {
            const count = ALL_VOCAB_DATA[key].length;
            const btn = document.createElement("button");
            btn.className = "chap-btn";
            btn.dataset.chapter = key;

            let label = key
                .replace("Chap ", "Ch ")
                .replace("Kapi ", "K")
                .replace("Lek ", "L")
                .replace("Prac ", "P")
                .replace("Class ", "C");

            btn.innerHTML = `<span>${label}</span><span class="chap-count">${count}</span>`;
            btn.addEventListener("click", () => toggleChapter(key, btn));
            grid.appendChild(btn);
        });
    });

    // Verb Families grid
    buildVerbFamilyButtons();
}

function buildVerbFamilyButtons() {
    const grid = $("grid-VerbFam");
    if (!grid || typeof VERB_FAMILIES_DATA === "undefined") return;
    grid.innerHTML = "";

    // Sort roots: bigger families first, then alphabetically
    const roots = Object.keys(VERB_FAMILIES_DATA).sort((a, b) => {
        const diff = VERB_FAMILIES_DATA[b].length - VERB_FAMILIES_DATA[a].length;
        return diff !== 0 ? diff : a.localeCompare(b);
    });

    roots.forEach(root => {
        const forms = VERB_FAMILIES_DATA[root];
        const count = forms.length;
        const hasC1 = forms.some(f => f.isC1);
        const key = `VF:${root}`;

        const btn = document.createElement("button");
        btn.className = "chap-btn";
        btn.dataset.chapter = key;
        btn.dataset.root = root.toLowerCase();

        let labelHtml = `<span>${root}</span>`;
        if (hasC1) {
            labelHtml += `<span class="c1-tag">+C1</span>`;
        }
        labelHtml += `<span class="chap-count">${count}</span>`;

        btn.innerHTML = labelHtml;
        btn.addEventListener("click", () => toggleVerbFamily(key, btn));
        grid.appendChild(btn);
    });
}

/* ===========================
   VERB FAMILY SEARCH
   =========================== */
if (dom.vfSearch) {
    dom.vfSearch.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const grid = $("grid-VerbFam");
        if (!grid) return;

        grid.querySelectorAll(".chap-btn").forEach(btn => {
            const root = btn.dataset.root || "";
            if (!query || root.includes(query)) {
                btn.classList.remove("hidden");
            } else {
                btn.classList.add("hidden");
            }
        });
    });
}

/* ===========================
   CATEGORY TABS
   =========================== */
function switchCategory(cat) {
    state.activeCategory = cat;

    dom.categoryTabs.querySelectorAll(".cat-tab").forEach(t => {
        t.classList.toggle("active", t.dataset.cat === cat);
    });

    CATEGORIES.forEach(c => {
        const panel = $(`panel-${c}`);
        if (panel) panel.classList.toggle("active", c === cat);
    });
}

dom.categoryTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".cat-tab");
    if (tab) switchCategory(tab.dataset.cat);
});

/* ===========================
   SELECT ALL / DESELECT ALL
   =========================== */
document.querySelectorAll(".select-all-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const cat = btn.dataset.cat;

        if (cat === "VerbFam") {
            // Handle verb families select all
            const grid = $("grid-VerbFam");
            const chapBtns = grid.querySelectorAll(".chap-btn:not(.hidden)");
            const keysInCat = Array.from(chapBtns).map(b => b.dataset.chapter);
            const allSelected = keysInCat.every(k => state.selectedChapters.includes(k));

            if (allSelected) {
                keysInCat.forEach(k => {
                    const idx = state.selectedChapters.indexOf(k);
                    if (idx !== -1) state.selectedChapters.splice(idx, 1);
                });
                chapBtns.forEach(b => b.classList.remove("selected"));
                btn.textContent = "Alle auswählen";
                btn.classList.remove("deselect");
            } else {
                keysInCat.forEach(k => {
                    if (!state.selectedChapters.includes(k)) state.selectedChapters.push(k);
                });
                chapBtns.forEach(b => b.classList.add("selected"));
                btn.textContent = "Alle abwählen";
                btn.classList.add("deselect");
            }
            updateSelectionInfo();
            return;
        }

        const grid = $(`grid-${cat}`);
        const chapBtns = grid.querySelectorAll(".chap-btn");
        const keysInCat = Array.from(chapBtns).map(b => b.dataset.chapter);
        const allSelected = keysInCat.every(k => state.selectedChapters.includes(k));

        if (allSelected) {
            keysInCat.forEach(k => {
                const idx = state.selectedChapters.indexOf(k);
                if (idx !== -1) state.selectedChapters.splice(idx, 1);
            });
            chapBtns.forEach(b => b.classList.remove("selected"));
            btn.textContent = "Alle auswählen";
            btn.classList.remove("deselect");
        } else {
            keysInCat.forEach(k => {
                if (!state.selectedChapters.includes(k)) state.selectedChapters.push(k);
            });
            chapBtns.forEach(b => b.classList.add("selected"));
            btn.textContent = "Alle abwählen";
            btn.classList.add("deselect");
        }

        updateSelectionInfo();
    });
});

/* ===========================
   TOGGLE CHAPTER / VERB FAMILY
   =========================== */
function toggleChapter(key, btn) {
    const idx = state.selectedChapters.indexOf(key);
    if (idx === -1) {
        state.selectedChapters.push(key);
        btn.classList.add("selected");
    } else {
        state.selectedChapters.splice(idx, 1);
        btn.classList.remove("selected");
    }
    updateSelectAllButton(getCategory(key));
    updateSelectionInfo();
}

function toggleVerbFamily(key, btn) {
    const idx = state.selectedChapters.indexOf(key);
    if (idx === -1) {
        state.selectedChapters.push(key);
        btn.classList.add("selected");
    } else {
        state.selectedChapters.splice(idx, 1);
        btn.classList.remove("selected");
    }
    updateSelectAllButton("VerbFam");
    updateSelectionInfo();
}

function updateSelectAllButton(cat) {
    const grid = $(`grid-${cat}`);
    const panel = $(`panel-${cat}`);
    if (!grid || !panel) return;

    const chapBtns = grid.querySelectorAll(".chap-btn:not(.hidden)");
    const keysInCat = Array.from(chapBtns).map(b => b.dataset.chapter);
    const allSelected = keysInCat.every(k => state.selectedChapters.includes(k));

    const btn = panel.querySelector(".select-all-btn");
    if (btn) {
        if (allSelected && keysInCat.length > 0) {
            btn.textContent = "Alle abwählen";
            btn.classList.add("deselect");
        } else {
            btn.textContent = "Alle auswählen";
            btn.classList.remove("deselect");
        }
    }
}

function updateSelectionInfo() {
    if (state.selectedChapters.length === 0) {
        dom.selectionInfo.classList.add("hidden");
        dom.startBtn.classList.add("disabled");
        return;
    }

    let totalWords = 0;
    state.selectedChapters.forEach(ch => {
        if (ch.startsWith("VF:")) {
            const root = ch.substring(3);
            totalWords += (VERB_FAMILIES_DATA[root] || []).length;
        } else {
            totalWords += (ALL_VOCAB_DATA[ch] || []).length;
        }
    });

    const vfCount = state.selectedChapters.filter(c => c.startsWith("VF:")).length;
    const chCount = state.selectedChapters.filter(c => !c.startsWith("VF:")).length;

    let label;
    if (vfCount > 0 && chCount > 0) {
        label = `${chCount} Abschnitte + ${vfCount} Verbfamilien`;
    } else if (vfCount > 0) {
        label = vfCount === 1 ? state.selectedChapters[0].substring(3) : `${vfCount} Verbfamilien`;
    } else {
        label = state.selectedChapters.length === 1
            ? state.selectedChapters[0]
            : `${state.selectedChapters.length} Abschnitte`;
    }

    dom.selectionLabel.textContent = label;
    dom.selectionCount.textContent = `${totalWords} Wörter`;
    dom.selectionInfo.classList.remove("hidden");
    dom.startBtn.classList.remove("disabled");
}

/* ===========================
   GENERATE QUESTIONS
   =========================== */
function generateQuestions() {
    let pool = [];

    state.selectedChapters.forEach(ch => {
        if (ch.startsWith("VF:")) {
            const root = ch.substring(3);
            const forms = VERB_FAMILIES_DATA[root] || [];
            forms.forEach(w => {
                pool.push({ ...w, chapter: root + " (Verbfamilie)" });
            });
        } else {
            (ALL_VOCAB_DATA[ch] || []).forEach(w => {
                pool.push({ ...w, chapter: ch });
            });
        }
    });

    // Filter out entries with empty meaning for quiz
    pool = pool.filter(w => w.meaning && w.meaning.trim() !== "");

    let shuffled = shuffle(pool);

    if (state.wordLimit !== "all") {
        shuffled = shuffled.slice(0, parseInt(state.wordLimit));
    }

    // Build distractor pools
    const allMeanings = pool.map(w => w.meaning);
    const allWords = pool.map(w => w.word);

    // Fallback distractors from entire dataset + verb families
    const globalData = Object.values(ALL_VOCAB_DATA).flat();
    const vfData = typeof VERB_FAMILIES_DATA !== "undefined" ? Object.values(VERB_FAMILIES_DATA).flat() : [];
    const combinedGlobal = [...globalData, ...vfData].filter(w => w.meaning && w.meaning.trim());
    const globalMeanings = combinedGlobal.map(w => w.meaning);
    const globalWords = combinedGlobal.map(w => w.word);

    return shuffled.map(item => {
        let question, correctAnswer, options;

        if (state.mode === "de-en") {
            question = item.word;
            correctAnswer = item.meaning;
            let distractors = shuffle(allMeanings.filter(m => m !== item.meaning)).slice(0, 3);
            if (distractors.length < 3) {
                const more = shuffle(globalMeanings.filter(m => m !== item.meaning && !distractors.includes(m)));
                distractors = [...distractors, ...more].slice(0, 3);
            }
            options = shuffle([correctAnswer, ...distractors]);
        } else {
            question = item.meaning;
            correctAnswer = item.word;
            let distractors = shuffle(allWords.filter(w => w !== item.word)).slice(0, 3);
            if (distractors.length < 3) {
                const more = shuffle(globalWords.filter(w => w !== item.word && !distractors.includes(w)));
                distractors = [...distractors, ...more].slice(0, 3);
            }
            options = shuffle([correctAnswer, ...distractors]);
        }

        return {
            question,
            correctAnswer,
            options,
            gender: item.gender,
            originalWord: item.word,
            originalMeaning: item.meaning,
        };
    });
}

/* ===========================
   RENDER QUESTION
   =========================== */
function renderQuestion() {
    const q = state.questions[state.currentIndex];
    state.answered = false;

    dom.questionCounter.textContent = `${state.currentIndex + 1} / ${state.questions.length}`;
    dom.scoreCorrect.textContent = state.score.correct;
    dom.scoreWrong.textContent = state.score.wrong;
    dom.progressBar.style.width = `${(state.currentIndex / state.questions.length) * 100}%`;

    dom.genderBadge.className = "gender-badge";
    if (q.gender && q.gender !== "null" && q.gender !== "") {
        dom.genderBadge.textContent = q.gender;
        dom.genderBadge.classList.add("visible", q.gender);
    }

    dom.questionWord.textContent = q.question;
    dom.questionHint.textContent = state.mode === "de-en"
        ? "What does this mean?"
        : "Wie sagt man das auf Deutsch?";

    dom.optionsGrid.innerHTML = "";
    const keys = ["1", "2", "3", "4"];
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerHTML = `<span class="key-hint">${keys[i]}</span>${opt}`;
        btn.addEventListener("click", () => handleAnswer(btn, opt, q.correctAnswer));
        dom.optionsGrid.appendChild(btn);
    });

    dom.nextBtn.classList.add("hidden");

    dom.questionCard.style.animation = "none";
    dom.questionCard.offsetHeight;
    dom.questionCard.style.animation = "fadeIn .35s ease forwards";
}

/* ===========================
   HANDLE ANSWER
   =========================== */
function handleAnswer(selectedBtn, selected, correct) {
    if (state.answered) return;
    state.answered = true;

    const allBtns = dom.optionsGrid.querySelectorAll(".option-btn");
    allBtns.forEach(btn => btn.classList.add("disabled"));

    const isCorrect = selected === correct;

    if (isCorrect) {
        selectedBtn.classList.add("correct");
        state.score.correct++;
        showFeedback("✅", "Richtig!", true);
    } else {
        selectedBtn.classList.add("wrong");
        state.score.wrong++;
        state.missedWords.push(state.questions[state.currentIndex]);
        showFeedback("❌", "Falsch!", false);
        allBtns.forEach(btn => {
            const text = btn.textContent.slice(1);
            if (text === correct) btn.classList.add("correct");
        });
    }

    dom.scoreCorrect.textContent = state.score.correct;
    dom.scoreWrong.textContent = state.score.wrong;

    dom.nextBtn.classList.remove("hidden");
    dom.nextBtn.style.animation = "fadeIn .3s ease forwards";

    if (state.currentIndex === state.questions.length - 1) {
        dom.nextBtn.querySelector("span").textContent = "Ergebnis anzeigen";
    }
}

function showFeedback(icon, text, isCorrect) {
    dom.feedbackIcon.textContent = icon;
    dom.feedbackText.textContent = text;
    dom.feedbackText.style.color = isCorrect ? "var(--correct)" : "var(--wrong)";
    dom.feedbackOverlay.classList.add("show");
    setTimeout(() => dom.feedbackOverlay.classList.remove("show"), 600);
}

/* ===========================
   NEXT / RESULTS
   =========================== */
function nextQuestion() {
    if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showScreen(dom.resultsScreen);

    const total = state.questions.length;
    const correct = state.score.correct;
    const pct = Math.round((correct / total) * 100);

    if (pct === 100) {
        dom.resultsEmoji.textContent = "🏆";
        dom.resultsTitle.textContent = "Perfekt!";
        dom.resultsSubtitle.textContent = "Alle Wörter richtig – unglaublich!";
    } else if (pct >= 80) {
        dom.resultsEmoji.textContent = "🎉";
        dom.resultsTitle.textContent = "Fantastisch!";
        dom.resultsSubtitle.textContent = "Du kennst fast alle Wörter!";
    } else if (pct >= 60) {
        dom.resultsEmoji.textContent = "💪";
        dom.resultsTitle.textContent = "Gut gemacht!";
        dom.resultsSubtitle.textContent = "Weiter so – du bist auf dem richtigen Weg!";
    } else if (pct >= 40) {
        dom.resultsEmoji.textContent = "📚";
        dom.resultsTitle.textContent = "Nicht schlecht!";
        dom.resultsSubtitle.textContent = "Übe weiter, es wird besser!";
    } else {
        dom.resultsEmoji.textContent = "🔄";
        dom.resultsTitle.textContent = "Übung macht den Meister!";
        dom.resultsSubtitle.textContent = "Wiederhole die Wörter und versuche es nochmal.";
    }

    dom.finalCorrect.textContent = correct;
    dom.finalWrong.textContent = state.score.wrong;
    dom.finalTotal.textContent = total;

    const circumference = 2 * Math.PI * 85;
    const offset = circumference - (pct / 100) * circumference;
    setTimeout(() => {
        dom.ringProgress.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)";
        dom.ringProgress.style.strokeDashoffset = offset;
    }, 300);

    animateCounter(dom.resultsPercent, 0, pct, 1000, "%");

    if (state.missedWords.length > 0) {
        dom.missedSection.classList.remove("hidden");
        dom.missedList.innerHTML = "";
        state.missedWords.forEach(q => {
            const item = document.createElement("div");
            item.className = "missed-item";
            item.innerHTML = `
                <span class="missed-word">${q.originalWord}</span>
                <span class="missed-meaning">${q.originalMeaning}</span>`;
            dom.missedList.appendChild(item);
        });
    } else {
        dom.missedSection.classList.add("hidden");
    }

    dom.progressBar.style.width = "100%";
}

function animateCounter(el, start, end, duration, suffix = "") {
    const t0 = performance.now();
    function tick(now) {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (end - start) * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

/* ===========================
   START / RESTART / NAV
   =========================== */
function startQuiz() {
    if (state.selectedChapters.length === 0) return;

    state.currentIndex = 0;
    state.score = { correct: 0, wrong: 0 };
    state.missedWords = [];
    state.questions = generateQuestions();

    if (state.questions.length === 0) {
        alert("Keine Wörter mit Bedeutung gefunden. Bitte wähle andere Abschnitte.");
        return;
    }

    const vfItems = state.selectedChapters.filter(c => c.startsWith("VF:"));
    const chItems = state.selectedChapters.filter(c => !c.startsWith("VF:"));

    let labelParts = [];
    if (chItems.length > 0) {
        labelParts.push(chItems.length <= 3 ? chItems.join(", ") : `${chItems.length} Abschnitte`);
    }
    if (vfItems.length > 0) {
        const rootNames = vfItems.map(v => v.substring(3));
        labelParts.push(rootNames.length <= 3 ? rootNames.join(", ") : `${rootNames.length} Verbfamilien`);
    }
    dom.quizChapterLabel.textContent = labelParts.join(" + ");

    showScreen(dom.quizScreen);
    renderQuestion();
}

function resetRing() {
    dom.ringProgress.style.transition = "none";
    dom.ringProgress.style.strokeDashoffset = 534;
}

function goHome() {
    resetRing();
    showScreen(dom.startScreen);
}

/* ===========================
   EVENT LISTENERS
   =========================== */
dom.modeDeEn.addEventListener("click", () => {
    state.mode = "de-en";
    dom.modeDeEn.classList.add("active");
    dom.modeEnDe.classList.remove("active");
});
dom.modeEnDe.addEventListener("click", () => {
    state.mode = "en-de";
    dom.modeEnDe.classList.add("active");
    dom.modeDeEn.classList.remove("active");
});

dom.limitButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".limit-btn");
    if (!btn) return;
    dom.limitButtons.querySelectorAll(".limit-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.wordLimit = btn.dataset.limit;
});

dom.startBtn.addEventListener("click", startQuiz);
dom.nextBtn.addEventListener("click", nextQuestion);
dom.backBtn.addEventListener("click", goHome);
dom.restartBtn.addEventListener("click", () => { resetRing(); startQuiz(); });
dom.switchModeBtn.addEventListener("click", () => {
    state.mode = state.mode === "de-en" ? "en-de" : "de-en";
    dom.modeDeEn.classList.toggle("active");
    dom.modeEnDe.classList.toggle("active");
    resetRing();
    startQuiz();
});
dom.homeBtn.addEventListener("click", goHome);

document.addEventListener("keydown", (e) => {
    if (dom.quizScreen.classList.contains("active")) {
        if (["1","2","3","4"].includes(e.key) && !state.answered) {
            const btns = dom.optionsGrid.querySelectorAll(".option-btn");
            if (btns[parseInt(e.key) - 1]) btns[parseInt(e.key) - 1].click();
        }
        if ((e.key === "Enter" || e.key === " ") && state.answered) {
            e.preventDefault();
            nextQuestion();
        }
    }
    if (dom.startScreen.classList.contains("active") && e.key === "Enter") {
        // Only start if not typing in search
        if (document.activeElement !== dom.vfSearch) {
            e.preventDefault();
            startQuiz();
        }
    }
});

/* ===========================
   CLEAR ALL SELECTIONS
   =========================== */
function clearAllSelections() {
    state.selectedChapters = [];

    // Deselect all buttons across all grids
    document.querySelectorAll(".chap-btn.selected").forEach(btn => {
        btn.classList.remove("selected");
    });

    // Reset all select-all buttons
    document.querySelectorAll(".select-all-btn").forEach(btn => {
        btn.textContent = "Alle auswählen";
        btn.classList.remove("deselect");
    });

    updateSelectionInfo();
}

dom.clearAllBtn.addEventListener("click", clearAllSelections);

/* ===========================
   DICTIONARY SEARCH
   =========================== */
const searchDom = {
    screen: $("searchScreen"),
    openBtn: $("searchOpenBtn"),
    backBtn: $("searchBackBtn"),
    input: $("dictSearch"),
    clearBtn: $("searchClearBtn"),
    results: $("searchResults"),
    stats: $("searchStats"),
    modeDe: $("searchModeDe"),
    modeEn: $("searchModeEn"),
};

let searchMode = "de"; // "de" = search German, "en" = search English

// Build flat index once
function buildSearchIndex() {
    const index = [];

    // All vocab data
    Object.entries(ALL_VOCAB_DATA).forEach(([section, words]) => {
        words.forEach(w => {
            if (w.word && w.word.trim()) {
                index.push({
                    word: w.word.trim(),
                    meaning: (w.meaning || "").trim(),
                    gender: w.gender && w.gender !== "None" ? w.gender : null,
                    source: section,
                });
            }
        });
    });

    // Verb families data
    if (typeof VERB_FAMILIES_DATA !== "undefined") {
        Object.entries(VERB_FAMILIES_DATA).forEach(([root, forms]) => {
            forms.forEach(f => {
                if (f.word && f.meaning) {
                    index.push({
                        word: f.word.trim(),
                        meaning: f.meaning.trim(),
                        gender: null,
                        source: `VF: ${root}`,
                        isC1: f.isC1 || false,
                    });
                }
            });
        });
    }

    return index;
}

const searchIndex = buildSearchIndex();

function highlightMatch(text, query) {
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
}

function performSearch(query) {
    if (!query || query.length < 1) {
        searchDom.results.innerHTML = `
            <div class="search-empty">
                <span class="search-empty-icon">🔍</span>
                <p>Gib ein Wort ein, um alle passenden Vokabeln zu finden</p>
            </div>`;
        searchDom.stats.textContent = "";
        return;
    }

    const q = query.toLowerCase().trim();

    const results = searchIndex.filter(item => {
        if (searchMode === "de") {
            return item.word.toLowerCase().includes(q);
        } else {
            return item.meaning.toLowerCase().includes(q);
        }
    });

    // Sort: exact start matches first, then by length
    results.sort((a, b) => {
        const fieldA = searchMode === "de" ? a.word.toLowerCase() : a.meaning.toLowerCase();
        const fieldB = searchMode === "de" ? b.word.toLowerCase() : b.meaning.toLowerCase();
        const startsA = fieldA.startsWith(q) ? 0 : 1;
        const startsB = fieldB.startsWith(q) ? 0 : 1;
        if (startsA !== startsB) return startsA - startsB;
        return fieldA.length - fieldB.length;
    });

    // Cap at 100 results for performance
    const shown = results.slice(0, 100);

    searchDom.stats.textContent = results.length > 0
        ? `${results.length} Ergebnis${results.length !== 1 ? "se" : ""} gefunden${results.length > 100 ? " (erste 100 angezeigt)" : ""}`
        : "";

    if (shown.length === 0) {
        searchDom.results.innerHTML = `
            <div class="search-empty">
                <span class="search-empty-icon">😕</span>
                <p>Keine Ergebnisse für „${query}"</p>
            </div>`;
        return;
    }

    searchDom.results.innerHTML = shown.map(item => {
        const wordHtml = searchMode === "de"
            ? highlightMatch(item.word, query)
            : item.word;
        const meaningHtml = searchMode === "en"
            ? highlightMatch(item.meaning, query)
            : item.meaning;

        let genderHtml = "";
        if (item.gender) {
            const gClass = item.gender.split("-")[0];
            genderHtml = `<span class="sr-gender ${gClass}">${item.gender}</span>`;
        }

        return `<div class="search-result-item">
            ${genderHtml}
            <span class="sr-word">${wordHtml}</span>
            <span class="sr-meaning">${meaningHtml || "—"}</span>
            <span class="sr-source">${item.source}</span>
        </div>`;
    }).join("");
}

// Debounce
let searchTimer = null;
searchDom.input.addEventListener("input", () => {
    const val = searchDom.input.value;
    searchDom.clearBtn.classList.toggle("hidden", val.length === 0);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => performSearch(val), 150);
});

searchDom.clearBtn.addEventListener("click", () => {
    searchDom.input.value = "";
    searchDom.clearBtn.classList.add("hidden");
    performSearch("");
    searchDom.input.focus();
});

// Mode toggle
searchDom.modeDe.addEventListener("click", () => {
    searchMode = "de";
    searchDom.modeDe.classList.add("active");
    searchDom.modeEn.classList.remove("active");
    searchDom.input.placeholder = "Deutsches Wort eingeben...";
    performSearch(searchDom.input.value);
});
searchDom.modeEn.addEventListener("click", () => {
    searchMode = "en";
    searchDom.modeEn.classList.add("active");
    searchDom.modeDe.classList.remove("active");
    searchDom.input.placeholder = "English word eingeben...";
    performSearch(searchDom.input.value);
});

// Navigation
searchDom.openBtn.addEventListener("click", () => {
    showScreen(searchDom.screen);
    setTimeout(() => searchDom.input.focus(), 100);
});
searchDom.backBtn.addEventListener("click", () => {
    showScreen(dom.startScreen);
});

/* ===========================
   INIT
   =========================== */
createParticles();
buildChapterButtons();
