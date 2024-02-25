const config = require('dotenv').config();
const OpenAI = require('openai');
const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

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

    socket.on('askAssistant', async (userInput) => {
        const assistant = await openai.beta.assistants.retrieve(
            'asst_j8bb3vigirhwTeZPOoLwtqls'
        );
        const thread = await openai.beta.threads.create();

        const message = await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: userInput,
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistant.id,
        });

        const checkStatusAndPrintMessages = async (threadId, runId) => {
            console.log(threadId);

            let runStatus = await openai.beta.threads.runs.retrieve(
                threadId,
                runId
            );
            // if (runStatus.status === 'completed') {
            let messages = await openai.beta.threads.messages.list(threadId);
            const assistantAns = messages.data[0].content[0].text.value;
            console.log('NUria: ' + assistantAns);

            // Emit the assistant's answer to the connected client
            socket.emit('assistantResponse', assistantAns);
            // } else {
            // console.log('Run is not completed yet!');
            // }
        };

        checkStatusAndPrintMessages(thread.id, run.id);

        // Stop polling when the client disconnects
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
