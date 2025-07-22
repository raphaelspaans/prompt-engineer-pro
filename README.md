# ChatGPT Prompt Enhancer 🚀

A powerful browser extension that enhances your ChatGPT prompts using AI to make them clearer, more specific, and more effective.

## Features ✨

- **AI-Powered Enhancement**: Uses OpenAI GPT-4 to analyze and improve your prompts
- **Side-by-Side Comparison**: See your original prompt alongside the enhanced version
- **Detailed Improvements**: Get specific feedback on what was improved and why
- **One-Click Integration**: Seamlessly replace your original prompt with the enhanced version
- **Privacy Focused**: Your API key is stored securely in your browser
- **Real-time Processing**: Fast enhancement directly within ChatGPT's interface

## How It Works 🔄

1. **Type your prompt** in ChatGPT as usual
2. **Click "🚀 Enhance Prompt"** button (appears in bottom-right corner)
3. **Review the enhancement** in a clean side-by-side modal
4. **See specific improvements** like clarity, structure, and assumptions addressed
5. **Accept or reject** the enhanced version
6. **Continue with ChatGPT** using your improved prompt

## Installation 📦

### Prerequisites
- Chrome browser (or Chromium-based browser)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Install the Extension

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/yourusername/chatgpt-prompt-enhancer.git
   cd chatgpt-prompt-enhancer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   # or
   pnpm build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-dev` folder

### Configuration

1. **Click the extension icon** in your Chrome toolbar
2. **Enter your OpenAI API key**
3. **Select your provider** (OpenAI recommended)
4. **Click "Save Settings"**

## Usage 💡

### Basic Enhancement
```
Original: "Help me with math"
Enhanced: "I'm struggling with specific areas of mathematics and would like targeted guidance. Could you help me identify effective learning strategies for improving my mathematical skills, including recommended resources and practice methods for building stronger fundamentals?"
```

### The Extension Improves:
- **Clarity**: Makes vague requests more specific
- **Structure**: Organizes complex requests logically  
- **Context**: Adds relevant background information
- **Assumptions**: Identifies and addresses hidden assumptions
- **Actionability**: Makes requests more actionable for AI

## Development 🛠️

### Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run package` - Package for distribution

### Project Structure
```
├── contents/
│   └── chatgpt.ts          # Main content script
├── background/
│   └── index.ts            # Background service worker
├── popup.tsx               # Extension configuration popup
├── assets/
│   └── icon.png           # Extension icon
└── build/                 # Built extension files
```

### Tech Stack
- **Framework**: [Plasmo](https://www.plasmo.com/) - Browser extension framework
- **Language**: TypeScript
- **UI**: React for popup, Vanilla JS for content script
- **API**: OpenAI GPT-4 for prompt enhancement

## API Usage 📊

The extension uses OpenAI's GPT-4 model for prompt enhancement. Typical usage:
- **Cost**: ~$0.01-0.05 per enhancement (depending on prompt length)
- **Speed**: 2-5 seconds per enhancement
- **Model**: GPT-4 (latest) for best results

## Privacy & Security 🔒

- **API keys stored locally** in Chrome's secure storage
- **No data sent to third parties** except OpenAI for processing
- **No tracking or analytics**
- **Open source** - audit the code yourself

## Troubleshooting 🔧

### Common Issues

**"API key not configured"**
- Ensure you've entered a valid OpenAI API key in the extension popup
- Verify the key starts with `sk-`

**"No response from background script"**
- Try reloading the extension at `chrome://extensions`
- Refresh the ChatGPT page

**Extension button not visible**
- Make sure you're on `chatgpt.com`
- Try refreshing the page
- Check if the extension is enabled

**API quota exceeded**
- Check your OpenAI billing at platform.openai.com
- Ensure you have available credits

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog 📝

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you encounter issues or have questions:
1. Check the [troubleshooting section](#troubleshooting-)
2. Open an issue on GitHub
3. Make sure to include browser version, extension version, and error messages

## Roadmap 🗺️

- [ ] Support for Anthropic Claude
- [ ] Custom enhancement templates
- [ ] Bulk prompt enhancement
- [ ] Export/import prompt collections
- [ ] Usage analytics dashboard
- [ ] Multi-language support

---

**Made with ❤️ by [Your Name]**

*Enhance your AI conversations, one prompt at a time.*