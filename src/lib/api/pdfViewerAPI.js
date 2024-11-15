// src/lib/api/pdfViewerAPI.js
import * as pdfjsLib from 'pdfjs-dist';

export class PDFViewerAPI {
    constructor(canvas, overlayDiv) {
        this.canvas = canvas;
        this.overlayDiv = overlayDiv;
        this.pdf = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 'auto';
        this.pageElements = [];
        this.renderTask = null;
        this.isRendering = false;
    }

    calculateScale(page) {
        if (!this.canvas || !page) return 1.0;
        
        const containerWidth = this.canvas.parentElement.clientWidth - 32;
        const viewport = page.getViewport({ scale: 1.0, rotation: 0 });
        
        return containerWidth / viewport.width;
    }

    async loadPDF(file) {
        if (!file) return;
        
        try {
            if (this.pdf) {
                this.pdf.destroy();
                this.pdf = null;
            }

            const arrayBuffer = await file.arrayBuffer();
            this.pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            this.totalPages = this.pdf.numPages;
            this.currentPage = 1;
            
            const firstPage = await this.pdf.getPage(1);
            if (this.scale === 'auto') {
                this.scale = this.calculateScale(firstPage);
            }
            
            console.log('PDF loaded:', this.totalPages, 'pages, scale:', this.scale);
            await this.renderPage(this.currentPage);
            return true;
        } catch (error) {
            console.error('PDF loading error:', error);
            return false;
        }
    }

    async renderPage(pageNum, showOverlay = true, parsingMode = 'viewer') {
        if (!this.pdf || !this.canvas) {
            console.log('PDF or canvas not ready');
            return;
        }

        if (this.isRendering) {
            console.log('Rendering in progress, waiting...');
            return;
        }

        try {
            this.isRendering = true;
            
            if (this.renderTask) {
                await this.renderTask.cancel();
                this.renderTask = null;
                const context = this.canvas.getContext('2d');
                context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            this.currentPage = pageNum;
            const page = await this.pdf.getPage(pageNum);
            
            let effectiveScale;
            if (this.scale === 'auto') {
                effectiveScale = this.calculateScale(page);
            } else {
                effectiveScale = parseFloat(this.scale);
            }

            const viewport = page.getViewport({ 
                scale: effectiveScale,
                rotation: 0
            });
            
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            const context = this.canvas.getContext('2d');
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            console.log('Starting render for page:', pageNum);
            this.renderTask = page.render(renderContext);
            
            await this.renderTask.promise;
            console.log('Render completed for page:', pageNum);
            
            if (showOverlay && parsingMode === 'viewer') {
                await this.renderOverlay(page, viewport, effectiveScale);
            } else if (this.overlayDiv) {
                this.overlayDiv.innerHTML = '';
            }

            return this.pageElements;
        } catch (error) {
            if (error.name === 'RenderingCancelled') {
                console.log('Previous rendering was cancelled');
            } else {
                console.error('Page rendering error:', error);
                throw error;
            }
        } finally {
            this.isRendering = false;
            this.renderTask = null;
        }
    }

    async renderOverlay(page, viewport, effectiveScale) {
        if (!this.overlayDiv) return;

        try {
            const textContent = await page.getTextContent();
            
            const debugCanvas = document.createElement('canvas');
            debugCanvas.style.position = 'absolute';
            debugCanvas.style.left = '0';
            debugCanvas.style.top = '0';
            debugCanvas.width = viewport.width;
            debugCanvas.height = viewport.height;
            debugCanvas.style.pointerEvents = 'none';
            debugCanvas.style.zIndex = '3';
            const debugCtx = debugCanvas.getContext('2d');
            
            this.overlayDiv.innerHTML = '';
            this.overlayDiv.style.position = 'absolute';
            this.overlayDiv.style.left = '0';
            this.overlayDiv.style.top = '0';
            this.overlayDiv.style.width = `${viewport.width}px`;
            this.overlayDiv.style.height = `${viewport.height}px`;
            this.overlayDiv.style.display = 'block';
            this.overlayDiv.style.pointerEvents = 'auto';
            this.overlayDiv.appendChild(debugCanvas);

            textContent.items.forEach((item, index) => {
                const transform = viewport.transform;
                const [x, y] = this.applyTransform([item.transform[4], item.transform[5]], transform);
                
                const itemHeight = item.height * effectiveScale;
                const itemWidth = item.width * effectiveScale;
                
                const top = y - itemHeight;

                debugCtx.strokeStyle = 'red';
                debugCtx.lineWidth = 1;
                debugCtx.strokeRect(x, top, itemWidth, itemHeight);
                
                debugCtx.strokeStyle = 'blue';
                debugCtx.beginPath();
                debugCtx.moveTo(x, y);
                debugCtx.lineTo(x + itemWidth, y);
                debugCtx.stroke();

                const box = document.createElement('div');
                box.className = 'bounding-box';
                box.style.position = 'absolute';
                box.style.left = `${x}px`;
                box.style.top = `${top}px`;
                box.style.width = `${itemWidth}px`;
                box.style.height = `${itemHeight}px`;
                box.style.border = '1px solid rgba(0, 255, 0, 0.5)';
                box.style.backgroundColor = 'transparent';
                box.style.cursor = 'pointer';
                box.dataset.text = item.str;
                box.dataset.index = index;

                box.title = `
                    Text: ${item.str}
                    Original: (${item.transform[4]}, ${item.transform[5]})
                    Transformed: (${x}, ${y})
                    Top: ${top}
                    Height: ${itemHeight}
                `;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'element-checkbox';
                checkbox.style.position = 'absolute';
                checkbox.style.left = '-20px';
                checkbox.style.top = '50%';
                checkbox.style.transform = 'translateY(-50%)';

                box.appendChild(checkbox);
                this.overlayDiv.appendChild(box);

                box.addEventListener('mouseover', () => {
                    if (!checkbox.checked) {
                        box.style.border = '2px solid #4a90e2';
                        box.style.backgroundColor = 'rgba(74, 144, 226, 0.1)';
                    }
                });
                
                box.addEventListener('mouseout', () => {
                    if (!checkbox.checked) {
                        box.style.border = '1px solid rgba(0, 255, 0, 0.5)';
                        box.style.backgroundColor = 'transparent';
                    }
                });
                
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        box.style.border = '2px solid #45a049';
                        box.style.backgroundColor = 'rgba(69, 160, 73, 0.1)';
                    } else {
                        box.style.border = '1px solid rgba(0, 255, 0, 0.5)';
                        box.style.backgroundColor = 'transparent';
                    }
                });
            });
        } catch (error) {
            console.error('Overlay rendering error:', error);
        }
    }

    applyTransform(point, transform) {
        return [
            transform[0] * point[0] + transform[2] * point[1] + transform[4],
            transform[1] * point[0] + transform[3] * point[1] + transform[5]
        ];
    }

    createNewParagraph() {
        return {
            type: 'paragraph',
            content: [],
            x: Infinity,
            y: Infinity,
            width: 0,
            height: 0,
            selected: false
        };
    }

    finalizeParagraph(paragraph) {
        if (paragraph.content.length === 0) return;
        
        const maxX = Math.max(...paragraph.content.map(c => c.x + c.width));
        const maxY = Math.max(...paragraph.content.map(c => c.y + c.height));
        
        paragraph.width = maxX - paragraph.x;
        paragraph.height = maxY - paragraph.y;
    }

    cleanup() {
        if (this.renderTask) {
            this.renderTask.cancel();
            this.renderTask = null;
        }
        if (this.pdf) {
            this.pdf.destroy();
            this.pdf = null;
        }
        if (this.canvas) {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.overlayDiv) {
            this.overlayDiv.innerHTML = '';
        }
        this.isRendering = false;
    }

    setScale(newScale) {
        this.scale = newScale;
        this.renderPage(this.currentPage);
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getTotalPages() {
        return this.totalPages;
    }

    handleResize() {
        if (this.pdf && this.currentPage) {
            this.renderPage(this.currentPage);
        }
    }
} 