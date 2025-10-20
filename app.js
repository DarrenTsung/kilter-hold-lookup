// Main application logic

let dataParser;
let renderer;

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

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showError('Failed to load application. Please refresh the page.');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('hold-search');
    const clearBtn = document.getElementById('clear-btn');

    // Search on input
    searchInput.addEventListener('input', handleSearch);

    // Clear button
    clearBtn.addEventListener('click', clearSearch);

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
    const angleDisplay = document.getElementById('angle-display');
    const positionDisplay = document.getElementById('position-display');

    // Get relative position within the panel
    const relativePos = dataParser.getRelativePosition(holdInfo.row, holdInfo.column);

    angleDisplay.textContent = `Angle: ${holdInfo.angle}`;
    positionDisplay.textContent = `Panel: ${relativePos.panel} | Position: ${relativePos.column}, ${relativePos.row}`;
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = message;
}

function clearDisplay() {
    document.getElementById('angle-display').textContent = '';
    document.getElementById('position-display').textContent = '';
    document.getElementById('error-message').textContent = '';
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
