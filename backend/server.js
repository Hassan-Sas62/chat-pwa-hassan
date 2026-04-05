const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const uri = "mongodb://SasdeSas:Hassane02%40@ac-sjwyqnm-shard-00-00.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-01.ri2es6o.mongodb.net:27017,ac-sjwyqnm-shard-00-02.ri2es6o.mongodb.net:27017/hassan_chat?ssl=true&replicaSet=atlas-ffb5le-shard-0&authSource=admin&retryWrites=true&w=majority";

// Modèles
const Message = mongoose.model("Message", new mongoose.Schema({
    text: String, sender: String, room: String, time: String, timestamp: { type: Date, default: Date.now }
}), "SAS");

const User = mongoose.model("User", new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}), "users");

mongoose.connect(uri).then(() => {
    console.log("✅ MongoDB connecté");

    io.on('connection', (socket) => {
        socket.on('join_room', async (data) => {
            const { username, room, password } = data;
            try {
                let user = await User.findOne({ username });
                if (!user) {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    user = await User.create({ username, password: hashedPassword });
                } else {
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) return socket.emit('auth_error', "Mot de passe incorrect.");
                }

                socket.join(room);
                // On renvoie les infos pour que le frontend les utilise
                socket.emit('auth_success', { username, room });

                const oldMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(50);
                socket.emit('load_messages', oldMessages);
            } catch (err) {
                socket.emit('auth_error', "Erreur serveur.");
            }
        });

        socket.on('send_message', async (data) => {
            const msg = { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            try {
                const saved = await Message.create(msg);
                io.to(data.room).emit('receive_message', saved);
            } catch (err) { console.log(err); }
        });

        socket.on('delete_message', async (id) => {
            const msg = await Message.findByIdAndDelete(id);
            if (msg) io.to(msg.room).emit('message_deleted', id);
        });
    });
});

server.listen(process.env.PORT || 5000);