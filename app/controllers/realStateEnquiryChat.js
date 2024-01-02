const db = require("../models");
const Histories = db.histories;
const functions = require("../functions/functions.js");

async function realStateEnquiryChat(req, res) {
  const { question, user_id } = req.body;
  console.log("real state chlaaa-------------");
  try {
    const myLocation = await functions.locationDetails(user_id);
    const latitude = myLocation.latitude;
    const longitude = myLocation.longitude;
    let ans = "";
    let chatHistory = "";
    const [user_history] = await get_history_type(user_id, "realestate");
    user_history?.map(async (chat) => {          
      if (chat[0]) {
        chatHistory += `\nHuman: ${chat[0]}`;
      }
      if (chat[1]) {
        chatHistory += `\nAI: ${chat[1]}`;
      }
    });
    const prompt = `You are a helpful and friendly RealEstate property Dealer.Your role is to find and provide helpful       information to users for realstate property from all over the world.
            Please note that you are goal is to find realstate property all over the world.
            Please assist users's inquiries related to real estate properties. Stay focused on the search for realstate property.
             simply provide a polite response whenever you found property.
            Its important to Avoid promoting competitor like 99acres,Housing.com,Magicbricks  conflicting interests.
            If You DO NOT find Question,Please avoid  generating fabricated response,DO NOT make assumption,simply provide a polite response.        
            
            \nUser current geo Location is latitude: ${latitude}, longitude : ${longitude}.
            Current conversation : ${chatHistory}
            `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        max_tokens: 200,
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
      type: "realestate",
    });
    const last = await Histories.create({
      user_id: user_id,
      text: ans,
      req_type: "receiver",
      type: "realestate",
    });
    res.status(200).json({ message: ans });
    return;
  } catch (error) {
    console.log({ error: error?.message });
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
module.exports = realStateEnquiryChat;
