import { useEffect, useRef, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/chat/prompt';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // SessionId único por carga de página
  const [sessionId] = useState(() => `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
  if (!input.trim() || isLoading) return;

  const userMessage = input.trim();
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
  setIsLoading(true);
  setError(null);

  try {
    const historial = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content
    }));

    console.log('📤 Enviando:', { mensaje: userMessage, sessionId, historial: historial.length });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje: userMessage, sessionId, historial })
    });

    const data = await response.json();
    if (data?.ok && data?.datos?.respuesta) {
      setMessages(prev => [...prev, { role: 'model', content: data.datos.respuesta }]);
    } else {
      // Muestra el error real del backend
      const errorMsg = data?.mensaje || data?.error || JSON.stringify(data);
      console.warn('⚠️ Error:', errorMsg);
      
      setError(errorMsg);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `⚠️ ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}` 
      }]);
    }
  } catch (err) {
    console.error('❌ Error de red o parsing:', err);
    setError('Error de conexión con el servidor');
    setMessages(prev => [...prev, { role: 'model', content: '⚠️ No se pudo conectar. Verifica que el backend esté corriendo.' }]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="chat-container">
      <header className="chat-header">
        <div className="header-avatar">🤖</div>
        <div className="header-info">
          <h1>CHAT BOT DE RESERVAS</h1>
          <span>bot • en línea</span>
        </div>
      </header>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            👋 ¡Hola! Soy tu asistente de reservas. ¿En qué te puedo ayudar?
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="message-bubble bot typing">🤖 Pensando...</div>}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="error-toast">❌ {error}</div>}

      <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
}

export default App;