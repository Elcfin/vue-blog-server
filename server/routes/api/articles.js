const Router = require("koa-router");
const router = new Router();
const passport = require("koa-passport");

const Article = require("../../../mongodb/models/Article");
const Tag = require("../../../mongodb/models/Tag");

router.post(
  "/createArticle",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (ctx) => {
    const newArticleInfo = ctx.request.body;
    const title = newArticleInfo.title;
    const abstract = newArticleInfo.abstract;
    const content = newArticleInfo.content;
    const createTime = new Date();
    const lastEditTime = new Date();
    /* 前端验证 tags 已被创建 */
    const tagsName = newArticleInfo.tags; /* 数组 */
    const isPublished = false;

    const tags = [];
    for (const name of tagsName) {
      const tag = await Tag.find({
        name,
      });
      tags.push(tag[0]);
    }

    if (title === "") {
      ctx.throw(400, "title is ''");
    }

    if (content === "") {
      ctx.throw(400, "content is ''");
    }

    const newArticle = new Article({
      title,
      abstract,
      content,
      createTime,
      lastEditTime,
      tags,
      isPublished,
    });

    let result = await newArticle.save();
    await Article.populate(result, { path: "tags" }, (err, res) => {
      try {
        result = res;
      } catch (e) {
        console.log(e);
      }
    });
    ctx.body = result;
  }
);

/* all */
router.post("/getPageNumber", async (ctx) => {
  const articleNumber = await Article.count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const pageNumber = articleNumber ? Math.ceil(articleNumber / size) : 1;

  ctx.body = { articleNumber, pageNumber, size };
});

router.post("/paging", async (ctx) => {
  const articleNumber = await Article.count();
  const req = ctx.request.body;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);

  const skip = (page - 1) * size;

  /* 先按时间逆序排序 */
  const result = await Article.find({})
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(size);
  const hasMore = articleNumber - page * size > 0;

  ctx.body = { hasMore, articles: result, articleNumber };
});

/* draft */
router.post("/getDraftPageNumber", async (ctx) => {
  const draftNumber = await Article.find({
    isPublished: false,
  }).count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const draftPageNumber = draftNumber ? Math.ceil(draftNumber / size) : 1;

  ctx.body = { draftNumber, draftPageNumber, size };
});

router.post("/draftPaging", async (ctx) => {
  const draftNumber = await Article.find({
    isPublished: false,
  }).count();
  const req = ctx.request.body;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);

  const skip = (page - 1) * size;

  /* 先按时间逆序排序 */
  const result = await Article.find({
    isPublished: false,
  })
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(size);
  const hasMore = draftNumber - page * size > 0;

  ctx.body = { hasMore, drafts: result, draftNumber };
});

/* public */
router.post("/getPublicPageNumber", async (ctx) => {
  const publicNumber = await Article.find({
    isPublished: true,
  }).count();
  const req = ctx.request.body;
  /* 每页显示数目 */
  const size = parseInt(req.size);
  const publicPageNumber = publicNumber ? Math.ceil(publicNumber / size) : 1;

  ctx.body = { publicNumber, publicPageNumber, size };
});

router.post("/publicPaging", async (ctx) => {
  const publicNumber = await Article.find({
    isPublished: true,
  }).count();
  const req = ctx.request.body;
  /* 当前页数 */
  const page = parseInt(req.page);
  /* 每页显示数目 */
  const size = parseInt(req.size);

  const skip = (page - 1) * size;

  /* 先按时间逆序排序 */
  const result = await Article.find({
    isPublished: true,
  })
    .sort({ createTime: -1 })
    .skip(skip)
    .limit(size);
  const hasMore = publicNumber - page * size > 0;

  ctx.body = { hasMore, articles: result, publicNumber };
});

module.exports = router;
