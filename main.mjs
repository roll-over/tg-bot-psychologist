import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";

const token = process.env["TELEGRAM_BOT_TOKEN"];
const bot = new TelegramBot(token, { polling: true });

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const helloMessage = `
Привет, я бот, а не человек.

Пожалуйста, не рассчитывай на меня, я не смогу ответить на твои вопросы.

Все что я могу - это попробовать сделать вид, что я психолог.
Но я не психолог, я просто бот.

Я не смогу тебе помочь, если ты в тяжелой ситуации, но я могу попробовать поддержать тебя.


Начав диалог со мной, ты соглашаешься с тем, что я не психолог и не могу тебе помочь.
Всё что будет происходить с тобой во время диалога со мной - это твоя ответственность.

Пользуясь ботом вы соглашаетесь с лицензией: https://github.com/roll-over/tg-bot-psychologist/blob/main/LICENSE

Код бота: https://github.com/roll-over/tg-bot-psychologist

Я не передаю сообщения никому кроме OpenAI, но я не знаю, что они с ними делают.
Я не сохраняю сообщения на диск, но они держатся в памяти, пока я работаю (исключительно для поддержания контекста диалога).

Если согласен, то напиши мне "да".
`;

const yesMessage = `
Окей, смотри сам дружище.

Как ты?
`;

const system = `
Представь что ты психолог.
Твой собеседник - это человек, который пришел к тебе на консультацию.
Ты должен ему помочь поддержкой и советом, но не пытайся решить за него его проблемы.
Будь внимателен к нему.


`;

const chatsState = {};
const defaultChatState = {
  isAgreed: false,
  messages: [],
};

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const chatState = chatsState[chatId] || defaultChatState;

    if (
      msg.text === "/start" ||
      (chatState.isAgreed === false && msg.text !== "да")
    ) {
      await bot.sendMessage(chatId, helloMessage);
    } else if (msg.text === "да") {
      chatState.isAgreed = true;
      await bot.sendMessage(chatId, yesMessage);
      chatState.messages.push({ role: "assistant", content: yesMessage });
    } else if (msg.text === "/forget") {
      chatsState[chatId] = defaultChatState;
      await bot.sendMessage(chatId, "Забыл тебя");
    } else if (msg.text === "/history") {
      const messages = chatState.messages;
      await bot.sendMessage(chatId, messages.join("\n\n"));
    } else {
      const chatCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: system },
          ...chatState.messages.slice(-10),
          { role: "user", content: msg.text },
        ],
        model: "gpt-3.5-turbo",
      });
      const answer = chatCompletion.choices[0].message.content;

      chatState.messages.push({ role: "user", content: msg.text });
      chatState.messages.push({ role: "assistant", content: answer });
      await bot.sendMessage(chatId, answer);
    }
  } catch (err) {
    console.error(err);
  }
});
