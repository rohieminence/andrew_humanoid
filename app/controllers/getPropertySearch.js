// const axios = require("axios");
// const { ChatMessageHistory } = require("langchain/memory");

// const db = require("../models");
// const Histories = db.histories;

// async function getPropertySearch(req, res, toolCall) {
//   console.log(toolCall, "properties search==========");
//   const { question, user_id } = req.body;
//   try {
//     res.setHeader("Content-Type", "application/json");
//     const [user_history] = await get_history_type(user_id, "search", 1);

//     let txt = "";
//     let last = "";
//     let last_search_params = "";
//     let properties = [];
//     let page1 = 0;
//     let params = 0;

//     const history = new ChatMessageHistory();
//     user_history?.map(async (chat) => {
//       if (chat[0]) {
//         await history.addUserMessage(chat[0]);
//       }
//       if (chat[1]) {
//         await history.addAIChatMessage(chat[1]);
//       }
//     });

//     await Histories.create({
//       user_id: user_id,
//       text: question,
//       req_type: "sender",
//       type: "search",
//     });

//     const { location, price, bedrooms, bathrooms } = toolCall;
//     if (location) {
//       last += `location:${location}, `;
//       params++;
//     }
//     if (bedrooms) {
//       last += `bedrooms:${bedrooms}, `;
//       params++;
//     }
//     if (bathrooms) {
//       last += `bathrooms:${bathrooms}, `;
//       params++;
//     }
//     if (price) {
//       last += `price:${price}, `;
//       params++;
//     }
//     if (params >= 2) {
//       response = {
//         text: "We are looking for property as per your criteria.",
//         properties: [],
//         chat_id: "",
//       };
//       txt = "We are looking for property as per your criteria.";
//       await Histories.create({
//         user_id: user_id,
//         text: txt,
//         req_type: "receiver",
//         type: "search",
//         page: page1,
//       });
//     }

//     const [propts, responceMsg] = await get_properties(toolCall);

//     properties = propts;
//     noFound = responceMsg;
//     ans = responceMsg ? responceMsg : toolCall.answer;
//     page1 = 1;

//     const lastOne = await Histories.create({
//       user_id: user_id,
//       req_type: "receiver",
//       type: "search",
//       properties: properties,
//       last_search: last_search_params,
//       page: page1,
//     });

//     const lastChat = await Histories.findOne({
//       where: {
//         id: lastOne.id,
//       },
//       attributes: ["id", "text", "properties"],
//     });
//     properties = JSON.parse(lastChat.properties);

//     let chat_id = lastChat.id;
//     res.status(200).end(JSON.stringify({ properties, chat_id }));
//     return;
//   } catch (error) {
//     res.status(200).end(JSON.stringify({ error: error?.message }));
//   }
// }

// const get_properties = async (paramters) => {
//   const { location, bedrooms, bathrooms, price, min_price, max_price } =
//     paramters;
//   let numberpara = 0;
//   let resData = [];
//   let responceMsg = "";
//   let parameter = {};
//   if (location) {
//     parameter.location = { city: [location] };
//     numberpara++;
//   }
//   if (min_price) {
//     const minrate = (min_price * 20) / 100;

//     parameter.price =
//       min_price + "," + (max_price ? max_price : min_price + minrate);
//     numberpara++;
//   }
//   if (max_price) {
//     const rate = (max_price * 20) / 100;
//     parameter.price =
//       (min_price ? min_price : max_price - rate) + "," + max_price;
//     numberpara++;
//   }

//   if (bedrooms) {
//     parameter.beds = bedrooms + "," + bedrooms;
//     numberpara++;
//   }
//   if (bathrooms) {
//     parameter.baths = bathrooms;
//   }

//   if (price) {
//     parameter.price = price;
//   }
//   let result;
//   let retryCount = 0;
//   let maxRetries = 1;
//   let cityIndex = 0;

//   if (numberpara >= 1) {
//     do {
//       const urlLink = `https://gowpnow.com/api-site/search/realTimeListings?page=1&pageSize=10&isSearching=true&condition=${JSON.stringify(
//         parameter
//       )}`;
//       console.log(urlLink, "urlLinkurlLinkurlLinkurlLink");
//       result = await axios.get(urlLink);
//       if (result.data && result.data.listings.length > 0) {
//         resData = result.data.listings;
//         responceMsg = "";
//       } else {
//         const get_locations = await axios.get(
//           `https://gowpnow.com/api-site/search/suggestions/listing/location?key=${parameter.location.city}&siteId=37314`
//         );
//         const jsonData = get_locations?.data;
//         maxRetries = get_locations?.data?.length;
//         if (jsonData && jsonData.length > 0) {
//           const selectedCity = jsonData[cityIndex]?.list?.[0]?.value;
//           if (selectedCity) {
//             parameter.location.city = [selectedCity];
//             cityIndex++;
//              const removeKeys = ["price", "beds", "baths"];
//             removeKeys.forEach((key) => {
//               if (parameter[key]) {
//                 delete parameter[key];
//               }
//             });
//           }
//         }

//         // please dont remove it

//         // var jsonData = get_locations?.data;
//         // jsonData.forEach((location) => {
//         //   location.list.forEach((item) => {
//         //      console.log(item?.value);
//         //   });
//         // });
//         // const removeKeys = ["price", "beds", "baths"];

//         // removeKeys.forEach((key) => {
//         //   if (parameter[key]) {
//         //     delete parameter[key];
//         //   }
//         // });
//         retryCount++;
//         if (retryCount >= maxRetries) {
//           responceMsg = "Properties were not found within this criteria.";
//           break;
//         }
//       }
//     } while (result.data.listings.length === 0);
//   }
//   return [resData, responceMsg];
// };

// const get_history_type = async (user_id, type, limit = 6) => {
//   let user_history = [];
//   await Histories.findAll({
//     where: {
//       user_id: user_id,
//       type: type,
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

// module.exports = { getPropertySearch };

const { z } = require("zod");
const axios = require("axios");
const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatMessageHistory, BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");
const normalChat = require("./normalChat");

const db = require("../models");
const Histories = db.histories;

async function getPropertySearch(req, res, toolCall) {
  console.log("properties search ==========");
  const { question, user_id } = req.body;
  try {
    res.setHeader("Content-Type", "application/json");
    const [user_history, page, last_search] = await get_history_type(
      user_id,
      "search",
      1
    );
    const parser = StructuredOutputParser.fromZodSchema(
      z
        .object({
          answer: z
            .string()
            .describe(
              "generate a response related to real estate properties in response to the user's query."
            ),
          min_price: z
            .number()
            .describe(
              "Minimum price of properties; If price is not , then it null."
            ),
          max_price: z
            .number()
            .describe(
              "maximum price of properties; If price is not , then it null."
            ),
          bedrooms: z
            .number()
            .describe("If Number Of Bedrooms is not mention then set 0"),
          bathrooms: z
            .number()
            .describe("if Number Of Bathrooms is not mention then set 0"),
          location: z
            .string()
            .describe("if name of city in USA is not then make null"),
        })
        .describe(
          "An array of table records contains common values representing property search criteria."
        )
    );

    const formatInstructions = parser.getFormatInstructions();
    const searchPrompt = new PromptTemplate({
      template: `You are a helpful and friendly RealEstate property Dealer.Your role is to find and provide helpful information to users for realstate property from all over the world.You are a very good friendly and profesional property search assistant.Your job is create a search conversational system that starts with good initial conversation and whenever needed,You can fearly asks a follow-up questions realted to any type of property search criteria ,and also has the availability to generate lists of properties.Please note that you are goal is to find realstate property all over the world and provide assistant for users's inquiries related to real estate properties.Simply provide a polite response whenever you found property.      
      
      Answer the user's question as best as possible:\n{format_instructions}
      
      \ninput: {input}`,
      inputVariables: ["input", "history"],
      partialVariables: { format_instructions: formatInstructions },
    });

    let txt = "";
    let ans = "";
    let last = "";
    let last_search_params = "";
    let properties = [];
    let page1 = 0;
    let params = 0;
    let moreproperties_url;
    let speak_property_names = [];

    if (question == "load_more_properties_gowpnow") {
      last_search_params = last_search;
      const [propts, responceMsg, transformedURLs, speak_property_name] =
        await get_properties(JSON.parse(last_search), page + 1);
      properties = propts;
      noFound = responceMsg;
      ans = responceMsg;
      moreproperties_url = transformedURLs;
      page1 = page + 1;
    } else {
      const history = new ChatMessageHistory();
      user_history?.map(async (chat) => {
        if (chat[0]) {
          await history.addUserMessage(chat[0]);
        }
        if (chat[1]) {
          await history.addAIChatMessage(chat[1]);
        }
      });
      const messages = await history.getMessages();
      const model = new OpenAI({
        modelName: "gpt-3.5-turbo-16k",
        streaming: true,
      });
      const memory = await new BufferMemory({
        chatHistory: new ChatMessageHistory(messages),
        returnMessages: false,
      });

      const chain = new ConversationChain({
        prompt: searchPrompt,
        llm: model,
        memory,
        verbose: false,
      });
      const res1 = await chain.call({ input: question });
      const result1 = res1.response;
      await Histories.create({
        user_id: user_id,
        text: question,
        req_type: "sender",
        type: "search",
      });
      const json = await isJsonString(result1);
      if (json) {
        const reponcedata = await JSON?.parse(result1);
        txt = reponcedata.answer;
        ans = reponcedata.answer;
        const { location, price, bedrooms, bathrooms } = toolCall;
        if (location) {
          last += `location:${location}, `;
          params++;
        }
        if (bedrooms) {
          last += `bedrooms:${bedrooms}, `;
          params++;
        }
        if (bathrooms) {
          last += `bathrooms:${bathrooms}, `;
          params++;
        }
        if (price) {
          last += `price:${price}, `;
          params++;
        }
        last_search_params = result1;
        if (params >= 2) {
          response = {
            message: "We are looking for property as per your criteria.",
            properties: [],
            chat_id: "",
          };
          txt = "We are looking for property as per your criteria.";
          await Histories.create({
            user_id: user_id,
            text: txt,
            req_type: "receiver",
            type: "search",
            page: page1,
          });
        }

        const [propts, responceMsg, transformedURLs, speak_property_name] =
          await get_properties(reponcedata, (page1 = 1), req, res);

        properties = propts;
        noFound = responceMsg;
        ans = responceMsg ? responceMsg : reponcedata.answer;
        page1 = 1;
        speak_property_names = speak_property_name;
        moreproperties_url = transformedURLs;
      } else {
        const data = await extractJSON(result1);

        const response = {
          message: data ? data[0]?.answer : result1,
          properties: [],
          chat_id: "",
          moreproperties_url: moreproperties_url,
        };
        res.write(JSON.stringify(response));
        ans = data ? data[0]?.answer : result1;
      }
    }
    const numberOfPopularProperties = 3;
    const popularProperties = speak_property_names.slice(
      0,
      numberOfPopularProperties
    );
 
    // Include property names in the AI answer
    if (popularProperties?.length > 0) {
      ans += `Some of Most Popular Properties in ${
        toolCall?.location
      }: ${popularProperties.join(", ")}`;
    }

    const lastOne = await Histories.create({
      user_id: user_id,
      text: ans.replace("AI:", ""),
      req_type: "receiver",
      type: "search",
      properties: properties,
      last_search: last_search_params,
      page: page1,
    });

    const lastChat = await Histories.findOne({
      where: {
        id: lastOne.id,
      },
      attributes: ["id", "text", "properties"],
    });
    properties = JSON.parse(lastChat.properties);
    let message = ans.replace("AI:", "");
    let chat_id = lastChat.id;
    res
      .status(200)
      .end(
        JSON.stringify({ message, properties, chat_id, moreproperties_url })
      );
    return;
  } catch (error) {
    res.status(200).end(JSON.stringify({ error: error?.message }));
  }
}
const get_properties = async (paramters, pageNo, req, res) => {
  const { location, bedrooms, bathrooms, price, min_price, max_price } =
    paramters;
  let page = pageNo;
  let numberpara = 0;
  let resData = [];
  let responceMsg = "";
  let parameter = {};
  if (location) {
    parameter.location = { city: [location] };
    numberpara++;
  }
  if (min_price) {
    const minrate = (min_price * 20) / 100;

    parameter.price =
      min_price + "," + (max_price ? max_price : min_price + minrate);
    numberpara++;
  }
  if (max_price) {
    const rate = (max_price * 20) / 100;
    parameter.price =
      (min_price ? min_price : max_price - rate) + "," + max_price;
    numberpara++;
  }

  if (bedrooms) {
    parameter.beds = bedrooms + "," + bedrooms;
    numberpara++;
  }
  if (bathrooms) {
    parameter.baths = bathrooms;
  }

  if (price) {
    parameter.price = price;
  }
  let result;
  let retryCount = 0;
  let maxRetries = 1;
  let cityIndex = 0;
  let transformedURLs;
  let speak_property_name = [];
  if (numberpara >= 1) {
    do {
      const urlLink = `https://gowpnow.com/api-site/search/realTimeListings?page=${page}&pageSize=10&isSearching=true&condition=${JSON.stringify(
        parameter
      )}`;
      result = await axios.get(urlLink);
      if (result.data && result.data.listings.length > 0) {
        resData = result.data.listings;
        transformedURLs = result.data.listings?.map((data) => {
          const urlParts = data?.detailLink?.split("?");
          if (urlParts.length === 2) {
            const queryParams = urlParts[1];
            const newURL = `https://gowpnow.com/listing?${queryParams}`;
            speak_property_name.push(data?.address);
            return newURL;
          }
           return null;
        });

        responceMsg = "";
      } else {
        const get_locations = await axios.get(
          `https://gowpnow.com/api-site/search/suggestions/listing/location?key=${parameter.location.city}&siteId=37314`
        );
         const jsonData = get_locations?.data;
 
        if (jsonData[cityIndex]?.list?.[0]?.value != undefined) { 
          maxRetries = get_locations?.data?.length;
        }
        if (jsonData && jsonData.length > 0) {
          const selectedCity = jsonData[cityIndex]?.list?.[0]?.value;
          if (selectedCity) {
            parameter.location.city = [selectedCity];
            cityIndex++;

            const removeKeys = ["price", "beds", "baths"];
            removeKeys.forEach((key) => {
              if (parameter[key]) {
                delete parameter[key];
              }
            });
          }
        }
        retryCount++;
        if (retryCount >= maxRetries) {
          await normalChat(req, res);
          // responceMsg = "Properties were not found within this criteria.";
          break;
        }
      }
    } while (result?.data?.listings?.length === 0);
  }
  const single_more_property = transformedURLs ? transformedURLs[0] : "";
  return [resData, responceMsg, single_more_property, speak_property_name];
};

const extractJSON = (str) => {
  var firstOpen, firstClose, candidate;
  firstOpen = str.indexOf("{", firstOpen + 1);
  do {
    firstClose = str.lastIndexOf("}");
    if (firstClose <= firstOpen) {
      return null;
    }
    do {
      candidate = str.substring(firstOpen, firstClose + 1);
      try {
        var res = JSON.parse(candidate);
        return [res, firstOpen, firstClose + 1];
      } catch (e) {}
      firstClose = str.substr(0, firstClose).lastIndexOf("}");
    } while (firstClose > firstOpen);
    firstOpen = str.indexOf("{", firstOpen + 1);
  } while (firstOpen != -1);
};
const isJsonString = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

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

module.exports = { getPropertySearch };
