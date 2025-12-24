# Base64 Image Preview

A VS Code extension that converts base64 strings to images and displays them in a beautiful preview panel.

## Features

- 🖼️ **Convert base64 strings to images** - Select any base64 string and preview it as an image
- 🔍 **Smart detection** - Automatically detects image format (PNG, JPEG, GIF, WebP, BMP)
- 📊 **Image information** - Shows dimensions, file size, and base64 length
- 🔎 **Zoom controls** - Zoom in/out and reset to original size
- 💾 **Download images** - Save the decoded image to your computer
- 📋 **Copy data URI** - Copy the full data URI to clipboard
- 🎨 **Theme-aware** - Adapts to your VS Code theme

## Usage

1. Select a base64 string in your editor (or place cursor on a line with base64)
2. Right-click and select **"Show Image from Base64"** from the context menu
3. Or use the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and search for **"Show Image from Base64"**

The extension will:
- Automatically remove common prefixes like `data:image/png;base64,`
- Remove surrounding quotes
- Validate the base64 string
- Display the image in a side panel with controls

## Supported Formats

- PNG
- JPEG/JPG
- GIF
- WebP
- BMP

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to open a new VS Code window with the extension loaded

### Packaging

To create a `.vsix` file for distribution:

```bash
npm install -g @vscode/vsce
vsce package
```

Then install the `.vsix` file in VS Code.

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run the extension in debug mode
Press F5 in VS Code
```

## Requirements

- VS Code version 1.75.0 or higher

## License

MIT

