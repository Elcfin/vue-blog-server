const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Tag = require("../../../mongodb/models/Tag");

router.post(
  "/createTag",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const newTagInfo = ctx.request.body;
    const name = newTagInfo.name;

    if (name === "") {
      ctx.status = 400;
      ctx.body = { error: "name is ''" };
      return;
    }

    const findResult = await Tag.find({ name });

    if (findResult.length > 0) {
      ctx.status = 500;
      ctx.body = { error: "already has this tag" };
      return;
    }

    const newTag = new Tag({
      name,
    });

    await newTag.save();
    ctx.body = newTag;
  }
);

module.exports = router;
