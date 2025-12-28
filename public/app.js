// Configuration
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : '/api';

// State
let currentCode = '';

// ============================================
// AUTHENTICATION GATE
// ============================================

const authGate = document.getElementById('auth-gate');
const mainContent = document.getElementById('main-content');
const authCodeInput = document.getElementById('auth-code');
const authBtn = document.getElementById('auth-btn');
const authError = document.getElementById('auth-error');

// Check if already authenticated
const storedCode = sessionStorage.getItem('weddingAuthCode');
if (storedCode) {
    // Validate stored code
    validateAuthCode(storedCode, true);
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function hideError(element) {
    element.classList.add('hidden');
}

function setLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner"></span>';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
    }
}

async function validateAuthCode(code, silent = false) {
    if (!silent) setLoading(authBtn, true);

    try {
        const response = await fetch(`${API_URL}/validate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.valid) {
            // Authentication successful
            currentCode = code;
            sessionStorage.setItem('weddingAuthCode', code);

            // Hide auth gate and show content
            authGate.style.display = 'none';
            mainContent.classList.remove('hidden');
            mainContent.style.opacity = '0';
            setTimeout(() => {
                mainContent.style.opacity = '1';
            }, 50);

            // Update RSVP section
            document.getElementById('current-code-display').textContent = code;

            if (data.maxGuests) {
                updateGuestCountOptions(data.maxGuests);
            }

            // Pre-fill if already RSVP'd
            if (data.alreadyUsed && data.guest) {
                document.getElementById('guest-name').value = data.guest.name;
                const attendingValue = data.guest.attending === 1 ? 'yes' : data.guest.attending === 0 ? 'no' : null;
                if (attendingValue) {
                    document.querySelector(`input[name="attending"][value="${attendingValue}"]`).checked = true;
                }
                document.getElementById('guest-count').value = data.guest.guest_count || 1;
                showAlert('You\'ve already submitted an RSVP. You can update it below.', 'info');
            }

            // Initialize scroll animations
            initScrollAnimations();
        } else {
            if (!silent) {
                showError(authError, data.message || 'Invalid code. Please check your invitation and try again.');
            }
        }
    } catch (error) {
        console.error('Authentication error:', error);
        if (!silent) {
            showError(authError, error.message.includes('fetch') ? 'Unable to validate code. Please try again.' : error.message);
        }
    } finally {
        if (!silent) setLoading(authBtn, false);
    }
}

authBtn.addEventListener('click', () => {
    const code = authCodeInput.value.trim().toUpperCase();

    if (!code) {
        showError(authError, 'Please enter your RSVP code');
        return;
    }

    hideError(authError);
    validateAuthCode(code);
});

authCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        authBtn.click();
    }
});

authCodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
    hideError(authError);
});

// ============================================
// RSVP FUNCTIONALITY
// ============================================

const rsvpForm = document.getElementById('rsvp-form');
const submitRsvpBtn = document.getElementById('submit-rsvp-btn');
const rsvpAlert = document.getElementById('rsvp-alert');
const guestCountSection = document.getElementById('guest-count-section');
const maxGuestsNote = document.getElementById('max-guests-note');
const rsvpFormSection = document.getElementById('rsvp-form-section');
const successSection = document.getElementById('rsvp-success-section');

function showAlert(message, type = 'info') {
    rsvpAlert.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function updateGuestCountOptions(max) {
    const guestCountSelect = document.getElementById('guest-count');
    guestCountSelect.innerHTML = '';

    for (let i = 1; i <= max; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} Guest${i > 1 ? 's' : ''}`;
        guestCountSelect.appendChild(option);
    }

    maxGuestsNote.textContent = `Maximum ${max} guest${max > 1 ? 's' : ''} for this invitation`;
}

// Show/hide guest count based on attending status
document.querySelectorAll('input[name="attending"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'no') {
            guestCountSection.classList.add('hidden');
        } else {
            guestCountSection.classList.remove('hidden');
        }
    });
});

rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value.trim();
    const attending = document.querySelector('input[name="attending"]:checked')?.value;
    const guestCount = parseInt(document.getElementById('guest-count').value);
    const message = document.getElementById('guest-message').value.trim();

    if (!name || !attending) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    setLoading(submitRsvpBtn, true);
    rsvpAlert.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/rsvp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: currentCode,
                name,
                attending: attending === 'yes',
                guestCount: attending === 'yes' ? guestCount : 0,
                message
            })
        });

        const data = await response.json();

        if (data.success) {
            rsvpFormSection.classList.add('hidden');
            successSection.classList.remove('hidden');
            successSection.classList.add('slide-up');
        } else {
            showAlert(data.error || 'Failed to submit RSVP. Please try again.', 'error');
        }
    } catch (error) {
        console.error('RSVP submission error:', error);
        showAlert('Unable to submit RSVP. Please try again later.', 'error');
    } finally {
        setLoading(submitRsvpBtn, false);
    }
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
}

console.log('Wedding website loaded successfully! 💒');
