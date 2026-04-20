import { state, saveScore, updateWordStats } from './store.js';

export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function loadQuiz() {
    if (state.filteredVocab.length < 2) return;
    document.getElementById("next-quiz-btn").style.display = "none";

    let pool = [...state.filteredVocab];
    pool.sort((a, b) => {
        const scoreA = (a.wrongCount || 0) * 2 - (a.correctCount || 0) + Math.random() * 5;
        const scoreB = (b.wrongCount || 0) * 2 - (b.correctCount || 0) + Math.random() * 5;
        return scoreB - scoreA;
    });

    const maxIndex = Math.min(5, pool.length);
    const qIndex = Math.floor(Math.random() * maxIndex);
    const question = pool[qIndex];
    state.currentQuizAnswer = question.en;

    document.getElementById("quiz-zh").innerText = question.zh;

    let options = [question.en];

    let sameHskOther = state.filteredVocab.filter(v => v.hsk === question.hsk && v.en !== question.en).map(v => v.en);
    let allOther = state.filteredVocab.filter(v => v.en !== question.en).map(v => v.en);

    const numOptions = Math.min(4, state.filteredVocab.length);
    let attempts = 0;

    while (options.length < numOptions && attempts < 50) {
        let optionsPool = (sameHskOther.length >= numOptions - 1) ? sameHskOther : allOther;
        let randomOpt = optionsPool[Math.floor(Math.random() * optionsPool.length)];
        if (!options.includes(randomOpt)) {
            options.push(randomOpt);
        }
        attempts++;
    }
    options = shuffle(options);

    const grid = document.getElementById("options-grid");
    grid.innerHTML = "";
    options.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(btn, opt, question);
        grid.appendChild(btn);
    });
}

export function checkAnswer(btn, selected, questionObj) {
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach((b) => (b.disabled = true));

    if (selected === state.currentQuizAnswer) {
        btn.classList.add("correct");
        saveScore(10);
        document.getElementById("score-val").innerText = state.score;
        updateWordStats(questionObj.zh, true);
        playFeedback(true);
    } else {
        btn.classList.add("wrong");
        allBtns.forEach((b) => {
            if (b.innerText === state.currentQuizAnswer) {
                b.classList.add("correct");
            }
        });
        saveScore(-2); // Penalty for wrong answer to make persistent score interesting
        document.getElementById("score-val").innerText = state.score;
        updateWordStats(questionObj.zh, false);
        playFeedback(false);
    }

    document.getElementById("next-quiz-btn").style.display = "inline-block";
}

export function playFeedback(isCorrect) {
    const utterance = new SpeechSynthesisUtterance(isCorrect ? "Very good!" : "Try again next time.");
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
}
