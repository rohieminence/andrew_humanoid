const db = require("../models");
const { Op } = require("sequelize");
const ChatHistory = db.ChatHistory;
const Histories = db.histories;
const sequelize = db.sequelize;
const Property = db.property;
exports.propertyDetails = async (req, res) => {
  const property_id = req.params.property_id;
  let propterites = "";
  let picListing = "";

  try {
    const props = await sequelize.query(
      'SELECT  properties FROM `histories` AS `histories` WHERE `histories`.`properties` LIKE "%' +
        property_id +
        '%" LIMIT 1'
    );
    const valid = isJsonString(props[0][0]?.properties);
    if (!valid) {
      res.status(404).send("Properties not Found");
      return;
    }
    const propertites = JSON.parse(props[0][0]?.properties);
    if (propertites.length > 0) {
      propertites?.map((prop) => {
        if (prop.id == property_id) {
          propterites = prop;
          picListing = prop?.listingPictures?.split("|");
        }
      });
    }
    if (propterites) {
      return res.render("property", { propterites, picListing });
    }

    res.status(404).send("Properties not Found");
  } catch (err) {
    res.status(500).send({ message: err?.message });
  }
  //res.status(200).send({ props });
};

exports.propertiesListing = async (req, res) => {
  const property_ids = req.params.property_ids;
  let properties_list = [];
  let propeties_ids_array = [];
  let propterites = [];
  try {
    propeties_ids_array = property_ids.split(",");
    const props = await sequelize.query(
      'SELECT  properties FROM `histories` AS `histories` WHERE `histories`.`properties` LIKE "%' +
        propeties_ids_array[0] +
        '%" order BY id DESC LIMIT 1'
    );
    Promise.all(
      propeties_ids_array?.map(async (item, index) => {
        const propss = await sequelize.query(
          'SELECT  properties FROM `histories` AS `histories` WHERE `histories`.`properties` LIKE "%' +
            item +
            '%" order BY id DESC LIMIT 1'
        );
        const valid = await isJsonString(propss[0][0]?.properties);
        if (valid) {
          const propertites = await JSON.parse(propss[0][0]?.properties);
          if (propertites.length > 0) {
            propertites?.map(async (prop) => {
              if (prop.id == item) {
                await propterites.push(prop);
              }
            });
          }
        }
      })
    );
    const valid = isJsonString(props[0][0]?.properties);
    if (!valid) {
      res.status(404).send("Properties not Found");
      return;
    } else {
    }
    const properties_list = JSON.parse(props[0][0]?.properties);

    return res.render("lists", { properties_list, propeties_ids_array });
    //res.json({ property_ids });
  } catch (error) {
    res.status(500).send({ message: error?.message });
  }
};

/*--------------------------------------*/
exports.propertiesListingAll = async (req, res) => {
  const chat_id = req.params.chat_id;
  let properties_list = [];
  let propeties_ids_array = [];
  let propterites = [];
  try {
    const propertiesdata = await Histories.findOne({
      where: {
        id: chat_id,
      },
    });

    properties_list = JSON.parse(propertiesdata.properties);
    return res.render("lists", { properties_list, propeties_ids_array });
    //res.json({ property_ids });
  } catch (error) {
    res.status(500).send({ message: error?.message });
  }
};

exports.propertyStore = async (req, res) => {
  const { property_id, user_id } = req.body;

  let propterites = "";

  try {
    const exist = await Property.findOne({
      where: {
        user_id: user_id,
        property_id: property_id,
      },
    });
    if (exist) {
      res.status(208).send({ message: "Property Already Save." });
      return;
    }

    const props = await sequelize.query(
      'SELECT  properties FROM `histories` AS `histories` WHERE `histories`.`properties` LIKE "%' +
        property_id +
        '%" LIMIT 1'
    );

    const valid = isJsonString(props[0][0]?.properties);
    if (!valid) {
      res.status(404).send("Properties not Found");
      return;
    }
    const propertites = JSON.parse(props[0][0]?.properties);
    if (propertites.length > 0) {
      propertites?.map((prop) => {
        if (prop.id == property_id) {
          propterites = prop;
        }
      });
    }
    if (propterites) {
      Property.create({
        user_id: user_id,
        property_id: property_id,
        property: propterites,
      })
        .then((pp) => {
          res.status(200).send({ message: "Property Store Successfully." });
          return;
        })
        .catch((err) => {
          res.status(500).send({ message: err?.message });
          return;
        });
    } else {
      res.status(404).send("Properties not Found");
    }
  } catch (err) {
    return res.status(500).send({ message: err?.message });
  }
};
exports.propertyRemove = async (req, res) => {
  const { property_id, user_id } = req.body;
  try {
    const delete_property = await Property.destroy({
      where: {
        user_id: user_id,
        property_id: property_id,
      },
    });
    if (delete_property == 0) {
      res.status(202).send({ message: "Property Already Deleted." });
    } else {
      res.status(202).send({ message: "Property Remove Successfully." });
    }
  } catch (err) {
    return res.status(500).send({ message: err?.message });
  }
};

exports.usersProperties = async (req, res) => {
  const user_id = req.params.user_id;
  Property.findAll({
    where: {
      user_id: user_id,
    },
  })
    .then((properties) => {
      res.status(200).send({ properties });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
exports.getSingleProperty = async (req, res) => {
  const property_id = req.params.property_id;
  Property.findOne({
    where: {
      property_id: property_id,
    },
  })
    .then((property) => {
      res.status(200).send({ property });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
const isJsonString = (str) => {
  try {
    const properies = JSON.parse(str);
  } catch (e) {
    console.log("error : ", e.message);
    return false;
  }
  return true;
};
