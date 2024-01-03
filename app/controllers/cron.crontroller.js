const db = require("../models");
const User = db.user;
const ChatHistory = db.ChatHistory;
const Remineder = db.Remineder;
const axios = require("axios");
const { Op } = require("sequelize");
const { admin } = require("../config/firebase-config");

const { OpenAI } = require("langchain/llms/openai");
const {
  PromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} = require("langchain/prompts");
const {
  StructuredOutputParser,
  OutputFixingParser,
} = require("langchain/output_parsers");
const { ChatMessageHistory, BufferMemory } = require("langchain/memory");
const { ConversationChain } = require("langchain/chains");
const Notification = db.notification;
const sequelize = db.sequelize;
const Histories = db.histories;
const moment = require("moment");
User.hasMany(Notification);
const { verifytwillio } = require("../config/reminder.config");
const twilio = require("twilio");

exports.randomQuestion = async () => {
  try {
    let setTime = moment().add(-360, "minutes").format("YYYY-MM-DD HH:mm:ss");

    User.findOne({
      where: {
        device_id: {
          [Op.not]: null,
        },
        status: 1,
        last_track: {
          [Op.lte]: setTime,
        },
      },
      include: [
        {
          model: Notification,
          where: {
            reminder: 1,
          },
        },
      ],
    })
      .then(async (user) => {
        if (user) {
          const [ques, history_type] = await remindQue(user?.id);
          var payload = {
            notification: {
              body: ques,
              OrganizationId: "2",
              content_available: "true",
              priority: "high",
              subtitle: "",
              title: "",
              type: "general",
            },
            data: {
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              priority: "high",
              sound: "app_sound.wav",
              content_available: "true",
              body: ques,
              type: "general",
              organization: "",
            },   
          };
          await sendRandomNotification(user?.device_id, payload, user);
        }
      })
      .catch((err) => {
        console.log(err?.message);
      });
  } catch (error) {
    console.log(error?.message);
  }
};

const sendRandomNotification = async (deviceID, payload, item) => {
  let current = moment().format("YYYY-MM-DD HH:mm:ss");

  try {
    let data = JSON.stringify({
      to: deviceID,
      notification: payload.notification,
      data: payload.data,
      webpush: {
        fcm_option: {
          link: "http://localhost:3000",
          // link: `${process.env.SITE_URL}`,
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://fcm.googleapis.com/fcm/send",
      // url: `${process.env.FCM_URL}`,
      headers: {
        Authorization:
          "key=AAAAIF1aV2g:APA91bFVw1M7qCtolTVTcFUOv9dBNM7thMflAAcFPFpgpwqGyxaWDOU57GyX2zhBx4w3iXKdFKT9_yhfnVxHaw4DQ7ff_qv5RZdBodZmJY2A9XklIf_E4KdpciMBuTF1ExvL904b2cpI",
        // Authorization: `${process.env.SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
    if (response) {
      User.update(
        {
          last_track: current,
        },
        {
          where: {
            id: item?.id,
          },
        }
      );
    }
  } catch (error) {
    console.error(error.message);
  }
};

// exports.cronJobtest = async (req, res) => {
//   try {
//     const [ques, history_type] = await remindQue(13);

//     res.status(200).json({ ques, history_type });
//   } catch (error) {
//     console.log(error?.message);
//     return error?.message;
//   }
// };

const remindQue = async (user_id) => {
  const prompt = new PromptTemplate({
    template: `create a  engaging conversational an question or a comment in 10 words or less that ends with “let’s chat”… the prompts are for a companion bot using AI to create relationship with users of the app… the prompts should be encouraging, or motivating and always kind, empathetic and inviting. The prompts should cover all aspects of the everyday life from food to entertainment, sports, life experiences, hopes and dreams, money, fashion, music etc. The language should be informal and casual but not too trendy. The objective is to invite the respondent to start a conversation.

    Current conversation:
    {history}.
     
    input : {input}`,
    inputVariables: ["input", "history"],
  });
  try {
    const history = new ChatMessageHistory();
    const [user_history, history_type] = await get_history(user_id);

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
    const model = new OpenAI({ modelName: "gpt-3.5-turbo-16k", maxTokens: 20 });
    const chain = new ConversationChain({
      prompt,
      llm: model,
      memory,
      verbose: false,
    });
    const res1 = await chain.call({
      input: `create 1 conversational questions or comments in  10 words or less that end with “let’s chat”… the prompts should be encouraging or motivating and always kind, empathetic and inviting. The objective is to invite the respondent to start a conversation`,
    });
    const ques = res1.response?.replace("Comment: ", "");
    return [ques, history_type];
  } catch (error) {
    return error?.message;
  }
};

const get_history = async (user_id) => {
  let chat_history = "";
  let history_type = "";
  let user_history = [];
  let propertiestext = "";
  await Histories.findAll({
    where: {
      user_id: user_id,
    },

    limit: 6,
    order: [["id", "DESC"]],
  })
    .then((history) => {
      const userHist = history.reverse();
      userHist?.map((his, ind) => {
        const proData = JSON.parse(his?.properties);
        proData?.map((item, index) => {
          propertiestext += `Property ${index + 1} : ${
            item?.propertyType
          } Bedrooms: ${item?.bedrooms}, Bathrooms: ${
            item?.bathrooms
          }, price : ${item?.price}$, size: ${item?.sqft} SqFt
            address: ${item?.address}
            detailsDescribe: ${item?.detailsDescribe}${
            item.communityFeatures
              ? " community Features: " + item.communityFeatures
              : ""
          }${item.view ? " view: " + item.view : ""}${
            item.waterfrontDescription
              ? " water front Description: " + item.waterfrontDescription
              : ""
          }${
            item.chimeAmenities
              ? " chime Amenities: " + item.chimeAmenities
              : ""
          }${
            item.elementarySchool
              ? " elementary School: " + item.elementarySchool
              : ""
          }${item.middleSchool ? " middle School: " + item.middleSchool : ""}${
            item.highSchool ? " highSchool: " + item?.highSchool : ""
          }${item.otherSchool ? " other School: " + item.otherSchool : ""}${
            item.schoolDistrict
              ? " school District: " + item.schoolDistrict
              : ""
          }`;
        });
        history_type = his.type;
        // chat_history = his.user_input+','+his.ai_answer.trim().replaceAll(/[:*]/g, ' ').replaceAll('\n', ' ');
        // const aai_re = his.ai_answer+'\n'+propertiestext;
        user_history.push([
          his?.req_type == "sender" ? his.text : "",
          his?.req_type == "receiver"
            ? his.text.trim().replaceAll(/[:*]/g, " ").replaceAll("\n", " ") +
              propertiestext.replaceAll("\n", "")
            : "",
        ]);
        //user_history.push(his.text.trim().replaceAll(/[:*]/g, ' ').replaceAll('\n', ' ') + propertiestext.replaceAll('\n', ''))
      });

      return [user_history, history_type];
    })
    .catch((err) => {
      return [];
    });
  return [user_history, history_type];
};

// reminder statu == 1 and sms == 1
exports.cronJobSMS = async () => {
  let current = moment().format("YYYY-MM-DD HH:mm:ss");
  let setTime = moment().add(+30, "minutes").format("YYYY-MM-DD HH:mm:ss");
  const { phone, sid, tkn } = await verifytwillio();
  const client = twilio(sid, tkn);
   const reminders = await sequelize.query(
    `SELECT reminders.id as id, user_id,msg, phone,reminders.datetime as reminder_datetime FROM reminders LEFT JOIN notifications ON notifications.userId = reminders.user_id WHERE reminders.status = 1 AND sms = 1 AND notifications.datetime = reminders.datetime AND (reminders.datetime >= '${current}' AND reminders.datetime <= '${setTime}')`
  ); 
    if (reminders[0].length > 0) {
    await Promise.all(
      reminders[0]?.map(async (item) => {
         client.messages
          .create({
            from: phone,
            body: "This is reminding message to you : " + item.msg,
            to: `+${item.phone}`,
          })
          .then(async (call) => {
              await Notification.update(
              { sms: 0 },
              {
                where: {
                  userId: item?.user_id,
                  datetime: moment
                    .utc(item?.reminder_datetime)
                    .format("YYYY-MM-DD HH:mm:ss"),
                },
              }
            );
            await Notification.destroy({
              where: {
                userId: item?.user_id,
                datetime: moment
                  .utc(item?.reminder_datetime)
                  .format("YYYY-MM-DD HH:mm:ss"),
                call: 0,
                reminder: 0,
              },
            });
            await Remineder.update(
              {
                status: 2,
              },
              {
                where: {
                  id: item.id,
                },
              }
            );
          })
          .catch((err) => {
            console.log(err?.message);
          });
      })
    );
  }
};

// reminder status > 0 and call = 1
exports.cronJobCall = async () => {
  let current = moment().format("YYYY-MM-DD HH:mm:ss");
  let setTime = moment().add(+10, "minutes").format("YYYY-MM-DD HH:mm:ss");
  const { phone, sid, tkn } = await verifytwillio();
  const client = twilio(sid, tkn);
  const reminders = await sequelize.query(
    `SELECT reminders.id as id, user_id,msg, phone ,reminders.datetime as reminder_datetime FROM reminders LEFT JOIN notifications ON notifications.userId = reminders.user_id WHERE reminders.status > 0 AND notifications.call = 1 AND notifications.datetime = reminders.datetime AND (reminders.datetime >= '${current}' AND reminders.datetime <= '${setTime}')`
  );
  if (reminders[0].length > 0) {
    await Promise.all(
      reminders[0]?.map(async (item) => {
        client.calls
          .create({
            twiml:
              "<Response><Say>This is reminding call to you : " +
              item.msg +
              "</Say></Response>",
            to: `+${item.phone}`,
            from: phone,
          })
          .then(async (call) => {
            await Notification.update(
              { call: 0 },
              {
                where: {
                  userId: item?.user_id,
                  datetime: moment
                    .utc(item?.reminder_datetime)
                    .format("YYYY-MM-DD HH:mm:ss"),
                },
              }
            );
            await Notification.destroy({
              where: {
                userId: item?.user_id,
                datetime: moment
                  .utc(item?.reminder_datetime)
                  .format("YYYY-MM-DD HH:mm:ss"),
                sms: 0,
                reminder: 0,
              },
            });

            await Remineder.update(
              {
                status: 0,
              },
              {
                where: {
                  id: item.id,
                },
              }
            );
          })
          .catch((err) => {
            console.log(err?.message);
          });
      })
    );
  }
};

// reminder = 1
exports.cronJobNotification = async () => {
  let current = moment().format("YYYY-MM-DD HH:mm:ss");
  let setTime = moment().add(+1, "minutes").format("YYYY-MM-DD HH:mm:ss");

  const reminders = await sequelize.query(
    `SELECT reminders.id as id, user_id,msg, device_id,reminders.datetime as reminder_datetime FROM reminders LEFT JOIN notifications ON notifications.userId = reminders.user_id LEFT JOIN users on users.id = reminders.user_id WHERE reminder = 1 AND notifications.datetime = reminders.datetime AND device_id IS NOT NULL AND (reminders.datetime >= '${current}' AND reminders.datetime <= '${setTime}')`
  );
 
  if (reminders[0].length > 0) {
    await Promise.all(
      reminders[0]?.map(async (item) => {
        var payload = {
          notification: {
            body: "Reminding call to you :  " + item.msg,
            OrganizationId: "2",
            content_available: "true",
            priority: "high",
            subtitle: "Remind Conversation",
            title: "REEC",
          },
          data: {
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            priority: "high",
            sound: "app_sound.wav",
            content_available: "true",
            body: "Reminding call to you :  " + item.msg,
            organization: "Remind Conversation",
          },
        };
        await sendFCMNotification(item.device_id, payload, item);
      })
    );
  }
};

const sendFCMNotification = async (deviceID, payload, item) => {
  try {
    let data = JSON.stringify({
      to: deviceID,
      notification: payload.notification,
      data: payload.data,
      webpush: {
        fcm_option: {
          link: "http://localhost:3000",
          // link: `${process.env.SITE_URL}`,
        },
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://fcm.googleapis.com/fcm/send",
      // url: `${process.env.FCM_URL}`,
      headers: {
        Authorization:
          "key=AAAAIF1aV2g:APA91bFVw1M7qCtolTVTcFUOv9dBNM7thMflAAcFPFpgpwqGyxaWDOU57GyX2zhBx4w3iXKdFKT9_yhfnVxHaw4DQ7ff_qv5RZdBodZmJY2A9XklIf_E4KdpciMBuTF1ExvL904b2cpI",
        // Authorization: `${process.env.SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);
     if (response) {
      await Notification.update(
        { reminder: 0 },
        {
          where: {
            userId: item?.user_id,
            datetime: moment
              .utc(item?.reminder_datetime)
              .format("YYYY-MM-DD HH:mm:ss"),
          },
        }
      );
      await Notification.destroy({
        where: {
          userId: item?.user_id,
          datetime: moment
            .utc(item?.reminder_datetime)
            .format("YYYY-MM-DD HH:mm:ss"),
          sms: 0,
          call: 0,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
};
