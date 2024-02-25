const express = require('express');
const http = require('http');
const config = require('dotenv').config();
const OpenAI = require('openai');
const readlineSync = require('readline-sync');
const colors = require('colors');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

app.use(express.static('public'));

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'views', 'index.html');
    res.sendFile(indexPath);
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('userMessage', async (userInput) => {
        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: 'user', content: userInput }],
                model: 'gpt-3.5-turbo',
            });

            const completionText = completion.choices[0].message.content;
            console.log(colors.green('Bot: ') + completionText);

            // Emit the bot's response to the frontend
            socket.emit('message', completionText);
        } catch (error) {
            console.error(colors.red(error));
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, 'localhost', () => {
    console.log(`Server is running on http://localhost:${port}`);
});
