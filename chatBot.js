const config = require('dotenv').config();
const OpenAI = require('openai');
const readline = require('readline/promises');
const fs = require('fs');
const path = require('path');
const player = require('play-sound')();
// const axios = require('axios');

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const audioFilePath = './speech.mp3';
const speechFile = path.resolve('./speech.mp3');

userInterface.prompt();
userInterface.on('line', async (input) => {
    const res = await openai.chat.completions.create({
        messages: [{ role: 'user', content: input }],
        model: 'gpt-3.5-turbo',
    });
    console.log(res.choices[0].message.content);
    const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova',
        input: res.choices[0].message.content,
    });
    console.log(speechFile);
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    player.play(audioFilePath);
    userInterface.prompt();
});
