// Data Parser for Kilter Hold CSV files

class DataParser {
    constructor() {
        this.holdLookup = {};
        this.gridConfig = {
            main: {
                columns: ['C-1', 'C-3', 'C-5', 'C-7', 'C-9', 'C-11', 'C-13', 'C-15', 'C-17', 'C-19', 'C-21'],
                rows: ['R-35', 'R-33', 'R-31', 'R-29', 'R-27', 'R-25', 'R-23', 'R-21', 'R-19', 'R-17', 'R-15', 'R-13', 'R-11', 'R-9', 'R-7']
            },
            aux: {
                columns: ['C-2', 'C-4', 'C-6', 'C-8', 'C-10', 'C-12', 'C-14', 'C-16', 'C-18', 'C-20'],
                rows: ['R-34', 'R-32', 'R-30', 'R-28', 'R-26', 'R-24', 'R-22', 'R-20', 'R-18', 'R-16', 'R-14', 'R-12', 'R-10', 'R-8']
            }
        };
    }

    async loadData() {
        try {
            const [mainData, auxData] = await Promise.all([
                fetch('HW7x10_Main_Line_Grid.csv').then(r => r.text()),
                fetch('HW7x10_Aux_Grid.csv').then(r => r.text())
            ]);

            this.parseCSV(mainData, 'main');
            this.parseCSV(auxData, 'aux');

            console.log(`Loaded ${Object.keys(this.holdLookup).length} holds`);
            return this.holdLookup;
        } catch (error) {
            console.error('Error loading CSV files:', error);
            throw error;
        }
    }

    parseCSV(csvText, gridType) {
        const lines = csvText.trim().split('\n');
        const columns = this.gridConfig[gridType].columns;

        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this is a "Hold #" row
            if (line.includes('Hold #')) {
                const holdRow = this.parseRow(line);
                const angleRow = i + 1 < lines.length ? this.parseRow(lines[i + 1]) : [];

                // Extract the row label (e.g., "R-34")
                const rowLabel = holdRow[holdRow.length - 1];

                // Process each hold in this row
                for (let colIndex = 0; colIndex < columns.length; colIndex++) {
                    const holdNumber = holdRow[colIndex + 1]; // +1 to skip first column
                    const angle = angleRow[colIndex + 1];

                    if (holdNumber && holdNumber !== 'Hold #') {
                        this.holdLookup[holdNumber] = {
                            row: rowLabel,
                            column: columns[colIndex],
                            angle: angle || '',
                            grid: gridType
                        };
                    }
                }

                i++; // Skip the angle row since we already processed it
            }
        }
    }

    parseRow(line) {
        // Split by comma, handling the arrow notation
        return line.split(',').map(cell => cell.replace(/^\d+→/, '').trim());
    }

    findHold(holdNumber) {
        const normalized = holdNumber.toUpperCase().trim();
        return this.holdLookup[normalized] || null;
    }

    getAllHolds() {
        return Object.keys(this.holdLookup);
    }
}
