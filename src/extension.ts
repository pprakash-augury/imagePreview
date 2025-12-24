import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Base64 Image Preview extension is now active!');

    let disposable = vscode.commands.registerCommand('base64-image-preview.showImage', () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('Please open a file and select a base64 string first!');
            return;
        }

        const selection = editor.selection;
        let base64String = editor.document.getText(selection).trim();

        // If no selection, try to get the entire line
        if (!base64String) {
            const line = editor.document.lineAt(selection.active.line);
            base64String = line.text.trim();
        }

        if (!base64String) {
            vscode.window.showInformationMessage('Please select a base64 string or place your cursor on a line containing base64 data.');
            return;
        }

        // Remove common prefixes if present
        base64String = base64String.replace(/^data:image\/[^;]+;base64,/, '');
        base64String = base64String.replace(/^["']|["']$/g, ''); // Remove quotes

        // Validate base64 string
        if (!isValidBase64(base64String)) {
            vscode.window.showErrorMessage('Invalid base64 string!');
            return;
        }

        // Create and show webview panel
        const panel = vscode.window.createWebviewPanel(
            'imagePreview',
            'Image Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Detect image format from base64 data
        const imageFormat = detectImageFormat(base64String);
        const dataUri = `data:image/${imageFormat};base64,${base64String}`;

        panel.webview.html = getWebviewContent(dataUri, base64String);
    });

    context.subscriptions.push(disposable);
}

function isValidBase64(str: string): boolean {
    try {
        // Check if string contains only valid base64 characters
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(str)) {
            return false;
        }
        
        // Try to decode it
        if (typeof Buffer !== 'undefined') {
            Buffer.from(str, 'base64');
        } else {
            atob(str);
        }
        return str.length > 20; // Reasonable minimum length for an image
    } catch (e) {
        return false;
    }
}

function detectImageFormat(base64String: string): string {
    try {
        const decoded = Buffer.from(base64String, 'base64');
        const hex = decoded.toString('hex', 0, 4);
        
        // Check magic numbers for common image formats
        if (hex.startsWith('89504e47')) return 'png';
        if (hex.startsWith('ffd8ff')) return 'jpeg';
        if (hex.startsWith('47494638')) return 'gif';
        if (hex.startsWith('52494646')) return 'webp';
        if (hex.startsWith('424d')) return 'bmp';
        
        return 'png'; // Default to png
    } catch (e) {
        return 'png';
    }
}

function getWebviewContent(dataUri: string, base64String: string): string {
    const base64Length = base64String.length;
    const estimatedSize = Math.round((base64Length * 3) / 4 / 1024);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Preview</title>
    <style>
        body {
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .container {
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .info {
            padding: 10px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 5px;
            font-size: 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        .label {
            font-weight: bold;
            margin-right: 10px;
        }
        .image-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 5px;
            min-height: 200px;
        }
        img {
            max-width: 100%;
            height: auto;
            border: 1px solid var(--vscode-panel-border);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .error {
            color: var(--vscode-errorForeground);
            padding: 10px;
        }
        .controls {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .zoom-controls {
            display: flex;
            gap: 5px;
            align-items: center;
        }
        #zoomLevel {
            min-width: 60px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="info">
            <div class="info-row">
                <span class="label">Base64 Length:</span>
                <span>${base64Length.toLocaleString()} characters</span>
            </div>
            <div class="info-row">
                <span class="label">Estimated Size:</span>
                <span>~${estimatedSize} KB</span>
            </div>
            <div class="info-row">
                <span class="label">Dimensions:</span>
                <span id="dimensions">Loading...</span>
            </div>
        </div>
        
        <div class="controls">
            <div class="zoom-controls">
                <button onclick="zoomOut()">-</button>
                <span id="zoomLevel">100%</span>
                <button onclick="zoomIn()">+</button>
                <button onclick="resetZoom()">Reset</button>
            </div>
            <button onclick="downloadImage()">Download Image</button>
            <button onclick="copyToClipboard()">Copy Data URI</button>
        </div>
        
        <div class="image-container">
            <img id="preview" src="${dataUri}" alt="Base64 Image Preview" onload="updateDimensions()" onerror="showError()">
        </div>
    </div>
    
    <script>
        let currentZoom = 100;
        const zoomStep = 25;
        const img = document.getElementById('preview');
        const zoomLevelSpan = document.getElementById('zoomLevel');
        
        function updateDimensions() {
            const img = document.getElementById('preview');
            document.getElementById('dimensions').textContent = 
                img.naturalWidth + ' × ' + img.naturalHeight + ' px';
        }
        
        function showError() {
            document.querySelector('.image-container').innerHTML = 
                '<div class="error">Failed to load image. The base64 string might be invalid or corrupted.</div>';
        }
        
        function zoomIn() {
            currentZoom += zoomStep;
            applyZoom();
        }
        
        function zoomOut() {
            if (currentZoom > zoomStep) {
                currentZoom -= zoomStep;
                applyZoom();
            }
        }
        
        function resetZoom() {
            currentZoom = 100;
            applyZoom();
        }
        
        function applyZoom() {
            img.style.transform = 'scale(' + (currentZoom / 100) + ')';
            zoomLevelSpan.textContent = currentZoom + '%';
        }
        
        function downloadImage() {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'image-' + Date.now() + '.png';
            link.click();
        }
        
        function copyToClipboard() {
            navigator.clipboard.writeText(img.src).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }
    </script>
</body>
</html>`;
}

export function deactivate() {}

