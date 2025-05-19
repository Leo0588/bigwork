const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const static = require('koa-static');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const app = new Koa();
const router = new Router();
const prisma = new PrismaClient();

// 中间件
app.use(bodyParser());
app.use(cors());

// 静态文件服务
app.use(static(path.join(__dirname, '../client/dist')));

// 路由
router.prefix('/api');

// 获取README内容
router.get('/readme', async (ctx) => {
  try {
    const readmePath = path.join(__dirname, '../README.md');
    const content = fs.readFileSync(readmePath, 'utf-8');
    ctx.body = { content };
  } catch (error) {
    console.error('读取README失败:', error);
    ctx.status = 500;
    ctx.body = { error: '读取README失败' };
  }
});

// 获取题目列表
router.get('/questions', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, type, keyword } = ctx.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // 构建查询条件
    const where = {};
    if (type && type !== 'all') {
      where.type = type;
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { optionA: { contains: keyword, mode: 'insensitive' } },
        { optionB: { contains: keyword, mode: 'insensitive' } },
        { optionC: { contains: keyword, mode: 'insensitive' } },
        { optionD: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    // 查询数据
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.question.count({ where })
    ]);

    ctx.body = {
      code: 0,
      data: questions,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取题目列表失败:', error);
    ctx.status = 500;
    ctx.body = { code: 1, error: '获取题目列表失败' };
  }
});

// 添加题目
// 添加题目
router.post('/questions', async (ctx) => {
  try {
    const data = ctx.request.body;
    
    // 验证必填字段
    if (!data.title || !data.type || !data.difficulty) {
      ctx.status = 400;
      ctx.body = { code: 1, error: '缺少必填字段' };
      return;
    }
    
    // 根据题型验证字段
    if (data.type === 'programming') {
      if (!data.language || !data.answer) {
        ctx.status = 400;
        ctx.body = { code: 1, error: '编程题必须包含编程语言和答案' };
        return;
      }
    } else if (data.type === 'single' || data.type === 'multiple') {
      if (!data.optionA || !data.optionB || !data.optionC || !data.optionD || !data.answer) {
        ctx.status = 400;
        ctx.body = { code: 1, error: '选择题必须包含选项和答案' };
        return;
      }
    } else {
      ctx.status = 400;
      ctx.body = { code: 1, error: '无效的题目类型' };
      return;
    }
    
    const safeValue = v => v === undefined ? null : v;
    const question = await prisma.question.create({
      data: {
        title: data.title,
        type: data.type,
        optionA: safeValue(data.optionA),
        optionB: safeValue(data.optionB),
        optionC: safeValue(data.optionC),
        optionD: safeValue(data.optionD),
        answer: safeValue(data.answer),
        difficulty: safeValue(data.difficulty),
        language: safeValue(data.language)
      }
    });
    ctx.body = { code: 0, data: question, message: '添加题目成功' };
  } catch (error) {
    console.error('添加题目失败:', error);
    ctx.status = 500;
    ctx.body = { code: 1, error: '添加题目失败: ' + error.message };
  }
});

// 批量添加题目
router.post('/questions/batch', async (ctx) => {
  try {
    const { questions } = ctx.request.body;
    const safeValue = v => v === undefined ? null : v;
    
    const questionsToCreate = questions.map(q => ({
      title: q.title,
      type: q.type,
      optionA: safeValue(q.optionA),
      optionB: safeValue(q.optionB),
      optionC: safeValue(q.optionC),
      optionD: safeValue(q.optionD),
      answer: safeValue(q.answer),
      difficulty: safeValue(q.difficulty),
      language: safeValue(q.language)
    }));

    const result = await prisma.question.createMany({
      data: questionsToCreate
    });

    ctx.body = { 
      code: 0, 
      data: { count: result.count },
      message: '批量添加题目成功'
    };
  } catch (error) {
    console.error('批量添加题目失败:', error);
    ctx.status = 500;
    ctx.body = { 
      code: 1, 
      error: '批量添加题目失败' 
    };
  }
});

// 更新题目
router.put('/questions/:id', async (ctx) => {
  try {
    const id = parseInt(ctx.params.id);
    const data = ctx.request.body;
    const question = await prisma.question.update({
      where: { id },
      data
    });
    ctx.body = question;
  } catch (error) {
    console.error('更新题目失败:', error);
    ctx.status = 500;
    ctx.body = { error: '更新题目失败' };
  }
});

// 删除题目
router.post('/questions/delete', async (ctx) => {
  try {
    const { ids } = ctx.request.body;
    const result = await prisma.question.deleteMany({
      where: {
        id: {
          in: ids.map(id => parseInt(id))
        }
      }
    });
    ctx.body = { count: result.count };
  } catch (error) {
    console.error('删除题目失败:', error);
    ctx.status = 500;
    ctx.body = { error: '删除题目失败' };
  }
});

// AI生成题目
router.post('/ai/generate', async (ctx) => {
  try {
    const { type, count, language } = ctx.request.body;
    const API_KEY = 'sk-f2c261a7ef944421a49f111a5cf8a658';
    
    // 调用大模型API生成题目
    const questions = [];
    
    for (let i = 0; i < count; i++) {
      const prompt = type === 'single' || type === 'multiple'
        ? `请生成一道${type === 'single' ? '单选题' : '多选题'}，要求：
           1. 题目难度适中
           2. 选项合理
           3. 答案明确
           4. 返回JSON格式：{
              title: 题目内容,
              optionA: 选项A内容,
              optionB: 选项B内容,
              optionC: 选项C内容,
              optionD: 选项D内容,
              answer: 答案(单选题为A/B/C/D中的一个，多选题为多个选项用逗号分隔如A,B,D)
           }`
        : `请生成一道${language}编程题，要求：
           1. 题目难度适中
           2. 问题描述清晰
           3. 返回JSON格式：{
              title: 题目内容,
              answer: 参考答案代码
           }`;

      try {
        // 模拟生成题目，避免实际调用API
        const generatedContent = type === 'single' || type === 'multiple' 
          ? {
              title: `这是一个${type === 'single' ? '单选' : '多选'}题示例 ${i+1}`,
              optionA: '选项A内容',
              optionB: '选项B内容',
              optionC: '选项C内容',
              optionD: '选项D内容',
              answer: type === 'single' ? 'A' : 'A,B'
            }
          : {
              title: `这是一个${language}编程题示例 ${i+1}`,
              answer: `// ${language} 代码示例\nconsole.log("Hello World");`
            };
        
        const difficulty = ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];
        const id = Date.now() + i;

        if (type === 'single' || type === 'multiple') {
          questions.push({
            id,
            title: generatedContent.title,
            type,
            optionA: generatedContent.optionA,
            optionB: generatedContent.optionB,
            optionC: generatedContent.optionC,
            optionD: generatedContent.optionD,
            answer: generatedContent.answer,
            difficulty,
            language: null
          });
        } else {
          questions.push({
            id,
            title: generatedContent.title,
            type,
            optionA: null,
            optionB: null,
            optionC: null,
            optionD: null,
            answer: generatedContent.answer,
            difficulty,
            language
          });
        }
      } catch (error) {
        console.error('生成题目失败:', error);
        throw new Error('生成题目失败: ' + error.message);
      }
    }

    ctx.body = {
      code: 0,
      data: questions,
      message: '生成题目成功'
    };
  } catch (error) {
    console.error('生成题目失败:', error);
    ctx.status = 500;
    ctx.body = {
      code: 1,
      message: error.message || '生成题目失败'
    };
  }
});

// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 处理前端路由
app.use(async (ctx) => {
  ctx.type = 'html';
  ctx.body = fs.readFileSync(path.join(__dirname, '../client/dist/index.html'), 'utf-8');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});