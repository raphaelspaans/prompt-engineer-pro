import { useState, useEffect } from "react"

function IndexPopup() {
  const [apiKey, setApiKey] = useState("")
  const [provider, setProvider] = useState("openai")
  const [model, setModel] = useState("gpt-4o-mini")
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    chrome.storage.sync.get(['apiKey', 'provider', 'model'], (result) => {
      if (result.apiKey) setApiKey(result.apiKey)
      if (result.provider) setProvider(result.provider)
      if (result.model) setModel(result.model)
      setIsLoading(false)
    })
  }, [])

  const saveSettings = () => {
    chrome.storage.sync.set({ apiKey, provider, model }, () => {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    })
  }

  const clearSettings = () => {
    chrome.storage.sync.clear(() => {
      setApiKey("")
      setProvider("openai")
      setModel("gpt-4o-mini")
      setIsSaved(false)
    })
  }

  if (isLoading) {
    return (
      <div style={{ padding: 16, width: 350 }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        width: 350,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#2d3748' }}>
          🚀 Prompt Enhancer
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#718096', lineHeight: 1.4 }}>
          Enhance your ChatGPT prompts with AI-powered improvements
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 600,
          color: '#4a5568'
        }}>
          AI Provider
        </label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: 'white'
          }}
        >
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 600,
          color: '#4a5568'
        }}>
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: 'white'
          }}
        >
          <option value="gpt-4o-mini">GPT-4o Mini (💰 Most Cost-Effective)</option>
          <option value="gpt-4o">GPT-4o (⚡ Balanced Performance)</option>
          <option value="gpt-4-turbo">GPT-4 Turbo (🚀 High Performance)</option>
          <option value="gpt-4">GPT-4 (🔬 Maximum Quality)</option>
        </select>
        <div style={{ 
          fontSize: 12, 
          color: '#718096', 
          marginTop: 4,
          lineHeight: 1.3
        }}>
          GPT-4o Mini is ~60x cheaper than GPT-4 and perfect for prompt enhancement
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 6, 
          fontSize: 14, 
          fontWeight: 600,
          color: '#4a5568'
        }}>
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            boxSizing: 'border-box'
          }}
        />
        <div style={{ 
          fontSize: 12, 
          color: '#718096', 
          marginTop: 4,
          lineHeight: 1.3
        }}>
          Get your API key from platform.openai.com
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={saveSettings}
          disabled={!apiKey.trim()}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: apiKey.trim() ? '#10a37f' : '#d1d5db',
            color: apiKey.trim() ? 'white' : '#9ca3af',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: apiKey.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          {isSaved ? '✅ Saved!' : 'Save Settings'}
        </button>
        <button
          onClick={clearSettings}
          style={{
            padding: '10px 16px',
            backgroundColor: 'white',
            color: '#dc2626',
            border: '1px solid #dc2626',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ 
        fontSize: 12, 
        color: '#718096',
        lineHeight: 1.4,
        backgroundColor: '#f7fafc',
        padding: 12,
        borderRadius: 6,
        border: '1px solid #e2e8f0'
      }}>
        <strong style={{ color: '#4a5568' }}>How to use:</strong><br />
        1. Configure your API key above<br />
        2. Visit chatgpt.com<br />
        3. Type your prompt<br />
        4. Click "🚀 Enhance Prompt" button<br />
        5. Review and accept improvements
      </div>
    </div>
  )
}

export default IndexPopup
