const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const keys = require("./keys");
const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = keys.secretOrKey;

/* 得到 User，来自 ../mongodb/models/User */
const mongoose = require("mongoose");
const User = mongoose.model("users");

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      /* 通过 id 查找用户 */
      const user = await User.findById(jwt_payload.id);

      /* 如果该用户存在，返回用户信息至调用该函数处 */
      if (user) return done(null, user);
      else return done(null, false);
    })
  );
};
