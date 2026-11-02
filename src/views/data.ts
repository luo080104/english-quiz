import {
  state,
  exportBackup,
  importBackup,
  clearLearningData,
  addWrongQuestionIds,
  STORAGE_KEY,
} from "../store";
import { byOriginalNumber } from "../bank";
import { el } from "../ui";
import type { RouteCtx } from "../main";

const PAPER_DEFAULT = `第一套：18,24,29,30,39,43,48,56
第二套：4,8,11,12,16,17,23,33,34,36,44,55,60
第三套：7,8,11,12,14,16,18,19,20,21,30,31,33,43,44,49,52,53
第四套：5,7,8,9,14,15,17,21,26,28,29,33,34,37,40,41,42,45,51,52,53,55,57
第五套：1,2,3,5,8,10,11,14,15,19,20,21,22,29,30,31,32,36,37,41,42,44,46,47,49,52,60`;

const SET_CHARS: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5 };

/** Parse lines like "第三套：7,8,11" or "3: 7 8 11" into question ids. */
function parsePaperList(text: string): { ids: string[]; invalid: string[] } {
  const ids: string[] = [];
  const invalid: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const norm = line.replace(/第|套|子表|set/gi, " ").trim();
    const m = norm.match(/^([一二三四五1-5])\s*[:：、,，.。\s]\s*(.*)$/);
    if (!m) {
      invalid.push(line.slice(0, 12));
      continue;
    }
    const set = SET_CHARS[m[1]] ?? Number(m[1]);
    const nums = m[2].split(/[^0-9]+/).filter(Boolean).map(Number);
    if (!nums.length) {
      invalid.push(line.slice(0, 12));
      continue;
    }
    for (const n of nums) {
      const q = n >= 1 && n <= 60 ? byOriginalNumber((set - 1) * 60 + n) : undefined;
      if (q) ids.push(q.id);
      else invalid.push(`子表${set}-${n}`);
    }
  }
  return { ids: [...new Set(ids)], invalid };
}

function header(title: string): HTMLElement {
  return el("header", { class: "topbar" }, [
    el("a", { class: "back", href: "#/" }, ["← 首页"]),
    el("span", { class: "topbar-title" }, [title]),
  ]);
}

export function renderData({ app }: RouteCtx): void {
  const msg = el("div", { class: "inline-msg hidden" });

  function show(kind: "ok" | "bad", text: string): void {
    msg.className = `inline-msg ${kind}`;
    msg.textContent = text;
  }

  const fileInput = el("input", {
    type: "file",
    accept: ".json,application/json",
    class: "hidden",
  }) as HTMLInputElement;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importBackup(String(reader.result));
      show(res.ok ? "ok" : "bad", res.message);
      if (res.ok) setTimeout(() => location.reload(), 600);
    };
    reader.readAsText(file);
  });

  function doExport(): void {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `english-quiz-backup-${Date.now()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    show("ok", "备份已导出（JSON 文件）");
  }

  const s = state();
  const practiced = Object.values(s.practice.records).filter((r) => r.attempts > 0).length;

  const paperInput = el("textarea", {
    class: "paper-input",
    rows: 6,
    spellcheck: "false",
    placeholder: "每行一套，例如：第一套：18,24,29",
  }) as HTMLTextAreaElement;
  paperInput.value = PAPER_DEFAULT;

  const paperLink = el("a", { class: "nav-btn hidden", href: "#/wrongbook" }, ["打开错题本"]);

  function doPaperImport(): void {
    const parsed = parsePaperList(paperInput.value);
    if (!parsed.ids.length) {
      show("bad", "没有解析到有效题号，请按“第一套：18,24”每行一套填写。");
      return;
    }
    const res = addWrongQuestionIds(parsed.ids);
    const bits = [`已加入 ${res.added} 道错题`];
    if (res.existed) bits.push(`${res.existed} 道原本已在错题本`);
    if (parsed.invalid.length) {
      bits.push(
        `未识别 ${parsed.invalid.length} 处：${parsed.invalid.slice(0, 6).join("、")}${
          parsed.invalid.length > 6 ? "…" : ""
        }`
      );
    }
    show(parsed.invalid.length ? "bad" : "ok", bits.join("；"));
    paperLink.classList.remove("hidden");
  }

  app.replaceChildren(
    header("学习记录备份"),
    el("div", { class: "page" }, [
      el("div", { class: "banner warn" }, [
        el("strong", {}, ["清除浏览器数据可能使本机记录丢失。"]),
        el("div", {}, ["请定期导出备份；换机时用导入恢复。"]),
      ]),
      el("div", { class: "cards" }, [
        el("div", { class: "card" }, [
          el("div", { class: "card-label" }, ["已记录题目"]),
          el("div", { class: "card-value" }, [String(practiced)]),
        ]),
        el("div", { class: "card" }, [
          el("div", { class: "card-label" }, ["模拟记录"]),
          el("div", { class: "card-value" }, [String(s.exams.length)]),
        ]),
      ]),
      el("div", { class: "btn-row-col" }, [
        el("button", { class: "primary-btn", onClick: doExport }, ["导出学习记录（JSON）"]),
        el("button", { class: "nav-btn", onClick: () => fileInput.click() }, ["导入备份文件"]),
        el(
          "button",
          {
            class: "nav-btn danger",
            onClick: () => {
              if (window.confirm("确定清空本机学习记录？此操作不可恢复，建议先导出备份。")) {
                clearLearningData();
                show("ok", "已清空本机学习记录");
                setTimeout(() => location.reload(), 600);
              }
            },
          },
          ["清空本机学习记录"]
        ),
      ]),
      fileInput,
      msg,
      el("div", { class: "card" }, [
        el("div", { class: "card-label" }, ["纸书错题批量加入"]),
        el("div", { class: "card-hint" }, [
          "每行一套，如“第三套：7,8,11”或“3: 7 8 11”。只加入错题本，不改动已提交的作答记录。",
        ]),
        paperInput,
        el("div", { class: "btn-row-col" }, [
          el("button", { class: "primary-btn", onClick: doPaperImport }, ["加入错题本"]),
          paperLink,
        ]),
      ]),
      el("div", { class: "muted small" }, [
        `存储位置：本机浏览器 localStorage["${STORAGE_KEY}"]。记录包含题库版本号，题库更新后旧记录仍保留版本说明。`,
      ]),
    ])
  );
}
