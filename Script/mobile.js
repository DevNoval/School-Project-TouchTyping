/* ============================ mobile-script.js (Mobile Fix) ============================ */

/* * Keterangan: 
 * Menggantikan event listener standar dengan logika yang dioptimalkan 
 * untuk keyboard virtual (Android/iOS).
 */

// 1. Hapus event listener desktop yang mungkin konflik
if (typeof onType === "function") typingInput.removeEventListener('input', onType);
if (typeof onKeyDown === "function") typingInput.removeEventListener('keydown', onKeyDown);

// Variabel pelacak panjang teks untuk menghitung keystroke di HP
let lastValueLength = 0;

/* ---------- Handler Utama (Pengganti onType) ---------- */
function onMobileType(e) {
    let value = typingInput.value;
    const target = STATE.wordsList[STATE.currentIndex] || '';

    // Mulai timer jika belum mulai
    if (!STATE.started && value.length > 0) startTimer();

    // --- Logika Deteksi Spasi (Word Submission) ---
    // Cek apakah karakter terakhir adalah spasi
    if (value.length > 0 && value.slice(-1) === ' ') {
        const typed = value.trim(); 
        
        // Panggil handler spasi
        handleSpaceMobile(typed);
        
        // Update pelacak panjang setelah manipulasi di handleSpaceMobile
        lastValueLength = typingInput.value.length;
        return; 
    }

    // --- Logika Hitung Keystroke (WPM/Akurasi) ---
    if (value.length > lastValueLength) {
        // User mengetik karakter baru
        STATE.totalKeystrokes++; 
        
        const inputIndex = value.length - 1;
        const lastChar = value[inputIndex];
        const correctChar = target[inputIndex];

        // Hitung correct keystroke jika cocok
        if (lastChar === correctChar) {
            STATE.correctKeystrokes++;
            playSound(typeSound);
        } else {
            playSound(errorSound);
        }
    } else if (value.length < lastValueLength) {
        // User menghapus (Backspace)
        STATE.totalKeystrokes++; 
        // Kurangi correctKeystrokes jika yang dihapus adalah karakter benar
        const deletedIndex = lastValueLength - 1;
        if (target[deletedIndex] && lastValueLength <= target.length + 1) {
             // Logika sederhana: anggap pengurangan poin jika menghapus
             STATE.correctKeystrokes = Math.max(0, STATE.correctKeystrokes - 1);
        }
        playSound(typeSound);
    }
    
    // Simpan panjang saat ini untuk event berikutnya
    lastValueLength = value.length;

    // Update tampilan huruf (warna merah/hijau/kuning)
    updateDisplay(value);
}

/* ---------- Handler Spasi Mobile ---------- */
function handleSpaceMobile(typed) {
    const target = STATE.wordsList[STATE.currentIndex] || "";
    const curEl = document.querySelector(`.word[data-index="${STATE.currentIndex}"]`);
    
    // Jika input hanya spasi kosong, reset
    if (typed.length === 0) {
        typingInput.value = "";
        typingInput.classList.remove("input-wrong");
        return;
    }

    const isCorrect = typed === target;

    if (isCorrect) {
        // === KATA BENAR ===
        STATE.correctKeystrokes++; // Poin untuk Spasi
        
        // Ubah warna kata jadi hijau (correct)
        if (curEl) {
            curEl.classList.remove("current", "wrong");
            curEl.classList.add("correct");
            curEl.querySelectorAll("span").forEach(span => {
                // Pastikan warna hijau diterapkan
                if (!span.classList.contains('caret')) span.style.color = "var(--success)";
            });
        }
        
        STATE.currentIndex++; // Pindah ke kata selanjutnya
        typingInput.value = ""; // Bersihkan input
        
    } else {
        // === KATA SALAH ===
        playSound(errorSound);
        
        // 1. Biarkan Spasi Terlihat!
        // Ini kuncinya: kita tambahkan spasi kembali ke input agar user melihatnya
        typingInput.value = typed + " "; 
        
        // 2. Tandai kata visual di atas sebagai salah
        if (curEl) curEl.classList.add("wrong");
        
        // 3. Beri feedback visual pada input box
        typingInput.classList.add("input-wrong");
        
        // 4. Penalti Keystroke
        STATE.totalKeystrokes++; 
        
        // KITA TIDAK PINDAH KATA (STATE.currentIndex tetap)
    }
    
    // Cek apakah tes selesai
    if (STATE.mode !== "timer" && STATE.currentIndex >= STATE.wordsList.length) {
        stopTimer();
        typingInput.blur();
        typingInput.disabled = true;
    } else {
         if (STATE.mode === "timer" && isCorrect) {
            // Render ulang hanya jika kata benar (untuk efek slide baris)
            renderWords(true); 
         } 
         // else: tidak perlu render ulang jika salah, cukup update style
    }

    // Update UI Statistik
    updateCaret();
    updateAccuracy(); 
    updateWPM(); 
    updateFooter();
    
    // Pastikan scroll mengikuti caret jika perlu
    if (!isCorrect) updateDisplay(typingInput.value); 
}

/* ---------- Pasang Event Listener ---------- */
// Gunakan event 'input' yang paling stabil di Android/iOS
typingInput.addEventListener('input', onMobileType);

// Cegah tombol Enter (Go/Search) mengirim form
typingInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") e.preventDefault();
});
