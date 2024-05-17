const config = require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

//Only for creation of AI assistant, if you already have one, you do not need to create a new one!
// const assistant = await openai.beta.assistants.create({
//     name: 'Library Assistant',
//     instructions: 'You are library assisstant at the KAZGUU University!',
//     model: 'gpt-3.5-turbo',
// });

async function askAssistant() {
    const assistant = await openai.beta.assistants.retrieve('asst_j8bb3vigirhwTeZPOoLwtqls');

    const thread = await openai.beta.threads.create();

    const message = await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: '2+2?',
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant.id,
    });

    checkStatusAndPrintMessages = async (threadId, runId) => {
        let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        if (runStatus.status === 'completed') {
            let messages = await openai.beta.threads.messages.list(threadId);
            const assistantAns = messages.data[0].content[0].text.value;
            console.log(assistantAns);
        } else {
            console.log('Run is not completed yet!');
        }
    };
    setTimeout(() => {
        checkStatusAndPrintMessages(thread.id, run.id);
    }, 3000);
}

askAssistant();
