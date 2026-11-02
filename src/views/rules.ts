import { getBank } from "../bank";
import { el } from "../ui";
import { APP_VERSION } from "../version";
import { isSfxOn, setSfxOn, isMusicOn, setMusicOn } from "../audio";
import type { RouteCtx } from "../main";

function header(title: string): HTMLElement {
  return el("header", { class: "topbar" }, [
    el("a", { class: "back", href: "#/" }, ["← 首页"]),
    el("span", { class: "topbar-title" }, [title]),
  ]);
}

export function renderRules({ app }: RouteCtx): void {
  const bank = getBank();
  app.replaceChildren(
    header("规则说明"),
    el("div", { class: "page prose" }, [
      el("div", { class: "banner ok" }, [
        el("strong", {}, ["答案采用课程官方答案；解析为本站重写。"]),
      ]),
      el("h2", {}, ["当前判分规则（产品规则，暂定）"]),
      el("ul", {}, [
        el("li", {}, ["单选/判断：选对得 1 分。"]),
        el("li", {}, ["多选：所选集合与正确答案完全一致才得 1 分（每题分值相同）。"]),
        el("li", {}, ["未作答：0 分。"]),
        el("li", {}, ["不倒扣。"]),
        el("li", {}, ["不设及格线，不显示“及格/不及格”。"]),
      ]),
      el("p", { class: "muted" }, [
        "待核事项：学校是否有多选部分分规则、是否存在主观/计算题的容差判分，均需你或老师确认后调整；确认前不擅自编造。",
      ]),
      el("h2", {}, ["顺序刷题"]),
      el("ul", {}, [
        el("li", {}, ["按原题号先后走题，显示当前题号与进度条。"]),
        el("li", {}, ["可上一题、下一题、题号跳转；刷新后从上次位置继续。"]),
        el("li", {}, ["提交后显示对错、正确答案与解析；答错自动进入错题本。"]),
        el("li", {}, ["进度按“至少提交过一次的不同题目数”统计，不按点击到第几题。"]),
      ]),
      el("h2", {}, ["仿真模拟"]),
      el("ul", {}, [
        el("li", {}, ["随机无放回抽题；题库录满 300 道后，仿真模式为 300 抽 60。"]),
        el("li", {}, ["正计时显示用时，不设倒计时、不自动交卷。"]),
        el("li", {}, ["考试过程中可切题、看答题卡，但不显示正确答案与解析。"]),
        el("li", {}, ["交卷后显示正确题数、错题与逐题解析。"]),
        el("li", {}, ["刷新恢复同一套卷、已答内容与计时（按保存的题目ID顺序与随机种子）。"]),
      ]),
      el("h2", {}, ["答案与审核状态"]),
      el("p", {}, [
        `当前题库 ${bank.meta.bankId} v${bank.meta.version}，共 ${bank.meta.counts.total} 题；`,
        `已核 ${bank.meta.counts.approved}，待核 ${bank.meta.counts.pending}，缺图待核 ${bank.meta.counts.pendingImage}，有争议 ${bank.meta.counts.contested}。`,
      ]),
      el("p", { class: "muted" }, [
        "题目与答案取自课程配套练习的官方答案；中文解析由本站重写，仅供学习参考。",
      ]),
      el("h2", {}, ["学习记录与隐私"]),
      el("ul", {}, [
        el("li", {}, ["学习记录保存在当前手机浏览器本机，不上传服务器。"]),
        el("li", {}, ["清除浏览器数据/无痕模式可能导致本机记录丢失，请在“学习记录备份”导出。"]),
        el("li", {}, ["换设备或换浏览器不会自动同步。"]),
      ]),
      el("h2", {}, ["音效与音乐"]),
      el("label", { class: "check-row" }, [
        (() => {
          const cb = el("input", { type: "checkbox" }) as HTMLInputElement;
          cb.checked = isSfxOn();
          cb.addEventListener("change", () => setSfxOn(cb.checked));
          return cb;
        })(),
        el("span", {}, ["点击音效（按钮 / 选项 / 下一题）"]),
      ]),
      el("label", { class: "check-row" }, [
        (() => {
          const cb = el("input", { type: "checkbox" }) as HTMLInputElement;
          cb.checked = isMusicOn();
          cb.addEventListener("change", () => setMusicOn(cb.checked));
          return cb;
        })(),
        el("span", {}, ["主界面轻音乐（做题时不播放）"]),
      ]),
      el("h2", {}, ["关于与安装"]),
      el("ul", {}, [
        el("li", {}, [`应用版本 v${APP_VERSION}（正式 1.0）。`]),
        el("li", {}, ["支持“添加到主屏幕/桌面”，像 App 一样使用。"]),
        el("li", {}, ["首次在线打开后会自动缓存，支持断网刷题；题库更新后联网打开即刷新。"]),
        el("li", {}, ["学习记录仅保存在本机浏览器，不上传服务器。"]),
      ]),
      el("p", { class: "muted small" }, [bank.meta.disclaimer]),
    ])
  );
}
