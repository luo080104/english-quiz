import "./styles.css";
import { loadBank, bindBankVersion } from "./bank";
import { el } from "./ui";
import { renderHome } from "./views/home";
import { renderPractice, renderDrillWrong, renderDrillFlag, renderDrillExamWrong, renderDrillCram } from "./views/practice";
import { renderCram } from "./views/cram";
import { renderExam, renderExamResult } from "./views/exam";
import { renderWrongbook } from "./views/wrongbook";
import { renderStats } from "./views/stats";
import { renderRules } from "./views/rules";
import { renderData } from "./views/data";
import { renderFlagged } from "./views/flagged";
import { renderGlossary } from "./views/glossary";
import { renderSearch } from "./views/search";
import { renderNotFound } from "./views/notfound";
import { sfx, unlockAudio, startMusic, stopMusic, isMusicOn } from "./audio";
import { initTheme } from "./theme";

export { APP_VERSION } from "./version";

export interface RouteCtx {
  app: HTMLElement;
  parts: string[];
}

type View = (ctx: RouteCtx) => void | Promise<void>;

const routes: Array<[RegExp, View]> = [
  [/^$/, (c) => renderHome(c)],
  [/^practice(?:\/(\d+))?$/, (c) => renderPractice(c)],
  [/^drill\/wrong\/(\d+)$/, (c) => renderDrillWrong(c)],
  [/^drill\/flag\/(\d+)$/, (c) => renderDrillFlag(c)],
  [/^drill\/examwrong\/[^/]+\/\d+$/, (c) => renderDrillExamWrong(c)],
  [/^drill\/cram\/\d+$/, (c) => renderDrillCram(c)],
  [/^cram$/, (c) => renderCram(c)],
  [/^exam$/, (c) => renderExam(c)],
  [/^exam\/result\/(.+)$/, (c) => renderExamResult(c)],
  [/^wrongbook$/, (c) => renderWrongbook(c)],
  [/^stats$/, (c) => renderStats(c)],
  [/^rules$/, (c) => renderRules(c)],
  [/^data$/, (c) => renderData(c)],
  [/^flagged$/, (c) => renderFlagged(c)],
  [/^glossary$/, (c) => renderGlossary(c)],
  [/^search$/, (c) => renderSearch(c)],
];

function currentParts(): string[] {
  const h = location.hash.replace(/^#\/?/, "");
  return h.split("/").filter(Boolean);
}

async function route(): Promise<void> {
  const app = document.getElementById("app") as HTMLElement;
  const parts = currentParts();
  const path = parts.join("/");
  for (const [re, view] of routes) {
    if (re.test(path)) {
      await view({ app, parts });
      window.scrollTo(0, 0);
      if (path === "") {
        if (isMusicOn()) startMusic();
      } else {
        stopMusic();
      }
      return;
    }
  }
  renderNotFound({ app, parts });
}

async function boot(): Promise<void> {
  initTheme();
  const app = document.getElementById("app") as HTMLElement;
  app.replaceChildren(el("div", { class: "loading" }, ["题库加载中…"]));
  try {
    await loadBank();
    bindBankVersion();
  } catch (e) {
    app.replaceChildren(
      el("div", { class: "fatal" }, [
        el("h2", {}, ["题库加载失败"]),
        el("p", {}, [String((e as Error).message || e)]),
        el("p", {}, ["请确认 public/questions/english-bank.json 存在，或运行 npm run build:bank。"]),
      ])
    );
    return;
  }
  document.addEventListener(
    "click",
    (e) => {
      const t = (e.target as HTMLElement)?.closest(
        "button, a, .option, .cell, summary, label, input[type=checkbox]"
      );
      if (!t) return;
      unlockAudio();
      sfx("tap");
      if (isMusicOn() && currentParts().length === 0) startMusic();
    },
    true
  );
  window.addEventListener("hashchange", () => void route());
  await route();

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {});
    });
  }
}

void boot();
