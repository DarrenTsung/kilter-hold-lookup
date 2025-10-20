// Canvas Renderer for hold visualization

class WallRenderer {
    constructor(canvasId, imageId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.image = document.getElementById(imageId);
        this.gridMapping = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            this.image.onload = () => {
                // Set canvas size to match image
                this.canvas.width = this.image.naturalWidth;
                this.canvas.height = this.image.naturalHeight;

                // Draw the base image
                this.drawImage();

                // Calculate grid mappings
                this.calculateGridMapping();

                resolve();
            };

            this.image.onerror = reject;

            // Trigger load if image is cached
            if (this.image.complete) {
                this.image.onload();
            }
        });
    }

    calculateGridMapping() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Define all columns (both odd and even)
        const allColumns = [
            'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8', 'C-9', 'C-10',
            'C-11', 'C-12', 'C-13', 'C-14', 'C-15', 'C-16', 'C-17', 'C-18', 'C-19', 'C-20', 'C-21'
        ];

        // Define all rows (both grids interleaved)
        const allRows = [
            'R-35', 'R-34', 'R-33', 'R-32', 'R-31', 'R-30', 'R-29', 'R-28', 'R-27', 'R-26',
            'R-25', 'R-24', 'R-23', 'R-22', 'R-21', 'R-20', 'R-19', 'R-18', 'R-17', 'R-16',
            'R-15', 'R-14', 'R-13', 'R-12', 'R-11', 'R-10', 'R-9', 'R-8', 'R-7'
        ];

        // Calculate spacing
        const columnSpacing = width / (allColumns.length + 1);
        const rowSpacing = height / (allRows.length + 1);

        this.gridMapping = {
            columns: {},
            rows: {}
        };

        // Map columns to x coordinates
        allColumns.forEach((col, index) => {
            this.gridMapping.columns[col] = (index + 1) * columnSpacing;
        });

        // Map rows to y coordinates
        allRows.forEach((row, index) => {
            this.gridMapping.rows[row] = (index + 1) * rowSpacing;
        });
    }

    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);
    }

    highlightHold(holdInfo) {
        // Redraw base image
        this.drawImage();

        if (!holdInfo || !this.gridMapping) return;

        const x = this.gridMapping.columns[holdInfo.column];
        const y = this.gridMapping.rows[holdInfo.row];

        if (!x || !y) {
            console.error('Invalid grid position:', holdInfo);
            return;
        }

        // Draw column highlight (vertical line)
        this.drawColumnHighlight(x);

        // Draw row highlight (horizontal line)
        this.drawRowHighlight(y);

        // Draw hold position marker
        this.drawHoldMarker(x, y);

        // Draw labels
        this.drawLabels(holdInfo.column, holdInfo.row, x, y);
    }

    drawColumnHighlight(x) {
        this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)'; // Yellow
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawRowHighlight(y) {
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)'; // Blue
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawHoldMarker(x, y) {
        // Draw outer glow
        this.ctx.shadowColor = 'rgba(244, 67, 54, 0.8)';
        this.ctx.shadowBlur = 20;

        // Draw red circle
        this.ctx.fillStyle = 'rgba(244, 67, 54, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw white center
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawLabels(column, row, x, y) {
        this.ctx.shadowBlur = 0;
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Column label at top
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x - 40, 10, 80, 40);
        this.ctx.fillStyle = '#FFEB3B';
        this.ctx.fillText(column, x, 30);

        // Row label at left
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, y - 20, 80, 40);
        this.ctx.fillStyle = '#2196F3';
        this.ctx.fillText(row, 50, y);
    }

    clear() {
        this.drawImage();
    }
}
