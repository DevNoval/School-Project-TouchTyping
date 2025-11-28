/* ============================ mobile-script.js ============================ */

/* * Keterangan: 
 * Skrip ini menggantikan logika input dari script.js agar stabil pada 
 * perangkat mobile dengan mengandalkan event 'input' dan mendeteksi spasi.
 */

// Hapus event listener lama dari script.js
typingInput.removeEventListener('input', onType);
typingInput.removeEventListener('keydown', onKeyDown);

// Variabel untuk membantu Keystroke Counting pada mobile
let lastValueLength = 0;

/* ---------- Mobile-Friendly Input Handler (Override for onType) ---------- */
function onMobileType(e) {
    let value = typingInput.value;
    const target = STATE.wordsList[STATE.currentIndex] || '';

    if (!STATE.started && value.length) startTimer();

    // 1. Keystroke Counting yang lebih baik untuk mobile
    if (value.length > lastValueLength) {
        // Asumsi: Penambahan karakter (ketik)
        STATE.totalKeystrokes++; 
        
        const lastChar = value.slice(-1);
        const correctChar = target[value.length - 1];

        // Jika karakter terakhir benar (dan bukan spasi)
        if (lastChar !== ' ' && lastChar === correctChar) {
            STATE.correctKeystrokes++;
            playSound(typeSound);
        } else if (lastChar !== ' ' && lastChar !== correctChar) {
            // Jika salah
            playSound(errorSound);
        }
    } else if (value.length < lastValueLength) {
        // Backspace
        STATE.totalKeystrokes++; 
        // Logika sederhana untuk mengurangi correctKeystrokes (jika menghapus karakter benar)
        const deletedChar = target[lastValueLength - 1];
        if (deletedChar && typingInput.value[lastValueLength - 1] === deletedChar) {
             STATE.correctKeystrokes--;
        }
        playSound(typeSound);
    }
    lastValueLength = value.length;

    // 2. Spacebar Handling (Word Submission)
    if (value.endsWith(' ')) {
        // Pemicu kata selesai (handleSpaceMobile)
        const typed = value.trim();
        handleSpaceMobile(typed);
        return;
    }
    
    // 3. Update Display
    updateDisplay(value);
}

/* ---------- Mobile-Friendly Space Handler (Pengganti handleSpace) ---------- */
function handleSpaceMobile(typed) {
    const target = STATE.wordsList[STATE.currentIndex] || "";
    const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
    
    if (!typed.length) { 
        typingInput.classList.remove("input-wrong");
        typingInput.value = "";
        lastValueLength = 0;
        return;
    }

    const isCorrect = typed === target;

    if (isCorrect) {
        STATE.correctKeystrokes++;
        if (curEl) {
            curEl.classList.remove("current", "wrong");
            curEl.classList.add("correct");
            curEl.querySelectorAll("span").forEach(span => {
                if (!span.classList.contains('caret')) span.style.color = "var(--success)";
            });
        }
        STATE.currentIndex++;
        typingInput.value = "";
        lastValueLength = 0; 
    } else {
        // Jika salah: Tandai salah, hitung 1 keystroke hukuman, dan pindah ke kata berikutnya.
        playSound(errorSound);

        typingInput.value = typed;
        lastValueLength = typed.length;

        if (curEl) curEl.classList.add("wrong");
        STATE.totalKeystrokes++; 
        typingInput.classList.add("input-wrong"); 
    }
    
    // Pindah ke kata berikutnya
    if (STATE.mode !== "timer" && STATE.currentIndex >= STATE.wordsList.length) {
        stopTimer();
        typingInput.blur();
        typingInput.disabled = true;
    } else {
         if (STATE.mode === "timer" && isCorrect) {
            renderWords(true); 
         } else {
            document.querySelectorAll(".word").forEach(word => word.classList.toggle("current", +word.dataset.index === STATE.currentIndex));
         }
    }

    updateCaret();
    updateAccuracy(); 
    updateWPM(); 
    updateFooter();
    typingInput.focus();
}

/* ---------- Re-bind Event Listener Baru ---------- */
typingInput.addEventListener('input', onMobileType);

// Tambahkan event keydown minimal untuk mencegah pengiriman form pada Enter
typingInput.addEventListener('keydown', (e) => {
    // Mencegah keyboard virtual mengirim form saat tombol Enter/Go ditekan
    if (e.key === "Enter") {
        e.preventDefault();
    }
});