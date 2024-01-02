const db = require("../models");
const ChatHistory = db.ChatHistory;
const Histories = db.histories;
const Remineder = db.Remineder;
exports.getUserHistory = (req, res) => {
  const user_id = req.params.user_id;
  const {offset, limit, orderby, type } = req.query;
  
  Histories.findAll({
    where: {
        user_id: user_id,
        // type: type ? type : ''
    },
    attributes: ['id', 'user_id', 'text', 'req_type','properties','type', 'createdAt'],
    offset: offset ? parseInt(offset) : 0,
    limit: limit ? parseInt(limit) : 50, 
    order : [['id', orderby ? orderby : 'ASC']]
  })
    .then((history) => {
      res.status(200).send({history});
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
exports.deleteUserHistory = async (req, res) => {
  const user_id = req.params.user_id;
  const {offset, limit, orderby, type } = req.query;
  
  Histories.destroy({ where: { user_id: user_id} }).then((history) => {
    res.status(202).send({ message: "Chat Histories Delete Successfully." });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getUserHistorytest = async (req, res) => {
  let chat_history = '';
  let user_history = [];
  let propertiestext = '';
  await ChatHistory.findAll({
    where: {
        user_id: 1,
    },
   
    limit: 5, 
    order : [['id', 'DESC']]
  })
    .then((history) => {
      
      const userHist = history.reverse();
      userHist?.map((his)=>{
        const proData = JSON.parse(his?.propeties);
        proData?.map((item, index)=>{
          propertiestext += `Property ${index + 1} : ${item?.propertyType}
          Bedrooms: ${item?.bedrooms}, Bathrooms: ${item?.bathrooms}, price : ${item?.price}$, size: ${item?.sqft} SqFt
          address : ${item?.address}
          about : ${item?.about}
          ${item.communityFeatures ? 'community Features : '+item.communityFeatures :'' }
          ${item.view ? 'view: '+item.view : '' }
          ${item.waterfrontDescription ? 'water front Description: '+ item.waterfrontDescription : ''}
          ${item.chimeAmenities ? 'chime Amenities: '+item.chimeAmenities : ''}
          ${item.elementarySchool ? 'elementary School: '+item.elementarySchool : '' }
          ${item.middleSchool ? 'middle School: ' +item.middleSchool :'' }
          ${item.highSchool ? 'highSchool: '+item?.highSchool : ''}
          ${item.otherSchool ? 'other School: '+item.otherSchool : '' }
          ${item.schoolDistrict ? 'school District: '+item.schoolDistrict : '' }`;
        });
        
        chat_history += 'input: '+his.user_input+'\n';
        chat_history += 'responce: '+his.ai_answer+'\n'+propertiestext;
        const aai_re = his.ai_answer+'\n'+propertiestext;
        user_history.push([his.user_input, aai_re])
      })
      
      res.status(200).send({user_history});
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.getNotification = (req, res) => {
  const user_id = req.params.user_id;
  const {offset, limit, orderby } = req.query;
  Remineder.findAll({
    where: {
        user_id: user_id,
    },
    offset: offset ? parseInt(offset) : 0,
    limit: limit ? parseInt(limit) : 25, 
    order : [['id', 'DESC']]
  })
    .then((notification) => {
      res.status(200).send({notification : notification?.reverse()});
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: err.message });
    });
};
