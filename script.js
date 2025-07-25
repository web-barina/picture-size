class IconStandardizer {
    constructor() {
        this.files = [];
        this.processedImages = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const aspectRatio = document.getElementById('aspectRatio');
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
        aspectRatio.addEventListener('change', () => this.toggleCustomRatio());
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

    toggleCustomRatio() {
        const aspectRatio = document.getElementById('aspectRatio');
        const customRatio = document.getElementById('customRatio');
        
        if (aspectRatio.value === 'custom') {
            customRatio.style.display = 'flex';
        } else {
            customRatio.style.display = 'none';
        }
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

    getAspectRatio() {
        const aspectRatio = document.getElementById('aspectRatio').value;
        
        if (aspectRatio === 'custom') {
            const width = parseFloat(document.getElementById('customWidth').value) || 1;
            const height = parseFloat(document.getElementById('customHeight').value) || 1;
            return width / height;
        }
        
        const ratios = {
            '1:1': 1,
            '4:3': 4/3,
            '16:9': 16/9,
            '3:2': 3/2,
            '2:1': 2/1
        };
        
        return ratios[aspectRatio] || 1;
    }

    getOutputSize() {
        const outputSize = document.getElementById('outputSize').value;
        
        if (outputSize === 'custom') {
            return parseInt(document.getElementById('customSizeValue').value) || 512;
        }
        
        return parseInt(outputSize);
    }

    async processImages() {
        const processBtn = document.getElementById('processBtn');
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');
        
        // Show processing state
        processBtn.disabled = true;
        processBtn.textContent = '処理中...';
        resultsGrid.innerHTML = '<div class="processing"><div class="spinner"></div><p>画像を処理しています...</p></div>';
        resultsSection.style.display = 'block';
        
        this.processedImages = [];
        const aspectRatio = this.getAspectRatio();
        const outputSize = this.getOutputSize();
        
        try {
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                const processedImage = await this.processImage(file, aspectRatio, outputSize);
                this.processedImages.push(processedImage);
            }
            
            this.displayResults();
            
        } catch (error) {
            console.error('Processing error:', error);
            alert('画像の処理中にエラーが発生しました。');
        } finally {
            processBtn.disabled = false;
            processBtn.textContent = '画像を処理';
        }
    }

    async processImage(file, aspectRatio, outputSize) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate canvas dimensions based on aspect ratio
                let canvasWidth, canvasHeight;
                if (aspectRatio >= 1) {
                    canvasWidth = outputSize;
                    canvasHeight = outputSize / aspectRatio;
                } else {
                    canvasWidth = outputSize * aspectRatio;
                    canvasHeight = outputSize;
                }
                
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                
                // Calculate scaling to fit image within canvas while maintaining aspect ratio
                const imgAspectRatio = img.width / img.height;
                let drawWidth, drawHeight;
                
                if (imgAspectRatio > aspectRatio) {
                    // Image is wider than target ratio
                    drawWidth = canvasWidth;
                    drawHeight = canvasWidth / imgAspectRatio;
                } else {
                    // Image is taller than target ratio
                    drawHeight = canvasHeight;
                    drawWidth = canvasHeight * imgAspectRatio;
                }
                
                // Center the image
                const x = (canvasWidth - drawWidth) / 2;
                const y = (canvasHeight - drawHeight) / 2;
                
                // Clear canvas (transparent background)
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);
                
                // Draw image centered
                ctx.drawImage(img, x, y, drawWidth, drawHeight);
                
                // Convert to blob
                canvas.toBlob((blob) => {
                    const fileName = file.name.replace(/\.[^/.]+$/, '') + '_standardized.png';
                    resolve({
                        blob: blob,
                        fileName: fileName,
                        originalName: file.name,
                        dataUrl: canvas.toDataURL('image/png')
                    });
                }, 'image/png');
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        
        resultsGrid.innerHTML = '';
        
        this.processedImages.forEach((processedImage, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            const img = document.createElement('img');
            img.src = processedImage.dataUrl;
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = processedImage.fileName;
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-btn';
            downloadBtn.textContent = 'ダウンロード';
            downloadBtn.onclick = () => this.downloadSingle(processedImage);
            
            resultItem.appendChild(img);
            resultItem.appendChild(filename);
            resultItem.appendChild(downloadBtn);
            resultsGrid.appendChild(resultItem);
        });
        
        downloadAllBtn.style.display = 'block';
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
    new IconStandardizer();
});
