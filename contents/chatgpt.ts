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
  if (button) {
    button.textContent = isEnhancing ? "Enhancing..." : "🚀 Enhance Prompt"
    button.style.opacity = isEnhancing ? '0.7' : '1'
    button.style.cursor = isEnhancing ? 'not-allowed' : 'pointer'
  }
}

function createButton() {
  // Remove existing button if it exists
  const existingButton = document.getElementById('prompt-enhancer-button')
  if (existingButton) {
    existingButton.remove()
  }

  const button = document.createElement('button')
  button.id = 'prompt-enhancer-button'
  button.textContent = '🚀 Enhance Prompt'
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background-color: #10a37f;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-family: system-ui, -apple-system, sans-serif;
  `
  
  button.addEventListener('click', enhancePrompt)
  document.body.appendChild(button)
}

function showEnhancementModal() {
  // Remove existing modal
  const existingModal = document.getElementById('prompt-enhancer-modal')
  if (existingModal) {
    existingModal.remove()
  }

  const modal = document.createElement('div')
  modal.id = 'prompt-enhancer-modal'
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
  `

  const improvementsHtml = improvements.length > 0 ? `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">Improvements Made</h3>
      <ul style="margin: 0; padding-left: 20px; color: #2d3748; font-size: 14px;">
        ${improvements.map(imp => `<li style="margin-bottom: 4px;">${imp}</li>`).join('')}
      </ul>
    </div>
  ` : ''

  modal.innerHTML = `
    <div style="background-color: white; border-radius: 12px; max-width: 900px; width: 90vw; max-height: 80vh; overflow: auto; padding: 24px;">
      <h2 style="margin: 0 0 20px 0; color: #2d3748;">Prompt Enhancement</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">Original Prompt</h3>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f7fafc; min-height: 120px; font-size: 14px; line-height: 1.5;">
            ${originalPrompt}
          </div>
        </div>
        
        <div>
          <h3 style="margin: 0 0 10px 0; color: #4a5568; font-size: 16px;">Enhanced Prompt</h3>
          <div style="border: 1px solid #10a37f; border-radius: 8px; padding: 12px; background-color: #f0fdf4; min-height: 120px; font-size: 14px; line-height: 1.5;">
            ${enhancedPrompt}
          </div>
        </div>
      </div>

      ${improvementsHtml}

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-enhancement" style="padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 8px; background-color: white; color: #374151; cursor: pointer; font-size: 14px; font-weight: 500;">
          Cancel
        </button>
        <button id="accept-enhancement" style="padding: 10px 20px; border: none; border-radius: 8px; background-color: #10a37f; color: white; cursor: pointer; font-size: 14px; font-weight: 600;">
          Use Enhanced Prompt
        </button>
      </div>
    </div>
  `

  document.body.appendChild(modal)
  
  // Add event listeners after modal is in DOM
  console.log("🔘 Adding button event listeners...")
  
  const cancelButton = document.getElementById('cancel-enhancement')
  const acceptButton = document.getElementById('accept-enhancement')
  
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      console.log("❌ Cancel button clicked")
      modal.remove()
    })
    console.log("✅ Cancel button listener added")
  } else {
    console.error("❌ Cancel button not found")
  }

  if (acceptButton) {
    acceptButton.addEventListener('click', () => {
      console.log("✅ Accept button clicked")
      const inputElement = findChatInput()
      if (inputElement) {
        console.log("🔄 Replacing input value...")
        setInputValue(inputElement, enhancedPrompt)
        console.log("✅ Input value replaced")
      } else {
        console.error("❌ Input element not found")
      }
      modal.remove()
    })
    console.log("✅ Accept button listener added")
  } else {
    console.error("❌ Accept button not found")
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createButton)
} else {
  createButton()
}

// Also try to create button after a short delay in case the page is still loading
setTimeout(createButton, 2000)