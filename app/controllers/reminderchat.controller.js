const { z } = require("zod");
const { OpenAI } = require("langchain/llms/openai");
const { PromptTemplate } = require("langchain/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { ChatMessageHistory, BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");

const { admin } = require("../config/firebase-config");
const db = require("../models");
const User = db.user;
const Remineder = db.Remineder;
const Histories = db.histories;
const moment = require("moment");   
const Notification = db.notification;

/*--------------------------------------------------------------------------------------*/
async function reminderChat(req, res) {
  const { question, user_id } = req.body;
  console.log("reminder chat ########");
  try{
    let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
    const current_date = moment().format("YYYY-MM-DD");
  console.log(current_time,'current_timecurrent_timecurrent_timecurrent_time');
    const parserReminder = StructuredOutputParser.fromZodSchema(
      z
        .object({
          answer: z
            .string()
            .describe(
              "To better answer the user's questions for reminder,  you need get all appropriate parameters for reminder,if not,then please ask for that, then set reminder"
            ),
          datetime: z
            .string()
            .describe(
              "If the user mentions a reminder task, set the reminder datetime format to Y-m-d H:i:s; otherwise, set it to null:" +
                current_time
            ),
          activities: z
            .string()
            .describe(
              "If the user mentions a reminder task, neither ask for activities then instruct the system to set a message prompting as activites of the user to complete the task. Otherwise, set it to null."
            ),
          format: z
            .boolean()
            .describe(
              "If the user does not mention a specific time and instead says 'after a minute' or 'after an hour,' then set it to false; otherwise, set it to true."
            ),
        })
        .describe(
          "If the user mentions a reminder task, then set the array of Airtable records; otherwise, do not attempt to modify the array. The current datetime is :" +
            current_time
        )
    );
  
    const formatInstructionsRemider = parserReminder.getFormatInstructions();
    try {
      res.setHeader("Content-Type", "application/json");
      const [user_history] = await get_history_type(user_id, "reminder", 2);
   
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
      const memory = await new BufferMemory({
        chatHistory: new ChatMessageHistory(messages),
        returnMessages: false,
      });
      const model = new OpenAI({
        modelName: "gpt-3.5-turbo-16k",
        streaming: true,
      });
      const remiderPrompt = new PromptTemplate({
        template: `You are a "Reminder aide Scheduler Assistant",Who provides facility or assistance to  set reminder.Your task is set up a reminder task,while ensuring that the system accurately understands the input to set reminders,If users do not provide all required parameters to set reminder ,then please ask follow-up questions to gather information like datetime,activites to setting up the reminders.Your  primary job is to set reminder for various activites with time and date.Please ask questions,if user doesn't provide all details to set reminder.Once the reminder is seted then response politly about there reminder.
        #For example:
        answer: 'Your reminder is succesfully created for the given activities,date and time,Then talk about there activites.',
        datetime:${current_time},
        activities:set activities for reminder[eg:Play cricket match tommorow morning],
        *Notes
        You are  committed to answering user's questions with kindness, inclusivity, and empathy, providing informative and service-oriented responses while maintaining an assertive and enthusiastic approach to assist you to the best of your abilities:\n\n{format_instructions}
  
        
        \nCurrent conversation : {history}
        
        
        \ninput: {input}`,
        inputVariables: ["input", "history"],
        partialVariables: { format_instructions: formatInstructionsRemider },
      });
  
      const chain = new ConversationChain({
        prompt: remiderPrompt,
        llm: model,
        memory,
        verbose: false,
      });
      console.log(question,'questionquestionquestionquestion');
      const res1 = await chain.call({ input: question });
      console.log(res1,'res1res1res1res1res1res1res1res1');
      let ans = "";
      let urlLink = "";
      const json = await isJsonString(res1.response);
  
      if (json) {
        const reponcedata = JSON?.parse(res1.response);
  
        if (ans) {
          response = { message: ans, link: "" };
        }
        const { datetime } = reponcedata;
        if (datetime && datetime != "") {
          urlLink = await setReminder(reponcedata, user_id, question);
        }
      } else {
        const data = await extractJSON(res1.response);
  
        ans = data
          ? data[0]?.answer.replace("AI:", "")
          : res1.response.replace("AI:", "");
        response = { message: ans, link: "" };
        res.write(JSON.stringify(response));
      }
      await Histories.create({
        user_id: user_id,
        text: question,
        req_type: "sender",
        type: "reminder",
      });
  
      const last = await Histories.create({
        user_id: user_id,
        text: ans,
        req_type: "receiver",
        type: "reminder",
      });
       response = {
        message: `${JSON?.parse(res1.response).answer}`,
        ...(urlLink ? { link: urlLink } : {}),
      };
      res.status(200).end(JSON.stringify(response));
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  } catch (error) {
    res.status(500).json({ error: error?.message });
  }
  
}
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

const setReminder = async (paramters, user_id, question) => {
  const { datetime, activities, format } = paramters;

  let calender_url = "";
  try {
    if (!datetime && !activities) {
      return false;
    }
    if (activities == "") {
      return false;
    }
    if (!activities) {
      return false;
    }

    const fmt = "YYYY-MM-DD HH:mm:ss"; // must match the input
    let timeZone = "";

    let userPhone = "";
    let device_id = "";
    await User.findOne({
      where: {
        id: user_id,
        status: 1,
      },
    })
      .then((user) => {
        userPhone = user.phone;
        timeZone = user.timeZoneOffset;
        device_id = user.device_id;
      })
      .catch((err) => {
        console.log("Something went wrong..");
      });
    let n = 10;
    n *= -1;
    const zone = timeZone.slice(0, n);
    const first = zone.split(":");
    if (parseInt(first[0]) > 0) {
      if (first[0].length == 1) {
        timeZone = "+0" + first[0] + ":" + first[1];
      } else {
        timeZone = "+" + first[0] + ":" + first[1];
      }
    } else {
      if (first[0].length > 2) {
        timeZone = first[0] + ":" + first[1];
      } else {
        let t = parseInt(first[0]) * -1;
        timeZone = "-0" + t + ":" + first[1];
      }
    }
    const defaultTime = moment(datetime).format("YYYY-MM-DD HH:mm:ss");
    const utcTime = moment(datetime).utcOffset(timeZone);
    const reminderTime = moment(datetime)
      .tz(timeZone)
      .format("YYYY-MM-DD HH:mm:ss");
     await Remineder.create({
      user_id: user_id,
      title:activities,
      msg:activities,
      phone: userPhone,
      datetime: format ? reminderTime : defaultTime, // change kis
    })
      .then(async (remine) => {
        const reminderId = remine.dataValues.id;
        const universalTime = moment(utcTime).utcOffset();
        const reminderTimecalender = moment
          .utc(datetime)
          .utcOffset(universalTime)
          .format("YYYY-MM-DD HH:mm:ss");
        const localUser = format ? defaultTime : reminderTimecalender;
        const cldateTime = moment(localUser).format("YYYYMMDDTHHmmssZ");
        calender_url = `https://calendar.google.com/calendar/u/0/r/eventedit?dates=${cldateTime}/${cldateTime}&text=${remine.title}`;
        if (reminderId) {
           const includesKeywords = (question, keywords) =>
            keywords.some((keyword) => question.includes(keyword));
          // Function to create a notification
          const createNotification = async (user_id, sms, call, reminder) => {
            await db.notification.create({
              userId: user_id,
              sms,
              call,
              reminder,
              reminder_id: reminderId,
              datetime: format ? reminderTime : defaultTime,
            });
          };
          if (
            includesKeywords(question, ["call", "phone", "calling"]) &&
            includesKeywords(question, ["sms", "text", "message"]) &&
            includesKeywords(question, ["notification", "popup"])
          ) {
            await createNotification(user_id, 1, 1, 1);
          } else if (
            includesKeywords(question, ["call", "phone", "calling"]) &&
            includesKeywords(question, ["sms", "text", "message"])
          ) {
            await createNotification(user_id, 1, 1, 0);
          } else if (
            includesKeywords(question, ["call", "phone", "calling"]) &&
            includesKeywords(question, ["notification", "popup"])
          ) {
            await createNotification(user_id, 1, 1, 0);
          } else if (
            includesKeywords(question, ["sms", "text", "message"]) &&
            includesKeywords(question, ["notification", "popup"])
          ) {
            await createNotification(user_id, 1, 0, 0);
          } else if (includesKeywords(question, ["call", "phone", "calling"])) {
            await createNotification(user_id, 0, 1, 0);
          } else if (includesKeywords(question, ["sms", "text", "message"])) {
            await createNotification(user_id, 1, 0, 0);
          } else {
            await createNotification(user_id, 1, 1, 1);
          }
        }
        return calender_url;
      })
      .catch((err) => {
        return err?.message;
      });
    return calender_url;
  } catch (error) {
    console.log(error?.message);
  }
};

const get_history_type = async (user_id, type, limit = 2) => {
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

const get_reminders = async (req, res) => {
  try {
    const { user_id } = req.body;
    const get_data_reminders = await Remineder.findAll({
      where: {
        user_id,
      },
      include: [
        {
          model: Notification,
          attributes: ["sms", "call", "reminder"],
        },
      ],
    });

    const uniqueReminderIds = new Set();

    const remindersWithDataValues = get_data_reminders
      .filter((reminder) => {
        if (uniqueReminderIds.has(reminder.id)) {
          return false;
        } else {
          uniqueReminderIds.add(reminder.id);
          return true;
        }
      })
      .map((reminder) => reminder.dataValues);

    return res.status(200).json({
      message: "Reminders fetch successfully",
      data: remindersWithDataValues,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const delete_reminders = async (req, res) => {
  try {
    const { user_id, id } = req.body;

    const reminder = await Remineder.findOne({
      where: { user_id, id },
    });

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found." });
    }
    await Remineder.destroy({
      where: { user_id, id },
    });

    await Notification.destroy({
      where: { userId: user_id, reminder_id: id },
    });

    return res.status(200).json({ message: "Reminder deleted successfully." });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

const update_reminders = async (req, res) => {
  try {
    const { id, user_id, sms_status, call_status, reminder_status } = req.body;

    const reminder = await Remineder.findOne({
      where: { id, user_id },
    });

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found." });
    }

    const notificationInstance = await Notification.findOne({
      where: { userId: user_id, reminder_id: id },
    });
    if (notificationInstance) {
      await notificationInstance.update({
        sms: sms_status,
        call: call_status,
        reminder: reminder_status,
      });
      return res
        .status(200)
        .json({ message: "Reminder updated successfully." });
    } else {
      return res.status(400).json({
        error: "something wents wrong please try after sometime...",
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  reminderChat,
  get_reminders,
  delete_reminders,
  update_reminders,
};




// after changes










// const { z } = require("zod");
// const { OpenAI } = require("langchain/llms/openai");
// const { PromptTemplate } = require("langchain/prompts");
// const { StructuredOutputParser } = require("langchain/output_parsers");
// const { ChatMessageHistory, BufferMemory } = require("langchain/memory");
// const { ConversationChain } = require("langchain/chains");

// const { admin } = require("../config/firebase-config");
// const db = require("../models");
// const User = db.user;
// const Remineder = db.Remineder;
// const Histories = db.histories;
// const moment = require("moment");
// const Notification = db.notification;

// /*--------------------------------------------------------------------------------------*/
// async function reminderChat(req, res) {
//   const { question, user_id } = req.body;
//   console.log("reminder chat ########");
//   let current_time = moment().format("HH:mm:ss");
//   let current_date = moment().format("YYYY-MM-DD");

//   // let current_date_time=moment().format("YYYY-MM-DD HH:mm:ss");
 

//   const parserReminder = StructuredOutputParser.fromZodSchema(
//     z
//       .object({
//         answer: z
//           .string()
//           .describe(
//             "To better answer the user's questions for reminder,  you need get all appropriate parameters for reminder,if not,then please ask for that, then set reminder"
//           ),
//         time: z.string().describe("If the user mentions a reminder task, set the reminder time format to HH:mm:ss; otherwise ask for date:"+current_time),       
//         date: z
//           .string()
//           .describe(
//             "If the user mentions a reminder task, set the reminder date format to YYYY-MM-DD;otherwise ask for date" +
//             current_date
//           ), 
//           title: z.string().describe("if user mention for reminder task then set title; otherwise ask for title."),
//           activities: z
//           .string()
//           .describe(
//             "If the user mentions a reminder task,set the the activities;if not mention then ask  for activities;"
//           ),
//         format: z
//           .boolean()
//           .describe(
//             "If the user does not mention a specific time and instead says 'after a minute' or 'after an hour,' then set it to false; otherwise, set it to true;"
//           ),
//       })
//       .describe(
//         "If the user mentions a reminder task, then set the array of Airtable records; otherwise, do not attempt to modify the array. The current date and time :" +
//         current_date + current_time
//       )
//   );

//   const formatInstructionsRemider = parserReminder.getFormatInstructions();
//   try {
//     res.setHeader("Content-Type", "application/json");
//     const [user_history] = await get_history_type(user_id, "reminder", 6);
//     // const existingNotification = await Notification.findOne({
//     //   where: { userId: user_id },
//     // });

//     // console.log("yes  here i am",existingNotification);

//     // if (existingNotification==null) {
//     //   console.log("yes  here i am");
//     //   await Notification.create({
//     //     userId: user_id,
//     //     sms: 1,
//     //     call: 1,
//     //     reminder: 1,
//     //   });

//     // }
//     const history = new ChatMessageHistory();
//     user_history?.map(async (chat) => {
//       if (chat[0]) {
//         await history.addUserMessage(chat[0]);
//       }
//       if (chat[1]) {
//         await history.addAIChatMessage(chat[1]);
//       }
//     });
//     const messages = await history.getMessages();
//     const memory = await new BufferMemory({
//       chatHistory: new ChatMessageHistory(messages),
//       returnMessages: false,
//     });

//     const model = new OpenAI({
//       modelName: "gpt-3.5-turbo-16k",
//       streaming: true,
//     });
//     const remiderPrompt = new PromptTemplate({
//       template: `You are "Anna" a Reminder aide Scheduler Assistant,Who provides facility and assistance to set reminder for activities.Your primary task and goal is to set reminder for various activites with time date and activities.Please ask follow-up questions from users if user doesn't provide all details to set reminders like date,time,and activities.Once the  user's reminder is set, then response politly about there reminders.
//       #For example:
//       answer: 'Your reminder is succesfully created for the given activities,date and time,Then talk about there activites.',
//       time:${current_time},
//       date:${current_date},
//       title:set title for reminder[eg:Cricket match]
//       activities:set activities for reminder[eg:Play cricket match tommorow morning],
//       *Notes
//        Your aim to set reminder and  offer informative and service-focused replies while maintaining a proactive and enthusiastic approach to assist to the fullest extent of your capabilities:\n\n{format_instructions}.

//       \nCurrent conversation : {history}     
      
//       \ninput: {input}`,
//       inputVariables: ["input", "history"],
//       partialVariables: { format_instructions: formatInstructionsRemider },
//     });

//     console.log("here i am .............");

//     const chain = new ConversationChain({
//       prompt: remiderPrompt,
//       llm: model,
//       memory,
//       verbose: false,
//     });
//     const res1 = await chain.call({ input: question });

//     console.log("here i am .............");

//     console.log("response for use", res1.response);
//     let ans = "";
//     let urlLink = "";
//     const json = await isJsonString(res1.response);

//     if (json) {
//       const reponcedata = JSON?.parse(res1.response);

//       if (ans) {
//         response = { message: ans, link: "" };
//       }
//       const { date,time } = reponcedata;
//       if (date && date != "" && time && time != "") {
//         urlLink = await setReminder(reponcedata, user_id, question);
//       }
//     } else {
//       const data = await extractJSON(res1.response);

//       ans = data
//         ? data[0]?.answer.replace("AI:", "")
//         : res1.response.replace("AI:", "");
//       response = { message: ans, link: "" };
//       res.write(JSON.stringify(response));
//     }
//     await Histories.create({
//       user_id: user_id,
//       text: question,
//       req_type: "sender",
//       type: "reminder",
//     });

//     const last = await Histories.create({
//       user_id: user_id,
//                        text: ans,
//       req_type: "receiver",
//       type: "reminder",
//     });

//     response = {
//       message: `${JSON?.parse(res1.response).answer}`,
//       ...(urlLink ? { link: urlLink } : {}),
//     };
//     res.status(200).end(JSON.stringify(response));
//   } catch (error) {
//     res.status(500).json({ error: error?.message });
//   }
// }
// const extractJSON = (str) => {
//   var firstOpen, firstClose, candidate;
//   firstOpen = str.indexOf("{", firstOpen + 1);
//   do {
//     firstClose = str.lastIndexOf("}");
//     if (firstClose <= firstOpen) {
//       return null;
//     }
//     do {
//       candidate = str.substring(firstOpen, firstClose + 1);
//       try {
//         var res = JSON.parse(candidate);
//         return [res, firstOpen, firstClose + 1];
//       } catch (e) {}
//       firstClose = str.substr(0, firstClose).lastIndexOf("}");
//     } while (firstClose > firstOpen);
//     firstOpen = str.indexOf("{", firstOpen + 1);
//   } while (firstOpen != -1);
// };
// const isJsonString = (str) => {
//   try {
//     JSON.parse(str);
//   } catch (e) {
//     return false;
//   }
//   return true;
// };

// const setReminder = async (paramters, user_id, question) => {
//   const { date,time, activities, format } = paramters;

//   const datetime =date+" "+time;
  

//   let calender_url = "";
//   try {
//     if (!datetime && !activities) {
//       return false;
//     }
    
//     if (activities == "") {
//       return false;
//     }
//     if (!activities) {
//       return false;
//     }
    
   
//     const fmt = "YYYY-MM-DD HH:mm:ss"; // must match the input
//     let timeZone = "";

//     let userPhone = "";
//     let device_id = "";
//     await User.findOne({
//       where: {
//         id: user_id,
//         status: 1,
//       },
//     })
//       .then((user) => {
//         userPhone = user.phone;
//         timeZone = user.timeZoneOffset;
//         device_id = user.device_id;
//       })
//       .catch((err) => {
//         console.log("Something went wrong..");
//       });
//     let n = 10;
//     n *= -1;
   
//     const zone = timeZone.slice(0, n);
//     const first = zone.split(":");
//     if (parseInt(first[0]) > 0) {
//       if (first[0].length == 1) {
//         timeZone = "+0" + first[0] + ":" + first[1];
//       } else {
//         timeZone = "+" + first[0] + ":" + first[1];
//       }
//     } else {
//       if (first[0].length > 2) {
//         timeZone = first[0] + ":" + first[1];
//       } else {
//         let t = parseInt(first[0]) * -1;
//         timeZone = "-0" + t + ":" + first[1];
//       }
//     }
    
   
//     const defaultTime = moment(datetime).format("YYYY-MM-DD HH:mm:ss");
  
//     const utcTime = moment(datetime).utcOffset(timeZone);
   
//     const reminderTime = moment(datetime)
//       .tz(timeZone)
//       .format("YYYY-MM-DD HH:mm:ss");
     
//   await Remineder.create({
//       user_id: user_id,
//       title: activities,
//       msg: activities,
//       phone: userPhone,
//       datetime: format ? reminderTime : defaultTime, // change kis
//     })
//       .then(async (remine) => {
//         const reminderId = remine.dataValues.id;
//         const universalTime = moment(utcTime).utcOffset();
//         const reminderTimecalender = moment
//           .utc(datetime)
//           .utcOffset(universalTime)
//           .format("YYYY-MM-DD HH:mm:ss");
//         const localUser = format ? defaultTime : reminderTimecalender;
//         const cldateTime = moment(localUser).format("YYYYMMDDTHHmmssZ");
        
   
//         calender_url = `https://calendar.google.com/calendar/u/0/r/eventedit?dates=${cldateTime}/${cldateTime}&text=${remine.title}`;
//         if (reminderId) {
//           console.log(reminderId, "reminderIdreminderIdreminderIdreminderId");
//           const includesKeywords = (question, keywords) =>
//             keywords.some((keyword) => question.includes(keyword));
//           // Function to create a notification
//           const createNotification = async (user_id, sms, call, reminder) => {
//             await db.notification.create({
//               userId: user_id,
//               sms,
//               call,
//               reminder,
//               reminder_id: reminderId,
//               datetime: format ? reminderTime : defaultTime,
//             });
//           };
//           if (
//             includesKeywords(question, ["call", "phone", "calling"]) &&
//             includesKeywords(question, ["sms", "text", "message"]) &&
//             includesKeywords(question, ["notification", "popup"])
//           ) {
//             await createNotification(user_id, 1, 1, 1);
//           } else if (
//             includesKeywords(question, ["call", "phone", "calling"]) &&
//             includesKeywords(question, ["sms", "text", "message"])
//           ) {
//             await createNotification(user_id, 1, 1, 0);
//           } else if (
//             includesKeywords(question, ["call", "phone", "calling"]) &&
//             includesKeywords(question, ["notification", "popup"])
//           ) {
//             await createNotification(user_id, 1, 1, 0);
//           } else if (
//             includesKeywords(question, ["sms", "text", "message"]) &&
//             includesKeywords(question, ["notification", "popup"])
//           ) {
//             await createNotification(user_id, 1, 0, 0);
//           } else if (includesKeywords(question, ["call", "phone", "calling"])) {
//             await createNotification(user_id, 0, 1, 0);
//           } else if (includesKeywords(question, ["sms", "text", "message"])) {
//             await createNotification(user_id, 1, 0, 0);
//           } else {
//             await createNotification(user_id, 1, 1, 1);
//           }
//         }
//         return calender_url;
//       })
//       .catch((err) => {
//         return err?.message;
//       });
//     return calender_url;
//   } catch (error) {
//     console.log(error?.message);
//   }
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

// const get_reminders = async (req, res) => {
//   try {
//     const { user_id } = req.body;
//     const get_data_reminders = await Remineder.findAll({
//       where: {
//         user_id,
//       },
//       include: [
//         {
//           model: Notification,
//           attributes: ["sms", "call", "reminder"],
//         },
//       ],
//     });

//     const uniqueReminderIds = new Set();

//     const remindersWithDataValues = get_data_reminders
//       .filter((reminder) => {
//         if (uniqueReminderIds.has(reminder.id)) {
//           return false;
//         } else {
//           uniqueReminderIds.add(reminder.id);
//           return true;
//         }
//       })
//       .map((reminder) => reminder.dataValues);

//     return res.status(200).json({
//       message: "Reminders fetch successfully",
//       data: remindersWithDataValues,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };

// const delete_reminders = async (req, res) => {
//   try {
//     const { user_id, id } = req.body;

//     const reminder = await Remineder.findOne({
//       where: { user_id, id },
//     });

//     if (!reminder) {
//       return res.status(404).json({ error: "Reminder not found." });
//     }
//     await Remineder.destroy({
//       where: { user_id, id },
//     });

//     await Notification.destroy({
//       where: { userId: user_id, reminder_id: id },
//     });

//     return res.status(200).json({ message: "Reminder deleted successfully." });
//   } catch (error) {
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };

// const update_reminders = async (req, res) => {
//   try {
//     const { id, user_id, sms_status, call_status, reminder_status } = req.body;

//     const reminder = await Remineder.findOne({
//       where: { id, user_id },
//     });

//     if (!reminder) {
//       return res.status(404).json({ error: "Reminder not found." });
//     }

//     const notificationInstance = await Notification.findOne({
//       where: { userId: user_id, reminder_id: id },
//     });
//     if (notificationInstance) {
//       await notificationInstance.update({
//         sms: sms_status,
//         call: call_status,
//         reminder: reminder_status,
//       });
//       return res
//         .status(200)
//         .json({ message: "Reminder updated successfully." });
//     } else {
//       return res.status(400).json({
//         error: "something wents wrong please try after sometime...",
//       });
//     }
//   } catch (error) {
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };

// module.exports = {
//   reminderChat,
//   get_reminders,
//   delete_reminders,
//   update_reminders,
// };

