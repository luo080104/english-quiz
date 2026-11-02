import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const root = process.cwd();
const setsDir = join(root, "data", "sets");
const outFile = join(root, "public", "questions", "english-bank.json");

const SETS = [1, 2, 3, 4, 5];
const questions = [];
let globalN = 0;

for (const setNo of SETS) {
  const file = join(setsDir, `set${setNo}.json`);
  if (!existsSync(file)) {
    console.warn(`[skip] ${file} 不存在`);
    continue;
  }
  const rows = JSON.parse(readFileSync(file, "utf8"));
  for (const row of rows) {
    globalN += 1;
    const options = row.options.map((text, i) => ({ key: "ABCD"[i], text }));
    if (options.length !== 4) throw new Error(`子表${setNo} 第${row.n}题选项不是4个`);
    if (!["A", "B", "C", "D"].includes(row.answer)) {
      throw new Error(`子表${setNo} 第${row.n}题答案非法: ${row.answer}`);
    }
    questions.push({
      id: `E${setNo}-${String(row.n).padStart(3, "0")}`,
      version: 1,
      originalNumber: globalN,
      chapterNumber: setNo,
      label: `子表${setNo}`,
      chapter: `学术英语词表 子表${setNo}`,
      tags: [row.word],
      type: "single",
      stem: row.stem,
      stemZh: row.stemZh || "",
      options,
      optionsZh: {},
      glossary: [{ term: row.word, meaning: row.meaning }],
      answer: [row.answer],
      explanation: row.explanation || "",
      candidateAnswer: [],
      phoneAnswer: [],
      reviewStatus: "approved",
      reviewFlag: null,
      source: { question: `子表${setNo} 第${row.n}题`, answer: "课程官方答案" },
    });
  }
}

const ids = new Set();
for (const q of questions) {
  if (ids.has(q.id)) throw new Error(`重复 id: ${q.id}`);
  ids.add(q.id);
}

const meta = {
  bankId: "academic-english-1",
  version: 1,
  label: "学术英语刷题",
  title: "学术英语词汇 子表1–5 配套练习",
  generatedAt: new Date().toISOString(),
  sourceFiles: {
    original: "《通用学术英语短语词汇教程》第4章 练习（子表1–5）",
    answerKey: "课程官方答案及解析（子表1–5）",
  },
  counts: {
    total: questions.length,
    approved: questions.length,
    pending: 0,
    pendingImage: 0,
    contested: 0,
    translated: questions.filter((q) => q.stemZh).length,
    glossaryTerms: questions.length,
  },
  disclaimer: "题目与官方答案取自课程配套练习；中文解析由本站重写，仅供学习参考。",
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ meta, questions }, null, 2), "utf8");
console.log(`写入 ${outFile}`);
console.log(`共 ${questions.length} 题，${SETS.filter((n) => existsSync(join(setsDir, `set${n}.json`))).length} 个子表`);
