import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Send, User, MessageSquare, Trash2, ShieldCheck, LogOut } from 'lucide-react'
import './App.css'

const socket = io("https://chat-pwa-hassan.onrender.com");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("Général"); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    socket.on("load_messages", (messages) => { setChat(messages); });
    socket.on("receive_message", (data) => { setChat((prev) => [...prev, data]); });
    socket.on("message_deleted", (deletedId) => {
      setChat((prev) => prev.filter((msg) => msg._id !== deletedId));
    });
    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
      socket.off("message_deleted");
    };
  }, []);

  const joinChat = () => {
    if (username.trim() && room) {
      setIsLoggedIn(true);
      socket.emit("join_room", room);
    }
  };

  // --- FONCTION DE RETOUR ---
  const handleLogout = () => {
    setIsLoggedIn(false);
    setChat([]); 
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msgData = { text: message, sender: username, room: room };
      socket.emit("send_message", msgData);
      setMessage("");
    }
  };

  const deleteMessage = (id) => {
    if (window.confirm("Confirmer la suppression définitive ?")) {
      socket.emit("delete_message", id);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="brand-section">
            <ShieldCheck size={42} color="#1e293b" />
            <h2>HassanChat <span className="badge">PRO</span></h2>
          </div>
          <p className="subtitle">Solution de communication sécurisée</p>
          <div className="input-group">
            <label>Identifiant collaborateur</label>
            <input placeholder="Ex: h.mahamat" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && joinChat()} />
          </div>
          <div className="input-group">
            <label>Canal de discussion</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)} className="room-select">
              <option value="Général">🏢 Direction Générale</option>
              <option value="Technique">🛠️ Support & IT</option>
              <option value="Marketing">📊 Pôle Marketing</option>
              <option value="Projets">🚀 Développement Projets</option>
            </select>
          </div>
          <button className="login-btn" onClick={joinChat}>Accéder à l'espace</button>
          <div className="login-footer"><small>© 2026 Hassan Dev Solutions</small></div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="header">
        <div className="user-info">
          <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="header-text">
            <span className="user-name">{username}</span>
            <span className="room-status"># {room}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="status-indicator"><span className="dot"></span><small>En ligne</small></div>
          <button className="logout-btn" onClick={handleLogout} title="Changer de canal">
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <div className="messages">
        {chat.length === 0 && (
          <div className="welcome-chat">
            <MessageSquare size={32} opacity={0.3} />
            <p>Début de la conversation sur <strong>{room}</strong></p>
          </div>
        )}
        {chat.map((msg) => (
          <div key={msg._id} className={`msg ${msg.sender === username ? "me" : "other"}`}>
            <div className="msg-content">
              <div className="msg-header">
                <span className="sender-name">{msg.sender}</span>
                <span className="msg-time">{msg.time}</span>
                {msg.sender === username && <Trash2 size={13} className="delete-icon" onClick={() => deleteMessage(msg._id)} />}
              </div>
              <p className="text-body">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
      <form onSubmit={sendMessage} className="input-area">
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Message dans ${room}...`} />
        <button type="submit" className="send-btn"><Send size={18} /></button>
      </form>
    </div>
  );
}
export default App;