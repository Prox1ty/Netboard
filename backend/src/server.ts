import express from 'express';
import * as dotenv from 'dotenv'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: "Whiteboard backend is alive"
    });
});

app.listen(PORT, (err) => {
    if (!err) {
        console.log("Server listening on port: ", PORT);
    }
});