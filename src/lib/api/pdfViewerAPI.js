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
        this.renderQueue = Promise.resolve();
        this.currentViewport = null;
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
                await this.cleanup();
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
            return true;
        } catch (error) {
            console.error('PDF loading error:', error);
            return false;
        }
    }

    async renderPage(pageNum, showOverlay = true, parsingMode = 'viewer') {
        if (!this.pdf || !this.canvas) {
            console.log('[Debug] PDF or canvas not ready', { pdf: !!this.pdf, canvas: !!this.canvas });
            return;
        }

        return new Promise((resolve, reject) => {
            this.renderQueue = this.renderQueue.then(async () => {
                if (this.isRendering) {
                    console.log('[Debug] Rendering in progress, queued...');
                    return;
                }

                let page = null;
                
                try {
                    this.isRendering = true;

                    if (this.renderTask) {
                        await this.renderTask.cancel();
                        this.renderTask = null;
                    }

                    const context = this.canvas.getContext('2d');
                    context.clearRect(0, 0, this.canvas.width, this.canvas.height);

                    if (this.overlayDiv) {
                        this.overlayDiv.innerHTML = '';
                    }

                    page = await this.pdf.getPage(pageNum);
                    this.currentPage = pageNum;
                    
                    const effectiveScale = this.scale === 'auto' 
                        ? this.calculateScale(page) 
                        : parseFloat(this.scale);

                    this.currentViewport = page.getViewport({ 
                        scale: effectiveScale,
                        rotation: 0
                    });
                    
                    this.canvas.height = this.currentViewport.height;
                    this.canvas.width = this.currentViewport.width;
                    
                    this.renderTask = page.render({
                        canvasContext: context,
                        viewport: this.currentViewport
                    });
                    
                    await this.renderTask.promise;
                    
                    if (showOverlay) {
                        if (parsingMode === 'viewer') {
                            const textContent = await page.getTextContent();
                            await this.renderOverlay(page, this.currentViewport, effectiveScale, textContent);
                        } else if (parsingMode === 'pymupdf') {
                            this.renderPyMuPDFElements(this.pageElements, this.currentViewport);
                        }
                    }

                    resolve({ success: true, page: this.currentPage });
                } catch (error) {
                    console.error('[Debug] Page rendering error:', error);
                    reject(error);
                } finally {
                    this.isRendering = false;
                    this.renderTask = null;
                    if (page) {
                        page.cleanup();
                    }
                }
            });
        });
    }

    async renderOverlay(page, viewport, effectiveScale, textContent) {
        if (!this.overlayDiv) {
            console.log('[Debug] No overlay div available');
            return;
        }

        try {
            console.log('[Debug] Starting overlay render', {
                viewportDimensions: {
                    width: viewport.width,
                    height: viewport.height
                }
            });

            this.overlayDiv.innerHTML = '';
            Object.assign(this.overlayDiv.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: `${viewport.width}px`,
                height: `${viewport.height}px`,
                display: 'block',
                pointerEvents: 'auto',
                zIndex: '1',
                visibility: 'visible',
                opacity: '1'
            });

            console.log('[Debug] Processing text items:', textContent.items.length);

            textContent.items.forEach((item, index) => {
                const transform = viewport.transform;
                const [x, y] = this.applyTransform([item.transform[4], item.transform[5]], transform);
                
                const itemHeight = item.height * effectiveScale;
                const itemWidth = item.width * effectiveScale;
                const top = y - itemHeight;

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

            console.log('[Debug] Overlay render complete');
        } catch (error) {
            console.error('[Debug] Overlay rendering error:', error);
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

    async cleanup() {
        try {
            if (this.renderTask) {
                await this.renderTask.cancel();
                this.renderTask = null;
            }
            if (this.pdf) {
                await this.pdf.destroy();
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
            this.renderQueue = Promise.resolve();
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }

    setScale(newScale) {
        this.scale = newScale;
        this.renderPage(this.currentPage);
    }

    getCurrentPage() {
        return this.currentPage;
    }

    setCurrentPage(pageNum) {
        if (pageNum >= 1 && pageNum <= this.totalPages) {
            this.currentPage = pageNum;
        }
    }

    getTotalPages() {
        return this.totalPages;
    }

    handleResize() {
        if (this.pdf && this.currentPage) {
            this.renderPage(this.currentPage);
        }
    }

    renderPyMuPDFElements(elements, viewport) {
        if (!this.overlayDiv || !elements || !viewport) return;
        
        console.log('PDFViewerAPI: Rendering PyMuPDF elements');
        this.overlayDiv.innerHTML = '';
        
        elements.forEach(element => {
            const [x1, y1, x2, y2] = element.bbox;
            
            const rect = viewport.convertToViewportRectangle([x1, y1, x2, y2]);
            
            const div = document.createElement('div');
            div.className = 'element-box';
            div.style.position = 'absolute';
            div.style.left = `${Math.min(rect[0], rect[2])}px`;
            div.style.top = `${Math.min(rect[1], rect[3])}px`;
            div.style.width = `${Math.abs(rect[2] - rect[0])}px`;
            div.style.height = `${Math.abs(rect[3] - rect[1])}px`;
            div.style.border = `2px solid ${element.type === 'text' ? '#4a90e2' : 
                              element.type === 'table' ? '#45a049' : '#e2574a'}`;
            div.style.backgroundColor = element.selected ? 'rgba(74, 144, 226, 0.1)' : 'transparent';
            div.style.cursor = 'pointer';
            
            const badge = document.createElement('div');
            badge.className = 'element-type-badge';
            badge.textContent = element.type;
            div.appendChild(badge);
            
            this.overlayDiv.appendChild(div);
        });
    }

    setPageElements(elements) {
        console.log('PDFViewerAPI: Setting page elements');
        this.pageElements = elements;
        if (this.currentViewport) {
            console.log('PDFViewerAPI: Rendering updated elements');
            this.renderPyMuPDFElements(elements, this.currentViewport);
        }
    }
} 