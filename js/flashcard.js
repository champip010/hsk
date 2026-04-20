import { state } from './store.js';

export function loadFlashcard() {
    const card = document.getElementById("flashcard");
    card.classList.remove("is-flipped");

    setTimeout(() => {
        const zhElem = document.getElementById("fc-zh");
        const pyElem = document.getElementById("fc-py");
        const enElem = document.getElementById("fc-en");
        let srsLabel = document.getElementById("srs-label");

        if (!srsLabel) {
            srsLabel = document.createElement("p");
            srsLabel.id = "srs-label";
            srsLabel.style.cssText = "font-size: 0.9rem; color: #ff5252; position: absolute; top: 10px; right: 15px; margin: 0; font-weight: bold;";
            document.querySelector(".card-front").appendChild(srsLabel);
        }

        if (state.filteredVocab.length === 0) {
            zhElem.innerText = "Empty";
            pyElem.innerText = "-";
            enElem.innerText = "No words for this filter.";
            enElem.style.fontSize = "2.5rem";
            zhElem.style.fontSize = "5rem";
            srsLabel.innerText = "";
            return;
        }

        if (state.currentCardIndex >= state.filteredVocab.length) state.currentCardIndex = 0;

        const currentWord = state.filteredVocab[state.currentCardIndex];
        const zhText = currentWord.zh;
        const pyText = currentWord.py;
        const enText = currentWord.en;

        zhElem.innerText = zhText;
        pyElem.innerText = pyText;
        enElem.innerText = enText;

        const wCount = parseInt(currentWord.wrongCount) || 0;
        const cCount = parseInt(currentWord.correctCount) || 0;
        
        if (wCount > cCount) {
            srsLabel.innerText = "⭐ Focus Word";
        } else if (cCount > wCount + 2) {
            srsLabel.innerText = "✅ Mastered";
            srsLabel.style.color = "#2ecc71";
        } else {
            srsLabel.innerText = "";
            srsLabel.style.color = "#ff5252";
        }

        if (zhText.length > 8) {
            zhElem.style.fontSize = "2.5rem";
        } else if (zhText.length > 4) {
            zhElem.style.fontSize = "3.5rem";
        } else {
            zhElem.style.fontSize = "5rem";
        }

        const hidePinyin = document.getElementById("hide-pinyin-toggle")?.checked;
        if (hidePinyin) {
            pyElem.style.visibility = "hidden";
        } else {
            pyElem.style.visibility = "visible";
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

export function flipCard() {
    if (state.filteredVocab.length > 0) {
        const card = document.getElementById("flashcard");
        card.classList.toggle("is-flipped");

        const pyElem = document.getElementById("fc-py");
        if (document.getElementById("hide-pinyin-toggle")?.checked) {
            if (card.classList.contains("is-flipped")) {
                pyElem.style.visibility = "visible";
            } else {
                pyElem.style.visibility = "hidden";
            }
        }
    }
}

export function togglePinyinVisibility() {
    const hidePinyin = document.getElementById("hide-pinyin-toggle").checked;
    const pyElem = document.getElementById("fc-py");
    const card = document.getElementById("flashcard");
    if (hidePinyin && !card.classList.contains("is-flipped")) {
        pyElem.style.visibility = "hidden";
    } else {
        pyElem.style.visibility = "visible";
    }
}

export function nextCard() {
    if (state.filteredVocab.length === 0) return;
    state.currentCardIndex = (state.currentCardIndex + 1) % state.filteredVocab.length;
    loadFlashcard();
}

export function prevCard() {
    if (state.filteredVocab.length === 0) return;
    state.currentCardIndex = (state.currentCardIndex - 1 + state.filteredVocab.length) % state.filteredVocab.length;
    loadFlashcard();
}

export function playAudio() {
    if (state.filteredVocab.length === 0) return;
    const text = state.filteredVocab[state.currentCardIndex].zh;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

export function randomizeVocab() {
    if (state.filteredVocab.length === 0) return;

    let array = [...state.filteredVocab];
    array.sort((a, b) => {
        const scoreA = (a.wrongCount || 0) - (a.correctCount || 0) + Math.random() * 5;
        const scoreB = (b.wrongCount || 0) - (b.correctCount || 0) + Math.random() * 5;
        return scoreB - scoreA;
    });

    state.filteredVocab = array;
    state.currentCardIndex = 0;
    loadFlashcard();
}

// Setup touch swipe listener once
export function setupSwipeListener() {
    let touchStartX = 0;
    let touchStartY = 0;
    const SWIPE_THRESHOLD = 50;

    const container = document.getElementById("learn-section");
    if (!container) return;

    container.addEventListener(
        "touchstart",
        function (e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        },
        { passive: true },
    );

    container.addEventListener(
        "touchend",
        function (e) {
            const dx = e.changedTouches[0].screenX - touchStartX;
            const dy = e.changedTouches[0].screenY - touchStartY;

            if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;

            if (dx < 0) {
                nextCard();
            } else {
                prevCard();
            }
        },
        { passive: true },
    );
}
