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
        window.location.href = '/onboarding?website=' + encodeURIComponent(website);
    } else {
        window.location.href = '/onboarding';
    }
}
window.trainAgent = trainAgent;

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
// 5b. Section Two - Tab Switching for "What Does Your AI Receptionist Do?"
// ==========================================================================

const sectionTwoTabs = document.querySelectorAll('.section-two .tab');
const featuresPanels = document.querySelectorAll('.section-two .features-panel');

sectionTwoTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.dataset.tab;

        // Update active tab
        sectionTwoTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Update active panel
        featuresPanels.forEach(panel => {
            if (panel.dataset.panel === tabId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    });
});

// ==========================================================================
// 6. Roadmap - Scroll-driven Line & Step Reveal
// ==========================================================================

const roadmapSection = document.querySelector('.roadmap');
const roadmapLine = document.querySelector('.roadmap-line');
const roadmapStart = document.querySelector('.roadmap-start');
const roadmapSteps = document.querySelectorAll('.roadmap-step');
const roadmapMarkers = document.querySelectorAll('.roadmap-marker');

if (roadmapSection && roadmapLine) {
    let roadmapTicking = false;

    function updateRoadmap() {
        const viewportH = window.innerHeight;
        const triggerPoint = viewportH * 0.6;

        // Line starts from bottom of the start box
        const startBox = roadmapStart.getBoundingClientRect();
        const lineOriginY = startBox.bottom;

        // How far the line should draw
        const drawn = triggerPoint - lineOriginY;
        const maxHeight = roadmapSection.offsetHeight - 18; // minus start box height
        const lineHeight = Math.max(0, Math.min(drawn, maxHeight));

        roadmapLine.style.height = lineHeight + 'px';

        // The absolute bottom of the drawn line in viewport coords
        const lineBottomY = lineOriginY + lineHeight;

        // Activate steps when line reaches their marker center
        roadmapSteps.forEach(step => {
            const marker = step.querySelector('.roadmap-number');
            if (!marker) return;
            const markerRect = marker.getBoundingClientRect();
            const markerCenter = markerRect.top + markerRect.height / 2;

            if (lineBottomY >= markerCenter) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (!roadmapTicking) {
            requestAnimationFrame(() => {
                updateRoadmap();
                roadmapTicking = false;
            });
            roadmapTicking = true;
        }
    }, { passive: true });

    // Animate CTA entrance
    const roadmapCta = document.querySelector('.roadmap-cta');
    if (roadmapCta) {
        const ctaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    ctaObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        ctaObserver.observe(roadmapCta);
    }

    updateRoadmap();
}

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

document.querySelectorAll('a[href="/onboarding"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = '/onboarding';
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

// ==========================================================================
// 10. Tool Logo Carousel - cycles through integration logos
// ==========================================================================

(function() {
    const items = document.querySelectorAll('.tool-carousel-item');
    if (!items.length) return;

    let current = 0;

    setInterval(function() {
        var next = (current + 1) % items.length;
        items[current].classList.remove('active');
        items[current].classList.add('exiting');
        setTimeout(function() {
            items[current === 0 ? items.length - 1 : current - 1].classList.remove('exiting');
        }, 400);
        items[next].classList.add('active');
        current = next;
    }, 2000);
})();
