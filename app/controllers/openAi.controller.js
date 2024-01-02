const { OpenAI } = require("openai");
const normalChat = require("./normalChat");
const { getPropertySearch } = require("./getPropertySearch");
const { reminderChat } = require("./reminderchat.controller");
const moment = require("moment")

const openai = new OpenAI();
let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
let current_date = moment().format("YYYY-MM-DD");
console.log(current_date,'current_datecurrent_datecurrent_datecurrent_datecurrent_date');
const openAiFunction = async (req, res) => {
  console.log("chla");
  const { question } = req.body;
  try {
    let messages = [{ role: "user", content: question }];
    const tools = [
      
      // for normal chat
      {
        type: "function",
        function: {
          name: "normalChat",
          description: "Get the conversation going and ",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: `conversation with human bot and generate a response related to realestate "properties" or property in response to the user's query`,
              },
              location: {
                type: "string",
                description:
                  "generate a response related to real estate properties in response to the user's query.",
              },
            },
          },
        },
      },

        // for reminder chat
        
   {
    type: "function",
    function: {
      name: "reminderChat",
      description: "Set reminders for tasks and receive timely prompts.",
      parameters: {
        type: "object",
        properties: {
          answer: {
            type: "string",
            description: "To better answer the user's questions",
          },
          time: {
            type: "string",
            description: `"If the user mentions a reminder task, set the reminder time format to H:i:s; otherwise, set it to null;The current datetime is :" +${current_time}`,
          },
          datetime: {        
            type: "string",
            description:
              `If the user mentions a reminder task, set the reminder datetime format to Y-m-d H:i:s; otherwise, set it to null;The current datetime is :" +${current_date}`,
          },
       
          activities: {
            type: "string",
            description: `If the user mentions a reminder task, instruct the system to set a message prompting the user to complete the task. Otherwise, set it to null.`,
          },
          format: {
            type: "string",
            description:
              "If the user does not mention a specific time and instead says 'after a minute' or 'after an hour,' then set it to false; otherwise, set it to true.",
          },
        },
        required: ["time", "date", "activities"],
      },
    },
  },

        // {
        //   type: "function",
        //   function: {
        //     name: "reminderChat",
        //     description:
        //       "Set reminders for tasks with date time and activites and receive timely prompts.",
        //     parameters: {
        //       type: "object",
        //       properties: {
        //         answer: {
        //           type: "string",
        //           description: "To better answer the user's questions",
        //         },
  
        //         datetime: {
        //           type: "string",
        //           description:
        //             "If the user mentions a reminder task, set the reminder datetime format to Y-m-d H:i:s; otherwise, set it to null",
        //         },
  
        //         activities: {
        //           type: "string",
        //           description: `If the user mentions a reminder task, instruct the system to set a message prompting the user to complete the task. Otherwise, set it to null.`,
        //         },
        //         format: {
        //           type: "string",
        //           description:
        //             "If the user does not mention a specific time and instead says 'after a minute' or 'after an hour,' then set it to false; otherwise, set it to true.",
        //         },
        //       },
        //       required: ["datetime", "activities"],
        //     },
        //   },
        // },

      // for property serach
      {
        type: "function",
        function: {
          name: "getPropertySearch",
          description: "Get the property details",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description:
                  "generate a response related to real estate properties in response to the user's query.",
              },
              price: {
                type: "number",
                description: "If price is not specified, then it is null.",
              },
              bedrooms: {
                type: "number",
                description:
                  "If the number of bedrooms is not mentioned, then set it to 0.",
              },
              bathrooms: {
                type: "number",
                description:
                  "If the number of bathrooms is not mentioned, then set it to 0.",
              },
            },
            required: ["location", "price"],
          },
        },
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
     const toolCalls = responseMessage.tool_calls;
     console.log(responseMessage.tool_calls,'responseMessage.tool_callsresponseMessage.tool_callsresponseMessage.tool_callsresponseMessage.tool_calls');
    if (toolCalls) {
      const availableFunctions = {
        normal_chat: normalChat,
        set_reminder: reminderChat,
        get_property_search: getPropertySearch,
      };
      messages.push(responseMessage);
      for (const toolCall of toolCalls) {
        let functionName = toolCall.function.name;
        let functionToCall;

        if (functionName == "normalChat") {
          functionToCall = availableFunctions["normal_chat"];
        }
        if (functionName == "reminderChat") {
          functionToCall = availableFunctions["set_reminder"];
        }
        if (functionName == "getPropertySearch") {
          functionToCall = availableFunctions["get_property_search"];
        }
        if (functionToCall) {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          console.log(toolCall,'toolCalltoolCalltoolCalltoolCalltoolCalltoolCalltoolCalltoolCalltoolCalltoolCalltoolCall');
          const functionResponse = await functionToCall(
            req,
            res,
            functionArgs,
            toolCall
          );
          return functionResponse;
        }
      }
    } else {
      if (response.choices[0].message) {
        const answer = response.choices[0].message?.content;
        return res.status(200).json({ message: answer });
      }
      return;
    }
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

module.exports = {
  openAiFunction,
};
