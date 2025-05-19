const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 清空现有数据
  await prisma.question.deleteMany({});

  // 创建示例题目
  const questions = [
    {
      title: '下面关于JavaScript中的变量声明，哪个选项是正确的？',
      type: 'single',
      optionA: 'var声明的变量没有块级作用域',
      optionB: 'let声明的变量没有块级作用域',
      optionC: 'const声明的变量可以重新赋值',
      optionD: 'let声明的变量不能在声明前使用',
      answer: 'A',
      difficulty: 'easy',
    },
    {
      title: '以下哪些是JavaScript中的基本数据类型？',
      type: 'multiple',
      optionA: 'String',
      optionB: 'Number',
      optionC: 'Array',
      optionD: 'Boolean',
      answer: 'A,B,D',
      difficulty: 'medium',
    },
    {
      title: '请实现一个函数，接收一个整数数组，返回数组中的最大值和最小值之和。',
      type: 'programming',
      language: 'javascript',
      difficulty: 'medium',
    },
    {
      title: '在Go语言中，以下关于goroutine的说法正确的是？',
      type: 'single',
      optionA: 'goroutine是Go语言中的线程',
      optionB: 'goroutine比线程更轻量级',
      optionC: 'goroutine之间不能通信',
      optionD: 'goroutine的创建需要显式的线程池',
      answer: 'B',
      difficulty: 'hard',
    },
    {
      title: '请实现一个Go函数，使用channel实现两个goroutine之间的通信。',
      type: 'programming',
      language: 'go',
      difficulty: 'hard',
    },
  ];

  for (const question of questions) {
    await prisma.question.create({
      data: question,
    });
  }

  console.log('数据库初始化完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });