const Router = require("koa-router");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("koa-passport");

const User = require("../../../mongodb/models/User");
const utils = require("../../utils");
const keys = require("../../config/keys");

const router = new Router();

/*
 * @route POST api/users/register
 * @desc 新用户注册接口地址
 * @access 接口是公开的
 */
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

/*
 * @route POST api/users/login
 * @desc 用户登录接口地址
 * @access 接口是公开的
 */
router.post("/login", async (ctx) => {
  const findResult = await User.find({
    name: "root",
  });

  if (!findResult.length) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: "用户不存在",
    };
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
      success: true,
      token: "Bearer " + token /* 注意 token 的写法是固定的 */,
    };
  } else {
    ctx.status = 401;
    ctx.body = {
      success: false,
      error: "your password is wrong",
    };
    return;
  }
});

/*
 * @route GET api/users/current
 * @desc 获取当前用户信息接口地址
 * @access 接口是私有的
 */
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
      success: true,
      id: userInfo.id,
      name: userInfo.name,
    };
  }
);

module.exports = router;
