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
        const height = this.canvas.height;

        // Actual pixel measurements for columns (X coordinates at top and bottom of image)
        const columnPixels = {
            'C-1':  { top: 40,  bottom: 24 },
            'C-2':  { top: 77,  bottom: 65 },
            'C-3':  { top: 117, bottom: 105 },
            'C-4':  { top: 157, bottom: 148 },
            'C-5':  { top: 195, bottom: 188 },
            'C-6':  { top: 235, bottom: 228 },
            'C-7':  { top: 272, bottom: 270 },
            'C-8':  { top: 312, bottom: 310 },
            'C-9':  { top: 350, bottom: 351 },
            'C-10': { top: 389, bottom: 392 },
            'C-11': { top: 428, bottom: 430 },
            'C-12': { top: 468, bottom: 472 },
            'C-13': { top: 506, bottom: 512 },
            'C-14': { top: 545, bottom: 553 },
            'C-15': { top: 585, bottom: 596 },
            'C-16': { top: 626, bottom: 636 },
            'C-17': { top: 663, bottom: 679 },
            'C-18': { top: 704, bottom: 720 },
            'C-19': { top: 742, bottom: 760 },
            'C-20': { top: 783, bottom: 803 },
            'C-21': { top: 822, bottom: 846 }
        };

        // Define all rows (both grids interleaved)
        const allRows = [
            'R-35', 'R-34', 'R-33', 'R-32', 'R-31', 'R-30', 'R-29', 'R-28', 'R-27', 'R-26',
            'R-25', 'R-24', 'R-23', 'R-22', 'R-21', 'R-20', 'R-19', 'R-18', 'R-17', 'R-16',
            'R-15', 'R-14', 'R-13', 'R-12', 'R-11', 'R-10', 'R-9', 'R-8', 'R-7'
        ];

        // Calculate row Y positions (evenly distributed)
        const rowSpacing = height / (allRows.length + 1);

        this.gridMapping = {
            columnPixels: columnPixels,
            rows: {}
        };

        // Map rows to y coordinates
        allRows.forEach((row, index) => {
            this.gridMapping.rows[row] = (index + 1) * rowSpacing;
        });
    }

    getColumnXPosition(column, y) {
        // Interpolate X position based on Y using the column's top and bottom measurements
        const colData = this.gridMapping.columnPixels[column];
        if (!colData) return null;

        const height = this.canvas.height;
        const t = y / height; // Normalized position from top (0) to bottom (1)

        // Linear interpolation between top and bottom X coordinates
        return colData.top + t * (colData.bottom - colData.top);
    }

    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0);
    }

    highlightHold(holdInfo) {
        // Redraw base image
        this.drawImage();

        if (!holdInfo || !this.gridMapping) return;

        const y = this.gridMapping.rows[holdInfo.row];
        if (!y) {
            console.error('Invalid row:', holdInfo.row);
            return;
        }

        // Get interpolated X position for this column at this Y position
        const x = this.getColumnXPosition(holdInfo.column, y);
        if (!x) {
            console.error('Invalid column:', holdInfo.column);
            return;
        }

        // Draw column highlight (vertical line)
        this.drawColumnHighlight(x, y, holdInfo.column);

        // Draw row highlight (horizontal line)
        this.drawRowHighlight(x, y);

        // Draw circle at intersection
        this.drawIntersectionCircle(x, y);
    }

    drawColumnHighlight(x, y, column) {
        this.ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)'; // Yellow at 50% opacity
        this.ctx.lineWidth = 30;

        // Draw curved column line with circular cutout at intersection
        this.ctx.save();

        // Create clipping path that excludes a circle at the intersection
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.arc(x, y, 35, 0, Math.PI * 2, true); // Cutout circle, counter-clockwise
        this.ctx.clip();

        // Draw the curved line by sampling points along the height
        const steps = 50;
        this.ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const currentY = (i / steps) * this.canvas.height;
            const currentX = this.getColumnXPosition(column, currentY);
            if (i === 0) {
                this.ctx.moveTo(currentX, currentY);
            } else {
                this.ctx.lineTo(currentX, currentY);
            }
        }
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawRowHighlight(x, y) {
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)'; // Blue at 50% opacity
        this.ctx.lineWidth = 30;

        // Draw horizontal line with circular cutout at intersection
        this.ctx.save();

        // Create clipping path that excludes a circle at the intersection
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.arc(x, y, 35, 0, Math.PI * 2, true); // Cutout circle, counter-clockwise
        this.ctx.clip();

        // Draw the line
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawIntersectionCircle(x, y) {
        this.ctx.strokeStyle = 'rgba(33, 150, 243, 0.5)'; // Blue at 50% opacity
        this.ctx.lineWidth = 30;

        // Draw circle just outside the cutout and line width
        // Cutout radius (35) + line half-width (15) + circle half-width (15) = 65
        this.ctx.beginPath();
        this.ctx.arc(x, y, 65, 0, Math.PI * 2);
        this.ctx.stroke();
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

    clear() {
        this.drawImage();
    }
}
