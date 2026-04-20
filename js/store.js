export const state = {
    vocab: [],
    filteredVocab: [],
    currentCardIndex: 0,
    score: parseInt(localStorage.getItem("hsk_score")) || 0,
    currentMode: "learn",
    currentQuizAnswer: ""
};

export function saveVocab() {
    try {
        localStorage.setItem("HSK_Chinese_Vocab", JSON.stringify(state.vocab));
    } catch (e) {
        console.warn("Vocab too large for localStorage, keeping in session memory", e);
    }
}

export function saveScore(points) {
    state.score += points;
    localStorage.setItem("hsk_score", state.score);
}

export function updateWordStats(zh, isCorrect) {
    const word = state.vocab.find(v => v.zh === zh);
    if (word) {
        if (word.correctCount === undefined) word.correctCount = 0;
        if (word.wrongCount === undefined) word.wrongCount = 0;
        
        if (isCorrect) {
            word.correctCount++;
            // SRS Logic: gradually reduce wrong penalty when they get it right
            if (word.wrongCount > 0) word.wrongCount--; 
        } else {
            word.wrongCount++;
        }
        saveVocab();
    }
}

export async function initStorage(onReadyCallback) {
    let storedVocab = [];
    try {
        const stored = localStorage.getItem("HSK_Chinese_Vocab");
        if (stored) {
            storedVocab = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Local storage load failed", e);
    }

    if (storedVocab && storedVocab.length > 0) {
        state.vocab = storedVocab;
        onReadyCallback();
    } else {
        const zhElem = document.getElementById("fc-zh");
        const enElem = document.getElementById("fc-en");
        if (zhElem) zhElem.innerText = "Loading...";
        if (enElem) enElem.innerText = "Fetching Complete HSK List ⌛";

        try {
            const response = await fetch("vocabs/Complete_HSK_1_to_9_Vocabulary.xlsx");
            const arrayBuffer = await response.arrayBuffer();
            const data = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            let extractedVocab = [];
            json.forEach((row) => {
                const zhKey = Object.keys(row).find((k) => k.toLowerCase().includes("chinese") || k.toLowerCase() === "zh" || k.toLowerCase() === "hanzi");
                const pyKey = Object.keys(row).find((k) => k.toLowerCase().includes("pinyin") || k.toLowerCase() === "py");
                const enKey = Object.keys(row).find((k) => k.toLowerCase().includes("english") || k.toLowerCase() === "en" || k.toLowerCase() === "meaning");
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

            if (extractedVocab.length > 0) {
                state.vocab = extractedVocab;
                saveVocab();
            }
        } catch (e) {
            console.error("Failed to load default vocab Excel:", e);
        }
        onReadyCallback();
    }
}
