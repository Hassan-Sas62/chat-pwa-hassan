import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Send, User, MessageSquare, Trash2 } from 'lucide-react' // Ajout de Trash2
import './App.css'

const socket = io("https://chat-pwa-hassan.onrender.com");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    socket.on("load_messages", (messages) => {
      setChat(messages);
    });

    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    // 🗑️ AJOUT : Écouter quand un message est supprimé par quelqu'un
    socket.on("message_deleted", (deletedId) => {
      setChat((prev) => prev.filter((msg) => msg._id !== deletedId));
    });
    
    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
      socket.off("message_deleted");
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msgData = { 
        text: message, 
        sender: username
      };
      socket.emit("send_message", msgData);
      setMessage("");
    }
  };

  // 🗑️ AJOUT : Fonction pour demander la suppression
  const deleteMessage = (id) => {
    if (window.confirm("Supprimer ce message ?")) {
      socket.emit("delete_message", id);
    }
  };

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
        {chat.map((msg) => (
          <div key={msg._id} className={`msg ${msg.sender === username ? "me" : "other"}`}>
            <div className="msg-content">
              <div className="msg-header">
                <small>{msg.sender} • {msg.time}</small>
                
                {/* 🗑️ AJOUT : Bouton poubelle uniquement sur MES messages */}
                {msg.sender === username && (
                  <Trash2 
                    size={14} 
                    className="delete-icon" 
                    onClick={() => deleteMessage(msg._id)} 
                    style={{ cursor: 'pointer', marginLeft: '8px', color: '#ff4444' }}
                  />
                )}
              </div>
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