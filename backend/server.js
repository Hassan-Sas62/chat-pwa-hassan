const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const uri = "mongodb://SasdeSas:Hassane02%40@ac-sjwyqnm-shard-00-00.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-01.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-02.ri2es6o.mongodb.net:27017/hassan_chat?ssl=true&replicaSet=atlas-ffb5le-shard-0&authSource=admin&retryWrites=true&w=majority";

// 📦 Modèle Message mis à jour avec "room"
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    sender: { type: String, default: "Utilisateur" },
    room: { type: String, default: "General" }, // ⬅️ Nouveau champ
    time: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema, "SAS");

mongoose.connect(uri)
.then(() => {
    console.log("✅ MongoDB connecté");

    io.on('connection', async (socket) => {
        console.log('📱 Nouvel utilisateur :', socket.id);

        // 🚪 Action : Rejoindre un salon
        socket.on('join_room', async (roomName) => {
            socket.join(roomName);
            console.log(`👤 ${socket.id} a rejoint : ${roomName}`);

            // 📥 Charger l'historique UNIQUEMENT de ce salon
            try {
                const oldMessages = await Message.find({ room: roomName })
                    .sort({ timestamp: 1 })
                    .limit(50);
                socket.emit('load_messages', oldMessages);
            } catch (err) {
                console.log("⚠️ Erreur historique salon :", err.message);
            }
        });

        // 📤 Recevoir et sauvegarder (version Salons)
        socket.on('send_message', async (data) => {
            const newMessage = {
                text: data.text,
                sender: data.sender || "Utilisateur",
                room: data.room || "General", // ⬅️ On récupère le salon
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            try {
                const savedMsg = await Message.create(newMessage);
                // 📢 On envoie uniquement aux gens dans ce salon
                io.to(data.room).emit('receive_message', savedMsg);
                console.log(`💾 Message sauvegardé dans ${data.room}`);
            } catch (err) {
                console.log("❌ Erreur message :", err.message);
            }
        });

        socket.on('delete_message', async (messageId) => {
            try {
                const msg = await Message.findById(messageId);
                if (msg) {
                    const room = msg.room;
                    await Message.findByIdAndDelete(messageId);
                    // On informe uniquement le salon concerné
                    io.to(room).emit('message_deleted', messageId);
                    console.log("🗑️ Message supprimé");
                }
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur prêt sur le port ${PORT}`);
});