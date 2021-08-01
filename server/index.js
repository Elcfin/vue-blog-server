const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const cors = require("koa-cors");
const passport = require("koa-passport");

const app = new Koa();
const router = new Router();

const api = require("./routes/api");

/* 回调到 config 文件中 passport.js */
require("./config/passport")(passport);

app.use(bodyParser());
app.use(cors());

app.use(passport.initialize());
app.use(passport.session());

/* 配置路由地址 localhost:3000/api */
router.use("/api", api.routes(), api.allowedMethods());

/* 配置路由 */
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log("listening on port 3000");
});
