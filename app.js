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

        // Set default hold and trigger search
        const searchInput = document.getElementById('hold-search');
        searchInput.value = '1350';
        handleSearch();

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
