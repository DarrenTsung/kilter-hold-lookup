# Kilter Homewall 7x10 Hold Lookup

A web application to help install climbing holds on the Kilter homewall 7x10 configuration. Search for a hold by number and see its exact location with visual highlights.

## Implementation Progress

**Status:** ✅ Complete and ready to use

- ✅ Phase 1: Project Setup
  - Created HTML, CSS, and JavaScript files
- ✅ Phase 2: Data Processing
  - Implemented CSV parser
  - Built hold lookup data structure with O(1) search
- ✅ Phase 3: UI Development
  - Built search interface with input field and info displays
  - Added responsive styling
- ✅ Phase 4: Rendering System
  - Implemented canvas-based rendering with image overlay
  - Created grid position mapping system
- ✅ Phase 5: Search & Lookup Logic
  - Implemented real-time search functionality
  - Added error handling for invalid holds
- ✅ Phase 6: Visual Highlighting
  - Row highlights (blue horizontal line)
  - Column highlights (yellow vertical line)
  - Hold position markers (red circle with glow)
  - Large visible row/column labels

**Ready to use:** Server running at http://localhost:8000

## Project Overview

This tool solves the problem of finding specific holds when installing routes on a Kilter board. Instead of manually scanning through CSV data, simply type in a hold number and instantly see:

- The hold's location on the wall (highlighted)
- Which row and column it belongs to (with large visible labels)
- The installation angle for the hold
- Visual row/column guides to make installation easier

## Data Structure

The project uses two grid configurations:

### Main Line Grid (`HW7x10_Main_Line_Grid.csv`)
- **Columns:** C-1, C-3, C-5, C-7, C-9, C-11, C-13, C-15, C-17, C-19, C-21 (odd columns)
- **Rows:** R-35, R-33, R-31, R-29, R-27, R-25, R-23, R-21, R-19, R-17, R-15, R-13, R-11, R-9, R-7
- Contains hold numbers (e.g., 1350, 1090, 1528) with corresponding angles

### Auxiliary Grid (`HW7x10_Aux_Grid.csv`)
- **Columns:** C-2, C-4, C-6, C-8, C-10, C-12, C-14, C-16, C-18, C-20 (even columns)
- **Rows:** R-34, R-32, R-30, R-28, R-26, R-24, R-22, R-20, R-18, R-16, R-14, R-12, R-10, R-8
- Contains hold numbers (e.g., 1143, D226, 1397) with corresponding angles

Each hold entry includes:
- **Hold Number:** Unique identifier (numeric or with D prefix)
- **Angle:** Installation angle in degrees (e.g., 215˚, 190˚)
- **Distance:** Distance in inches (for reference)

## Features

### Core Functionality
1. **Hold Search:** Text input for hold number lookup
2. **Visual Highlighting:**
   - Highlight the specific hold position
   - Highlight the entire column (vertical line)
   - Highlight the entire row (horizontal line)
3. **Position Labels:** Large, visible row and column numbers
4. **Angle Display:** Show the installation angle next to the search input
5. **Visual Feedback:** Immediate visual response when hold is found

### User Experience
- Clean, minimal interface focused on the wall image
- Large, readable labels for installation clarity
- Error handling for invalid hold numbers
- Responsive design for various screen sizes

## High-Level Implementation Plan

### Phase 1: Project Setup
**Goal:** Set up the basic web application structure

1. **Choose Technology Stack:**
   - HTML/CSS/JavaScript (vanilla or framework like React/Vue)
   - Consider using a simple static site for easy deployment
   - Canvas API or SVG for image overlay rendering

2. **Project Structure:**
   ```
   kilter-hold-lookup/
   ├── index.html          # Main HTML file
   ├── styles.css          # Styling
   ├── app.js              # Main application logic
   ├── data-parser.js      # CSV parsing and data structure
   ├── renderer.js         # Canvas/SVG rendering for highlights
   ├── data/
   │   ├── HW7x10_Main_Line_Grid.csv
   │   ├── HW7x10_Aux_Grid.csv
   │   └── zoomed_colored_7x10homewall.png
   └── README.md
   ```

3. **Dependencies:**
   - CSV parser (PapaParse or custom parser)
   - No heavy frameworks needed initially

### Phase 2: Data Processing
**Goal:** Parse CSV files and create efficient lookup structure

1. **Parse CSV Files:**
   - Load both Main Line and Aux Grid CSVs
   - Extract hold numbers, angles, and positions
   - Handle special cases (holds with 'D' prefix, 'B' suffix variants)

2. **Create Lookup Data Structure:**
   ```javascript
   {
     "1143": { row: "R-34", column: "C-2", angle: "195°", grid: "aux" },
     "1350": { row: "R-35", column: "C-1", angle: "215°", grid: "main" },
     "D226": { row: "R-34", column: "C-10", angle: "260°", grid: "aux" },
     // ... etc
   }
   ```

3. **Grid Position Mapping:**
   - Map row/column labels to pixel coordinates on the image
   - Calculate hold positions based on the wall image dimensions
   - Account for the staggered pattern (odd/even columns on different rows)

### Phase 3: UI Development
**Goal:** Build the user interface

1. **HTML Structure:**
   - Search input field (with autocomplete suggestions)
   - Angle display area
   - Large canvas/container for the wall image with overlays
   - Status/error message area

2. **CSS Styling:**
   - Responsive layout that keeps the wall image centered
   - Highlight colors: distinct colors for row, column, and hold position
   - Large, legible fonts for row/column labels
   - Clean, minimal design that doesn't distract from the wall

3. **Input Handling:**
   - Real-time search as user types
   - Clear button to reset the view
   - Keyboard navigation support

### Phase 4: Rendering System
**Goal:** Implement visual highlighting on the wall image

1. **Image Overlay System:**
   - Load the wall image as background
   - Create transparent overlay layer (Canvas or SVG)
   - Ensure overlays are properly scaled with image

2. **Highlight Rendering:**
   - **Row Highlight:** Draw horizontal line across entire row
   - **Column Highlight:** Draw vertical line down entire column
   - **Hold Highlight:** Draw circle/marker at specific hold position
   - **Labels:** Render large row and column numbers at edges

3. **Coordinate System:**
   - Calculate pixel positions for each grid intersection
   - Account for image scaling/responsive sizing
   - Test accuracy with known hold positions

4. **Visual Design:**
   - Use contrasting colors (e.g., semi-transparent yellow for column, blue for row, red for hold)
   - Add glow/shadow effects for better visibility
   - Animate the highlights when hold is found (optional)

### Phase 5: Search & Lookup Logic
**Goal:** Implement the core search functionality

1. **Search Function:**
   ```javascript
   function findHold(holdNumber) {
     // Normalize input (uppercase, trim)
     // Look up in data structure
     // Return hold info or null if not found
   }
   ```

2. **Display Logic:**
   - Clear previous highlights
   - Look up hold position
   - Render row/column/hold highlights
   - Display angle in UI
   - Show error if hold not found

3. **Edge Cases:**
   - Handle variant holds (D prefix, B suffix like "D229B")
   - Case-insensitive search
   - Partial matches or autocomplete

### Phase 6: Testing & Refinement
**Goal:** Ensure accuracy and usability

1. **Accuracy Testing:**
   - Verify hold positions match the actual wall image
   - Test with holds from different areas of the wall
   - Validate angle data display

2. **Usability Testing:**
   - Test on different screen sizes
   - Verify readability of labels
   - Check color contrast for highlights

3. **Performance:**
   - Optimize image loading
   - Ensure smooth search/highlight updates
   - Test with slow connections

## Technical Decisions

### Why Canvas over SVG?
- Better performance for frequent redraws
- Easier to layer over bitmap image
- Simpler coordinate system for grid overlay

### Data Structure Choice
Using a flat lookup object for O(1) hold search rather than scanning CSV rows on each search.

### Responsive Strategy
Fix aspect ratio of wall image, scale entire visualization proportionally to fit viewport.

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for CORS if loading CSVs) or bundler

### Running the App
1. Clone or download this repository
2. Serve the directory with a local web server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Node.js (with http-server)
   npx http-server
   ```
3. Open `http://localhost:8000` in your browser
4. Type a hold number (e.g., "1143", "D226") to see its location

## Contributing
Suggestions and improvements welcome!

## License
MIT License - feel free to use and modify for your climbing needs
