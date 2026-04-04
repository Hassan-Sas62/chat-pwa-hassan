// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
const server = http.createServer(app);

// 🔌 Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 🌐 MongoDB Atlas URI
const uri = "mongodb://SasdeSas:Hassane02%40@ac-sjwyqnm-shard-00-00.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-01.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-02.ri2es6o.mongodb.net:27017/hassan_chat?ssl=true&replicaSet=atlas-ffb5le-shard-0&authSource=admin&retryWrites=true&w=majority";

// 📦 Modèle Message
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: String, default: "Utilisateur" },
    time: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema, "SAS");

// 🔥 Connexion MongoDB
mongoose.connect(uri)
.then(() => {
    console.log("✅ MongoDB connecté");

    // ⚡ Socket.io après connexion MongoDB
    io.on('connection', async (socket) => {
        console.log('📱 Nouvel utilisateur connecté :', socket.id);

        // 📥 Charger l'historique
        try {
            const oldMessages = await Message.find().sort({ timestamp: 1 }).limit(50);
            socket.emit('load_messages', oldMessages);
        } catch (err) {
            console.log("⚠️ Erreur historique :", err.message);
        }

        // 📤 Recevoir et sauvegarder un message
        socket.on('send_message', async (data) => {
            const newMessage = {
                text: data.text,
                sender: data.sender || "Utilisateur",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            try {
                const savedMsg = await Message.create(newMessage);
                io.emit('receive_message', savedMsg);
                console.log("💾 Message sauvegardé");
            } catch (err) {
                console.log("❌ Erreur message :", err.message);
            }
        });

        // 🗑️ AJOUT : Supprimer un message
        socket.on('delete_message', async (messageId) => {
            try {
                await Message.findByIdAndDelete(messageId);
                // On informe TOUT LE MONDE que ce message doit disparaître de l'écran
                io.emit('message_deleted', messageId);
                console.log("🗑️ Message supprimé :", messageId);
            } catch (err) {
                console.log("❌ Erreur suppression :", err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Utilisateur déconnecté');
        });
    });

})
.catch(err => console.log("❌ Erreur MongoDB :", err.message));

// 🚀 Lancer le serveur
// Utilise process.env.PORT pour Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur prêt sur le port ${PORT}`);
});