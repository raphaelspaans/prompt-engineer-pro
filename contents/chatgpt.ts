import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://chatgpt.com/*", "https://chat.openai.com/*"]
}

export {}

// Vanilla JavaScript content script to avoid React conflicts
let isEnhancing = false
let showModal = false
let originalPrompt = ""
let enhancedPrompt = ""
let improvements: string[] = []

// Theme system
interface Theme {
  background: string
  surface: string
  surfaceSecondary: string
  text: string
  textSecondary: string
  border: string
  borderFocus: string
  accent: string
  accentHover: string
  shadow: string
  gradient: string
  blur: string
}

const themes = {
  dark: {
    background: 'rgba(15, 15, 15, 0.95)',
    surface: 'rgba(25, 25, 25, 0.98)',
    surfaceSecondary: 'rgba(35, 35, 35, 0.9)',
    text: '#ffffff',
    textSecondary: '#a1a1aa',
    border: 'rgba(63, 63, 70, 0.4)',
    borderFocus: 'rgba(139, 92, 246, 0.5)',
    accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentHover: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    gradient: 'linear-gradient(135deg, rgba(15, 15, 15, 0.95) 0%, rgba(25, 25, 35, 0.95) 100%)',
    blur: 'blur(20px)'
  } as Theme,
  light: {
    background: 'rgba(255, 255, 255, 0.95)',
    surface: 'rgba(248, 250, 252, 0.98)',
    surfaceSecondary: 'rgba(241, 245, 249, 0.9)',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: 'rgba(226, 232, 240, 0.8)',
    borderFocus: 'rgba(59, 130, 246, 0.5)',
    accent: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentHover: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
    blur: 'blur(20px)'
  } as Theme
}

function detectTheme(): Theme {
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  // Try to detect ChatGPT theme
  const htmlElement = document.documentElement
  const bodyClasses = document.body.className
  const computedStyle = window.getComputedStyle(document.body)
  const backgroundColor = computedStyle.backgroundColor
  
  // Check for dark theme indicators
  const isDarkMode = 
    prefersDark ||
    bodyClasses.includes('dark') ||
    htmlElement.classList.contains('dark') ||
    backgroundColor.includes('rgb(0') || // Very dark backgrounds
    backgroundColor.includes('rgb(1') ||
    backgroundColor.includes('rgb(2')
  
  console.log('🎨 Theme detection:', { 
    prefersDark, 
    bodyClasses, 
    backgroundColor, 
    isDarkMode 
  })
  
  return isDarkMode ? themes.dark : themes.light
}

function findChatInput(): HTMLElement | null {
  const selectors = [
    'textarea[data-id="root"]',
    '#prompt-textarea', 
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Message ChatGPT"]',
    'textarea[placeholder*="Ask me anything"]',
    'div[contenteditable="true"]',
    '[data-testid="prompt-input"]',
    'form textarea',
    'main textarea'
  ]
  
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      console.log(`Found input with selector: ${selector}`)
      return element
    }
  }
  
  console.log('No ChatGPT input found')
  return null
}

function getInputValue(element: HTMLElement): string {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return (element as HTMLTextAreaElement).value
  } else if (element.getAttribute('contenteditable') === 'true') {
    return element.innerText || element.textContent || ''
  }
  return ''
}

function setInputValue(element: HTMLElement, value: string): void {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    (element as HTMLTextAreaElement).value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
  } else if (element.getAttribute('contenteditable') === 'true') {
    element.innerText = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
  element.focus()
}

async function enhancePrompt() {
  console.log("🚀 enhancePrompt() called")
  
  if (isEnhancing) {
    console.log("❌ Already enhancing, skipping")
    return
  }
  
  const inputElement = findChatInput()
  if (!inputElement) {
    console.log("❌ No input element found")
    alert("Could not find ChatGPT input field. Please try refreshing the page.")
    return
  }

  const currentValue = getInputValue(inputElement)
  console.log("📝 Current prompt value:", currentValue)
  
  if (!currentValue || !currentValue.trim()) {
    console.log("❌ No prompt entered")
    alert("Please enter a prompt first")
    return
  }

  console.log("✅ Starting enhancement process...")
  originalPrompt = currentValue
  isEnhancing = true
  updateButton()
  
  try {
    console.log("📤 Sending message to background script...")
    
    const message = { name: 'enhance', body: { prompt: currentValue } }
    console.log("📋 Message to send:", message)
    
    // Use chrome.runtime.sendMessage directly from content script
    const response = await new Promise<any>((resolve, reject) => {
      console.log("📞 Calling chrome.runtime.sendMessage directly...")
      
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.error("❌ Chrome runtime not available")
        reject(new Error("Chrome extension runtime not available"))
        return
      }
      
      chrome.runtime.sendMessage(message, (response) => {
        console.log("📥 Direct response from background:", response)
        console.log("🔍 Chrome runtime last error:", chrome.runtime.lastError)
        
        if (chrome.runtime.lastError) {
          console.error("❌ Chrome runtime error:", chrome.runtime.lastError.message)
          reject(new Error(chrome.runtime.lastError.message))
        } else if (!response) {
          console.error("❌ No response received from background")
          reject(new Error("No response from background script"))
        } else {
          console.log("✅ Valid response received:", response)
          resolve(response)
        }
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Background response timeout'))
      }, 30000)
    })
    
    console.log("🎯 Processing response:", response)
    
    if (!response.enhancedPrompt) {
      throw new Error("Invalid response: no enhanced prompt received")
    }
    
    enhancedPrompt = response.enhancedPrompt
    improvements = response.improvements || []
    
    console.log("✅ Enhancement complete:", {
      originalLength: originalPrompt.length,
      enhancedLength: enhancedPrompt.length,
      improvementsCount: improvements.length
    })
    
    showEnhancementModal()
  } catch (error) {
    console.error("❌ Enhancement failed:", error)
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    // Show more specific error message based on the error
    let errorMessage = "Failed to enhance prompt. "
    if (error.message.includes("runtime not available")) {
      errorMessage += "Extension runtime error. Please reload the page and try again."
    } else if (error.message.includes("No response")) {
      errorMessage += "Background script not responding. Please reload the extension."
    } else if (error.message.includes("API")) {
      errorMessage += "API error. Please check your API configuration."
    } else {
      errorMessage += `Error: ${error.message}`
    }
    
    alert(errorMessage)
  } finally {
    console.log("🏁 Enhancement process finished")
    isEnhancing = false
    updateButton()
  }
}

function updateButton() {
  const button = document.getElementById('prompt-enhancer-button')
  if (!button) return
  
  const theme = detectTheme()
  
  if (isEnhancing) {
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="
          width: 18px; 
          height: 18px; 
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-left: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span style="
          background: linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        ">Enhancing...</span>
      </div>
    `
    button.style.cursor = 'not-allowed'
    button.style.transform = 'translateY(0px) scale(1)'
    button.style.background = `linear-gradient(135deg, 
      rgba(102, 126, 234, 0.8) 0%, 
      rgba(139, 92, 246, 0.8) 50%, 
      rgba(102, 126, 234, 0.8) 100%)`
    button.style.backgroundSize = '200% 200%'
    button.style.animation = 'gradientShift 3s ease infinite'
    
    // Add enhanced loading animations
    const enhancedLoadingStyle = document.createElement('style')
    enhancedLoadingStyle.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `
    document.head.appendChild(enhancedLoadingStyle)
  } else {
    button.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px; transition: transform 0.2s ease;">✨</span>
        <span style="transition: color 0.2s ease;">Enhance Prompt</span>
      </div>
    `
    button.style.cursor = 'pointer'
    button.style.background = theme.accent
    button.style.animation = 'none'
    button.style.backgroundSize = '100% 100%'
  }
}

function createButton() {
  // Remove existing button if it exists
  const existingButton = document.getElementById('prompt-enhancer-button')
  if (existingButton) {
    existingButton.remove()
  }

  const theme = detectTheme()
  const button = document.createElement('button')
  button.id = 'prompt-enhancer-button'
  
  // Create inner content with icon and text
  button.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 16px;">✨</span>
      <span>Enhance Prompt</span>
    </div>
  `
  
  button.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    background: ${theme.accent};
    color: white;
    border: none;
    border-radius: 16px;
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: ${theme.shadow};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    backdrop-filter: ${theme.blur};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(0px);
    user-select: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `
  
  // Add enhanced hover effects with micro-interactions
  button.addEventListener('mouseenter', () => {
    if (!isEnhancing) {
      button.style.background = theme.accentHover
      button.style.transform = 'translateY(-3px) scale(1.05)'
      button.style.boxShadow = `${theme.shadow}, 0 0 25px rgba(102, 126, 234, 0.5)`
      
      // Animate the emoji
      const emoji = button.querySelector('span[style*="font-size: 16px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(25deg) scale(1.2)'
      }
    }
  })
  
  button.addEventListener('mouseleave', () => {
    if (!isEnhancing) {
      button.style.background = theme.accent
      button.style.transform = 'translateY(0px) scale(1)'
      button.style.boxShadow = theme.shadow
      
      // Reset emoji animation
      const emoji = button.querySelector('span[style*="font-size: 16px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(0deg) scale(1)'
      }
    }
  })
  
  // Add click handler with ripple effect
  button.addEventListener('click', (e) => {
    if (isEnhancing) return // Prevent double clicks during processing
    
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `
    
    button.style.position = 'relative'
    button.style.overflow = 'hidden'
    button.appendChild(ripple)
    
    setTimeout(() => ripple.remove(), 600)
    enhancePrompt()
  })
  
  // Add ripple keyframes
  const style = document.createElement('style')
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
    
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `
  document.head.appendChild(style)
  
  document.body.appendChild(button)
}

// Streaming text animation function
function typeWriterEffect(element: HTMLElement, text: string, speed: number = 30): Promise<void> {
  return new Promise((resolve) => {
    element.innerHTML = ''
    let index = 0
    
    // Add cursor
    const cursor = document.createElement('span')
    cursor.style.cssText = `
      display: inline-block;
      width: 2px;
      height: 1.2em;
      background-color: currentColor;
      animation: blink 1s infinite;
      margin-left: 2px;
    `
    element.appendChild(cursor)
    
    const timer = setInterval(() => {
      if (index < text.length) {
        // Insert character before cursor
        const char = text[index]
        const charSpan = document.createElement('span')
        charSpan.textContent = char
        charSpan.style.opacity = '0'
        charSpan.style.animation = 'fadeInChar 0.1s ease-out forwards'
        
        element.insertBefore(charSpan, cursor)
        index++
      } else {
        // Animation complete, remove cursor
        clearInterval(timer)
        cursor.remove()
        resolve()
      }
    }, speed)
  })
}

function showEnhancementModal() {
  // Remove existing modal
  const existingModal = document.getElementById('prompt-enhancer-modal')
  if (existingModal) {
    existingModal.remove()
  }

  const theme = detectTheme()
  const modal = document.createElement('div')
  modal.id = 'prompt-enhancer-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${theme.background};
    backdrop-filter: ${theme.blur};
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    opacity: 0;
    animation: fadeIn 0.3s ease-out forwards;
  `

  const improvementsHtml = improvements.length > 0 ? `
    <div style="margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: ${theme.textSecondary}; font-size: 16px; font-weight: 600;">✨ Improvements Made</h3>
      <ul style="margin: 0; padding-left: 20px; color: ${theme.text}; font-size: 14px; line-height: 1.6;">
        ${improvements.map(imp => `
          <li style="margin-bottom: 8px; position: relative;">
            <span style="color: ${theme.accent.includes('linear') ? '#8b5cf6' : theme.accent};">•</span>
            <span style="margin-left: 8px;">${imp}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : ''

  modal.innerHTML = `
    <div style="
      background: ${theme.surface};
      backdrop-filter: ${theme.blur};
      border: 1px solid ${theme.border};
      border-radius: 20px;
      max-width: 920px;
      width: 90vw;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: ${theme.shadow};
      animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    ">
      <div style="padding: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 28px;">
          <div style="
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: ${theme.accent};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">✨</div>
          <h2 style="margin: 0; color: ${theme.text}; font-size: 24px; font-weight: 700;">
            Prompt Enhancement
          </h2>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 16px;">📝</span>
              <h3 style="margin: 0; color: ${theme.textSecondary}; font-size: 16px; font-weight: 600;">Original Prompt</h3>
            </div>
            <div style="
              border: 1px solid ${theme.border};
              border-radius: 12px;
              padding: 16px;
              background: ${theme.surfaceSecondary};
              min-height: 140px;
              font-size: 14px;
              line-height: 1.6;
              color: ${theme.text};
              overflow-y: auto;
              max-height: 200px;
            ">
              ${originalPrompt}
            </div>
          </div>
          
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 16px;">🚀</span>
              <h3 style="margin: 0; color: ${theme.textSecondary}; font-size: 16px; font-weight: 600;">Enhanced Prompt</h3>
            </div>
            <div id="enhanced-prompt-container" style="
              border: 1px solid ${theme.borderFocus};
              border-radius: 12px;
              padding: 16px;
              background: ${theme.surfaceSecondary};
              min-height: 140px;
              font-size: 14px;
              line-height: 1.6;
              color: ${theme.text};
              overflow-y: auto;
              max-height: 200px;
              position: relative;
            ">
              <div id="enhanced-text" style="
                opacity: 0;
                animation: fadeInText 0.5s ease-out 0.3s forwards;
              "></div>
              <div id="loading-indicator" style="
                display: flex;
                flex-direction: column;
                gap: 16px;
                color: ${theme.textSecondary};
                font-size: 13px;
              ">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, ${theme.accent.includes('linear') ? '#8b5cf6, #ec4899' : theme.accent + ', #10b981'});
                    border-radius: 6px;
                    animation: pulse 2s infinite;
                    position: relative;
                    overflow: hidden;
                  ">
                    <div style="
                      position: absolute;
                      top: 0;
                      left: -100%;
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                      animation: shimmer 2s infinite;
                    "></div>
                  </div>
                  <span style="
                    background: linear-gradient(90deg, ${theme.textSecondary} 25%, ${theme.text} 50%, ${theme.textSecondary} 75%);
                    background-size: 200% 100%;
                    animation: textShimmer 2s infinite;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                  ">Analyzing your prompt...</span>
                </div>
                
                <!-- Loading skeleton for text content -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="
                    height: 12px;
                    background: linear-gradient(90deg, ${theme.surfaceSecondary} 25%, rgba(255,255,255,0.1) 50%, ${theme.surfaceSecondary} 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: 6px;
                    width: 90%;
                  "></div>
                  <div style="
                    height: 12px;
                    background: linear-gradient(90deg, ${theme.surfaceSecondary} 25%, rgba(255,255,255,0.1) 50%, ${theme.surfaceSecondary} 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite 0.2s;
                    border-radius: 6px;
                    width: 70%;
                  "></div>
                  <div style="
                    height: 12px;
                    background: linear-gradient(90deg, ${theme.surfaceSecondary} 25%, rgba(255,255,255,0.1) 50%, ${theme.surfaceSecondary} 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite 0.4s;
                    border-radius: 6px;
                    width: 85%;
                  "></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${improvementsHtml}

        <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid ${theme.border};">
          <button id="cancel-enhancement" style="
            padding: 12px 24px;
            border: 1px solid ${theme.border};
            border-radius: 12px;
            background: ${theme.surface};
            color: ${theme.textSecondary};
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            position: relative;
            overflow: hidden;
          ">
            <span style='position: relative; z-index: 2; display: flex; align-items: center; gap: 6px;'>
              <span style='font-size: 12px; transition: transform 0.2s ease;'>❌</span>
              Cancel
            </span>
          </button>
          <button id="accept-enhancement" style="
            padding: 12px 24px;
            border: none;
            border-radius: 12px;
            background: ${theme.accent};
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: inherit;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
          ">
            <span style='position: relative; z-index: 2; display: flex; align-items: center; gap: 8px;'>
              <span style='font-size: 14px; transition: transform 0.2s ease;'>✨</span>
              Use Enhanced Prompt
            </span>
          </button>
        </div>
      </div>
    </div>
  `

  // Add modal animations and typewriter effects
  const modalStyle = document.createElement('style')
  modalStyle.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes fadeInText {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes fadeInChar {
      from { 
        opacity: 0; 
        transform: translateY(5px);
      }
      to { 
        opacity: 1; 
        transform: translateY(0);
      }
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1);
      }
    }
    
    @keyframes textShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes buttonPulse {
      0%, 100% {
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5);
      }
      50% {
        box-shadow: 0 12px 24px rgba(102, 126, 234, 0.7), 0 0 0 4px rgba(102, 126, 234, 0.1);
      }
    }
  `
  document.head.appendChild(modalStyle)

  document.body.appendChild(modal)
  
  // Start streaming animation after modal appears
  setTimeout(() => {
    const loadingIndicator = document.getElementById('loading-indicator')
    const enhancedTextElement = document.getElementById('enhanced-text')
    
    if (loadingIndicator && enhancedTextElement) {
      // Hide loading indicator
      loadingIndicator.style.opacity = '0'
      loadingIndicator.style.transition = 'opacity 0.3s ease'
      
      setTimeout(() => {
        loadingIndicator.style.display = 'none'
        
        // Start typewriter effect
        typeWriterEffect(enhancedTextElement, enhancedPrompt, 25).then(() => {
          console.log("✅ Streaming animation completed")
        })
      }, 300)
    }
  }, 800) // Delay to let the modal slide in animation complete
  
  // Add event listeners after modal is in DOM
  console.log("🔘 Adding button event listeners...")
  
  const cancelButton = document.getElementById('cancel-enhancement')
  const acceptButton = document.getElementById('accept-enhancement')
  
  if (cancelButton) {
    // Add enhanced hover effects with micro-interactions
    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.background = theme.surfaceSecondary
      cancelButton.style.color = theme.text
      cancelButton.style.transform = 'translateY(-2px) scale(1.02)'
      cancelButton.style.borderColor = theme.borderFocus
      
      // Animate the emoji
      const emoji = cancelButton.querySelector('span[style*="font-size: 12px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(-10deg) scale(1.1)'
      }
      
      // Add subtle background animation
      cancelButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
    })
    
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.background = theme.surface
      cancelButton.style.color = theme.textSecondary
      cancelButton.style.transform = 'translateY(0) scale(1)'
      cancelButton.style.borderColor = theme.border
      cancelButton.style.boxShadow = 'none'
      
      // Reset emoji
      const emoji = cancelButton.querySelector('span[style*="font-size: 12px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(0deg) scale(1)'
      }
    })
    
    cancelButton.addEventListener('click', () => {
      console.log("❌ Cancel button clicked")
      modal.style.animation = 'fadeOut 0.2s ease-in forwards'
      setTimeout(() => modal.remove(), 200)
    })
    console.log("✅ Cancel button listener added")
  } else {
    console.error("❌ Cancel button not found")
  }

  if (acceptButton) {
    // Add enhanced hover effects with micro-interactions
    acceptButton.addEventListener('mouseenter', () => {
      acceptButton.style.background = theme.accentHover
      acceptButton.style.transform = 'translateY(-2px) scale(1.05)'
      acceptButton.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.5)'
      
      // Animate the emoji
      const emoji = acceptButton.querySelector('span[style*="font-size: 14px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(360deg) scale(1.2)'
        emoji.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }
      
      // Add subtle pulsing effect
      acceptButton.style.animation = 'buttonPulse 2s infinite'
    })
    
    acceptButton.addEventListener('mouseleave', () => {
      acceptButton.style.background = theme.accent
      acceptButton.style.transform = 'translateY(0) scale(1)'
      acceptButton.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
      acceptButton.style.animation = 'none'
      
      // Reset emoji
      const emoji = acceptButton.querySelector('span[style*="font-size: 14px"]')
      if (emoji) {
        emoji.style.transform = 'rotate(0deg) scale(1)'
        emoji.style.transition = 'transform 0.3s ease'
      }
    })
    
    acceptButton.addEventListener('click', () => {
      console.log("✅ Accept button clicked")
      
      // Add success animation
      acceptButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            width: 16px; 
            height: 16px; 
            border: 2px solid white;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          "></div>
          <span>Applying...</span>
        </div>
      `
      
      const inputElement = findChatInput()
      if (inputElement) {
        console.log("🔄 Replacing input value...")
        setInputValue(inputElement, enhancedPrompt)
        console.log("✅ Input value replaced")
        
        // Success animation
        setTimeout(() => {
          acceptButton.innerHTML = '✅ Applied!'
          acceptButton.style.background = '#10b981'
          setTimeout(() => {
            modal.style.animation = 'fadeOut 0.3s ease-in forwards'
            setTimeout(() => modal.remove(), 300)
          }, 800)
        }, 500)
      } else {
        console.error("❌ Input element not found")
        modal.remove()
      }
    })
    console.log("✅ Accept button listener added")
  } else {
    console.error("❌ Accept button not found")
  }
  
  // Add fadeOut animation
  const fadeOutStyle = document.createElement('style')
  fadeOutStyle.innerHTML = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `
  document.head.appendChild(fadeOutStyle)
  
  // Close modal when clicking backdrop
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.animation = 'fadeOut 0.2s ease-in forwards'
      setTimeout(() => modal.remove(), 200)
    }
  })
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButton)
} else {
  createButton()
}

// Also try to create button after a short delay in case the page is still loading
setTimeout(createButton, 2000)