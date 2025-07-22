// Background script for Prompt Enhancer
try {
  console.log("🟣 BACKGROUND SCRIPT STARTING...")
  console.log("🟣 Background script loaded at:", new Date().toISOString())
  
  // Test interval (shorter for debugging)
  let heartbeatCount = 0
  const heartbeatInterval = setInterval(() => {
    heartbeatCount++
    console.log(`💓 Heartbeat #${heartbeatCount}:`, new Date().toISOString())
  }, 10000)
  
  // Add message handler
  console.log("🔧 Setting up message handler...")
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("📨 MESSAGE RECEIVED:", {
      message,
      sender: sender.tab ? `Tab ${sender.tab.id}` : 'Unknown sender',
      timestamp: new Date().toISOString()
    })
    
    if (message && message.name === 'enhance') {
      console.log("🎯 Processing enhance request...")
      console.log("📋 Request body:", message.body)
      
      // Use real API enhancement
      handleEnhance(message.body)
        .then(result => {
          console.log("✅ Enhancement successful:", result)
          sendResponse(result)
        })
        .catch(error => {
          console.error("❌ Enhancement error:", error)
          const errorResponse = {
            enhancedPrompt: message.body.prompt,
            improvements: [`Error: ${error.message}`]
          }
          sendResponse(errorResponse)
        })
      
      return true // Keep message channel open for async response
    } else {
      console.log("❓ Unknown message:", message)
    }
  })
  
  console.log("✅ Background script initialization complete with message handler")

} catch (error) {
  console.error("❌ Background script initialization error:", error)
}

// Enhancement functions
async function handleEnhance(body: { prompt: string }): Promise<{ enhancedPrompt: string, improvements: string[] }> {
  console.log("🔍 handleEnhance() called with body:", body)
  
  const { prompt } = body
  
  if (!prompt || prompt.trim().length === 0) {
    console.log("❌ No prompt provided")
    return {
      enhancedPrompt: prompt || "",
      improvements: ["No prompt provided"]
    }
  }

  console.log("📝 Prompt to enhance:", prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""))
  console.log("🔧 Retrieving stored configuration...")
  
  const { apiKey, provider } = await getStoredConfig()
  console.log("⚙️ Config retrieved:", { 
    hasApiKey: !!apiKey, 
    provider,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + "..." : "none"
  })
  
  if (!apiKey) {
    console.log("❌ No API key found in storage")
    return {
      enhancedPrompt: prompt,
      improvements: ["API key not configured. Please set up your API key in the extension popup."]
    }
  }

  if (provider === 'openai') {
    console.log("🤖 Using OpenAI provider")
    return enhanceWithOpenAI(prompt, apiKey)
  } else {
    console.log("❌ Unsupported provider:", provider)
    return {
      enhancedPrompt: prompt,
      improvements: [`Unsupported provider: ${provider}. Please select OpenAI.`]
    }
  }
}

async function getStoredConfig(): Promise<{ apiKey: string, provider: string }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'provider'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        provider: result.provider || 'openai'
      })
    })
  })
}

async function enhanceWithOpenAI(prompt: string, apiKey: string): Promise<{ enhancedPrompt: string, improvements: string[] }> {
  console.log("🚀 Starting OpenAI enhancement...")
  console.log("📊 API Key validation:", {
    hasKey: !!apiKey,
    keyLength: apiKey.length,
    keyFormat: apiKey.startsWith('sk-') ? 'Valid' : 'Invalid format'
  })
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Key should start with "sk-"')
  }
  
  const systemPrompt = `You are a prompt enhancement specialist. Your job is to improve user prompts to make them more effective for AI interactions.

Analyze the given prompt and enhance it by:
1. Making instructions clearer and more specific
2. Identifying and addressing hidden assumptions
3. Adding relevant context that might be missing
4. Structuring the request for better AI understanding
5. Ensuring the tone and format are appropriate

Return your response as JSON with this exact structure:
{
  "enhancedPrompt": "the improved version of the prompt",
  "improvements": ["list of specific improvements made"]
}

Do not include any text outside the JSON response.`

  console.log("🌐 Making API request to OpenAI...")
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    })

    console.log("📡 OpenAI API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ OpenAI API error:", errorText)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("📦 OpenAI response received")
    
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from OpenAI')
    }

    console.log("📄 Raw OpenAI content:", content.substring(0, 200) + "...")

    try {
      const parsed = JSON.parse(content)
      console.log("✅ Successfully parsed OpenAI response")
      return parsed
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response as JSON")
      return {
        enhancedPrompt: prompt,
        improvements: ['Failed to parse enhancement response - please try again']
      }
    }
  } catch (fetchError) {
    console.error("❌ Network error during OpenAI API call:", fetchError)
    throw new Error(`Network error: ${fetchError.message}`)
  }
}