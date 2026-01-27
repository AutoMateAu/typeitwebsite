/**
 * Entry AI Receptionist - Main JavaScript
 * ========================================
 */

// ==========================================================================
// 1. Train Agent CTA - Redirect to onboarding with website parameter
// ==========================================================================

function trainAgent() {
    const websiteInput = document.getElementById('heroWebsiteInput');
    const website = websiteInput.value.trim();
    if (website) {
        window.location.href = 'onboarding.html?website=' + encodeURIComponent(website);
    } else {
        window.location.href = 'onboarding.html';
    }
}

// ==========================================================================
// 2. Header Scroll Behavior - Hide on scroll down, show on scroll up
// ==========================================================================

let lastScrollY = window.scrollY;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > lastScrollY && window.scrollY > 100) {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }
    lastScrollY = window.scrollY;
});

// ==========================================================================
// 3. Industry Cards Navigation
// ==========================================================================

const industryCards = document.querySelector('.industry-cards');
const navArrows = document.querySelectorAll('.nav-arrow');

if (navArrows.length >= 2) {
    navArrows[0].addEventListener('click', () => {
        industryCards.scrollBy({ left: -400, behavior: 'smooth' });
    });

    navArrows[1].addEventListener('click', () => {
        industryCards.scrollBy({ left: 400, behavior: 'smooth' });
    });
}

// ==========================================================================
// 4. Audio Player / Waveform Animation for Voice Showcase
// ==========================================================================

function toggleAudioPlayback(button) {
    const audioPlayer = button.closest('.audio-player');
    const playIcon = button.querySelector('.play-icon');
    const pauseIcon = button.querySelector('.pause-icon');

    if (audioPlayer.classList.contains('playing')) {
        // Stop playing
        audioPlayer.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    } else {
        // Stop any other playing audio first
        document.querySelectorAll('.audio-player.playing').forEach(player => {
            player.classList.remove('playing');
            player.querySelector('.play-icon').style.display = 'block';
            player.querySelector('.pause-icon').style.display = 'none';
        });

        // Start playing this one
        audioPlayer.classList.add('playing');
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
}

// Add click handlers to all play buttons
document.querySelectorAll('.play-pause-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        toggleAudioPlayback(this);
    });
});

// ==========================================================================
// 5. Features Showcase - Clickable Items
// ==========================================================================

document.querySelectorAll('.feature-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.feature-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

// ==========================================================================
// 6. Never Lose Business - Scroll-driven Animation
// ==========================================================================

const neverLoseSection = document.querySelector('.never-lose-section');
const neverLoseItems = document.querySelectorAll('.never-lose-item');
const chatWindows = document.querySelectorAll('.chat-window');
const progressBar = document.querySelector('.scroll-progress-bar');
let currentStep = 1;

function setActiveStep(step) {
    if (step === currentStep) return;

    const oldStep = currentStep;
    currentStep = step;

    // Update items
    neverLoseItems.forEach((item, index) => {
        const itemStep = index + 1;
        if (itemStep === step) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update chat windows with direction-aware animation
    chatWindows.forEach(window => {
        const windowStep = parseInt(window.dataset.chat);
        if (windowStep === step) {
            window.classList.remove('exiting');
            window.classList.add('active');
        } else if (windowStep === oldStep) {
            window.classList.add('exiting');
            window.classList.remove('active');
            // Remove exiting class after animation
            setTimeout(() => {
                window.classList.remove('exiting');
            }, 500);
        } else {
            window.classList.remove('active', 'exiting');
        }
    });

    // Update progress bar
    const progress = ((step - 1) / 2) * 100 + 33;
    if (progressBar) {
        progressBar.style.height = `${Math.min(progress, 100)}%`;
    }
}

function handleScroll() {
    if (!neverLoseSection) return;

    const rect = neverLoseSection.getBoundingClientRect();
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    const viewportHeight = window.innerHeight;

    // Calculate scroll progress within the section (0 to 1)
    const scrollProgress = Math.max(0, Math.min(1, -sectionTop / (sectionHeight - viewportHeight)));

    // Determine which step based on scroll progress
    let newStep;
    if (scrollProgress < 0.33) {
        newStep = 1;
    } else if (scrollProgress < 0.66) {
        newStep = 2;
    } else {
        newStep = 3;
    }

    setActiveStep(newStep);
}

// Throttled scroll handler for performance
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
    }, 16); // ~60fps
}, { passive: true });

// Initial check
handleScroll();

// Click handlers still work for direct interaction
neverLoseItems.forEach((item, index) => {
    item.addEventListener('click', function() {
        setActiveStep(index + 1);
    });
});

// ==========================================================================
// 7. Stat Cards - Fade-in Animation with Counting
// ==========================================================================

const statCards = document.querySelectorAll('.stat-card');
const statNumbers = document.querySelectorAll('.stat-number');

function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateCount(element, target, suffix, duration) {
    const start = Math.floor(target * 0.6);
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutExpo(progress);
        const current = Math.floor(start + (target - start) * easedProgress);

        element.textContent = current + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target + suffix;
        }
    }

    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            statCards.forEach(card => card.classList.add('visible'));

            // Start counting after cards appear
            setTimeout(() => {
                statNumbers.forEach(num => {
                    const target = parseInt(num.dataset.target);
                    const suffix = num.dataset.suffix || '';
                    animateCount(num, target, suffix, 2000);
                });
            }, 400);

            statsObserver.disconnect();
        }
    });
}, { threshold: 0.3 });

const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) {
    statsObserver.observe(statsGrid);
}

// ==========================================================================
// 8. Page Transition for Download Button
// ==========================================================================

document.querySelectorAll('a[href="onboarding.html"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'onboarding.html';
        }, 200);
    });
});

// ==========================================================================
// 9. Typing Animation for Hero Input Placeholder
// ==========================================================================

(function() {
    const heroInput = document.getElementById('heroWebsiteInput');
    if (!heroInput) return;

    const phrases = ['Enter your website URL', 'https://yourwebsite.com'];
    let phraseIndex = 0;
    let currentIndex = 0;
    let isTyping = true;
    let isPaused = false;

    function updatePlaceholder() {
        if (heroInput === document.activeElement || heroInput.value) {
            return;
        }

        if (isPaused) return;

        const currentPhrase = phrases[phraseIndex];

        if (isTyping) {
            currentIndex++;
            heroInput.placeholder = currentPhrase.slice(0, currentIndex);
            if (currentIndex === currentPhrase.length) {
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                    isTyping = false;
                }, 1500);
            }
        } else {
            currentIndex--;
            heroInput.placeholder = currentPhrase.slice(0, currentIndex);
            if (currentIndex === 0) {
                phraseIndex = (phraseIndex + 1) % phrases.length;
                isPaused = true;
                setTimeout(() => {
                    isPaused = false;
                    isTyping = true;
                }, 300);
            }
        }
    }

    setInterval(updatePlaceholder, 50);

    heroInput.addEventListener('focus', function() {
        this.placeholder = '';
    });

    heroInput.addEventListener('blur', function() {
        if (!this.value) {
            currentIndex = 0;
            isTyping = true;
            isPaused = false;
        }
    });
})();
