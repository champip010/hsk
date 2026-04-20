import { state, initStorage } from './store.js';
import { loadFlashcard, flipCard, togglePinyinVisibility, nextCard, prevCard, playAudio, randomizeVocab, setupSwipeListener } from './flashcard.js';
import { loadQuiz } from './quiz.js';
import { renderManageTable, addVocab, deleteAllVocab, onImportFileSelected, confirmImport, cancelImport, exportExcel, toggleSortDir, setupManageListeners } from './manage.js';

function applyFilter() {
    const hskFilter = document.getElementById("hsk-filter").value;
    const searchQ = document.getElementById("search-filter") ? document.getElementById("search-filter").value.toLowerCase() : "";

    let tempVocab = state.vocab;

    if (hskFilter !== "All") {
        tempVocab = tempVocab.filter((v) => String(v.hsk) === hskFilter);
    }

    if (searchQ) {
        tempVocab = tempVocab.filter(
            (v) => v.zh.toLowerCase().includes(searchQ) || v.py.toLowerCase().includes(searchQ) || v.en.toLowerCase().includes(searchQ)
        );
    }

    state.filteredVocab = tempVocab;
    state.currentCardIndex = 0;

    if (state.currentMode === "learn") {
        loadFlashcard();
    } else if (state.currentMode === "quiz") {
        document.getElementById("score-val").innerText = state.score;
        if (state.filteredVocab.length >= 2) {
            loadQuiz();
        } else {
            document.getElementById("quiz-zh").innerHTML = "<span style='font-size:1.2rem; color: #e74c3c;'>Need at least 2 words in this HSK level for a quiz.</span>";
            document.getElementById("options-grid").innerHTML = "";
            document.getElementById("next-quiz-btn").style.display = "none";
        }
    } else if (state.currentMode === "manage") {
        renderManageTable();
    }
}

function switchMode(mode) {
    state.currentMode = mode;
    document.getElementById("btn-learn").classList.remove("btn-active");
    document.getElementById("btn-quiz").classList.remove("btn-active");
    document.getElementById("btn-manage").classList.remove("btn-active");

    document.getElementById("btn-" + mode).classList.add("btn-active");

    document.getElementById("learn-section").style.display = "none";
    document.getElementById("quiz-section").style.display = "none";
    document.getElementById("manage-section").style.display = "none";

    const filterContainer = document.querySelector(".filter-container");

    if (mode === "learn") {
        filterContainer.style.display = "flex";
        document.getElementById("learn-section").style.display = "block";
        loadFlashcard();
    } else if (mode === "quiz") {
        filterContainer.style.display = "flex";
        document.getElementById("quiz-section").style.display = "block";
        document.getElementById("score-val").innerText = state.score;
        if (state.filteredVocab.length >= 2) {
            loadQuiz();
        } else {
            document.getElementById("quiz-zh").innerHTML = "<span style='font-size:1.2rem; color: #e74c3c;'>Need at least 2 words in this HSK level for a quiz.</span>";
            document.getElementById("options-grid").innerHTML = "";
            document.getElementById("next-quiz-btn").style.display = "none";
        }
    } else if (mode === "manage") {
        filterContainer.style.display = "none";
        document.getElementById("manage-section").style.display = "block";
        renderManageTable();
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("hsk_dark_mode", isDark);
    document.getElementById("btn-dark-mode").innerText = isDark ? "☀️ Theme" : "🌙 Theme";
}

document.addEventListener("DOMContentLoaded", () => {
    // Top Nav
    document.getElementById("btn-dark-mode").addEventListener("click", toggleDarkMode);
    document.getElementById("btn-learn").addEventListener("click", () => switchMode("learn"));
    document.getElementById("btn-quiz").addEventListener("click", () => switchMode("quiz"));
    document.getElementById("btn-manage").addEventListener("click", () => switchMode("manage"));

    // Global Filters
    document.getElementById("hsk-filter").addEventListener("change", applyFilter);
    document.getElementById("search-filter").addEventListener("input", applyFilter);

    // Flashcard Actions
    document.getElementById("flashcard").addEventListener("click", flipCard);
    document.getElementById("hide-pinyin-toggle").addEventListener("change", togglePinyinVisibility);
    
    // Explicit array assignment for navigation buttons to avoid logic errors
    const controls = document.querySelector(".controls").children;
    controls[0].addEventListener("click", prevCard);
    controls[1].addEventListener("click", randomizeVocab);
    controls[2].addEventListener("click", playAudio);
    controls[3].addEventListener("click", nextCard);

    // Quiz Actions
    document.getElementById("next-quiz-btn").addEventListener("click", loadQuiz);

    // Manage Actions
    document.getElementById("import-file-input").addEventListener("change", onImportFileSelected);
    document.querySelector(".file-upload-btn").addEventListener("click", () => document.getElementById("import-file-input").click());
    document.querySelector(".export-btn").addEventListener("click", exportExcel);
    document.getElementById("delete-all-btn").addEventListener("click", deleteAllVocab);
    
    document.querySelector(".add-btn").addEventListener("click", addVocab);
    
    document.getElementById("manage-search").addEventListener("input", renderManageTable);
    document.getElementById("manage-hsk-filter").addEventListener("change", renderManageTable);
    document.getElementById("manage-sort-field").addEventListener("change", renderManageTable);
    document.getElementById("manage-sort-dir").addEventListener("click", toggleSortDir);

    // Modal Actions
    document.querySelector(".modal-btn-merge").addEventListener("click", () => confirmImport("merge"));
    document.querySelector(".modal-btn-replace").addEventListener("click", () => confirmImport("replace"));
    document.querySelector(".modal-cancel").addEventListener("click", cancelImport);

    // Keydown Listener
    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

        if (state.currentMode === "learn") {
            if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown") {
                e.preventDefault();
                flipCard();
            } else if (e.code === "ArrowLeft") {
                prevCard();
            } else if (e.code === "ArrowRight") {
                nextCard();
            }
        }
    });

    // Theme initialization
    if (localStorage.getItem("hsk_dark_mode") === "true") {
        document.body.classList.add("dark-theme");
        document.getElementById("btn-dark-mode").innerText = "☀️ Theme";
    }

    // Start App Sequence
    setupSwipeListener();
    setupManageListeners();
    initStorage(() => {
        applyFilter(); 
    });
});
