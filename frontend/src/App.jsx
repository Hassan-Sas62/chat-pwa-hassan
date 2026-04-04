import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Send, User, MessageSquare } from 'lucide-react'
import './App.css'

// ✅ Connexion au backend en ligne (Render)
const socket = io("https://chat-pwa-hassan.onrender.com");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scrollRef = useRef();

  // 🔽 Scroll automatique
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    // 📥 Charger historique
    socket.on("load_messages", (messages) => {
      setChat(messages);
    });

    // 📩 Recevoir messages
    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });
    
    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();

    if (message.trim()) {
      const msgData = { 
        text: message, 
        sender: username,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      socket.emit("send_message", msgData);
      setMessage("");
    }
  };

  // 🔐 Écran login
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <MessageSquare size={48} color="#2563eb" />
          <h2>HassanChat</h2>
          <p>Projet PWA - UPM Marrakech</p>

          <input 
            placeholder="Entre ton nom..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && username && setIsLoggedIn(true)}
          />

          <button onClick={() => username && setIsLoggedIn(true)}>
            Rejoindre le Chat
          </button>
        </div>
      </div>
    );
  }

  // 💬 Interface chat
  return (
    <div className="chat-window">

      <div className="header">
        <div className="user-info">
          <User size={20} />
          <span>Connecté : <strong>{username}</strong></span>
        </div>
        <div className="status-online"></div>
      </div>
      
      <div className="messages">
        {chat.map((msg, i) => (
          <div key={i} className={`msg ${msg.sender === username ? "me" : "other"}`}>
            <div className="msg-content">
              <small>{msg.sender} • {msg.time}</small>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="input-area">
        <input 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          placeholder="Écris ton message..."
        />
        <button type="submit" className="send-btn">
          <Send size={20} />
        </button>
      </form>

    </div>
  );
}

export default App;