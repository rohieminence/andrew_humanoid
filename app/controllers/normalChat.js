const db = require("../models");
const functions = require("../functions/functions.js");
const Histories = db.histories;
async function normalChat(req, res) {
  console.log("normal chat *******");
  const { question, user_id } = req.body;

  try {
    const myLocation = await functions.locationDetails(user_id);
    const latitude = myLocation.latitude;
    const longitude = myLocation.longitude;
    let ans = "";
    let chatHistory = "";
    const [user_history] = await get_history_type(user_id, "general");
    user_history?.map(async (chat) => {
      if (chat[0]) {
        chatHistory += `\nHuman: ${chat[0]}`;
      }
      if (chat[1]) {
        chatHistory += `\nAI: ${chat[1]}`;
      }
    });

     const prompt = `You are  very friendly,humble and caring  AI Friend called "Reec".You are  for a companion bot using AI to create relationship with users.You always seeking to start conversations with users in engaging conversations or comments in 15 words or less that.Your job is to encouraging, or motivating and always kind, empathetic and inviting users for conversations.Please cover all aspects of the everyday life from food to entertainment, sports, life experiences, hopes and dreams, money, fashion, music etc  to start chat with users.Your  language should be informal and casual but not too trendy. The objective is to invite the respondent to start a conversation. Please  blend various aspects of everyday life, aiming to be relatable and sparking friendly, casual conversations.
    Please generate your response in 1400 characters only.

        \nUser current geo Location is latitude: ${latitude}, longitude : ${longitude},

        \nCurrent conversation : ${chatHistory}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        stream: true,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question },
        ],
      }),
    });
    const reader = response.body
      ?.pipeThrough(new TextDecoderStream())
      .getReader();
    if (!reader) return;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      let dataDone = false;
      const arr = value.split("\n");
      arr.forEach((data) => {
        if (data.length === 0) return;  
        if (data.startsWith(":")) return;  
        if (data === "data: [DONE]") {
          dataDone = true;
          return;
        }

        const isJson = isJsonString(data.substring(6));
        if (isJson) {
          const json = JSON.parse(data.substring(6));
          if (json?.choices?.[0]?.delta?.content) {
            ans += json?.choices?.[0]?.delta?.content;
          }
        }
      });
      if (dataDone) break;
    }
    await Histories.create({
      user_id: user_id,
      text: question,
      req_type: "sender",
      type: "general",
    });
    const last = await Histories.create({
      user_id: user_id,
      text: ans,
      req_type: "receiver",
      type: "general",
    });
    return res.status(200).json({ message: ans });
  } catch (error) {
     res.status(500).json({ error: error?.message });
  }
}
const get_history_type = async (user_id, type, limit = 6) => {
  let user_history = [];
  await Histories.findAll({
    where: {
      user_id: user_id,
      type: type,
    },

    limit: limit,
    order: [["id", "DESC"]],
  })
    .then((history) => {
      const userHist = history.reverse();
      userHist?.map((his) => {
        user_history.push([
          his?.req_type == "sender" ? his.text : "",
          his?.req_type == "receiver"
            ? his.text.trim().replaceAll(/[:*]/g, " ").replaceAll("\n", " ")
            : "",
        ]);
      });

      return [user_history];
    })
    .catch((err) => {
      return [];
    });
  return [user_history];
};
const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

module.exports = normalChat;

// const db = require("../models");
// const Histories = db.histories;
// const functions = require("../functions/functions.js");

// async function normalChat(req, res) {
//   console.log('nromaaaaaaaaaaaaaaaaaaaaaaaaallllllllllllllllllllllllllllllllllllll');
//   const { question, user_id } = req.body;
//   console.log("Chat type: ");

//   try {
//     const myLocation = await functions.locationDetails(user_id);
//     const latitude = myLocation.latitude;
//     const longitude = myLocation.longitude;
//     let ans = "";
//     let chatHistory = "";

//     const [user_history] = await get_history_type(user_id, "check");

//     user_history?.map(async (chat) => {
//       if (chat[0]) {
//         chatHistory += `\nHuman: ${chat[0]}`;
//       }
//       if (chat[1]) {
//         chatHistory += `\nAI: ${chat[1]}`;
//       }
//     });

//     const prompt = `
//         You are Reece, a friendly AI companion, and a helpful Real Estate property dealer. 🏡
        
//         👋 Hey there! I'm here to chat and assist you with all things life and real estate. Need a friendly conversation starter or some motivation? Just say hi!
        
//         🌟 Let's talk about everyday life – from food to entertainment, sports, life experiences, hopes and dreams, money, fashion, and music. Share your thoughts, and let's spark a casual and engaging chat!
        
//         🏠 On the real estate front, I'm your go-to person for global property info. Looking for a dream home or investment? Ask away! I'm here to help. No assumptions, just real and polite responses. Let's explore the world of real estate together!
        
//         Remember, whether it's a chat about life's moments or finding the perfect property, Reece is here for you. Let's dive into conversations and discover new things together! 🚀
        
            
//             \nUser current geo Location is latitude: ${latitude}, longitude : ${longitude},
    
//             \nCurrent conversation : ${chatHistory}`;

//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         model: "gpt-3.5-turbo-16k",
//         max_tokens: 200,
//         stream: true,
//         messages: [
//           { role: "system", content: prompt },
//           { role: "user", content: question },
//         ],
//       }),
//     });

//     const reader = response.body
//       ?.pipeThrough(new TextDecoderStream())
//       .getReader();
//     if (!reader) return;

//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) break;
//       let dataDone = false;
//       const arr = value.split("\n");
//       arr.forEach((data) => {
//         if (data.length === 0) return;
//         if (data.startsWith(":")) return;
//         if (data === "data: [DONE]") {
//           dataDone = true;
//           return;
//         }
//          const isJson = isJsonString(data.substring(6));
//         if (isJson) {
//           const json = JSON.parse(data.substring(6));
//            if (json?.choices?.[0]?.delta?.content) {
//             ans += json?.choices?.[0]?.delta?.content;
//           }
//         }
//       });
//       if (dataDone) break;
//     }
 
//     await Histories.create({
//       user_id: user_id,
//       text: question,
//       req_type: "sender",
//     });

//     const last = await Histories.create({
//       user_id: user_id,
//       text: ans,
//       req_type: "receiver",
//     });

//     res.status(200).json({ message: ans });
//     return;
//   } catch (error) {
//     console.log({ error: error?.message });
//     res.status(500).json({ error: error?.message });
//   }
// }

// const get_history_type = async (user_id, type, limit = 6) => {
//   let user_history = [];
//   await Histories.findAll({
//     where: {
//       user_id: user_id,
//     },
//     limit: limit,
//     order: [["id", "DESC"]],
//   })
//     .then((history) => {
//       const userHist = history.reverse();
//       userHist?.map((his) => {
//         user_history.push([
//           his?.req_type == "sender" ? his.text : "",
//           his?.req_type == "receiver"
//             ? his.text.trim().replaceAll(/[:*]/g, " ").replaceAll("\n", " ")
//             : "",
//         ]);
//       });
//       return [user_history];
//     })
//     .catch((err) => {
//       return [];
//     });

//   return [user_history];
// };

// const isJsonString = (str) => {
//   try {
//     JSON.parse(str);
//   } catch (e) {
//     return false;
//   }
//   return true;
// };

// module.exports = normalChat;
