const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Tag = require("../../../mongodb/models/Tag");
const Article = require("../../../mongodb/models/Article");

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

router.get("/getTags", async (ctx) => {
  const findResult = await Tag.find({});
  ctx.body = findResult;
});

/* 删除没有被使用的标签 */
router.get("/filterTags", async (ctx) => {
  let tags = await Tag.find({});
  for (const tag of tags) {
    const result = await Article.find({
      tags: { $elemMatch: { $eq: tag } },
    });

    if (!result.length) {
      await Tag.deleteOne({
        name: tag.name,
      });
    }
  }

  tags = await Tag.find({});
  ctx.body = tags;
});

module.exports = router;
