import { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Send, MessageSquare, Trash2, ShieldCheck, LogOut } from 'lucide-react'
import './App.css'

const socket = io("https://chat-pwa-hassan.onrender.com");

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [room, setRoom] = useState("Général"); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    socket.on("auth_success", (data) => {
      console.log(`Connecté avec succès au salon ${data.room}`);
      setIsLoggedIn(true);
      setError("");
    });

    socket.on("auth_error", (msg) => setError(msg));
    socket.on("load_messages", (msgs) => setChat(msgs));
    socket.on("receive_message", (msg) => setChat((prev) => [...prev, msg]));
    socket.on("message_deleted", (id) => setChat((prev) => prev.filter(m => m._id !== id)));
    
    return () => socket.removeAllListeners();
  }, []);

  const joinChat = () => {
    if (username.trim() && password.trim()) {
      socket.emit("join_room", { username, room, password });
    } else {
      setError("Champs incomplets.");
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("send_message", { text: message, sender: username, room });
      setMessage("");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <ShieldCheck size={42} color="#1e293b" />
          <h2>HassanChat <span className="badge">PRO</span></h2>
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <label>Identifiant</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && joinChat()} />
          </div>
          <div className="input-group">
            <label>Salon</label>
            <select value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="Général">🏢 Direction Générale</option>
              <option value="Technique">🛠️ Support & IT</option>
              <option value="Marketing">📊 Pôle Marketing</option>
              <option value="Projets">🚀 Développement Projets</option>
            </select>
          </div>
          <button className="login-btn" onClick={joinChat}>Entrer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="header">
        <div className="user-info">
          <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="header-text"><strong>{username}</strong><small># {room}</small></div>
        </div>
        <button className="logout-btn" onClick={() => setIsLoggedIn(false)}><LogOut size={18} /></button>
      </div>
      <div className="messages">
        {chat.length === 0 && <div className="empty-chat">Début de la conversation sur {room}</div>}
        {chat.map((msg) => (
          <div key={msg._id} className={`msg ${msg.sender === username ? "me" : "other"}`}>
            <div className="msg-header"><span>{msg.sender}</span><small>{msg.time}</small></div>
            <p>{msg.text}</p>
            {msg.sender === username && <Trash2 size={12} className="delete-icon" onClick={() => socket.emit("delete_message", msg._id)} />}
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