class IconSquareProcessor {
    constructor() {
        this.files = [];
        this.processedImages = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const outputSize = document.getElementById('outputSize');
        const processBtn = document.getElementById('processBtn');
        const downloadAllBtn = document.getElementById('downloadAllBtn');

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Settings change
        outputSize.addEventListener('change', () => this.toggleCustomSize());

        // Process button
        processBtn.addEventListener('click', () => this.processImages());

        // Download all button
        downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }

    handleFiles(fileList) {
        this.files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
        
        if (this.files.length === 0) {
            alert('有効な画像ファイルを選択してください。');
            return;
        }

        this.displayPreview();
    }

    async displayPreview() {
        const previewSection = document.getElementById('previewSection');
        const previewGrid = document.getElementById('previewGrid');
        
        previewGrid.innerHTML = '';
        
        for (const file of this.files) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = file.name;
            
            previewItem.appendChild(img);
            previewItem.appendChild(filename);
            previewGrid.appendChild(previewItem);
        }
        
        previewSection.style.display = 'block';
    }



    toggleCustomSize() {
        const outputSize = document.getElementById('outputSize');
        const customSize = document.getElementById('customSize');
        
        if (outputSize.value === 'custom') {
            customSize.style.display = 'flex';
        } else {
            customSize.style.display = 'none';
        }
    }

    getPosition() {
        const positionInputs = document.querySelectorAll('input[name="position"]');
        for (const input of positionInputs) {
            if (input.checked) {
                return input.value;
            }
        }
        return 'center'; // default
    }

    getSelectedFormats() {
        const formats = [];
        if (document.getElementById('format-png').checked) formats.push('png');
        if (document.getElementById('format-jpeg').checked) formats.push('jpeg');
        if (document.getElementById('format-webp').checked) formats.push('webp');
        return formats;
    }

    getOutputSize() {
        const outputSize = document.getElementById('outputSize').value;
        
        if (outputSize === 'custom') {
            return parseInt(document.getElementById('customSizeValue').value) || 512;
        }
        
        return parseInt(outputSize);
    }

    async processImages() {
        if (this.files.length === 0) {
            alert('画像ファイルを選択してください。');
            return;
        }

        const selectedFormats = this.getSelectedFormats();
        if (selectedFormats.length === 0) {
            alert('少なくとも1つの出力形式を選択してください。');
            return;
        }

        const outputSize = this.getOutputSize();
        const position = this.getPosition();
        
        // Show processing indicator
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = `
            <h3>処理中...</h3>
            <div class="processing">
                <div class="spinner"></div>
                <p>画像を処理しています...</p>
            </div>
        `;
        
        this.processedImages = [];
        
        try {
            for (const file of this.files) {
                for (const format of selectedFormats) {
                    const processedImage = await this.processImage(file, outputSize, position, format);
                    this.processedImages.push(processedImage);
                }
            }
            
            this.displayResults();
        } catch (error) {
            console.error('Processing error:', error);
            alert('画像処理中にエラーが発生しました。');
        } finally {
            const processBtn = document.getElementById('processBtn');
            processBtn.disabled = false;
            processBtn.textContent = '画像を処理';
        }
    }

    async processImage(file, outputSize, position, format) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Square canvas (1:1 aspect ratio)
                canvas.width = outputSize;
                canvas.height = outputSize;
                
                // Set background based on format
                if (format === 'jpeg') {
                    // White background for JPEG
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, outputSize, outputSize);
                } else {
                    // Transparent background for PNG, WebP, SVG
                    ctx.clearRect(0, 0, outputSize, outputSize);
                }
                
                // Calculate icon size (keep original size, don't scale up)
                const maxIconSize = Math.min(outputSize * 0.9, Math.max(img.width, img.height));
                const scale = Math.min(maxIconSize / img.width, maxIconSize / img.height);
                const iconWidth = img.width * scale;
                const iconHeight = img.height * scale;
                
                // Calculate position based on user selection
                let x, y;
                switch (position) {
                    case 'top-left':
                        x = outputSize * 0.05;
                        y = outputSize * 0.05;
                        break;
                    case 'top':
                        x = (outputSize - iconWidth) / 2;
                        y = outputSize * 0.05;
                        break;
                    case 'top-right':
                        x = outputSize * 0.95 - iconWidth;
                        y = outputSize * 0.05;
                        break;
                    case 'left':
                        x = outputSize * 0.05;
                        y = (outputSize - iconHeight) / 2;
                        break;
                    case 'center':
                        x = (outputSize - iconWidth) / 2;
                        y = (outputSize - iconHeight) / 2;
                        break;
                    case 'right':
                        x = outputSize * 0.95 - iconWidth;
                        y = (outputSize - iconHeight) / 2;
                        break;
                    case 'bottom-left':
                        x = outputSize * 0.05;
                        y = outputSize * 0.95 - iconHeight;
                        break;
                    case 'bottom':
                        x = (outputSize - iconWidth) / 2;
                        y = outputSize * 0.95 - iconHeight;
                        break;
                    case 'bottom-right':
                        x = outputSize * 0.95 - iconWidth;
                        y = outputSize * 0.95 - iconHeight;
                        break;
                    default:
                        x = (outputSize - iconWidth) / 2;
                        y = (outputSize - iconHeight) / 2;
                }
                
                // Draw the icon
                ctx.drawImage(img, x, y, iconWidth, iconHeight);
                
                // Get file extension and MIME type based on format
                let mimeType, extension;
                switch (format) {
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        extension = 'jpg';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        extension = 'webp';
                        break;
                    case 'svg':
                        mimeType = 'image/png'; // SVG will be rasterized to PNG
                        extension = 'svg.png';
                        break;
                    default: // png
                        mimeType = 'image/png';
                        extension = 'png';
                }
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const fileName = `${baseName}_square_${position}.${extension}`;
                    resolve({
                        blob: blob,
                        fileName: fileName,
                        originalName: file.name,
                        format: format,
                        dataUrl: canvas.toDataURL(mimeType)
                    });
                }, mimeType);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    displayResults() {
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.innerHTML = `
            <h3>処理結果 (${this.processedImages.length}個のファイル)</h3>
            <div class="results-grid" id="resultsGrid"></div>
            <div class="action-buttons">
                <button class="btn btn-secondary" id="downloadAllBtn">すべてダウンロード (ZIP)</button>
            </div>
        `;
        
        const resultsGrid = document.getElementById('resultsGrid');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        
        this.processedImages.forEach((processedImage, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const img = document.createElement('img');
            img.src = processedImage.dataUrl;
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = processedImage.fileName;
            
            const formatBadge = document.createElement('div');
            formatBadge.className = 'format-badge';
            formatBadge.textContent = processedImage.format.toUpperCase();
            formatBadge.style.cssText = `
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-bottom: 8px;
            `;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'ダウンロード';
            downloadBtn.onclick = () => this.downloadSingle(processedImage);
            
            resultItem.appendChild(formatBadge);
            resultItem.appendChild(img);
            resultItem.appendChild(filename);
            resultItem.appendChild(downloadBtn);
            resultsGrid.appendChild(resultItem);
        });
        
        // Re-attach event listener for download all button
        downloadAllBtn.addEventListener('click', () => this.downloadAll());
    }

    downloadSingle(processedImage) {
        const link = document.createElement('a');
        link.href = processedImage.dataUrl;
        link.download = processedImage.fileName;
        link.click();
    }

    async downloadAll() {
        if (this.processedImages.length === 0) return;
        
        const zip = new JSZip();
        
        this.processedImages.forEach((processedImage) => {
            zip.file(processedImage.fileName, processedImage.blob);
        });
        
        try {
            const content = await zip.generateAsync({type: 'blob'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'standardized_icons.zip';
            link.click();
        } catch (error) {
            console.error('ZIP creation error:', error);
            alert('ZIPファイルの作成中にエラーが発生しました。');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new IconSquareProcessor();
});
