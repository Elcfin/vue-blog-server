const Router = require("koa-router");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("koa-passport");

const User = require("../../../mongodb/models/User");
const utils = require("../../utils");
const keys = require("../../config/keys");

const router = new Router();

router.post("/register", async (ctx) => {
  const newUserInfo = ctx.request.body;

  /* mongoose 查找，返回值为数组 */
  const findResult = await User.find({
    name: "root",
  });

  if (findResult.length > 0) {
    ctx.throw(500, "root has been registered");
    return;
  }

  /* mongoose 创建 User 模块的新实例 */
  const newUser = new User({
    name: "root",
    password: utils.encrypt(newUserInfo.password),
    /* 对 password 加密 */
  });

  /* mongoose 将新实例存入数据库 */
  await newUser.save();
  ctx.body = newUser;
});

router.post("/login", async (ctx) => {
  const findResult = await User.find({
    name: "root",
  });

  if (!findResult.length) {
    ctx.throw(500, "root 不存在");
    return;
  }

  const user = findResult[0];
  const password = ctx.request.body.password;
  /* 判断 password 是否正确，返回 Boolean */
  const result = await bcrypt.compareSync(password, user.password);

  /* 如果 password 正确 */
  if (result) {
    const payload = {
      id: user.id,
      name: user.name,
    };

    const token = jwt.sign(payload, keys.secretOrKey, {
      expiresIn: "6h" /* 设置该 token 有效时长 */,
    });

    ctx.body = {
      token: "Bearer " + token /* 注意 token 的写法是固定的 */,
    };
  } else {
    ctx.throw(400, "your password is wrong");
  }
});

router.get(
  "/current",
  /* 监听 ../../config/passport 中 new JwtStrategy() 中的回调函数 */
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const userInfo =
      ctx.state.user; /* ../../config/passport 中传来的用户信息 */

    ctx.body = {
      id: userInfo.id,
      name: userInfo.name,
    };
  }
);

module.exports = router;
