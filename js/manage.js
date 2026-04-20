import { state, saveVocab } from './store.js';

export function showMessage(msg, isError = false) {
    const msgBox = document.getElementById("msg-box");
    msgBox.style.display = "block";
    msgBox.style.backgroundColor = isError ? "#e74c3c" : "#2ecc71";
    msgBox.innerText = msg;
    setTimeout(() => {
        msgBox.style.display = "none";
    }, 4000);
}

let manageSortDir = "asc";

export function toggleSortDir() {
    manageSortDir = manageSortDir === "asc" ? "desc" : "asc";
    const btn = document.getElementById("manage-sort-dir");
    btn.innerText = manageSortDir === "asc" ? "↑ Asc" : "↓ Desc";
    renderManageTable();
}

function getManageFiltered() {
    const hskFilter = document.getElementById("manage-hsk-filter").value;
    const searchQ = (document.getElementById("manage-search").value || "").toLowerCase();
    const sortField = document.getElementById("manage-sort-field").value;

    let result = [...state.vocab];

    if (hskFilter !== "All") {
        result = result.filter((v) => String(v.hsk) === hskFilter);
    }

    if (searchQ) {
        result = result.filter(
            (v) =>
                v.zh.toLowerCase().includes(searchQ) ||
                v.py.toLowerCase().includes(searchQ) ||
                v.en.toLowerCase().includes(searchQ),
        );
    }

    if (sortField !== "none") {
        result.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            if (sortField === "hsk") {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
                return manageSortDir === "asc" ? valA - valB : valB - valA;
            }

            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
            const cmp = valA.localeCompare(valB, "zh");
            return manageSortDir === "asc" ? cmp : -cmp;
        });
    }

    return result;
}

export function renderManageTable() {
    const manageList = getManageFiltered();
    const tbody = document.getElementById("vocab-tbody");
    tbody.innerHTML = "";
    manageList.forEach((v) => {
        const mainIndex = state.vocab.indexOf(v);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${v.zh}</td>
            <td>${v.py}</td>
            <td>${v.en}</td>
            <td style="text-align:center">${v.hsk}</td>
            <td style="text-align:center">
                <button class="del-btn" data-index="${mainIndex}">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const countEl = document.getElementById("manage-count");
    if (countEl) {
        countEl.innerText = `Found ${manageList.length} from ${state.vocab.length} words`;
    }
}

export function setupManageListeners() {
    const tbody = document.getElementById("vocab-tbody");
    tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("del-btn")) {
            const index = parseInt(e.target.getAttribute("data-index"));
            deleteVocabByIndex(index);
        }
    });
}

export function addVocab() {
    const zh = document.getElementById("new-zh").value.trim();
    const py = document.getElementById("new-py").value.trim();
    const en = document.getElementById("new-en").value.trim();
    const hsk = document.getElementById("new-hsk").value;

    if (zh && en) {
        const exists = state.vocab.some((v) => v.zh === zh);
        if (exists) {
            showMessage("This Chinese word already exists in your list!", true);
            return;
        }

        state.vocab.unshift({ zh, py, en, hsk: parseInt(hsk), correctCount: 0, wrongCount: 0 });
        saveVocab();
        document.getElementById("new-zh").value = "";
        document.getElementById("new-py").value = "";
        document.getElementById("new-en").value = "";
        showMessage("Vocabulary added successfully!");
        renderManageTable();
    } else {
        showMessage("Please fill in at least Chinese and English.", true);
    }
}

function deleteVocabByIndex(mainIndex) {
    if (mainIndex > -1 && mainIndex < state.vocab.length) {
        state.vocab.splice(mainIndex, 1);
        saveVocab();
        renderManageTable();
    }
}

let deleteConfirmTimeout;
export function deleteAllVocab() {
    const btn = document.getElementById("delete-all-btn");
    if (btn.innerText === "⚠️ Confirm Delete All") {
        state.vocab = [];
        saveVocab();
        showMessage("All web vocabulary has been completely deleted.");
        btn.innerText = "🗑️ Delete All (Web)";
        clearTimeout(deleteConfirmTimeout);
        renderManageTable();
    } else {
        btn.innerText = "⚠️ Confirm Delete All";
        deleteConfirmTimeout = setTimeout(() => {
            btn.innerText = "🗑️ Delete All (Web)";
        }, 3000);
    }
}

let pendingImportEvent = null;

export function onImportFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validExts = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(fileExt)) {
        showMessage("Invalid file type. Please upload a .xlsx, .xls, or .csv file.", true);
        event.target.value = "";
        return;
    }

    pendingImportEvent = event;
    document.getElementById("import-modal").style.display = "flex";
}

export function confirmImport(mode) {
    document.getElementById("import-modal").style.display = "none";
    if (pendingImportEvent) {
        importExcel(pendingImportEvent, mode);
        pendingImportEvent = null;
    }
}

export function cancelImport() {
    document.getElementById("import-modal").style.display = "none";
    if (pendingImportEvent) {
        pendingImportEvent.target.value = "";
        pendingImportEvent = null;
    }
}

function importExcel(event, mode) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            if (!json || json.length === 0) {
                showMessage("The uploaded file is empty.", true);
                event.target.value = "";
                return;
            }

            const firstRowKeys = Object.keys(json[0]).map((k) => k.toLowerCase());
            const hasZh = firstRowKeys.some((k) => k.includes("chinese") || k === "zh");
            const hasEn = firstRowKeys.some((k) => k.includes("english") || k === "en");

            if (!hasZh || !hasEn) {
                showMessage("Invalid format! Your file must contain 'Chinese' and 'English' columns.", true);
                event.target.value = "";
                return;
            }

            let extractedVocab = [];
            json.forEach((row) => {
                const zhKey = Object.keys(row).find((k) => k.toLowerCase().includes("chinese") || k.toLowerCase() === "zh");
                const pyKey = Object.keys(row).find((k) => k.toLowerCase().includes("pinyin") || k.toLowerCase() === "py");
                const enKey = Object.keys(row).find((k) => k.toLowerCase().includes("english") || k.toLowerCase() === "en");
                const hskKey = Object.keys(row).find((k) => k.toLowerCase().includes("hsk") || k.toLowerCase().includes("level"));

                if (row[zhKey] && row[enKey]) {
                    const zhVal = String(row[zhKey]).trim();
                    const enVal = String(row[enKey]).trim();
                    const pyVal = row[pyKey] ? String(row[pyKey]).trim() : "";
                    
                    let hskLevel = 1;
                    if (row[hskKey]) {
                        const parsedHsk = parseInt(String(row[hskKey]).replace(/\D/g, ""));
                        if (!isNaN(parsedHsk)) hskLevel = parsedHsk;
                    }

                    extractedVocab.push({ zh: zhVal, py: pyVal, en: enVal, hsk: hskLevel, correctCount: 0, wrongCount: 0 });
                }
            });

            if (mode === "replace") {
                state.vocab = extractedVocab;
                showMessage(`Replaced! Imported ${extractedVocab.length} words.`);
            } else if (mode === "merge") {
                let addedCount = 0;
                extractedVocab.forEach((newItem) => {
                    const exists = state.vocab.some((v) => v.zh === newItem.zh);
                    if (!exists) {
                        state.vocab.unshift(newItem);
                        addedCount++;
                    }
                });
                showMessage(`Merged successfully! Added ${addedCount} new words.`);
            }

            document.getElementById("hsk-filter").value = "All";
            saveVocab();
            renderManageTable();
            event.target.value = "";
        } catch (error) {
            showMessage("Error reading file.", true);
            event.target.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}

export function exportExcel() {
    if (state.filteredVocab.length === 0) {
        showMessage("No vocabulary to export.", true);
        return;
    }
    const exportData = state.filteredVocab.map((v) => ({
        Chinese: v.zh,
        Pinyin: v.py,
        English: v.en,
        HSK: v.hsk,
        CorrectCount: v.correctCount || 0,
        WrongCount: v.wrongCount || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");
    XLSX.writeFile(workbook, "HSK_Chinese_Vocab.xlsx");
}
