let defaultVocab = [];

let vocab = JSON.parse(localStorage.getItem('nammon_chinese_vocab')) || defaultVocab;
let filteredVocab = [...vocab];

let currentCardIndex = 0;
let score = 0;
let currentQuizAnswer = "";
let currentMode = 'learn';

function saveVocab() {
    localStorage.setItem('nammon_chinese_vocab', JSON.stringify(vocab));
    applyFilter();
}

function applyFilter() {
    const hskFilter = document.getElementById('hsk-filter').value;
    const searchQ = document.getElementById('search-filter') ? document.getElementById('search-filter').value.toLowerCase() : "";

    let tempVocab = vocab;

    if (hskFilter !== 'All') {
        tempVocab = tempVocab.filter(v => String(v.hsk) === hskFilter);
    }

    if (searchQ) {
        tempVocab = tempVocab.filter(v =>
            v.zh.toLowerCase().includes(searchQ) ||
            v.py.toLowerCase().includes(searchQ) ||
            v.en.toLowerCase().includes(searchQ)
        );
    }

    filteredVocab = tempVocab;
    currentCardIndex = 0;

    if (currentMode === 'learn') {
        loadFlashcard();
    } else if (currentMode === 'quiz') {
        score = 0;
        document.getElementById('score-val').innerText = score;
        if (filteredVocab.length >= 4) {
            loadQuiz();
        } else {
            document.getElementById('quiz-zh').innerHTML = "<span style='font-size:1.2rem; color: #e74c3c;'>Need at least 4 words in this HSK level for a quiz.</span>";
            document.getElementById('options-grid').innerHTML = "";
            document.getElementById('next-quiz-btn').style.display = 'none';
        }
    } else if (currentMode === 'manage') {
        renderManageTable();
    }
}

function randomizeVocab() {
    if (filteredVocab.length === 0) return;

    filteredVocab = shuffle([...filteredVocab]);
    currentCardIndex = 0;

    if (currentMode === 'learn') {
        loadFlashcard();
    } else if (currentMode === 'quiz') {
        score = 0;
        document.getElementById('score-val').innerText = score;
        loadQuiz();
    } else if (currentMode === 'manage') {
        renderManageTable();
    }
}

// --- Navigation Logic ---
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('btn-learn').classList.remove('btn-active');
    document.getElementById('btn-quiz').classList.remove('btn-active');
    document.getElementById('btn-manage').classList.remove('btn-active');

    document.getElementById('btn-' + mode).classList.add('btn-active');

    document.getElementById('learn-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('manage-section').style.display = 'none';

    if (mode === 'learn') {
        document.getElementById('learn-section').style.display = 'block';
        loadFlashcard();
    } else if (mode === 'quiz') {
        document.getElementById('quiz-section').style.display = 'block';
        score = 0;
        document.getElementById('score-val').innerText = score;
        if (filteredVocab.length >= 4) {
            loadQuiz();
        } else {
            document.getElementById('quiz-zh').innerHTML = "<span style='font-size:1.2rem; color: #e74c3c;'>Need at least 4 words in this HSK level for a quiz.</span>";
            document.getElementById('options-grid').innerHTML = "";
            document.getElementById('next-quiz-btn').style.display = 'none';
        }
    } else if (mode === 'manage') {
        document.getElementById('manage-section').style.display = 'block';
        renderManageTable();
    }
}

// --- Flashcard Logic ---
function loadFlashcard() {
    const card = document.getElementById('flashcard');
    card.classList.remove('is-flipped');

    setTimeout(() => {
        const zhElem = document.getElementById('fc-zh');
        const pyElem = document.getElementById('fc-py');
        const enElem = document.getElementById('fc-en');

        if (filteredVocab.length === 0) {
            zhElem.innerText = "Empty";
            pyElem.innerText = "-";
            enElem.innerText = "No words for this filter.";
            enElem.style.fontSize = "2.5rem";
            zhElem.style.fontSize = "5rem";
            return;
        }

        if (currentCardIndex >= filteredVocab.length) currentCardIndex = 0;

        const zhText = filteredVocab[currentCardIndex].zh;
        const pyText = filteredVocab[currentCardIndex].py;
        const enText = filteredVocab[currentCardIndex].en;

        zhElem.innerText = zhText;
        pyElem.innerText = pyText;
        enElem.innerText = enText;

        if (zhText.length > 8) {
            zhElem.style.fontSize = "2.5rem";
        } else if (zhText.length > 4) {
            zhElem.style.fontSize = "3.5rem";
        } else {
            zhElem.style.fontSize = "5rem";
        }

        if (enText.length > 60) {
            enElem.style.fontSize = "1.5rem";
        } else if (enText.length > 30) {
            enElem.style.fontSize = "2rem";
        } else if (enText.length > 15) {
            enElem.style.fontSize = "2.8rem";
        } else {
            enElem.style.fontSize = "3.5rem";
        }

    }, 150);
}

function flipCard() {
    if (filteredVocab.length > 0) document.getElementById('flashcard').classList.toggle('is-flipped');
}

function nextCard() {
    if (filteredVocab.length === 0) return;
    currentCardIndex = (currentCardIndex + 1) % filteredVocab.length;
    loadFlashcard();
}

function prevCard() {
    if (filteredVocab.length === 0) return;
    currentCardIndex = (currentCardIndex - 1 + filteredVocab.length) % filteredVocab.length;
    loadFlashcard();
}

function playAudio() {
    if (filteredVocab.length === 0) return;
    const text = filteredVocab[currentCardIndex].zh;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

// --- Quiz Logic ---
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadQuiz() {
    if (filteredVocab.length < 4) return;
    document.getElementById('next-quiz-btn').style.display = 'none';

    const qIndex = Math.floor(Math.random() * filteredVocab.length);
    const question = filteredVocab[qIndex];
    currentQuizAnswer = question.en;

    document.getElementById('quiz-zh').innerText = question.zh;

    let options = [question.en];
    while (options.length < 4) {
        let randomOpt = filteredVocab[Math.floor(Math.random() * filteredVocab.length)].en;
        if (!options.includes(randomOpt)) {
            options.push(randomOpt);
        }
    }
    options = shuffle(options);

    const grid = document.getElementById('options-grid');
    grid.innerHTML = "";
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt);
        grid.appendChild(btn);
    });
}

function checkAnswer(btn, selected) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);

    if (selected === currentQuizAnswer) {
        btn.classList.add('correct');
        score += 10;
        document.getElementById('score-val').innerText = score;
        playFeedback(true);
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if (b.innerText === currentQuizAnswer) {
                b.classList.add('correct');
            }
        });
        playFeedback(false);
    }

    document.getElementById('next-quiz-btn').style.display = 'inline-block';
}

function playFeedback(isCorrect) {
    const utterance = new SpeechSynthesisUtterance(isCorrect ? "Very good!" : "Try again next time.");
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// --- Manage Logic (Excel & CRUD) ---
function showMessage(msg, isError = false) {
    const msgBox = document.getElementById('msg-box');
    msgBox.style.display = 'block';
    msgBox.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
    msgBox.innerText = msg;
    setTimeout(() => { msgBox.style.display = 'none'; }, 4000);
}

function renderManageTable() {
    const tbody = document.getElementById('vocab-tbody');
    tbody.innerHTML = "";
    filteredVocab.forEach((v, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.zh}</td>
            <td>${v.py}</td>
            <td>${v.en}</td>
            <td>${v.hsk}</td>
            <td><button class="del-btn" onclick="deleteVocab(${index})">Delete</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function addVocab() {
    const zh = document.getElementById('new-zh').value.trim();
    const py = document.getElementById('new-py').value.trim();
    const en = document.getElementById('new-en').value.trim();
    const hsk = document.getElementById('new-hsk').value;

    if (zh && en) {
        const exists = vocab.some(v => v.zh === zh);
        if (exists) {
            showMessage("This Chinese word already exists in your list!", true);
            return;
        }

        vocab.unshift({ zh, py, en, hsk: parseInt(hsk) });
        saveVocab();
        document.getElementById('new-zh').value = "";
        document.getElementById('new-py').value = "";
        document.getElementById('new-en').value = "";
        showMessage("Vocabulary added successfully!");
    } else {
        showMessage("Please fill in at least Chinese and English.", true);
    }
}

function deleteVocab(indexInFiltered) {
    const itemToDelete = filteredVocab[indexInFiltered];
    const mainIndex = vocab.indexOf(itemToDelete);

    if (mainIndex > -1) {
        vocab.splice(mainIndex, 1);
        saveVocab();
    }
}

let deleteConfirmTimeout;
function deleteAllVocab() {
    const btn = document.getElementById('delete-all-btn');
    if (btn.innerText === "⚠️ Confirm Delete All") {
        vocab = [];
        saveVocab();
        showMessage("All web vocabulary has been completely deleted.");
        btn.innerText = "🗑️ Delete All (Web)";
        clearTimeout(deleteConfirmTimeout);
    } else {
        btn.innerText = "⚠️ Confirm Delete All";
        deleteConfirmTimeout = setTimeout(() => {
            btn.innerText = "🗑️ Delete All (Web)";
        }, 3000);
    }
}

function importExcel(event, mode) {
    const file = event.target.files[0];
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(fileExt)) {
        showMessage("Invalid file type. Please upload a .xlsx, .xls, or .csv file.", true);
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const json = XLSX.utils.sheet_to_json(worksheet);

            if (!json || json.length === 0) {
                showMessage("The uploaded file is empty.", true);
                event.target.value = "";
                return;
            }

            const firstRowKeys = Object.keys(json[0]).map(k => k.toLowerCase());
            const hasZh = firstRowKeys.some(k => k.includes('chinese') || k === 'zh');
            const hasEn = firstRowKeys.some(k => k.includes('english') || k === 'en');

            if (!hasZh || !hasEn) {
                showMessage("Invalid format! Your file must contain 'Chinese' and 'English' columns.", true);
                event.target.value = "";
                return;
            }

            let extractedVocab = [];
            json.forEach(row => {
                const zhKey = Object.keys(row).find(k => k.toLowerCase().includes('chinese') || k.toLowerCase() === 'zh');
                const pyKey = Object.keys(row).find(k => k.toLowerCase().includes('pinyin') || k.toLowerCase() === 'py');
                const enKey = Object.keys(row).find(k => k.toLowerCase().includes('english') || k.toLowerCase() === 'en');
                const hskKey = Object.keys(row).find(k => k.toLowerCase().includes('hsk') || k.toLowerCase().includes('level'));

                if (row[zhKey] && row[enKey]) {
                    const zhVal = String(row[zhKey]).trim();
                    const enVal = String(row[enKey]).trim();
                    const pyVal = row[pyKey] ? String(row[pyKey]).trim() : "";

                    let hskLevel = 1;
                    if (row[hskKey]) {
                        const parsedHsk = parseInt(String(row[hskKey]).replace(/\D/g, ''));
                        if (!isNaN(parsedHsk)) hskLevel = parsedHsk;
                    }

                    extractedVocab.push({
                        zh: zhVal,
                        py: pyVal,
                        en: enVal,
                        hsk: hskLevel
                    });
                }
            });

            if (extractedVocab.length === 0) {
                showMessage("No valid vocabulary words found in the file.", true);
                event.target.value = "";
                return;
            }

            if (mode === 'sync-to-excel') {
                let addedCount = 0;
                vocab.forEach(webItem => {
                    const existsIndex = extractedVocab.findIndex(v => v.zh === webItem.zh);
                    if (existsIndex === -1) {
                        extractedVocab.unshift(webItem);
                        addedCount++;
                    } else {
                        extractedVocab[existsIndex].py = webItem.py || extractedVocab[existsIndex].py;
                        extractedVocab[existsIndex].en = webItem.en;
                        extractedVocab[existsIndex].hsk = webItem.hsk;
                    }
                });

                const exportData = extractedVocab.map(v => ({
                    Chinese: v.zh,
                    Pinyin: v.py,
                    English: v.en,
                    HSK: v.hsk
                }));

                const newWorksheet = XLSX.utils.json_to_sheet(exportData);
                const newWorkbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Vocabulary");
                XLSX.writeFile(newWorkbook, "Synced_" + file.name);

                showMessage(`Synced! Web list merged to Excel. Downloaded updated file with ${addedCount} new words.`);
                event.target.value = "";
                return;
            } else if (mode === 'merge') {
                let addedCount = 0;
                extractedVocab.forEach(newItem => {
                    const exists = vocab.some(v => v.zh === newItem.zh);
                    if (!exists) {
                        vocab.unshift(newItem);
                        addedCount++;
                    }
                });
                showMessage(`Merged successfully! Added ${addedCount} new words (ignored duplicates).`);
            }

            document.getElementById('hsk-filter').value = 'All';
            saveVocab();
            event.target.value = "";

        } catch (error) {
            showMessage("Error reading file. Make sure it's a valid Excel or CSV format.", true);
            event.target.value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}

function exportExcel() {
    if (filteredVocab.length === 0) {
        showMessage("No vocabulary to export.", true);
        return;
    }
    const exportData = filteredVocab.map(v => ({
        Chinese: v.zh,
        Pinyin: v.py,
        English: v.en,
        HSK: v.hsk
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");

    XLSX.writeFile(workbook, "HSK_Chinese_Vocab.xlsx");
}

// Initialize App
applyFilter();
