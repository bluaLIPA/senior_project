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

async function createNewThread() {
    console.log('thread created');
    const thread = await openai.beta.threads.create();
    return thread;
}

io.on('connection', (socket) => {
    console.log('connectinon established');

    socket.on('createNewThread', async () => {
        let t = await createNewThread();
        socket.emit('newThreadCreated', t);
    });

    socket.on('askAssistant', async (userInput, frontThread) => {
        const assistant = await openai.beta.assistants.retrieve('asst_j8bb3vigirhwTeZPOoLwtqls');

        const message = await openai.beta.threads.messages.create(frontThread.id, {
            role: 'user',
            content: userInput,
        });

        const run = await openai.beta.threads.runs.create(frontThread.id, {
            assistant_id: assistant.id,
        });

        const printMessages = async (threadId) => {
            let messages = await openai.beta.threads.messages.list(threadId);
            const assistantAns = messages.data[0].content[0].text.value;
            console.log('NUria: ' + assistantAns);
            socket.emit('assistantResponse', assistantAns);
        };

        while (true) {
            let runData = await openai.beta.threads.runs.retrieve(frontThread.id, run.id);
            console.log(runData.status);

            if (runData.status === 'completed') {
                printMessages(frontThread.id, run.id);
                break;
            } else if (runData.status === 'failed') {
                const errorMessage = 'Something unexpected happened, please try again!';
                return socket.emit('assistanceResponse', errorMessage);
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
