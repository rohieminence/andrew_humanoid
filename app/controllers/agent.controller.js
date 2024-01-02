const axios = require("axios");
const db = require("../models");
const User = db.user;
const Agentconnect = db.agentconnect;
const { verifytwillio } = require("../config/reminder.config");
const twilio = require('twilio');
exports.agentCall = async (req, res) => {

    const { name, user_id, property_id, license, propertyType, address } = req.body;
    try{
        const {phone, sid, tkn} =  await verifytwillio();
        const client = twilio(sid, tkn);
    const userData = await User.findOne({
            where: {
              id: user_id
            },
          });
        const urlLink  = `https://gowpnow.com/api-site/agent/search/condition?name=${name}&siteId=3731&pageSize=100`;
        const result = await axios.get(urlLink);
       
          if(result.data?.data?.dataList){
                const agentData = result.data?.data?.dataList;
                const agent_phone =  agentData[0]?.phone;
                const email =  agentData[0]?.email;
                const cleanedNumber = agent_phone?.replace(/\D/g, '');
                if(!cleanedNumber){
                  const call_text = `Hello ${name},
            
                This is Reec App calling to notify you that ${userData.name} has shown interest in one of your listings - ${propertyType} at:${address}. We encourage you to check their details in the Agent REEC app and reach out to them as soon as possible. Ensuring prompt communication can greatly enhance client relationships and potential transactions.`
                client.calls
                    .create({
                        twiml: '<Response><Say>This call from REEC App to you : '+call_text+'</Say></Response>',
                        to: `+18582017577`,
                        from: phone
                    })
                 .then(async(call) =>{ console.log(call.sid)
                
                })
               await Agentconnect.create({
                    user_id: user_id,
                    agent_name: name,
                    phone: `+18582017577`,
                    license: license,
                    property_id: property_id,
                    email: 'andreww@gowpnow.com',
                    msg: call_text,
                    type: 'call',
                  })
                  res.status(200).json({message : 'Agent Call Request Sent.'});
                  return;
                }
                
                const call_text = `Hello ${name},
            
                This is Reec App calling to notify you that ${userData.name} has shown interest in one of your listings - ${propertyType} at:${address}. We encourage you to check their details in the Agent REEC app and reach out to them as soon as possible. Ensuring prompt communication can greatly enhance client relationships and potential transactions.`
                client.calls
                    .create({
                        twiml: '<Response><Say>This call from REEC App to you : '+call_text+'</Say></Response>',
                        to: `+${cleanedNumber}`,
                        from: phone
                    })
                 .then(async(call) =>{ console.log(call.sid)
                
                })
               await Agentconnect.create({
                    user_id: user_id,
                    agent_name: name,
                    phone: `+${cleanedNumber}`,
                    license: license,
                    property_id: property_id,
                    email: email,
                    msg: call_text,
                    type: 'call',
                  })
          }else{
            const call_text = `Hello ${name},
            
                This is Reec App calling to notify you that ${userData.name} has shown interest in one of your listings - ${propertyType} at:${address}. We encourage you to check their details in the Agent REEC app and reach out to them as soon as possible. Ensuring prompt communication can greatly enhance client relationships and potential transactions.`
                client.calls
                    .create({
                        twiml: '<Response><Say>This call from REEC App to you : '+call_text+'</Say></Response>',
                        to: `+18582017577`,
                        from: phone
                    })
                 .then(async(call) =>{ console.log(call.sid)
                
                })
               await Agentconnect.create({
                    user_id: user_id,
                    agent_name: name,
                    phone: `+18582017577`,
                    license: license,
                    property_id: property_id,
                    email: 'andreww@gowpnow.com',
                    msg: call_text,
                    type: 'call',
                  })
          }
          
    
        res.status(200).json({message : 'Agent Call Request Sent.'});
    }catch(error){
        res.status(500).json({ error: error?.message });
    }
}

exports.agentsms = async (req, res) => {

    const { name, user_id, property_id, license, propertyType, address } = req.body;
    try{
        const {phone, sid, tkn} =  await verifytwillio();
        const client = twilio(sid, tkn);
        const userData = await User.findOne({
            where: {
              id: user_id
            },
          });
        const urlLink  = `https://gowpnow.com/api-site/agent/search/condition?name=${name}&siteId=3731&pageSize=100`;
        const result = await axios.get(urlLink);
        console.log(result.data?.data?.dataList.length);
          if(result.data?.data?.dataList.length <= 0){
            const call_text = `Dear ${name}, \n\n    We are pleased to inform you that recently, ${userData.name} expressed interest in your listed property, ${propertyType} at:${address}. Please check their details within the Agent REEC app and connect with the potential client at your earliest convenience. \n\nWarm regards,\nREEC APP
            `
            client.messages
            .create({
               from: phone,
               body: call_text,
               to: `+18582017577`,
            })
            .then(async(call) =>{ console.log(call.sid)
            })
            await Agentconnect.create({
                user_id: user_id,
                agent_name: name,
                phone: `+18582017577`,
                license: license,
                property_id: property_id,
                email: 'andreww@gowpnow.com',
                msg: call_text,
                type: 'sms',
              })
              res.status(200).json({message : 'Agent SMS Request Sent.'});
            return;
          }
          if(result.data?.data?.dataList){
           
                const agentData = result.data?.data?.dataList;
                console.log("agentData : ", agentData);
                const agent_phone =  agentData[0]?.phone;
                const email =  agentData[0]?.email;
                const cleanedNumber = agent_phone?.replace(/\D/g, '');
                if(!cleanedNumber){
                  res.status(404).json({message : 'Agent Contact Details Not Found.'});
                  return;
                }
                
                const call_text = `Dear ${name}, \n\n   We are pleased to inform you that recently, ${userData.name} expressed interest in your listed property, ${propertyType} at:${address}. Please check their details within the Agent REEC app and connect with the potential client at your earliest convenience. \n\nWarm regards,\nREEC APP
                `
                client.messages
                .create({
                   from: phone,
                   body: call_text,
                   to: `+${cleanedNumber}`,
                })
                .then(async(call) =>{ console.log(call.sid)
                })
                await Agentconnect.create({
                    user_id: user_id,
                    agent_name: name,
                    phone: `+${cleanedNumber}`,
                    license: license,
                    property_id: property_id,
                    email: email,
                    msg: call_text,
                    type: 'sms',
                  })
            }
          
    
        res.status(200).json({message : 'Agent SMS Request Sent.'});
    }catch(error){
      console.log({error: error});
        res.status(500).json({ error: error?.message });
    }
}