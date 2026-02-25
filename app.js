// Main application logic

let dataParser;
let renderer;

// Voice recognition and speech synthesis
let recognition = null;
let voices = [];
let speechEnabled = false;
let voiceModeActive = false;

// Load voices
function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    console.log('Loaded voices:', voices.length);
    if (voices.length > 0) {
        console.log('First voice:', voices[0].name, voices[0].lang);
        // Log English voices
        const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
        console.log('English voices available:', englishVoices.length);
    }
}

// Get preferred English voice
function getPreferredVoice() {
    // Try to find an English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en-'));
    if (englishVoice) {
        return englishVoice;
    }

    // Fall back to first voice
    if (voices.length > 0) {
        return voices[0];
    }

    return null;
}

// Prime speech synthesis with a user gesture to enable it for later use
function enableSpeechSynthesis() {
    if (speechEnabled) return;

    // Speak a silent utterance to prime the API
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);

    speechEnabled = true;
    console.log('Speech synthesis enabled');
}

// Wait for voices to load
if (window.speechSynthesis) {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
}

function getVoiceTextParts(holdNumber, holdInfo, relativePos) {
    const fields = document.querySelectorAll('#voice-fields li');
    const parts = [];
    fields.forEach(li => {
        const checkbox = li.querySelector('input[type="checkbox"]');
        if (!checkbox.checked) return;
        switch (li.dataset.field) {
            case 'holdNumber': parts.push(`${holdNumber}`); break;
            case 'panel': parts.push(relativePos.panel); break;
            case 'grid': parts.push(relativePos.gridType); break;
            case 'column': parts.push(`${relativePos.columnText}..`); break;
            case 'row': parts.push(`${relativePos.rowText}.`); break;
            case 'angle': parts.push(holdInfo.angle); break;
        }
    });
    return parts;
}

function speakHoldInfo(holdNumber) {
    // Check if hold exists
    const holdInfo = dataParser.findHold(holdNumber);

    if (!holdInfo) {
        console.log('Hold not found, not speaking');
        return;
    }

    // Get relative position
    const relativePos = dataParser.getRelativePosition(holdInfo.row, holdInfo.column);

    // Build speech text from voice settings
    let textParts = getVoiceTextParts(holdNumber, holdInfo, relativePos);

    // Check against accepted grids
    const acceptedGrids = getAcceptedValues('grid-filters');
    if (!acceptedGrids.includes(relativePos.gridType)) {
        textParts = [`Wrong grid, got ${relativePos.gridType}`];
        console.log('Wrong grid, got', relativePos.gridType, 'accepted:', acceptedGrids);
    }

    // Check against accepted panels
    const acceptedPanels = getAcceptedValues('panel-filters');
    if (!acceptedPanels.includes(relativePos.panel)) {
        textParts = [`Wrong panel, got ${relativePos.panel}`];
        console.log('Wrong panel, got', relativePos.panel, 'accepted:', acceptedPanels);
    }

    const textToSpeak = textParts.join('. ') + '.';

    // Use Web Speech Synthesis API
    if ('speechSynthesis' in window) {
        // Stop recognition while speaking to avoid feedback loop
        if (recognition && voiceModeActive) {
            try {
                recognition.abort();
                console.log('Recognition stopped for speech output');
            } catch (e) {
                console.log('Could not stop recognition:', e.message);
            }
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);

        // Set preferred voice
        const voice = getPreferredVoice();
        if (voice) {
            utterance.voice = voice;
            console.log('Using voice:', voice.name, voice.lang);
        } else {
            console.warn('No voice available for speech');
        }

        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Add event listeners for debugging
        utterance.addEventListener('start', (e) => {
            console.log('Speech started');
        });

        utterance.addEventListener('end', (e) => {
            console.log('Speech finished');
            // Restart recognition after speaking
            if (voiceModeActive && recognition) {
                recognition.abort();
                setTimeout(() => {
                    try {
                        recognition.start();
                        console.log('Recognition restarted after speech');
                    } catch (e) {
                        console.log('Could not restart recognition:', e.message);
                    }
                }, 200);
            }
        });

        utterance.addEventListener('error', (e) => {
            console.error('Speech error:', e);
            // Restart recognition even on error
            if (voiceModeActive && recognition) {
                setTimeout(() => {
                    try {
                        recognition.abort();
                        recognition.start();
                        console.log('Recognition restarted after speech error');
                    } catch (e) {
                        console.log('Could not restart recognition:', e.message);
                    }
                }, 200);
            }
        });

        console.log('Speaking:', textToSpeak);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    } else {
        console.log('Speech synthesis not supported');
    }
}

function setupVoiceRecognition() {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.log('Speech recognition not supported in this browser');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript.toLowerCase().trim();

        console.log('Heard:', transcript);

        // Only process if the result is final
        if (result.isFinal) {
            // Remove all non-alphanumeric characters to handle speech like "hold 1 2 3 1" -> "hold1231" -> extract "1231"
            const normalized = transcript.replace(/[^a-z0-9]/gi, '');

            // Try to extract a number or alphanumeric code (like D226)
            const match = normalized.match(/([d])?(\d+)([a-z])?/i);

            if (match) {
                let holdNumber = '';

                // Check if there's a 'D' prefix
                if (match[1]) {
                    holdNumber = 'D';
                }

                // Add the number
                holdNumber += match[2];

                // Check if there's a letter suffix (like B in D229B)
                if (match[3]) {
                    holdNumber += match[3].toUpperCase();
                }

                console.log('Parsed hold number:', holdNumber);

                // Check if hold exists before updating input
                const holdInfo = dataParser.findHold(holdNumber);
                if (holdInfo) {
                    // Update input and trigger search
                    const searchInput = document.getElementById('hold-search');
                    searchInput.value = holdNumber;
                    handleSearch();

                    // Speak the information
                    speakHoldInfo(holdNumber);
                } else {
                    console.log('Hold not found, ignoring:', holdNumber);
                    // Restart recognition immediately so user can try again
                    if (voiceModeActive && recognition) {
                        setTimeout(() => {
                            try {
                                recognition.abort();
                                recognition.start();
                                console.log('Recognition restarted after hold not found');
                            } catch (e) {
                                console.log('Could not restart recognition:', e.message);
                            }
                        }, 100);
                    }
                }
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'aborted') {
            return;
        }
        // Restart recognition after other errors if voice mode is still active
        if (voiceModeActive && recognition) {
            recognition.abort();
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Recognition restarted after error:', event.error);
                } catch (e) {
                    console.log('Could not restart recognition after error:', e.message);
                }
            }, 200);
        }
    };

    recognition.onend = () => {
        console.log('Recognition ended');
        // Automatically restart recognition if voice mode is still active
        if (voiceModeActive && recognition) {
            setTimeout(() => {
                try {
                    recognition.start();
                    console.log('Recognition restarted after ending');
                } catch (e) {
                    console.log('Could not restart recognition after ending:', e.message);
                }
            }, 100);
        }
    };

    // Start recognition
    try {
        recognition.start();
        console.log('Voice recognition started');
    } catch (e) {
        console.error('Failed to start recognition:', e);
    }
}

// Initialize the application
async function init() {
    try {
        // Initialize data parser
        dataParser = new DataParser();
        await dataParser.loadData();

        // Initialize renderer
        renderer = new WallRenderer('wall-canvas', 'wall-image');
        await renderer.initialize();

        // Set up event listeners
        setupEventListeners();

        // Set up filter and voice output settings
        setupFilterSettings();
        setupVoiceSettings();

        // Set default hold and trigger search
        const searchInput = document.getElementById('hold-search');
        searchInput.value = '1350';
        handleSearch();

        // Voice recognition will be started manually via the "Start Voice Mode" button

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to load application. Please refresh the page.');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('hold-search');
    const clearBtn = document.getElementById('clear-btn');
    const voiceModeBtn = document.getElementById('voice-mode-btn');

    // Search on input
    searchInput.addEventListener('input', handleSearch);

    // Clear button
    clearBtn.addEventListener('click', clearSearch);

    // Voice mode button
    voiceModeBtn.addEventListener('click', () => {
        if (!voiceModeActive) {
            // Enable voice mode
            enableSpeechSynthesis();
            setupVoiceRecognition();
            voiceModeActive = true;
            voiceModeBtn.textContent = 'Stop Voice Mode';
            voiceModeBtn.style.backgroundColor = '#4CAF50';
            console.log('Voice mode activated');
        } else {
            // Disable voice mode
            if (recognition) {
                recognition.abort();
            }
            voiceModeActive = false;
            voiceModeBtn.textContent = 'Start Voice Mode';
            voiceModeBtn.style.backgroundColor = '';
            console.log('Voice mode deactivated');
        }
    });

    // Enter key
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// Filter settings: accepted panels and grids
const FILTER_SETTINGS_KEY = 'filterSettings';

function getAcceptedValues(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function setupFilterSettings() {
    loadFilterSettings();

    // Save on any checkbox change
    document.getElementById('panel-filters').addEventListener('change', saveFilterSettings);
    document.getElementById('grid-filters').addEventListener('change', saveFilterSettings);
}

function loadFilterSettings() {
    const saved = localStorage.getItem(FILTER_SETTINGS_KEY);
    if (!saved) return;

    try {
        const settings = JSON.parse(saved);
        ['panel-filters', 'grid-filters'].forEach(containerId => {
            const key = containerId === 'panel-filters' ? 'panels' : 'grids';
            const accepted = settings[key];
            if (!accepted) return;
            document.querySelectorAll(`#${containerId} input[type="checkbox"]`).forEach(cb => {
                cb.checked = accepted.includes(cb.value);
            });
        });
    } catch (e) {
        console.log('Could not load filter settings:', e.message);
    }
}

function saveFilterSettings() {
    const settings = {
        panels: getAcceptedValues('panel-filters'),
        grids: getAcceptedValues('grid-filters')
    };
    localStorage.setItem(FILTER_SETTINGS_KEY, JSON.stringify(settings));
}

// Voice settings: drag-and-drop reordering + localStorage persistence
const VOICE_SETTINGS_KEY = 'voiceSettings';

function setupVoiceSettings() {
    loadVoiceSettings();
    setupDragAndDrop();

    // Save on checkbox change
    document.getElementById('voice-fields').addEventListener('change', saveVoiceSettings);
}

function loadVoiceSettings() {
    const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
    if (!saved) return;

    try {
        const settings = JSON.parse(saved);
        const list = document.getElementById('voice-fields');
        const items = Array.from(list.querySelectorAll('li'));

        // Reorder DOM elements to match saved order
        settings.order.forEach(field => {
            const item = items.find(li => li.dataset.field === field);
            if (item) list.appendChild(item);
        });

        // Restore checkbox states
        list.querySelectorAll('li').forEach(li => {
            const checkbox = li.querySelector('input[type="checkbox"]');
            const enabled = settings.enabled[li.dataset.field];
            if (enabled !== undefined) {
                checkbox.checked = enabled;
            }
        });
    } catch (e) {
        console.log('Could not load voice settings:', e.message);
    }
}

function saveVoiceSettings() {
    const items = document.querySelectorAll('#voice-fields li');
    const order = [];
    const enabled = {};
    items.forEach(li => {
        order.push(li.dataset.field);
        enabled[li.dataset.field] = li.querySelector('input[type="checkbox"]').checked;
    });
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({ order, enabled }));
}

function setupDragAndDrop() {
    const list = document.getElementById('voice-fields');
    let draggedItem = null;

    list.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('li');
        if (!draggedItem) return;
        draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    list.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
        list.querySelectorAll('li').forEach(li => li.classList.remove('drag-over'));
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const target = e.target.closest('li');
        if (!target || target === draggedItem) return;

        // Clear all drag-over indicators
        list.querySelectorAll('li').forEach(li => li.classList.remove('drag-over'));
        target.classList.add('drag-over');
    });

    list.addEventListener('dragleave', (e) => {
        const target = e.target.closest('li');
        if (target) target.classList.remove('drag-over');
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('li');
        if (!target || !draggedItem || target === draggedItem) return;

        // Determine position: insert before or after target
        const items = Array.from(list.querySelectorAll('li'));
        const dragIdx = items.indexOf(draggedItem);
        const targetIdx = items.indexOf(target);

        if (dragIdx < targetIdx) {
            list.insertBefore(draggedItem, target.nextSibling);
        } else {
            list.insertBefore(draggedItem, target);
        }

        list.querySelectorAll('li').forEach(li => li.classList.remove('drag-over'));
        saveVoiceSettings();
    });
}

function handleSearch() {
    const searchInput = document.getElementById('hold-search');
    const holdNumber = searchInput.value.trim();

    // Clear previous displays
    clearDisplay();

    if (!holdNumber) {
        renderer.clear();
        return;
    }

    // Find the hold
    const holdInfo = dataParser.findHold(holdNumber);

    if (holdInfo) {
        // Display hold information
        displayHoldInfo(holdInfo);

        // Highlight on canvas
        renderer.highlightHold(holdInfo);
    } else {
        showError(`Hold "${holdNumber}" not found`);
        renderer.clear();
    }
}

function displayHoldInfo(holdInfo) {
    const panelDisplay = document.getElementById('panel-display');
    const gridDisplay = document.getElementById('grid-display');
    const columnDisplay = document.getElementById('column-display');
    const rowDisplay = document.getElementById('row-display');
    const angleDisplay = document.getElementById('angle-display');

    // Get relative position within the panel
    const relativePos = dataParser.getRelativePosition(holdInfo.row, holdInfo.column);

    panelDisplay.textContent = relativePos.panel;
    gridDisplay.textContent = relativePos.gridType;
    columnDisplay.textContent = relativePos.columnText;
    rowDisplay.textContent = relativePos.rowText;
    angleDisplay.textContent = holdInfo.angle;
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
}

function clearDisplay() {
    const elements = [
        'panel-display',
        'grid-display',
        'column-display',
        'row-display',
        'angle-display',
        'error-message'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
        }
    });
}

function clearSearch() {
    document.getElementById('hold-search').value = '';
    clearDisplay();
    renderer.clear();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
