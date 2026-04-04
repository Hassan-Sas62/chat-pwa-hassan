// mongodbExample.js

const { MongoClient, ObjectId } = require("mongodb");

// 🔥 URI depuis variable d'environnement
const uri = process.env.MONGODB_URI || "PASTE_YOUR_URI_HERE";

const dbName = "hassan_chat";
const collectionName = "messages";

async function run() {
    const client = new MongoClient(uri);

    try {
        console.log("🔌 Connexion à MongoDB Atlas...");
        await client.connect();
        console.log("✅ Connecté avec succès !");

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // 🧹 nettoyer
        await collection.deleteMany({});
        console.log("🧹 Anciennes données supprimées");

        // 📥 insérer 10 messages
        const messages = [];
        for (let i = 1; i <= 10; i++) {
            messages.push({
                text: `Message ${i}`,
                sender: `User${i}`,
                timestamp: new Date(Date.now() - i * 60000)
            });
        }

        const result = await collection.insertMany(messages);
        console.log("📥 10 messages insérés");

        // 📤 lire 5 récents
        const recent = await collection
            .find()
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        console.log("📤 5 derniers messages :");
        console.log(recent);

        // 📌 lire par ID
        const firstId = result.insertedIds[0];

        const one = await collection.findOne({
            _id: new ObjectId(firstId)
        });

        console.log("📌 Message trouvé par ID :");
        console.log(one);

    } catch (err) {
        console.log("❌ Erreur :", err.message);
    } finally {
        await client.close();
        console.log("🔒 Connexion fermée");
    }
}

run();