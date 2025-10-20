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

function speakHoldInfo(holdNumber) {
    // Check if hold exists
    const holdInfo = dataParser.findHold(holdNumber);

    if (!holdInfo) {
        console.log('Hold not found, not speaking');
        return;
    }

    // Get relative position
    const relativePos = dataParser.getRelativePosition(holdInfo.row, holdInfo.column);

    // Build the speech text (including hold number, excluding angle)
    const textParts = [
        `Hold ${holdNumber}`,
        `${relativePos.panel} Panel`,
        `${relativePos.gridType}..`,
        `${relativePos.columnText}..`,
        `${relativePos.rowText}.`
    ];

    const textToSpeak = textParts.join('. ') + '.';

    // Use Web Speech Synthesis API
    if ('speechSynthesis' in window) {
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

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Add event listeners for debugging
        utterance.addEventListener('start', (e) => {
            console.log('Speech started');
        });

        utterance.addEventListener('end', (e) => {
            console.log('Speech finished');
        });

        utterance.addEventListener('error', (e) => {
            console.error('Speech error:', e);
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
            // Try to extract a number or alphanumeric code (like D226)
            const match = transcript.match(/\b([d]\s*)?(\d+)([a-z])?\b/i);

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
                }
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            // Ignore no-speech errors, just keep listening
            return;
        }
    };

    // recognition.onend = () => {
    //     // Automatically restart recognition when it ends
    //     console.log('Recognition ended, restarting...');
    //     try {
    //         recognition.start();
    //     } catch (e) {
    //         console.log('Recognition already started');
    //     }
    // };

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
                recognition.stop();
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
