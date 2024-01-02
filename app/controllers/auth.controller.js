const db = require("../models");
const config = require("../config/auth.config");
const { mailTransporter } = require("../config/nodemailer.config");
const User = db.user;
 var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  // Save User to Database

  User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    device_id: req.body.device_id,
    password: req.body.password ? bcrypt.hashSync(req.body.password, 8) : null,
  })
    .then(async (user) => {
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 8640000, // 24 hours
      });

      res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accessToken: token,
        image: "http://api.realtorai.us:3006/images/user.png",
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  if (!req.body.email && !req.body.password && !req.body.timeZoneOffset) {
    res.status(400).json({ message: "Bad Request" });
    return;
  }

  // Email
  User.findOne({
    where: {
      email: req.body.email ? req.body.email : "",
      status: 1,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password ? req.body.password : "",
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          message: "Invalid Password!",
        });
      }
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 8640000,
      });
      if (req.body.timeZoneOffset) {
        User.update(
          {
            timeZoneOffset: req.body.timeZoneOffset,
          },
          {
            where: {
              id: user.id,
            },
          }
        );
      }
      if (user.device_id !== req.body.device_id) {
        User.update(
          {
            device_id: req.body.device_id,
          },
          {
            where: {
              id: user.id,
            },
          }
        );
      }

      res.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accessToken: token,
        image:
          "http://api.realtorai.us:3006/images/" +
          (user.image ? user.image : "user.png"),
      });
      return;
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.fogotPassword = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
      status: 1,
    },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      const random = Math.floor(Math.random() * (999999 - 100000) + 100000);
      User.update(
        { otp: random },
        {
          where: {
            id: user.id,
          },
        }
      );

      let mailDetails = {
        from: "jignesh.creadigol@gmail.com",
        to: user.email,
        subject: "Reset Password",
        text: `Use your secret code! ${random}  For reset password`,
      };

      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          res.status(400).send({ message: "Something went Wrong!" });
          return;
        } else {
          res
            .status(200)
            .send({ message: "Email Sent Successfully. Please Check mailbox" });
          return;
        }
      });

      res
        .status(200)
        .send({ message: "Email Sent Successfully. Please Check mailbox" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.resetPassword = async (req, res) => {
  const otpnew = req.body.otp;
  await User.findOne({
    where: {
      email: req.body.email,
      status: 1,
    },
  })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      const existOtp = user.otp;
      console.log("existOtp : ", existOtp);
      if (existOtp != otpnew) {
        res.status(401).send({ message: "Invalid OTP" });
        return;
      }
      await User.update(
        { otp: null, password: bcrypt.hashSync(req.body.password, 8) },
        {
          where: {
            id: user.id,
          },
        }
      );
      res.status(200).send({ message: "Password Reset Successfully" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

exports.checkOtp = async (req, res) => {
  const otpnew = req.body.otp;
  await User.findOne({
    where: {
      email: req.body.email,
      status: 1,
    },
  })
    .then(async (user) => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }
      const existOtp = user.otp;

      if (existOtp != otpnew) {
        res.status(401).send({ message: "Invalid OTP" });
        return;
      }

      res.status(200).send({ message: "Otp Verified" });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
