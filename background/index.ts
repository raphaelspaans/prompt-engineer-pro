// Background script for Prompt Enhancer
try {
  console.log("🟣 BACKGROUND SCRIPT STARTING...")
  console.log("🟣 Background script loaded at:", new Date().toISOString())
  
  // Background script ready
  
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
  
  const { apiKey, provider, model } = await getStoredConfig()
  console.log("⚙️ Config retrieved:", { 
    hasApiKey: !!apiKey, 
    provider,
    model,
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
    console.log(`🤖 Using OpenAI provider with model: ${model}`)
    return enhanceWithOpenAI(prompt, apiKey, model)
  } else {
    console.log("❌ Unsupported provider:", provider)
    return {
      enhancedPrompt: prompt,
      improvements: [`Unsupported provider: ${provider}. Please select OpenAI.`]
    }
  }
}

async function getStoredConfig(): Promise<{ apiKey: string, provider: string, model: string }> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiKey', 'provider', 'model'], (result) => {
      resolve({
        apiKey: result.apiKey || '',
        provider: result.provider || 'openai',
        model: result.model || 'gpt-4o-mini'
      })
    })
  })
}

async function enhanceWithOpenAI(prompt: string, apiKey: string, model: string = 'gpt-4o-mini'): Promise<{ enhancedPrompt: string, improvements: string[] }> {
  console.log(`🚀 Starting OpenAI enhancement with model: ${model}`)
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
        model: model,
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

    console.log("📄 Raw OpenAI content:", content.substring(0, 500) + "...")

    // Improved JSON parsing with multiple strategies
    const result = parseEnhancementResponse(content, prompt)
    console.log("✅ Successfully processed OpenAI response")
    return result
  } catch (fetchError) {
    console.error("❌ Network error during OpenAI API call:", fetchError)
    throw new Error(`Network error: ${fetchError.message}`)
  }
}

function parseEnhancementResponse(content: string, originalPrompt: string): { enhancedPrompt: string, improvements: string[] } {
  console.log("🔍 Parsing enhancement response with multiple strategies...")
  
  // Strategy 1: Direct JSON parsing
  try {
    const parsed = JSON.parse(content)
    if (parsed.enhancedPrompt && parsed.improvements) {
      console.log("✅ Strategy 1: Direct JSON parse successful")
      return parsed
    }
  } catch (error) {
    console.log("⚠️ Strategy 1 failed: Direct JSON parse error")
  }

  // Strategy 2: Extract JSON from markdown code block
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1])
      if (parsed.enhancedPrompt && parsed.improvements) {
        console.log("✅ Strategy 2: Markdown JSON block extraction successful")
        return parsed
      }
    }
  } catch (error) {
    console.log("⚠️ Strategy 2 failed: Markdown extraction error")
  }

  // Strategy 3: Find first complete JSON object in the content
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.enhancedPrompt && parsed.improvements) {
        console.log("✅ Strategy 3: JSON object extraction successful")
        return parsed
      }
    }
  } catch (error) {
    console.log("⚠️ Strategy 3 failed: JSON object extraction error")
  }

  // Strategy 4: Manual extraction using regex patterns
  try {
    const enhancedMatch = content.match(/"enhancedPrompt"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
    const improvementsMatch = content.match(/"improvements"\s*:\s*\[([\s\S]*?)\]/);
    
    if (enhancedMatch) {
      let enhanc = enhancedMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      let improvements: string[] = [];
      
      if (improvementsMatch) {
        // Extract individual improvement strings
        const improvStr = improvementsMatch[1];
        const impMatches = improvStr.match(/"([^"]*(?:\\.[^"]*)*)"/g);
        if (impMatches) {
          improvements = impMatches.map(match => 
            match.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n')
          );
        }
      }
      
      console.log("✅ Strategy 4: Manual regex extraction successful")
      return {
        enhancedPrompt: enhanc,
        improvements: improvements.length > 0 ? improvements : ["Prompt enhanced with improved clarity and structure"]
      }
    }
  } catch (error) {
    console.log("⚠️ Strategy 4 failed: Manual extraction error")
  }

  // Strategy 5: AI response parsing fallback
  try {
    // Look for any quoted text that might be the enhanced prompt
    const quotedTexts = content.match(/"([^"]*(?:\\.[^"]*)*)"/g);
    if (quotedTexts && quotedTexts.length > 0) {
      // Use the longest quoted text as the enhanced prompt
      let longestQuote = quotedTexts.reduce((a, b) => a.length > b.length ? a : b);
      longestQuote = longestQuote.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
      
      // If it's significantly longer than original, it's likely the enhancement
      if (longestQuote.length > originalPrompt.length * 0.8) {
        console.log("✅ Strategy 5: Fallback text extraction successful")
        return {
          enhancedPrompt: longestQuote,
          improvements: ["Enhanced prompt with improved structure and clarity"]
        }
      }
    }
  } catch (error) {
    console.log("⚠️ Strategy 5 failed: Fallback extraction error")
  }

  // Final fallback: Log the full content and return a helpful error
  console.error("❌ All parsing strategies failed. Full content:")
  console.error(content)
  
  return {
    enhancedPrompt: originalPrompt,
    improvements: [
      "Unable to parse the enhanced response automatically. The AI may have provided a response in an unexpected format.",
      "Please try again with a shorter prompt, or check the console logs for details."
    ]
  }
}