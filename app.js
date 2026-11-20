"use strict";

const APP_NAME = "前锋刷题软件";
const APP_SHORT = "前锋刷题";
const STORAGE_KEY = "shuati.v1";
const API_STORE_KEY = "shuati.api.v1";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const API_PRESETS = [
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { name: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { name: "Ollama", baseUrl: "http://127.0.0.1:11434/v1", model: "llama3.1" },
];

const SAMPLE_JSON = `{
  "name": "计算机基础",
  "questions": [
    {
      "question": "在 TCP/IP 体系中，提供端到端可靠传输的协议是？",
      "options": ["UDP", "TCP", "IP", "ARP"],
      "answer": "B",
      "explanation": "TCP 面向连接，能保证数据可靠、按序到达。UDP 不保证可靠；IP 负责寻址和转发；ARP 用来由 IP 地址查询 MAC 地址。"
    },
    {
      "question": "浏览网页时看到 HTTP 状态码 404，含义是？",
      "options": ["服务器内部错误", "未授权", "请求的资源不存在", "请求超时"],
      "answer": "C",
      "explanation": "404 表示服务器找不到请求的资源。500 是服务器内部错误，401 是未授权，408 是请求超时。"
    },
    {
      "question": "栈的特点是？",
      "options": ["先进先出", "后进先出", "插入和删除都发生在两端", "每个元素可以有多个后继"],
      "answer": "B",
      "explanation": "栈只允许在同一端放入和取出，后进入的先出来。先进先出的是队列；两端都能进出的是双端队列。"
    },
    {
      "question": "下列属于线性数据结构的有？（多选）",
      "options": ["栈", "队列", "二叉树", "数组"],
      "answer": "ABD",
      "type": "multiple",
      "explanation": "线性结构里的元素是一对一依次排列的，栈、队列和数组都属于线性结构。二叉树的一个结点可以有多个孩子，属于非线性结构。"
    },
    {
      "question": "二分查找能够正确工作，前提是？",
      "options": ["必须用链表存储", "数据可以随意排列", "数据已经有序", "元素必须全是正数"],
      "answer": "C",
      "explanation": "二分查找每次排除一半数据，要求序列已经按查找关键字排好序，并且能按下标直接访问。数据是否为正数并不是前提。"
    },
    {
      "question": "关于进程和线程，正确的是？",
      "options": ["线程是资源分配的基本单位", "进程是 CPU 调度的基本单位", "一个进程可以包含多个线程", "同一进程的线程不能共享地址空间"],
      "answer": "C",
      "explanation": "进程是操作系统分配资源的基本单位，线程是 CPU 调度的基本单位。一个进程里可以有多个线程，这些线程共享该进程的地址空间。"
    },
    {
      "question": "关系型数据库中，主键的作用是？",
      "options": ["用来给所有查询加速，并允许重复", "用来唯一标识一行记录", "必须由两个以上的字段组成", "只能是自动增长的整数"],
      "answer": "B",
      "explanation": "主键用来唯一标识表中的一行，值不能重复，也不能为空。它不要求一定由多个字段组成，也不要求一定是自增整数。"
    },
    {
      "question": "执行 git commit 的作用是？",
      "options": ["把远程仓库完整下载到本地", "将暂存区中的修改记录为一次本地提交", "把本地提交推送到远程仓库", "丢弃工作区里的全部修改"],
      "answer": "B",
      "explanation": "git commit 会把已经放入暂存区的修改保存为一次新的本地提交。下载远程内容用 clone、fetch 或 pull，推送用 git push。"
    },
    {
      "question": "DNS 的主要作用是？",
      "options": ["把域名解析为 IP 地址", "加密 HTTP 内容", "为主机自动分配 IP 地址", "在局域网中转发数据帧"],
      "answer": "A",
      "explanation": "DNS 把便于记忆的域名转换成 IP 地址。加密传输是 TLS 的工作，自动分配 IP 一般由 DHCP 负责，局域网转发数据帧是交换机的工作。"
    },
    {
      "question": "下列哪些 HTTP 方法通常被认为是安全的，即不应修改服务器资源？（多选）",
      "options": ["GET", "POST", "HEAD", "DELETE"],
      "answer": "AC",
      "type": "multiple",
      "explanation": "安全方法不应该改变服务器上的资源。GET 获取资源，HEAD 只获取响应头，二者通常是安全的。POST 常会改变状态，DELETE 会删除资源。"
    }
  ]
}`;

const TEXT_SAMPLE = `题库：常识小测

1. 地球绕太阳公转一周大约是多久？
A. 一天
B. 一个月
C. 一年
D. 十年
答案：C
解析：地球公转周期约为一年，自转周期约为一天。

2. 下列属于网页前端基础的有？（多选）
A. HTML
B. CSS
C. MySQL
D. JavaScript
答案：ABD
解析：HTML 负责结构，CSS 负责样式，JavaScript 负责行为。MySQL 是数据库，不属于前端基础。`;

let state = fresh();
let toastTimer = 0;
let examTimer = 0;
let dragDepth = 0;
let explainingId = "";

function fresh() {
  return {
    initialized: false,
    banks: [],
    activeBankId: null,
    currentId: null,
    onlyWrong: false,
    order: {},
    optionOrder: {},
    records: {},
    exam: null,
    uiMode: "practice",
    pendingKeys: [],
    pinId: null,
  };
}

function uid() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function $(id) {
  return document.getElementById(id);
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ASM_OPS = new Set("add addi sub and andi or ori xor xori sll slli srl srli sra srai slt slti sltu sltiu lui auipc lb lh lw lbu lhu sb sh sw beq bne blt bge bltu bgeu ble bgt jal jalr j jr ret ecall ebreak mv li la nop not neg seqz snez beqz bnez bltz bgez call tail mul div rem".split(" "));

function isAsmRegister(word) {
  return /^(?:x(?:[0-9]|[12]\d|3[01])|zero|ra|sp|gp|tp|fp|t[0-6]|s(?:[0-9]|1[01])|a[0-7])$/i.test(word);
}

function highlightAsmLine(line) {
  let html = "";
  let i = 0;
  while (i < line.length) {
    if (line[i] === "#") {
      html += `<span class="tok-cmt">${esc(line.slice(i))}</span>`;
      break;
    }
    if (line[i] === '"') {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") { j += 2; continue; }
        if (line[j] === '"') { j += 1; break; }
        j += 1;
      }
      html += `<span class="tok-str">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/\s/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /\s/.test(line[j])) j += 1;
      html += line.slice(i, j);
      i = j;
      continue;
    }
    if (line[i] === ".") {
      let j = i + 1;
      while (j < line.length && /\w/.test(line[j])) j += 1;
      html += `<span class="tok-dir">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(line[i])) {
      let j = i + 1;
      while (j < line.length && /[\w.]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      if (line[j] === ":") {
        html += `<span class="tok-lbl">${esc(word)}:</span>`;
        i = j + 1;
        continue;
      }
      if (ASM_OPS.has(word.toLowerCase())) html += `<span class="tok-op">${esc(word)}</span>`;
      else if (isAsmRegister(word)) html += `<span class="tok-reg">${esc(word)}</span>`;
      else html += esc(word);
      i = j;
      continue;
    }
    if ((line[i] === "-" && /\d/.test(line[i + 1] || "")) || /\d/.test(line[i])) {
      let j = i;
      if (line[j] === "-") j += 1;
      if (line.slice(j, j + 2).toLowerCase() === "0x") {
        j += 2;
        while (j < line.length && /[0-9a-fA-F]/.test(line[j])) j += 1;
      } else {
        while (j < line.length && /\d/.test(line[j])) j += 1;
      }
      html += `<span class="tok-num">${esc(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    html += esc(line[i]);
    i += 1;
  }
  return html;
}

function highlightAsm(source) {
  return String(source).split("\n").map(highlightAsmLine).join("\n");
}

function looksLikeAsm(text) {
  return /(^|\n)\s*(\.[A-Za-z_]\w*|[A-Za-z_][\w]*:|\b(?:li|la|lw|sw|lb|sb|addi|add|jal|j|beq|bne|bge|ble|blt|mv|ecall|ret|xor)\b)/.test(text);
}

function dedentLines(lines) {
  const indents = lines.filter((line) => line.trim()).map((line) => (line.match(/^[ \t]*/) || [""])[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => (line.trim() ? line.slice(Math.min(min, line.length)) : "")).join("\n").replace(/\s+$/, "");
}

function splitRich(text) {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let prose = [];
  const flush = () => {
    const body = prose.join("\n").replace(/^\n+|\n+$/g, "");
    prose = [];
    if (body.trim()) parts.push({ type: "text", text: body });
  };
  let i = 0;
  while (i < lines.length) {
    const fence = lines[i].match(/^```([A-Za-z0-9_+-]*)\s*$/);
    if (fence) {
      flush();
      const lang = fence[1] || "asm";
      const body = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      parts.push({ type: "code", lang, text: body.join("\n").replace(/\s+$/, "") });
      continue;
    }
    if (/^(?: {4}|\t)/.test(lines[i]) && lines[i].trim()) {
      const body = [];
      while (i < lines.length) {
        if (/^(?: {4}|\t)/.test(lines[i])) {
          body.push(lines[i]);
          i += 1;
          continue;
        }
        if (lines[i].trim() === "") {
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j += 1;
          if (j < lines.length && /^(?: {4}|\t)/.test(lines[j])) {
            body.push(lines[i]);
            i += 1;
            continue;
          }
        }
        break;
      }
      const code = dedentLines(body);
      if (looksLikeAsm(code)) {
        flush();
        parts.push({ type: "code", lang: "asm", text: code });
      } else {
        prose.push(...body);
      }
      continue;
    }
    prose.push(lines[i]);
    i += 1;
  }
  flush();
  return parts;
}

function inlineHtml(text) {
  return String(text).split("\n").map((line) => {
    return line.split(/(`[^`\n]+`)/).map((chunk) => {
      if (chunk.length >= 2 && chunk.startsWith("`") && chunk.endsWith("`")) {
        return `<code class="icode">${esc(chunk.slice(1, -1))}</code>`;
      }
      return esc(chunk);
    }).join("");
  }).join("<br>");
}

function codeBlockHtml(lang, text) {
  const label = lang || "asm";
  const body = label === "asm" ? highlightAsm(text) : esc(text);
  return `<div class="codeblock"><div class="codeblock-bar"><span class="codeblock-lang">${esc(label)}</span><svg class="codeblock-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.2 7.6 6 3.8l3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div><pre><code>${body}</code></pre></div>`;
}

function formatRich(text) {
  const parts = splitRich(text);
  if (!parts.some((part) => part.type === "code")) return inlineHtml(parts.map((part) => part.text).join("\n"));
  return parts.map((part) => (part.type === "code" ? codeBlockHtml(part.lang, part.text) : `<p class="rich-p">${inlineHtml(part.text)}</p>`)).join("");
}

function normText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function pick(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== "") return obj[key];
  }
  const map = new Map(Object.keys(obj).map((key) => [key.toLowerCase(), obj[key]]));
  for (const key of keys) {
    const value = map.get(String(key).toLowerCase());
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function nameFromFile(filename) {
  if (!filename) return "";
  const base = String(filename).split(/[/\\]/).pop();
  return base.replace(/\.[^.]+$/, "").trim();
}

function splitOptionLabel(text) {
  const matched = String(text ?? "").trim().match(/^(?:[（(]\s*([A-Z])\s*[)）]|([A-Z])[.、．)）])\s*(.+)$/i);
  if (!matched) return null;
  return { key: (matched[1] || matched[2]).toUpperCase(), text: matched[3].trim() };
}

function parseOptions(raw) {
  if (!raw) return [];
  if (typeof raw === "string") return parseOptions(raw.split(/\n+/).filter((line) => line.trim()));
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (item && typeof item === "object") {
        let text = pick(item, ["text", "content", "value", "option"]);
        let key = pick(item, ["key", "label", "id"]);
        if (text == null) {
          const entries = Object.entries(item).filter(([entryKey]) => /^[A-Z]$/i.test(entryKey));
          if (entries.length === 1) {
            key = entries[0][0];
            text = entries[0][1];
          }
        }
        const labeled = splitOptionLabel(text ?? "");
        const letter = key
          ? String(key).toUpperCase().replace(/[^A-Z]/g, "").charAt(0)
          : labeled?.key || LETTERS[index];
        return { key: letter, text: labeled && labeled.key === letter ? labeled.text : String(text ?? "").trim() };
      }
      const labeled = splitOptionLabel(item);
      if (labeled) return labeled;
      return { key: LETTERS[index], text: String(item).trim() };
    }).filter((option) => option.text);
  }
  if (typeof raw === "object") {
    return Object.entries(raw).map(([key, value]) => ({
      key: String(key).toUpperCase().replace(/[^A-Z]/g, "").charAt(0),
      text: String(value).trim(),
    })).filter((option) => option.key && option.text);
  }
  return [];
}

function optionsFromFields(raw) {
  const options = [];
  for (const key of "ABCDEFGH") {
    const text = pick(raw, [key, key.toLowerCase(), "option" + key, "option_" + key, "选项" + key]);
    if (text != null && String(text).trim()) options.push({ key, text: String(text).trim() });
  }
  return options;
}

function dedupeOptions(options) {
  const seen = new Set();
  const result = [];
  for (const option of options) {
    const key = String(option.key || "").toUpperCase();
    const text = String(option.text || "").trim();
    if (!/^[A-Z]$/.test(key) || !text || seen.has(key)) continue;
    seen.add(key);
    const labeled = splitOptionLabel(text);
    result.push({ key, text: labeled && labeled.key === key ? labeled.text : text });
  }
  return result;
}

function resolveAnswer(raw, options) {
  const keys = new Set(options.map((option) => option.key));
  const byText = new Map(options.map((option) => [normText(option.text), option.key]));
  const parts = Array.isArray(raw) ? raw.flat(Infinity) : [raw];
  const found = [];
  const add = (key) => {
    if (keys.has(key) && !found.includes(key)) found.push(key);
  };
  for (const part of parts) {
    if (part == null) continue;
    const text = String(part).trim();
    if (!text) continue;
    if (byText.has(normText(text))) {
      add(byText.get(normText(text)));
      continue;
    }
    const single = text.match(/^([A-Z])[.、．。]?$/i);
    if (single) {
      add(single[1].toUpperCase());
      continue;
    }
    const named = text.match(/^(?:选项|option)\s*([A-Z])$/i);
    if (named) {
      add(named[1].toUpperCase());
      continue;
    }
    const pieces = text.split(/[,，、/|\s]+/).map((piece) => piece.trim()).filter(Boolean);
    if (pieces.length > 1 && pieces.every((piece) => /^[A-Z]$/i.test(piece))) {
      pieces.forEach((piece) => add(piece.toUpperCase()));
      continue;
    }
    if (/^[A-Z](?:\s*(?:和|与|及)\s*[A-Z])+$/i.test(text)) {
      text.toUpperCase().match(/[A-Z]/g).forEach(add);
      continue;
    }
    if (/^[A-Z]{2,8}$/i.test(text) && [...text.toUpperCase()].every((char) => keys.has(char))) {
      [...text.toUpperCase()].forEach(add);
      continue;
    }
    if (/^\d+$/.test(text)) {
      const index = Number(text);
      if (index >= 1 && index <= options.length) add(options[index - 1].key);
      continue;
    }
    const prefixed = text.match(/^(?:[（(]\s*([A-Z])\s*[)）]|([A-Z])[.、．)）])/i);
    if (prefixed) add((prefixed[1] || prefixed[2]).toUpperCase());
  }
  return found;
}

function finalizeQuestion(draft) {
  const options = dedupeOptions(draft.options).sort((a, b) => a.key.charCodeAt(0) - b.key.charCodeAt(0));
  const stem = String(draft.stem || "").trim();
  if (!stem) return { error: "缺少题干" };
  if (options.length < 2) return { error: "选项不足" };
  const answer = resolveAnswer(draft.answer, options);
  if (!answer.length) return { error: "答案无法识别" };
  const typeRaw = String(draft.type || "");
  const multiple = /多|不定项|multiple|multi/i.test(typeRaw) || /多选|不定项|多项选择/.test(stem) || answer.length > 1;
  return {
    question: {
      id: uid(),
      stem,
      options,
      answer,
      explanation: String(draft.explanation || "").trim(),
      type: multiple ? "multiple" : "single",
    },
  };
}

function questionFromRaw(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { error: "格式不对" };
  const stem = String(pick(raw, ["question", "stem", "title", "题目", "题干", "q", "content"]) ?? "").trim();
  let options = parseOptions(pick(raw, ["options", "choices", "选项", "optionList"]));
  if (!options.length) options = optionsFromFields(raw);
  const answer = pick(raw, ["answer", "answers", "correct", "correctAnswer", "correct_answer", "rightAnswer", "答案", "正确答案"]);
  const explanation = String(pick(raw, ["explanation", "analysis", "parse", "detail", "解析", "分析", "详解"]) ?? "");
  const type = pick(raw, ["type", "questionType", "题型"]);
  return finalizeQuestion({ stem, options, answer, explanation, type });
}

function looksLikeQuestion(value) {
  return value && typeof value === "object" && !Array.isArray(value) && (
    pick(value, ["question", "题目", "题干", "stem"]) != null ||
    pick(value, ["options", "选项"]) != null ||
    pick(value, ["answer", "答案"]) != null
  );
}

function isBankLike(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (looksLikeQuestion(value) && !Array.isArray(value.questions)) return false;
  return Array.isArray(pick(value, ["questions", "items", "题目"]));
}

function parseJsonBank(data, filename) {
  let name = nameFromFile(filename) || "导入题库";
  let list = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    const named = pick(data, ["name", "title", "题库", "bank"]);
    if (named) name = String(named).trim();
    const maybe = pick(data, ["questions", "items", "题目"]);
    if (Array.isArray(maybe)) list = maybe;
    else if (Array.isArray(data.data) || Array.isArray(data.list)) list = data.data || data.list;
    else if (looksLikeQuestion(data)) list = [data];
    else return { name, questions: [], warnings: ["JSON 里没有找到题目列表"] };
  } else {
    return { name, questions: [], warnings: ["JSON 格式不正确"] };
  }
  const questions = [];
  const warnings = [];
  if (!list.length) warnings.push("题目列表是空的");
  list.forEach((item, index) => {
    const result = questionFromRaw(item);
    if (result.question) questions.push(result.question);
    else warnings.push(`第 ${index + 1} 题${result.error}`);
  });
  return { name, questions, warnings };
}

function normHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/^\ufeff/, "").replace(/\s+/g, "");
}

function parseDelimited(text, delim) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === delim) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((items) => items.some((item) => String(item).trim()));
}

function looksLikeTable(text) {
  const firstLine = text.split(/\r?\n/, 1)[0];
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const delim = tabs > commas ? "\t" : ",";
  if (!firstLine.includes(delim)) return false;
  const rows = parseDelimited(firstLine, delim);
  if (!rows.length) return false;
  const cells = rows[0].map(normHeader);
  const hasQuestion = cells.some((cell) => ["question", "stem", "title", "题目", "题干"].includes(cell));
  const hasAnswer = cells.some((cell) => ["answer", "answers", "正确答案", "答案"].includes(cell));
  return hasQuestion && hasAnswer;
}

function columnIndex(header, names) {
  const wanted = new Set(names.map((name) => normHeader(name)));
  return header.findIndex((cell) => wanted.has(cell));
}

function parseTableBank(text, filename) {
  const name = nameFromFile(filename) || "导入题库";
  const firstLine = text.split(/\r?\n/, 1)[0];
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const delim = tabs > commas ? "\t" : ",";
  const rows = parseDelimited(text, delim);
  if (rows.length < 2) return { name, questions: [], warnings: ["表格里没有题目"] };
  const header = rows[0].map(normHeader);
  const questionCol = columnIndex(header, ["question", "stem", "title", "题目", "题干"]);
  const answerCol = columnIndex(header, ["answer", "answers", "正确答案", "答案"]);
  const explainCol = columnIndex(header, ["explanation", "analysis", "解析", "分析", "详解"]);
  const typeCol = columnIndex(header, ["type", "题型"]);
  if (questionCol < 0 || answerCol < 0) {
    return { name, questions: [], warnings: ["表格第一行需要有题目列和答案列"] };
  }
  const questions = [];
  const warnings = [];
  rows.slice(1).forEach((row, index) => {
    const raw = { question: row[questionCol] || "", answer: row[answerCol] || "" };
    if (explainCol >= 0) raw.explanation = row[explainCol] || "";
    if (typeCol >= 0) raw.type = row[typeCol] || "";
    for (const key of "ABCDEFGH") {
      const indexOfKey = columnIndex(header, [key, "option" + key, "选项" + key]);
      if (indexOfKey >= 0 && row[indexOfKey] && String(row[indexOfKey]).trim()) raw[key] = row[indexOfKey];
    }
    const result = questionFromRaw(raw);
    if (result.question) questions.push(result.question);
    else warnings.push(`第 ${index + 1} 题${result.error}`);
  });
  return { name, questions, warnings };
}

const ANSWER_LABEL = "(?:正确答案|参考答案|标准答案|答案|answer)";
const ANSWER_TAIL_RE = new RegExp(
  String.raw`(?:\*{1,3}|_{1,3}|【|\[)?\s*${ANSWER_LABEL}\s*(?:\*{1,3}|_{1,3}|】|\])?\s*[:：]?\s*\*{0,3}\s*([A-Ha-h](?:[A-Ha-h]|[,，、\s/|和与及]){0,15})\s*[.。]?\s*\*{0,3}\s*$`,
  "i"
);
const ANSWER_LINE_RE = new RegExp(
  String.raw`^(?:【\s*|\[\s*)?${ANSWER_LABEL}(?:\s*】|\s*\])?\s*([:：])?\s*(.*)$`,
  "i"
);
const EXPLAIN_LINE_RE = /^(?:【\s*|\[\s*)?(?:解析|详解|解答|分析|explanation|analysis)(?:\s*】|\s*\])?\s*([:：])?\s*(.*)$/i;

function unwrapOuterDecor(line) {
  let text = String(line || "").trim();
  for (let i = 0; i < 4; i++) {
    const next = text
      .replace(/^\*{1,3}\s*|\s*\*{1,3}$/g, "")
      .replace(/^_{1,3}\s*|\s*_{1,3}$/g, "")
      .replace(/^【\s*|\s*】$/g, "")
      .replace(/^\[\s*|\s*\]$/g, "")
      .trim();
    if (next === text) break;
    text = next;
  }
  return text;
}

function matchTrailingAnswer(line) {
  const text = String(line || "").trim();
  const matched = text.match(ANSWER_TAIL_RE);
  if (!matched) return null;
  const value = matched[1].replace(/[^A-Za-z]/g, "").toUpperCase();
  if (!value || value.length > 8) return null;
  return { index: matched.index, value };
}

function isFenceLine(line) {
  return /^`{3,}\w*\s*$/.test(line);
}

function isRuleLine(line) {
  return /^[-—–=*_]{3,}$/.test(line);
}

function isHeadingLine(line) {
  return /^#{1,6}\s+\S/.test(line);
}

function normalizeQuizText(text) {
  const source = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = [];
  let title = "";
  for (const raw of source.split("\n")) {
    let line = raw.replace(/^(?:>\s*)+/, "").replace(/\s+$/, "");
    const trimmed = line.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }
    if (isFenceLine(trimmed) || isRuleLine(trimmed)) continue;
    if (isHeadingLine(trimmed)) {
      const heading = trimmed.replace(/^#{1,6}\s+/, "").trim();
      if (/^\d+\s*[\.、．)）]/.test(heading)) line = heading;
      else {
        if (!title) title = heading.replace(/[*_]+/g, "").trim();
        continue;
      }
    }
    const peeled = matchTrailingAnswer(line.trim());
    if (peeled) {
      const before = line.trim().slice(0, peeled.index).trim();
      if (before) lines.push(before);
      lines.push("答案：" + peeled.value);
      continue;
    }
    lines.push(line.trim());
  }
  return { text: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim(), title };
}

function matchAnswerLine(line) {
  const variants = [String(line || "").trim()];
  const unwrapped = unwrapOuterDecor(variants[0]);
  if (unwrapped && unwrapped !== variants[0]) variants.push(unwrapped);
  for (const text of variants) {
    const matched = text.match(ANSWER_LINE_RE);
    if (!matched) continue;
    const body = matched[2].trim().replace(/^\*+|\*+$/g, "").trim();
    const hasDelim = Boolean(matched[1]) || /[】\]]/.test(text);
    if (!body) continue;
    if (hasDelim) return body;
    if (/^[A-Z](?:\s*[,，、/|和与及]*\s*[A-Z])*[.。]?$/i.test(body) && body.replace(/[^A-Z]/gi, "").length <= 8) return body;
  }
  return "";
}

function matchExplainLine(line) {
  const variants = [String(line || "").trim()];
  const unwrapped = unwrapOuterDecor(variants[0]);
  if (unwrapped && unwrapped !== variants[0]) variants.push(unwrapped);
  for (const text of variants) {
    const matched = text.match(EXPLAIN_LINE_RE);
    if (!matched) continue;
    const hasDelim = Boolean(matched[1]) || /[】\]]/.test(text);
    if (!hasDelim) continue;
    return { text: matched[2].trim() };
  }
  return null;
}

function parseBlock(block) {
  const lines = block.split("\n").map((line) => line.trim()).filter((line) => (
    line && !isRuleLine(line) && !isFenceLine(line) && !isHeadingLine(line)
  ));
  const stemLines = [];
  const options = [];
  const explainLines = [];
  let answer = "";
  let mode = "stem";
  for (let line of lines) {
    if (!answer) {
      const trailing = matchTrailingAnswer(line);
      if (trailing && trailing.index > 0) {
        answer = trailing.value;
        line = line.slice(0, trailing.index).trim();
        if (!line) continue;
      }
    }
    if (!answer) {
      const found = matchAnswerLine(line);
      if (found) {
        answer = found;
        continue;
      }
    }
    const explain = matchExplainLine(line);
    if (explain && answer) {
      mode = "explanation";
      if (explain.text) explainLines.push(explain.text);
      continue;
    }
    if (mode === "explanation") {
      explainLines.push(line);
      continue;
    }
    const option = splitOptionLabel(line);
    if (option) {
      options.push(option);
      continue;
    }
    const stemLine = stemLines.length ? line : line.replace(/^\d+\s*[\.、．)）]\s*/, "");
    stemLines.push(stemLine);
  }
  return {
    stem: stemLines.join("\n").trim(),
    options,
    answer,
    explanation: explainLines.join("\n").trim(),
  };
}

function splitQuestionChunks(text) {
  const source = text.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "").trim();
  const numbered = source.match(/^\d+\s*[\.、．)）]/gm) || [];
  let parts;
  if (numbered.length >= 2) parts = source.split(/(?=^\d+\s*[\.、．)）])/m);
  else if (/^[-—–=]{3,}\s*$/m.test(source)) parts = source.split(/^[-—–=]{3,}\s*$/m);
  else parts = source.split(/\n\s*\n/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

function isMetadataStem(stem) {
  const lines = String(stem || "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return true;
  return lines.every((line) => (
    /^[-*+•]\s+/.test(line) ||
    /^(?:difficulty|split|easy|medium|hard|beginner|intermediate|advanced|初级|中级|高级)(?:\s|$|[:：])/i.test(line) ||
    /^难度/.test(line)
  ));
}

function isPreambleChunk(block) {
  return !block.answer && block.options.length < 2 && isMetadataStem(block.stem);
}

function mergeDangling(chunks) {
  const merged = [];
  for (const chunk of chunks) {
    if (!merged.length) {
      merged.push(chunk);
      continue;
    }
    const current = parseBlock(chunk);
    const previous = parseBlock(merged[merged.length - 1]);
    const currentIncomplete = !current.answer || current.options.length < 2;
    const previousIncomplete = !previous.answer || previous.options.length < 2;
    if (previousIncomplete && !currentIncomplete && isPreambleChunk(previous)) {
      merged[merged.length - 1] = chunk;
    } else if (currentIncomplete || previousIncomplete) {
      merged[merged.length - 1] += "\n" + chunk;
    } else {
      merged.push(chunk);
    }
  }
  return merged;
}

function parseTextBank(text, filename) {
  const normalized = normalizeQuizText(text);
  let body = normalized.text;
  let name = nameFromFile(filename) || "导入题库";
  const firstLine = body.split("\n", 1)[0] || "";
  const title = firstLine.match(/^题库\s*[:：]\s*(.+)$/);
  if (title) {
    name = title[1].trim();
    body = body.slice(firstLine.length).trim();
  } else if (normalized.title) {
    name = normalized.title;
  }
  const questions = [];
  const warnings = [];
  mergeDangling(splitQuestionChunks(body)).forEach((chunk, index) => {
    const block = parseBlock(chunk);
    const result = finalizeQuestion(block);
    if (result.question) questions.push(result.question);
    else warnings.push(`第 ${index + 1} 段${result.error}`);
  });
  return { name, questions, warnings };
}

function parseImport(text, filename) {
  const trimmed = String(text || "").replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new Error("内容是空的");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let data;
    try {
      data = JSON.parse(trimmed);
    } catch (err) {
      throw new Error("JSON 格式不正确，请检查逗号、引号和括号");
    }
    if (Array.isArray(data) && data.length && data.every(isBankLike)) {
      return data.map((bank, index) => parseJsonBank(bank, filename || `题库${index + 1}.json`));
    }
    return [parseJsonBank(data, filename)];
  }
  if (looksLikeTable(trimmed)) return [parseTableBank(trimmed, filename)];
  return [parseTextBank(trimmed, filename)];
}

function load() {
  const blank = fresh();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.banks)) return blank;
    return {
      initialized: Boolean(raw.initialized),
      banks: raw.banks.filter((bank) => bank && typeof bank.id === "string" && typeof bank.name === "string" && Array.isArray(bank.questions) && bank.questions.length),
      activeBankId: raw.activeBankId || null,
      currentId: raw.currentId || null,
      onlyWrong: Boolean(raw.onlyWrong),
      order: raw.order && typeof raw.order === "object" ? raw.order : {},
      optionOrder: raw.optionOrder && typeof raw.optionOrder === "object" ? raw.optionOrder : {},
      records: raw.records && typeof raw.records === "object" ? raw.records : {},
      exam: sanitizeExam(raw.exam),
      uiMode: raw.uiMode === "exam" ? "exam" : "practice",
      pendingKeys: [],
      pinId: null,
    };
  } catch (err) {
    return blank;
  }
}

function save() {
  const data = {
    initialized: state.initialized,
    banks: state.banks,
    activeBankId: state.activeBankId,
    currentId: state.currentId,
    onlyWrong: state.onlyWrong,
    order: state.order,
    optionOrder: state.optionOrder,
    records: state.records,
    exam: state.exam,
    uiMode: state.uiMode === "exam" ? "exam" : "practice",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function defaultApiSettings() {
  return { apiKey: "", baseUrl: API_PRESETS[0].baseUrl, model: API_PRESETS[0].model };
}

function loadApiSettings() {
  const blank = defaultApiSettings();
  try {
    const raw = JSON.parse(localStorage.getItem(API_STORE_KEY) || "null");
    if (!raw || typeof raw !== "object") return blank;
    return {
      apiKey: String(raw.apiKey || ""),
      baseUrl: String(raw.baseUrl || blank.baseUrl).trim() || blank.baseUrl,
      model: String(raw.model || blank.model).trim() || blank.model,
    };
  } catch (err) {
    return blank;
  }
}

function saveApiSettings(settings) {
  localStorage.setItem(API_STORE_KEY, JSON.stringify({
    apiKey: String(settings.apiKey || ""),
    baseUrl: String(settings.baseUrl || "").trim() || defaultApiSettings().baseUrl,
    model: String(settings.model || "").trim() || defaultApiSettings().model,
  }));
}

function chatCompletionsUrl(base) {
  let url = String(base || "").trim().replace(/\/+$/, "");
  if (!url) url = defaultApiSettings().baseUrl;
  if (/\/chat\/completions$/i.test(url)) return url;
  if (!/\/v\d+$/i.test(url)) url += "/v1";
  return url + "/chat/completions";
}

function unwrapModelText(text) {
  let out = String(text || "").trim();
  const fenced = out.match(/^```(?:\w+)?\s*([\s\S]*?)\s*```$/);
  if (fenced) out = fenced[1].trim();
  return out.replace(/^解析\s*[:：]\s*/, "").trim();
}

function buildExplainMessages(question) {
  const options = (question.options || []).map((option) => `${option.key}. ${option.text}`).join("\n");
  const answer = (question.answer || []).join("");
  const kind = question.type === "multiple" ? "多选" : "单选";
  return [
    {
      role: "system",
      content: "你是严谨的选择题讲解助手。用简体中文写解析。先写 2 到 5 句总述，说明考点和为什么该答案正确。然后按题目给出的选项字母逐条说明，每行格式必须是「A. 说明」，正确选项以「正确。」开头。不要输出 Markdown 标题、代码围栏或「解析：」前缀，不要打乱选项字母。",
    },
    {
      role: "user",
      content: `题型：${kind}\n题干：${question.stem}\n选项：\n${options}\n正确答案：${answer}`,
    },
  ];
}

function openApiSettings() {
  const settings = loadApiSettings();
  $("apiError").textContent = "";
  $("apiBaseInput").value = settings.baseUrl;
  $("apiModelInput").value = settings.model;
  $("apiKeyInput").value = settings.apiKey;
  $("apiDialog").showModal();
  $("apiKeyInput").focus();
}

function closeApiSettings() {
  if ($("apiDialog").open) $("apiDialog").close();
  $("apiError").textContent = "";
}

function applyApiPreset(base, model) {
  if (base) $("apiBaseInput").value = base;
  if (model) $("apiModelInput").value = model;
  $("apiError").textContent = "";
}

function saveApiFromForm() {
  const apiKey = $("apiKeyInput").value.trim();
  const baseUrl = $("apiBaseInput").value.trim();
  const model = $("apiModelInput").value.trim();
  if (!baseUrl) {
    $("apiError").textContent = "请填写接口地址";
    return;
  }
  if (!model) {
    $("apiError").textContent = "请填写模型名";
    return;
  }
  try {
    const url = new URL(chatCompletionsUrl(baseUrl));
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("接口地址必须是 http 或 https");
  } catch (err) {
    $("apiError").textContent = err.message || "接口地址不正确";
    return;
  }
  saveApiSettings({ apiKey, baseUrl, model });
  closeApiSettings();
  toast(apiKey ? "API 设置已保存" : "已保存接口，未填写 Key（本地模型可用）");
}

async function requestChat(settings, messages) {
  const url = chatCompletionsUrl(settings.baseUrl);
  const rawBody = JSON.stringify({
    model: settings.model || "deepseek-chat",
    messages,
    temperature: 0.3,
  });
  const useProxy = isLocalServer();
  const headers = { "Content-Type": "application/json" };
  if (!useProxy && settings.apiKey) headers.Authorization = "Bearer " + settings.apiKey;
  const res = await fetch(useProxy ? "/api/complete" : url, {
    method: "POST",
    headers,
    body: useProxy ? JSON.stringify({ url, apiKey: settings.apiKey, body: rawBody }) : rawBody,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(res.ok ? "接口返回的不是 JSON" : `请求失败（${res.status}）`);
  }
  if (!res.ok) {
    const message = data.error?.message || data.error || data.message || `请求失败（${res.status}）`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content || !String(content).trim()) throw new Error("接口没有返回解析内容");
  return unwrapModelText(content);
}

async function generateExplain() {
  const question = currentQuestion();
  if (!question) return;
  if (explainingId) {
    toast("正在生成解析，请稍候");
    return;
  }
  const settings = loadApiSettings();
  const local = /127\.0\.0\.1|localhost/i.test(settings.baseUrl);
  if (!settings.apiKey && !local) {
    openApiSettings();
    toast("请先填写 API Key");
    return;
  }
  const id = question.id;
  explainingId = id;
  render({ focusVerdict: true });
  try {
    const text = await requestChat(settings, buildExplainMessages(question));
    const bank = getBank();
    const target = bank && bank.questions.find((item) => item.id === id);
    if (!target) return;
    target.explanation = text;
    save();
    toast("解析已生成");
  } catch (err) {
    const message = String(err.message || "生成失败");
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      toast("连不上接口。用前锋刷题.bat 打开，或检查地址、跨域和网络。");
    } else {
      toast(message);
    }
  } finally {
    if (explainingId === id) explainingId = "";
    render({ focusVerdict: true });
  }
}

function explainActionsHtml(question) {
  const busy = explainingId === question.id;
  const label = busy ? "正在生成…" : (question.explanation ? "重新生成解析" : "生成解析");
  return `<div class="explain-actions"><button type="button" class="ghost" data-action="generate-explain"${busy ? " disabled" : ""}>${label}</button></div>`;
}

function toast(message) {
  const node = $("toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2800);
}

function getBank() {
  return state.banks.find((bank) => bank.id === state.activeBankId) || state.banks[0] || null;
}

function orderedQuestions(bank) {
  if (!bank) return [];
  const order = state.order[bank.id];
  if (!order) return bank.questions;
  const map = new Map(bank.questions.map((question) => [question.id, question]));
  const result = [];
  for (const id of order) if (map.has(id)) result.push(map.get(id));
  for (const question of bank.questions) if (!order.includes(question.id)) result.push(question);
  return result;
}

function visibleQuestions() {
  const bank = getBank();
  if (!bank) return [];
  if (examActive() && state.exam.bankId === bank.id) {
    const map = new Map(bank.questions.map((question) => [question.id, question]));
    return state.exam.ids.map((id) => map.get(id)).filter(Boolean);
  }
  const questions = orderedQuestions(bank);
  if (!state.onlyWrong) return questions;
  const records = state.records[bank.id] || {};
  return questions.filter((question) => question.id === state.pinId || (records[question.id] && records[question.id].correct === false));
}

function bankStats(bank) {
  const records = state.records[bank.id] || {};
  let correct = 0;
  let wrong = 0;
  for (const question of bank.questions) {
    if (!records[question.id]) continue;
    if (records[question.id].correct) correct += 1;
    else wrong += 1;
  }
  return { correct, wrong, todo: bank.questions.length - correct - wrong, total: bank.questions.length };
}

function rateOf(stats) {
  const done = stats.correct + stats.wrong;
  if (!done) return 0;
  return Math.round((stats.correct / done) * 100);
}

function sameAnswers(picked, answer) {
  if (picked.length !== answer.length) return false;
  const expected = new Set(answer);
  return picked.every((key) => expected.has(key));
}

function shuffledCopy(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function optionsReferToLetters(question) {
  const blob = [question.stem, ...(question.options || []).map((option) => option.text)].join("\n");
  return /以上[均都全]|全部正确|全部错误|都不对|都不正确|all of the above|none of the above|both\s+[A-D]\s+and|[A-D]\s*(?:和|与|、|／|\/|,)\s*[A-D]|选项\s*[A-D]|A and B/i.test(blob);
}

function optionKeysOf(question) {
  return (question.options || []).map((option) => option.key);
}

function optionOrderOf(question) {
  const bank = getBank();
  let stored;
  if (examActive() && state.exam.optionOrder) stored = state.exam.optionOrder[question.id];
  else stored = bank && state.optionOrder[bank.id] && state.optionOrder[bank.id][question.id];
  const canonical = optionKeysOf(question);
  if (!Array.isArray(stored) || !stored.length) return canonical;
  const allowed = new Set(canonical);
  const ordered = stored.filter((key) => allowed.has(key));
  for (const key of canonical) if (!ordered.includes(key)) ordered.push(key);
  return ordered;
}

function optionsAreShuffled(question) {
  return optionOrderOf(question).join("") !== optionKeysOf(question).join("");
}

function displayOptions(question) {
  const byKey = new Map((question.options || []).map((option) => [option.key, option]));
  return optionOrderOf(question).map((key, index) => ({
    id: key,
    letter: LETTERS[index],
    text: byKey.get(key)?.text || "",
  })).filter((item) => item.text);
}

function displayLetter(question, originalKey) {
  const index = optionOrderOf(question).indexOf(originalKey);
  return index >= 0 ? LETTERS[index] : originalKey;
}

function displayLetterText(question, keys) {
  return [...keys].map((key) => displayLetter(question, key)).sort().join("、");
}

function splitExplanation(text) {
  const source = String(text || "").replace(/\r\n/g, "\n").trim();
  if (!source) return { intro: "", byKey: {} };
  const intro = [];
  const byKey = {};
  let current = "";
  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    const matched = line.trim().match(/^([A-H])[.、．)）]\s*(.*)$/i);
    if (matched) {
      current = matched[1].toUpperCase();
      byKey[current] = matched[2].trim();
      continue;
    }
    if (current) {
      byKey[current] = byKey[current] ? `${byKey[current]}\n${line}` : line;
    } else {
      intro.push(line);
    }
  }
  for (const key of Object.keys(byKey)) byKey[key] = byKey[key].trim();
  return { intro: intro.join("\n").trim(), byKey };
}

function remapAnswerLetters(text, question) {
  if (!text) return "";
  return String(text).replace(
    /((?:正确答案|参考答案|标准答案|答案|answer)\s*[:：]?\s*)([A-H](?:\s*[,，、/|和与及]*\s*[A-H]){0,7})/gi,
    (full, prefix, body) => prefix + body.replace(/[A-H]/gi, (ch) => displayLetter(question, ch.toUpperCase()))
  );
}

function explanationView(question) {
  const split = splitExplanation(question.explanation);
  return {
    intro: remapAnswerLetters(split.intro, question),
    byKey: split.byKey,
  };
}

function bankOptionsShuffled(bank) {
  const map = bank && state.optionOrder[bank.id];
  return Boolean(map && Object.keys(map).length);
}

function uniqueName(name) {
  const names = new Set(state.banks.map((bank) => bank.name));
  if (!names.has(name)) return name;
  let index = 2;
  while (names.has(`${name} (${index})`)) index += 1;
  return `${name} (${index})`;
}

function currentQuestion() {
  const list = visibleQuestions();
  return list.find((question) => question.id === state.currentId) || list[0] || null;
}

function currentRecord(question) {
  const bank = getBank();
  if (!bank || !question) return null;
  if (examRunning()) return null;
  if (examReview() && state.exam.records) return state.exam.records[question.id] || null;
  return (state.records[bank.id] || {})[question.id] || null;
}

function sanitizeExam(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.ids) || !raw.ids.length) return null;
  if (raw.status !== "running" && raw.status !== "review") return null;
  return {
    bankId: String(raw.bankId || ""),
    ids: raw.ids.map(String),
    answers: raw.answers && typeof raw.answers === "object" ? raw.answers : {},
    optionOrder: raw.optionOrder && typeof raw.optionOrder === "object" ? raw.optionOrder : {},
    startedAt: Number(raw.startedAt) || Date.now(),
    endsAt: raw.endsAt ? Number(raw.endsAt) : null,
    status: raw.status,
    records: raw.records && typeof raw.records === "object" ? raw.records : {},
    result: raw.result && typeof raw.result === "object" ? raw.result : null,
    auto: Boolean(raw.auto),
  };
}

function examActive() {
  return Boolean(state.exam && (state.exam.status === "running" || state.exam.status === "review"));
}

function examRunning() {
  return Boolean(state.exam && state.exam.status === "running");
}

function examReview() {
  return Boolean(state.exam && state.exam.status === "review");
}

function isExamMode() {
  return state.uiMode === "exam" || examActive();
}

function isPracticeMode() {
  return !isExamMode();
}

function setUiMode(mode) {
  const next = mode === "exam" ? "exam" : "practice";
  if (next === "practice") {
    if (!confirmLeaveExam()) return;
    if (examReview()) {
      state.exam = null;
      stopExamTimer();
    }
  }
  state.uiMode = next;
  if (next === "exam") state.onlyWrong = false;
  save();
  render({ toTop: true });
}

function formatRemain(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hours) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function examPicks(question) {
  if (!state.exam || !question) return [];
  const saved = state.exam.answers[question.id];
  return Array.isArray(saved) ? saved : [];
}

function gradeExam(bank, ids, answers) {
  const records = {};
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  const map = new Map((bank.questions || []).map((question) => [question.id, question]));
  for (const id of ids) {
    const question = map.get(id);
    const picks = Array.isArray(answers[id]) ? answers[id] : [];
    if (!question) continue;
    if (!picks.length) {
      blank += 1;
      records[id] = { picks: [], correct: false };
      continue;
    }
    const ok = sameAnswers(picks, question.answer);
    records[id] = { picks: [...picks], correct: ok };
    if (ok) correct += 1;
    else wrong += 1;
  }
  return { correct, wrong, blank, total: ids.length, records };
}

function buildExamOptionOrder(questions, shuffle) {
  const next = {};
  if (!shuffle) return next;
  for (const question of questions) {
    const keys = optionKeysOf(question);
    if (keys.length < 2 || optionsReferToLetters(question)) continue;
    let order = shuffledCopy(keys);
    if (order.join("") === keys.join("") && keys.length > 2) order = shuffledCopy(keys);
    if (order.join("") !== keys.join("")) next[question.id] = order;
  }
  return next;
}

function stopExamTimer() {
  if (examTimer) clearInterval(examTimer);
  examTimer = 0;
}

function startExamTimer() {
  stopExamTimer();
  if (typeof document === "undefined") return;
  if (!examRunning() || !state.exam.endsAt) return;
  const tick = () => {
    if (!examRunning() || !state.exam.endsAt) {
      stopExamTimer();
      return;
    }
    const left = state.exam.endsAt - Date.now();
    const node = document.querySelector(".exam-timer");
    if (node) {
      node.textContent = formatRemain(left);
      node.classList.toggle("warn", left <= 60000);
    }
    if (left <= 0) {
      stopExamTimer();
      submitExam(true);
    }
  };
  tick();
  examTimer = setInterval(tick, 250);
}

function openExamDialog() {
  const bank = getBank();
  if (!bank) {
    toast("请先选择一套题库");
    return;
  }
  if (examRunning()) {
    toast("考试进行中");
    return;
  }
  $("examError").textContent = "";
  $("examCountInput").max = String(bank.questions.length);
  $("examCountInput").value = String(bank.questions.length);
  $("examDialog").showModal();
}

function closeExamDialog() {
  if ($("examDialog")?.open) $("examDialog").close();
}

function startExamFromForm() {
  const bank = getBank();
  if (!bank) return;
  const max = bank.questions.length;
  const count = Math.max(1, Math.min(max, Number($("examCountInput").value) || max));
  const minutes = Number($("examDurationInput").value) || 0;
  const shuffleQ = $("examShuffleQ").checked;
  const shuffleO = $("examShuffleO").checked;
  let ids = bank.questions.map((question) => question.id);
  if (shuffleQ) ids = shuffledCopy(ids);
  ids = ids.slice(0, count);
  const slice = ids.map((id) => bank.questions.find((question) => question.id === id)).filter(Boolean);
  state.exam = {
    bankId: bank.id,
    ids,
    answers: {},
    optionOrder: buildExamOptionOrder(slice, shuffleO),
    startedAt: Date.now(),
    endsAt: minutes > 0 ? Date.now() + minutes * 60 * 1000 : null,
    status: "running",
    records: {},
    result: null,
    auto: false,
  };
  state.activeBankId = bank.id;
  state.currentId = ids[0];
  state.uiMode = "exam";
  state.onlyWrong = false;
  state.pendingKeys = [];
  state.pinId = null;
  save();
  closeExamDialog();
  closeSidebar();
  startExamTimer();
  render({ toTop: true });
  toast(minutes ? `考试开始，共 ${ids.length} 题，限时 ${minutes} 分钟` : `考试开始，共 ${ids.length} 题`);
}

function saveExamAnswer(id, picks) {
  if (!examRunning() || !id) return;
  if (!picks.length) {
    toast("请先选择选项");
    return;
  }
  state.exam.answers[id] = [...picks];
  save();
  render();
}

function submitExam(auto = false) {
  if (!examRunning()) return;
  const bank = state.banks.find((item) => item.id === state.exam.bankId) || getBank();
  if (!bank) {
    state.exam = null;
    save();
    render();
    return;
  }
  const unanswered = state.exam.ids.filter((id) => !state.exam.answers[id] || !state.exam.answers[id].length).length;
  if (!auto && unanswered && !confirm(`还有 ${unanswered} 题未作答，确定交卷？`)) return;
  const result = gradeExam(bank, state.exam.ids, state.exam.answers);
  state.exam.status = "review";
  state.exam.records = result.records;
  state.exam.result = {
    correct: result.correct,
    wrong: result.wrong,
    blank: result.blank,
    total: result.total,
  };
  state.exam.auto = Boolean(auto);
  if (!state.records[bank.id]) state.records[bank.id] = {};
  Object.assign(state.records[bank.id], result.records);
  state.pendingKeys = [];
  save();
  stopExamTimer();
  render({ toTop: true });
  const score = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  toast(auto ? `时间到，已交卷。得分 ${score}%` : `已交卷。得分 ${score}%`);
}

function exitExam() {
  if (examRunning()) submitExam(true);
  state.exam = null;
  state.uiMode = "exam";
  state.pendingKeys = [];
  save();
  stopExamTimer();
  render({ toTop: true });
}

function confirmLeaveExam() {
  if (!examRunning()) return true;
  if (!confirm("考试还在进行。离开将自动交卷。确定吗？")) return false;
  submitExam(true);
  return true;
}

function closeSidebar() {
  $("sidebar").classList.remove("open");
  $("scrim").classList.remove("show");
}

function toggleSidebar() {
  $("sidebar").classList.toggle("open");
  $("scrim").classList.toggle("show", $("sidebar").classList.contains("open"));
}

function focusBank(id) {
  const bank = state.banks.find((item) => item.id === id);
  if (!bank) return;
  if (examActive() && state.exam.bankId !== bank.id && !confirmLeaveExam()) return;
  state.activeBankId = bank.id;
  state.currentId = bank.questions[0]?.id || null;
  state.onlyWrong = false;
  state.pendingKeys = [];
  state.pinId = null;
  save();
  render({ toTop: true });
  closeSidebar();
}

function pushBank(pack) {
  const bank = {
    id: uid(),
    name: uniqueName(pack.name || "导入题库"),
    createdAt: Date.now(),
    questions: pack.questions,
  };
  state.banks.push(bank);
  return bank;
}

async function importFileList(files) {
  const errors = [];
  const before = state.banks.length;
  for (const file of files) {
    let packs;
    try {
      packs = parseImport(await file.text(), file.name);
    } catch (err) {
      errors.push(`${file.name}：${err.message}`);
      continue;
    }
    const ok = packs.filter((pack) => pack.questions.length);
    if (!ok.length) {
      errors.push(`${file.name}：${packs.flatMap((pack) => pack.warnings)[0] || "没有识别到完整题目"}`);
      continue;
    }
    ok.forEach((pack) => pushBank(pack));
  }
  const added = state.banks.slice(before);
  if (!added.length) throw new Error(errors.join("\n") || "没有识别到完整题目。每题需要题干、至少两个选项，以及答案。");
  const count = added.reduce((sum, bank) => sum + bank.questions.length, 0);
  focusBank(added[0].id);
  toast(errors.length
    ? `已导入 ${added.length} 个题库、${count} 题，另有 ${errors.length} 个文件失败`
    : `已导入 ${added.length} 个题库，共 ${count} 题`);
}

function seedSample() {
  const pack = parseImport(SAMPLE_JSON, "计算机基础.json")[0];
  const bank = pushBank(pack);
  state.activeBankId = bank.id;
  state.currentId = bank.questions[0].id;
  state.initialized = true;
  save();
}

function loadSample() {
  const existing = state.banks.find((bank) => bank.name === "计算机基础");
  if (existing) {
    focusBank(existing.id);
    toast("示例题库已在列表中");
    return;
  }
  const pack = parseImport(SAMPLE_JSON, "计算机基础.json")[0];
  const bank = pushBank(pack);
  focusBank(bank.id);
  toast(`已载入「${bank.name}」，共 ${bank.questions.length} 题`);
}

function go(delta) {
  const list = visibleQuestions();
  const index = list.findIndex((question) => question.id === state.currentId);
  if (index < 0) return;
  const target = list[index + delta];
  if (!target) return;
  state.pinId = null;
  state.currentId = target.id;
  state.pendingKeys = examRunning() && target.type === "multiple" ? [...examPicks(target)] : [];
  save();
  render({ toTop: true });
}

function jumpTo(id) {
  state.pinId = null;
  state.currentId = id;
  const question = currentQuestion();
  state.pendingKeys = examRunning() && question?.type === "multiple" ? [...examPicks(question)] : [];
  save();
  render({ toTop: true });
  if (window.innerWidth <= 900) closeSidebar();
}

function onPick(key) {
  const question = currentQuestion();
  if (!question) return;
  if (examRunning()) {
    if (question.type === "multiple") {
      const picked = new Set(state.pendingKeys.length ? state.pendingKeys : examPicks(question));
      if (picked.has(key)) picked.delete(key);
      else picked.add(key);
      state.pendingKeys = [...picked];
      render();
      return;
    }
    saveExamAnswer(question.id, [key]);
    return;
  }
  if (currentRecord(question)) return;
  if (question.type === "multiple") {
    const picked = new Set(state.pendingKeys);
    if (picked.has(key)) picked.delete(key);
    else picked.add(key);
    state.pendingKeys = [...picked];
    render();
    return;
  }
  commit([key]);
}

function commit(picks) {
  const bank = getBank();
  const question = currentQuestion();
  if (!bank || !question) return;
  if (examRunning()) {
    saveExamAnswer(question.id, picks);
    return;
  }
  if (!picks.length) {
    toast("请先选择选项");
    return;
  }
  const correct = sameAnswers(picks, question.answer);
  if (!state.records[bank.id]) state.records[bank.id] = {};
  state.records[bank.id][question.id] = { picks: [...picks], correct };
  state.pendingKeys = [];
  if (state.onlyWrong) state.pinId = question.id;
  save();
  render({ focusVerdict: true });
  const verdict = correct ? "正确" : `错误，正确答案 ${displayLetterText(question, question.answer)}`;
  const spoken = optionsAreShuffled(question) ? (explanationView(question).intro || question.explanation) : question.explanation;
  $("live").textContent = `${verdict}。${spoken || ""}`;
}

function redo() {
  if (examActive()) return;
  const bank = getBank();
  const question = currentQuestion();
  if (!bank || !question || !state.records[bank.id]) return;
  delete state.records[bank.id][question.id];
  state.pendingKeys = [];
  state.pinId = null;
  save();
  render();
}

function toggleWrong() {
  state.onlyWrong = !state.onlyWrong;
  state.pinId = null;
  state.pendingKeys = [];
  save();
  render({ toTop: true });
}

function shuffleQuestions() {
  if (examActive()) {
    toast("考试中不能改题序");
    return;
  }
  const bank = getBank();
  if (!bank) return;
  if (state.order[bank.id]) {
    delete state.order[bank.id];
    toast("已恢复原来的顺序");
  } else {
    state.order[bank.id] = shuffledCopy(bank.questions.map((question) => question.id));
    toast("已打乱题目顺序");
  }
  state.pinId = null;
  state.pendingKeys = [];
  save();
  render({ toTop: true });
}

function shuffleOptions() {
  if (examActive()) {
    toast("考试中不能改选项顺序");
    return;
  }
  const bank = getBank();
  if (!bank) return;
  if (bankOptionsShuffled(bank)) {
    delete state.optionOrder[bank.id];
    toast("已恢复选项顺序");
  } else {
    const next = {};
    let skipped = 0;
    for (const question of bank.questions) {
      const keys = optionKeysOf(question);
      if (keys.length < 2 || optionsReferToLetters(question)) {
        skipped += 1;
        continue;
      }
      let order = shuffledCopy(keys);
      if (order.join("") === keys.join("") && keys.length > 2) order = shuffledCopy(keys);
      if (order.join("") !== keys.join("")) next[question.id] = order;
    }
    if (!Object.keys(next).length) {
      toast(skipped ? "这些题目的选项互相引用，不能打乱" : "没有可以打乱的选项");
      return;
    }
    state.optionOrder[bank.id] = next;
    toast(skipped ? `已打乱选项，跳过 ${skipped} 题` : "已打乱选项顺序");
  }
  state.pendingKeys = [];
  save();
  render();
}

function clearProgress() {
  if (!confirmLeaveExam()) return;
  const bank = getBank();
  if (!bank) return;
  if (!confirm(`清空「${bank.name}」的做题记录？`)) return;
  delete state.records[bank.id];
  state.pendingKeys = [];
  state.pinId = null;
  save();
  render();
  toast("做题记录已清空");
}

function deleteBank() {
  if (!confirmLeaveExam()) return;
  const bank = getBank();
  if (!bank) return;
  if (!confirm(`删除题库「${bank.name}」？题目和做题记录都会去掉。`)) return;
  state.banks = state.banks.filter((item) => item.id !== bank.id);
  delete state.records[bank.id];
  delete state.order[bank.id];
  delete state.optionOrder[bank.id];
  const next = state.banks[0];
  state.activeBankId = next?.id || null;
  state.currentId = next?.questions[0]?.id || null;
  state.pendingKeys = [];
  state.pinId = null;
  save();
  render({ toTop: true });
}

function exportBank() {
  const bank = getBank();
  if (!bank) return;
  const data = {
    name: bank.name,
    questions: bank.questions.map((question) => ({
      question: question.stem,
      options: question.options.map((option) => ({ key: option.key, text: option.text })),
      answer: question.answer.join(""),
      explanation: question.explanation,
      type: question.type,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const clean = bank.name.replace(/[<>:"/\\|?*]/g, " ").trim() || "题库";
  link.href = URL.createObjectURL(blob);
  link.download = `${clean}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function openImport() {
  $("importError").textContent = "";
  $("importDialog").showModal();
  $("pasteArea").focus();
}

function closeImport() {
  if ($("importDialog").open) $("importDialog").close();
  $("importError").textContent = "";
}

function render(options = {}) {
  const bank = getBank();
  if (bank && bank.id !== state.activeBankId) state.activeBankId = bank.id;
  const list = bank ? visibleQuestions() : [];
  if (bank && list.length && !list.some((question) => question.id === state.currentId)) {
    state.currentId = list[0].id;
  }
  document.title = bank
    ? `${bank.name} · ${isExamMode() ? "考试模式" : "刷题模式"}`
    : APP_NAME;
  $("sidebar").innerHTML = renderSidebar(bank);
  $("stage").innerHTML = renderStage(bank, list);
  if (options.toTop) window.scrollTo(0, 0);
  if (options.focusVerdict) document.querySelector(".verdict")?.scrollIntoView({ block: "nearest" });
}

function renderSidebar(bank) {
  const banks = state.banks.map((item) => {
    const stats = bankStats(item);
    const done = stats.correct + stats.wrong;
    const rate = done ? ` · 正确率 ${rateOf(stats)}%` : "";
    return `<button type="button" class="bank${item.id === state.activeBankId ? " active" : ""}" data-action="open-bank" data-id="${esc(item.id)}">
      <span class="bank-name">${esc(item.name)}</span>
      <span class="bank-meta">${stats.total} 题${rate}</span>
    </button>`;
  }).join("");
  let tools = "";
  if (bank) {
    const shuffled = Boolean(state.order[bank.id]);
    const optionShuffled = bankOptionsShuffled(bank);
    const list = visibleQuestions();
    const all = examActive() ? list : orderedQuestions(bank);
    const records = examReview() ? (state.exam.records || {}) : (state.records[bank.id] || {});
    const dots = list.map((question, index) => {
      const number = (examActive() ? index : all.findIndex((item) => item.id === question.id)) + 1;
      let status = "todo";
      if (examRunning()) status = examPicks(question).length ? "answered" : "todo";
      else {
        const record = records[question.id];
        status = record ? (record.correct ? "correct" : "wrong") : "todo";
      }
      const current = question.id === state.currentId ? " current" : "";
      return `<button type="button" class="qdot ${status}${current}" data-action="jump" data-id="${esc(question.id)}" title="${esc(question.stem)}" aria-label="第 ${number} 题"${question.id === state.currentId ? ' aria-current="true"' : ""}>${number}</button>`;
    }).join("");
    if (examRunning()) {
      tools = `<div class="side-actions">
        <button type="button" class="side-btn primary wide" data-action="submit-exam">交卷</button>
      </div>
      <p class="side-label">题目</p>
      <div class="qgrid">${dots}</div>`;
    } else if (examReview()) {
      tools = `<div class="side-actions">
        <button type="button" class="side-btn primary wide" data-action="exit-exam">结束看卷</button>
      </div>
      <p class="side-label">题目</p>
      <div class="qgrid">${dots}</div>`;
    } else if (isExamMode()) {
      tools = `<div class="side-actions">
        <button type="button" class="side-btn primary wide" data-action="open-exam">开始考试</button>
        <button type="button" class="side-btn" data-action="export">导出题库</button>
        <button type="button" class="side-btn" data-action="delete">删除本题库</button>
      </div>`;
    } else {
      tools = `<div class="side-actions">
        <button type="button" class="side-btn" data-action="export">导出题库</button>
        <button type="button" class="side-btn" data-action="toggle-wrong" aria-pressed="${state.onlyWrong}">${state.onlyWrong ? "查看全部" : "只看错题"}</button>
        <button type="button" class="side-btn" data-action="shuffle" aria-pressed="${shuffled}">${shuffled ? "恢复题序" : "打乱题序"}</button>
        <button type="button" class="side-btn" data-action="shuffle-options" aria-pressed="${optionShuffled}">${optionShuffled ? "恢复选项" : "打乱选项"}</button>
        <button type="button" class="side-btn" data-action="clear">清空记录</button>
        <button type="button" class="side-btn wide" data-action="delete">删除本题库</button>
      </div>
      <p class="side-label">题目</p>
      <div class="qgrid">${dots}</div>`;
    }
  }
  const topActions = examActive()
    ? ""
    : `<div class="side-actions">
      <button type="button" class="side-btn primary wide" data-action="open-import">导入题库</button>
      <button type="button" class="side-btn wide" data-action="open-api">API 设置</button>
      <button type="button" class="side-btn wide" data-action="load-sample">载入示例题库</button>
    </div>`;
  const modeSwitch = examActive()
    ? `<p class="mode-lock">${examRunning() ? "考试进行中" : "正在看卷"}</p>`
    : `<div class="mode-switch" role="tablist" aria-label="模式">
      <button type="button" class="mode-btn" data-action="mode-practice" aria-pressed="${isPracticeMode()}">刷题模式</button>
      <button type="button" class="mode-btn" data-action="mode-exam" aria-pressed="${isExamMode()}">考试模式</button>
    </div>`;
  return `<div class="logo"><span class="logo-mark">锋</span><div><strong>${APP_SHORT}</strong><em>${isExamMode() ? "考试模式" : "刷题模式"}</em></div></div>
    ${modeSwitch}
    ${topActions}
    <p class="side-label">题库</p>
    <div class="bank-list">${banks || '<p class="bank-meta">还没有题库</p>'}</div>
    ${tools}
    <p class="store-note">题库和进度保存在这台电脑上，下次打开还在。清除站点数据后需要重新导入。</p>
    ${isPagesDemo() ? '<p class="store-note">这是网页演示。Windows 用户请下载仓库 Releases，解压后双击打开。</p>' : ""}`;
}

function renderStage(bank, list) {
  const menu = '<button type="button" class="menu-btn" data-action="toggle-sidebar">题库</button>';
  if (!bank) {
    return `<div class="sheet"><div class="top">${menu}<div><h2>${isExamMode() ? "考试模式" : "刷题模式"}</h2></div></div>
      <article class="card empty-card"><h1>还没有题目</h1><p>导入 JSON、CSV、Markdown 或文本题库，也可以先载入一套示例题。</p>
      <div class="nav"><button type="button" class="primary" data-action="open-import">导入题库</button><button type="button" class="ghost" data-action="load-sample">载入示例</button></div></article></div>`;
  }
  if (isExamMode() && !examActive()) {
    return `<div class="sheet"><div class="top">${menu}<div><p class="eyebrow">${esc(bank.name)}</p></div>
      <div class="stats"><span><b>${bank.questions.length}</b>题</span></div></div>
      <article class="card empty-card">
        <h1>考试模式</h1>
        <p>答题过程中不显示对错和解析。交卷后出分，错题会记入错题本。可选题量、时限，并打乱题序或选项。</p>
        <div class="nav"><button type="button" class="primary" data-action="open-exam">开始考试</button><button type="button" class="ghost" data-action="mode-practice">回到刷题模式</button></div>
      </article></div>`;
  }
  const stats = examActive()
    ? (() => {
      const total = state.exam.ids.length;
      if (examRunning()) {
        const answered = state.exam.ids.filter((id) => examPicks({ id }).length).length;
        return { correct: 0, wrong: 0, todo: total - answered, total, answered };
      }
      const result = state.exam.result;
      if (result) {
        return {
          correct: result.correct || 0,
          wrong: result.wrong || 0,
          todo: result.blank || 0,
          total: result.total || total,
        };
      }
      const records = state.exam.records || {};
      let correct = 0;
      let wrong = 0;
      let blank = 0;
      for (const id of state.exam.ids) {
        const record = records[id];
        if (!record || !record.picks?.length) blank += 1;
        else if (record.correct) correct += 1;
        else wrong += 1;
      }
      return { correct, wrong, todo: blank, total };
    })()
    : bankStats(bank);
  const done = examRunning() ? stats.answered : stats.correct + stats.wrong;
  const percent = stats.total ? Math.round((done / stats.total) * 100) : 0;
  const remain = examRunning() && state.exam.endsAt
    ? `<span class="exam-timer${state.exam.endsAt - Date.now() <= 60000 ? " warn" : ""}">${esc(formatRemain(state.exam.endsAt - Date.now()))}</span>`
    : examRunning() ? '<span class="exam-timer">不限时</span>' : "";
  const examBar = examRunning()
    ? `<div class="exam-banner"><strong>考试中</strong><span>已答 ${stats.answered} / ${stats.total}</span>${remain}<button type="button" class="ghost" data-action="submit-exam">交卷</button></div>`
    : examReview()
      ? `<div class="exam-banner review"><strong>考试结束</strong><span>正确 ${stats.correct} · 错误 ${stats.wrong} · 未答 ${stats.todo} · 得分 ${stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%</span><button type="button" class="ghost" data-action="exit-exam">结束看卷</button></div>`
      : "";
  const head = `${examBar}<div class="top">${menu}<div><p class="eyebrow">${esc(bank.name)}${examActive() ? " · 考试" : ""}</p></div>
    <div class="stats">${examRunning()
      ? `<span><b>${stats.answered}</b>已答</span><span><b>${stats.todo}</b>未答</span>`
      : `<span><b>${stats.correct}</b>正确</span><span><b>${stats.wrong}</b>错误</span><span><b>${stats.todo}</b>未做</span>`}</div></div>
    <div class="progress-line"><div class="bar"><span style="width:${percent}%"></span></div><span>${examRunning() ? "进度" : "已做"} ${percent}%</span></div>`;
  if (!list.length) {
    const message = stats.wrong === 0 ? "当前题库里没有答错的题目。" : "错题都已经复习过了。";
    return `<div class="sheet">${head}<article class="card empty-card"><h1>没有错题</h1><p>${message}</p>
      <div class="nav"><button type="button" class="primary" data-action="show-all">返回全部题目</button></div></article></div>`;
  }
  const question = list.find((item) => item.id === state.currentId) || list[0];
  const record = currentRecord(question);
  const index = list.findIndex((item) => item.id === question.id);
  const all = orderedQuestions(bank);
  const number = examActive() ? index + 1 : all.findIndex((item) => item.id === question.id) + 1;
  const finished = !examActive() && stats.todo === 0 && stats.total > 0 && !state.onlyWrong
    ? `<p class="done">这套题已经做完，正确率 ${rateOf(stats)}%。</p>`
    : "";
  const badge = question.type === "multiple" ? '<span class="badge multi">多选</span>' : '<span class="badge">单选</span>';
  const hint = !record && question.type === "multiple" ? '<p class="hint">多选题，选完后点击确认答案。</p>' : "";
  const shown = displayOptions(question);
  const shuffledOptions = optionsAreShuffled(question);
  const view = shuffledOptions ? explanationView(question) : { intro: "", byKey: {} };
  const livePicks = examRunning()
    ? (question.type === "multiple" && state.pendingKeys.length ? state.pendingKeys : examPicks(question))
    : state.pendingKeys;
  const options = shown.map((option) => {
    const picked = record ? record.picks.includes(option.id) : livePicks.includes(option.id);
    const isAnswer = question.answer.includes(option.id);
    let cls = "option";
    if (!record && picked) cls += " is-selected";
    if (record && isAnswer) cls += " is-correct";
    if (record && picked && !isAnswer) cls += " is-wrong";
    if (record && !isAnswer && !picked) cls += " is-dim";
    const mark = record && isAnswer ? "✓" : record && picked ? "✕" : "";
    const button = `<button type="button" class="${cls}" data-action="pick" data-key="${option.id}"${record ? " disabled" : ""}>
      <span class="letter">${option.letter}</span><span class="otext">${formatRich(option.text)}</span><span class="mark">${mark}</span>
    </button>`;
    const note = record && shuffledOptions && view.byKey[option.id]
      ? `<div class="option-note">${formatRich(view.byKey[option.id])}</div>`
      : "";
    return `<div class="option-wrap">${button}${note}</div>`;
  }).join("");
  let verdict = "";
  let explain = "";
  if (record) {
    const yours = displayLetterText(question, record.picks) || "未选";
    const right = displayLetterText(question, question.answer);
    verdict = record.correct
      ? `<div class="verdict good"><strong>正确</strong><span>答案 ${esc(right)}</span></div>`
      : `<div class="verdict bad"><strong>错误</strong><span>你的选择 ${esc(yours)} · 正确答案 ${esc(right)}</span></div>`;
    if (shuffledOptions) {
      const correctShown = shown.filter((item) => question.answer.includes(item.id));
      const answerLines = correctShown.map((item) => `<p><b>${esc(item.letter)}.</b> ${formatRich(item.text)}</p>`).join("");
      const body = view.intro
        ? formatRich(view.intro)
        : Object.keys(view.byKey).length
          ? ""
          : "本题暂无解析。";
      explain = `<section class="explain"><div class="explain-head"><h3>解析</h3>${explainActionsHtml(question)}</div>
        <div class="answer-line"><strong>正确选项 ${esc(right)}</strong>${answerLines}</div>
        ${body ? `<div class="explain-body">${body}</div>` : ""}</section>`;
    } else {
      explain = `<section class="explain"><div class="explain-head"><h3>解析</h3>${explainActionsHtml(question)}</div><div class="explain-body">${question.explanation ? formatRich(question.explanation) : "本题暂无解析。"}</div></section>`;
    }
  }
  const middle = record
    ? (examReview() ? "<span></span>" : '<button type="button" class="ghost" data-action="redo">重做本题</button>')
    : question.type === "multiple"
      ? `<button type="button" class="primary" data-action="commit">${examRunning() ? "保存本题" : "确认答案"}</button>`
      : "<span></span>";
  const keysHint = examRunning()
    ? "考试中不显示对错。选好即可翻题，全部完成后交卷 · ← → 切换题目"
    : examReview()
      ? "正在看卷，可查看解析 · ← → 切换题目"
      : "单击选项查看正误和解析 · 多选题按 Enter 确认 · ← → 切换题目";
  return `<div class="sheet">${head}${finished}<article class="card">
    <div class="meta">${badge}${state.onlyWrong && !examActive() ? '<span class="badge multi">错题</span>' : ""}${examRunning() ? '<span class="badge exam">考试</span>' : ""}<span class="count">第 ${number} 题 · ${index + 1} / ${list.length}</span></div>
    <div class="stem">${formatRich(question.stem)}</div>
    ${hint}
    <div class="options">${options}</div>
    ${verdict}
    ${explain}
    <div class="nav">
      <button type="button" class="ghost" data-action="prev"${index <= 0 ? " disabled" : ""}>上一题</button>
      ${middle}
      <button type="button" class="primary" data-action="next"${index >= list.length - 1 ? " disabled" : ""}>下一题</button>
    </div>
  </article>
  <p class="keys">${keysHint}</p></div>`;
}

function onClick(event) {
  const node = event.target.closest("[data-action]");
  if (!node || node.disabled) return;
  const action = node.dataset.action;
  if (action === "pick") onPick(node.dataset.key);
  else if (action === "commit") commit(state.pendingKeys.length ? state.pendingKeys : examPicks(currentQuestion()));
  else if (action === "prev") go(-1);
  else if (action === "next") go(1);
  else if (action === "jump") jumpTo(node.dataset.id);
  else if (action === "redo") redo();
  else if (action === "open-bank") focusBank(node.dataset.id);
  else if (action === "open-import") {
    if (!confirmLeaveExam()) return;
    openImport();
  }
  else if (action === "open-exam") openExamDialog();
  else if (action === "mode-practice") setUiMode("practice");
  else if (action === "mode-exam") setUiMode("exam");
  else if (action === "submit-exam") submitExam(false);
  else if (action === "exit-exam") exitExam();
  else if (action === "open-api") openApiSettings();
  else if (action === "generate-explain") {
    if (examRunning()) return;
    generateExplain();
  }
  else if (action === "api-preset") applyApiPreset(node.dataset.base, node.dataset.model);
  else if (action === "load-sample") loadSample();
  else if (action === "toggle-wrong" || action === "show-all") {
    if (action === "show-all") state.onlyWrong = true;
    toggleWrong();
  } else if (action === "shuffle") shuffleQuestions();
  else if (action === "shuffle-options") shuffleOptions();
  else if (action === "clear") clearProgress();
  else if (action === "delete") deleteBank();
  else if (action === "export") exportBank();
  else if (action === "toggle-sidebar") toggleSidebar();
}

function onKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if ($("importDialog").open || $("apiDialog").open || $("examDialog")?.open) return;
  if (event.target.closest("textarea, input")) return;
  const question = currentQuestion();
  if (!question) return;
  const shown = displayOptions(question);
  if (/^[a-h]$/i.test(event.key)) {
    const option = shown.find((item) => item.letter === event.key.toUpperCase());
    if (option) {
      event.preventDefault();
      onPick(option.id);
    }
    return;
  }
  if (/^[1-9]$/.test(event.key)) {
    const option = shown[Number(event.key) - 1];
    if (option) {
      event.preventDefault();
      onPick(option.id);
    }
    return;
  }
  if (event.key === "Enter" && question.type === "multiple" && (examRunning() || !currentRecord(question))) {
    event.preventDefault();
    commit(state.pendingKeys.length ? state.pendingKeys : examPicks(question));
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    go(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    go(-1);
  }
}

function bind() {
  document.body.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  $("scrim").addEventListener("click", closeSidebar);
  $("fillSample").addEventListener("click", () => {
    $("pasteArea").value = TEXT_SAMPLE;
    $("importError").textContent = "";
  });
  $("chooseFile").addEventListener("click", () => $("fileInput").click());
  $("saveApi").addEventListener("click", saveApiFromForm);
  $("doExam").addEventListener("click", (event) => {
    event.preventDefault();
    startExamFromForm();
  });
  $("clearApi").addEventListener("click", () => {
    $("apiKeyInput").value = "";
    const settings = loadApiSettings();
    saveApiSettings({ ...settings, apiKey: "" });
    toast("已清除 API Key");
  });
  $("doImport").addEventListener("click", async () => {
    if (!confirmLeaveExam()) return;
    try {
      await importFileList([{ name: "粘贴题库.txt", text: async () => $("pasteArea").value }]);
      $("pasteArea").value = "";
      closeImport();
    } catch (err) {
      $("importError").textContent = err.message;
    }
  });
  $("fileInput").addEventListener("change", async () => {
    const files = [...$("fileInput").files];
    $("fileInput").value = "";
    if (!files.length) return;
    if (!confirmLeaveExam()) return;
    try {
      await importFileList(files);
      closeImport();
    } catch (err) {
      openImport();
      $("importError").textContent = err.message;
    }
  });
  window.addEventListener("dragenter", (event) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepth += 1;
    $("dropmask").classList.add("show");
  });
  window.addEventListener("dragover", (event) => {
    if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
  });
  window.addEventListener("dragleave", () => {
    dragDepth -= 1;
    if (dragDepth <= 0) {
      dragDepth = 0;
      $("dropmask").classList.remove("show");
    }
  });
  window.addEventListener("drop", async (event) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    dragDepth = 0;
    $("dropmask").classList.remove("show");
    const files = [...event.dataTransfer.files];
    if (!files.length) return;
    if (!confirmLeaveExam()) return;
    try {
      await importFileList(files);
      closeImport();
    } catch (err) {
      openImport();
      $("importError").textContent = err.message;
    }
  });
}

function isLocalServer() {
  return location.protocol !== "file:" && location.hostname === "127.0.0.1";
}

function isPagesDemo() {
  return /\.github\.io$/i.test(location.hostname);
}

function watchWindow() {
  if (!isLocalServer()) return;
  const ping = () => {
    fetch("/__alive", { method: "POST", cache: "no-store", keepalive: true }).catch(() => {});
  };
  ping();
  setInterval(ping, 1000);
  window.addEventListener("pagehide", ping);
}

function boot() {
  watchWindow();
  try {
    state = load();
    if (!state.initialized) seedSample();
    if (examActive() && state.exam.bankId) {
      const examBank = state.banks.find((item) => item.id === state.exam.bankId);
      if (examBank) {
        state.activeBankId = examBank.id;
        state.uiMode = "exam";
      } else state.exam = null;
    }
    bind();
    render({ toTop: true });
    startExamTimer();
  } catch (err) {
    $("stage").textContent = "题库打不开：" + err.message;
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") boot();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runTests() {
  const sample = parseImport(SAMPLE_JSON, "计算机基础.json");
  assert(sample[0].questions.length === 10, "示例应为 10 题");
  assert(sample[0].name === "计算机基础", "示例题库名称");
  assert(sample[0].questions[0].answer.join("") === "B", "第 1 题答案");
  assert(sample[0].questions[0].options[1].text === "TCP", "第 1 题选项");
  assert(sample[0].questions[3].type === "multiple" && sample[0].questions[3].answer.join("") === "ABD", "第 4 题多选");
  assert(sample[0].questions[9].answer.join("") === "AC", "第 10 题多选");

  const textPack = parseImport(TEXT_SAMPLE, "x.txt");
  assert(textPack[0].name === "常识小测", "文本题库标题");
  assert(textPack[0].questions.length === 2, "文本题数量");
  assert(textPack[0].questions[1].type === "multiple" && textPack[0].questions[1].answer.join("") === "ABD", "文本多选");

  const falseStem = parseImport("答案是什么？下面说法正确的是\nA. 对\nB. 错\n答案：A\n解析：第一行只是题干。", "t.txt")[0];
  assert(falseStem.questions.length === 1 && falseStem.questions[0].answer[0] === "A", "题干里的答案二字不能误判");
  assert(falseStem.questions[0].stem.includes("答案是什么"), "题干保留");

  const marked = `1. 一加一等于几？
A. 1
B. 2
【答案】B
【解析】一加一等于二。

2. 选两个偶数（多选）
A. 1
B. 2
C. 3
D. 4
答案：BD
解析：2 和 4 是偶数。`;
  const markedPack = parseImport(marked, "m.txt")[0];
  assert(markedPack.questions.length === 2, "编号题目数量");
  assert(markedPack.questions[0].answer.join("") === "B", "括号答案");
  assert(markedPack.questions[1].answer.join("") === "BD", "紧凑多选答案");

  const blankStem = `题干第一行

题干第二行
A. 1
B. 2
答案：A
解析：因为

所以这样。`;
  const blankPack = parseImport(blankStem, "b.txt")[0];
  assert(blankPack.questions.length === 1, "空行不应拆开同一题");
  assert(blankPack.questions[0].stem.includes("题干第一行") && blankPack.questions[0].stem.includes("题干第二行"), "多行题干");
  assert(blankPack.questions[0].explanation.includes("所以这样"), "解析续行");

  const csv = 'question,A,B,C,D,answer,explanation\n"1, 2, 3 里哪个是偶数？",1,2,3,4,B,只有 2\n下一题,甲,乙,丙,丁,A,选甲';
  const csvPack = parseImport(csv, "题.csv")[0];
  assert(csvPack.questions.length === 2, "CSV 题数");
  assert(csvPack.questions[0].stem.includes("1, 2, 3"), "CSV 引号");
  assert(csvPack.questions[0].answer.join("") === "B", "CSV 答案");
  assert(csvPack.name === "题", "CSV 用文件名");

  const objectOptions = JSON.stringify({
    name: "对象选项",
    questions: [{ question: "选乙", options: { B: "乙", A: "甲", C: "丙" }, answer: "乙", explanation: "按文字匹配" }],
  });
  const objectPack = parseImport(objectOptions, "o.json")[0];
  assert(objectPack.questions[0].answer.join("") === "B", "按选项文字识别答案");
  assert(objectPack.questions[0].options.map((option) => option.key).join("") === "ABC", "选项按字母排序");

  const mixed = JSON.stringify({
    name: "混合",
    questions: [
      { question: "只有题干" },
      { question: "完整", options: ["一", "二"], answer: "A", explanation: "选一" },
    ],
  });
  const mixedPack = parseImport(mixed, "mix.json")[0];
  assert(mixedPack.questions.length === 1 && mixedPack.warnings.length === 1, "残缺题目被跳过");

  const fields = JSON.stringify({ question: "选二", optionA: "一", optionB: "二", optionC: "三", answer: 2, explanation: "数字序号" });
  const fieldPack = parseImport(fields, "f.json")[0];
  assert(fieldPack.questions[0].answer.join("") === "B", "数字答案按选项顺序");

  const markdown = `# Java Quiz

## Easy
1. What is JVM?
A) Compile
B) Execute bytecode
C) Install JDK
D) Maven
**Answer: B**
2. Operator AND
A) and
B) &&
C) ||
D) \`!\`**Answer: B**

3. 选两个（多选）
A. 1
B. 2
C. 3
D. 4
**Answer: BD**`;
  const mdPack = parseImport(markdown, "java.md")[0];
  assert(mdPack.name === "Java Quiz", "Markdown 标题");
  assert(mdPack.questions.length === 3, "Markdown 题数");
  assert(mdPack.questions[0].answer.join("") === "B", "加粗 Answer");
  assert(mdPack.questions[0].stem === "What is JVM?", "Markdown 去掉编号");
  assert(mdPack.questions[1].answer.join("") === "B", "行内 Answer");
  assert(mdPack.questions[1].options[3].text.includes("!"), "行内答案剥离后选项仍在");
  assert(mdPack.questions[2].type === "multiple" && mdPack.questions[2].answer.join("") === "BD", "Markdown 多选");

  const inline = formatRich("shell command `echo $?` and `<tag>`");
  assert(inline.includes('class="icode"') && inline.includes("echo $?") && inline.includes("&lt;tag&gt;"), "行内代码");
  assert(!inline.includes("`"), "反引号不原样显示");
  const block = formatRich("Read syscall:\n    .data\n    buf: .space 4\n    li a0, 0\nWhich statement?");
  assert(block.includes('class="codeblock"') && block.includes("asm") && block.includes("tok-dir") && block.includes("tok-op") && block.includes("tok-reg"), "汇编代码块");
  assert(block.includes("Which statement?"), "代码块前后的题干保留");

  state = fresh();
  state.banks = [{ name: "计算机基础" }];
  assert(uniqueName("计算机基础") === "计算机基础 (2)", "重名题库加序号");

  const quiz = parseImport(SAMPLE_JSON, "计算机基础.json")[0].questions[0];
  state = fresh();
  state.banks = [{ id: "bank1", name: "t", questions: [quiz] }];
  state.activeBankId = "bank1";
  assert(displayOptions(quiz).map((item) => item.letter).join("") === "ABCD", "默认显示字母");
  assert(displayLetter(quiz, "B") === "B" && displayOptions(quiz)[1].text === "TCP", "未打乱时显示与原 key 一致");
  state.optionOrder = { bank1: { [quiz.id]: ["B", "A", "C", "D"] } };
  const shown = displayOptions(quiz);
  assert(shown[0].id === "B" && shown[0].letter === "A" && shown[0].text === "TCP", "打乱后身份不变、显示字母重排");
  assert(displayLetter(quiz, "B") === "A" && displayLetterText(quiz, ["B"]) === "A", "原 B 显示为 A");
  assert(sameAnswers(["B"], quiz.answer), "判分仍按原始 key");
  assert(quiz.options[1].key === "B" && quiz.answer.join("") === "B", "题库原数据不被改写");
  assert(optionsReferToLetters({
    stem: "哪项正确？",
    options: [{ key: "A", text: "both A and B" }, { key: "B", text: "只有 B" }],
  }), "互相引用的选项锁定");
  assert(!optionsReferToLetters(quiz), "普通题可以打乱选项");

  const explained = {
    id: "qexp",
    stem: "JVM?",
    options: [
      { key: "A", text: "Compile" },
      { key: "B", text: "Execute" },
      { key: "C", text: "Install" },
      { key: "D", text: "Maven" },
    ],
    answer: ["B"],
    explanation: "答案：B。JVM 执行字节码。\n\nA. 编译是 javac。\nB. 正确。执行字节码。\nC. 安装不是 JVM。\nD. Maven 不管。",
  };
  state.banks = [{ id: "bank1", name: "t", questions: [explained] }];
  state.activeBankId = "bank1";
  state.optionOrder = {};
  const parts = splitExplanation(explained.explanation);
  assert(parts.intro.includes("JVM 执行字节码"), "解析总述");
  assert(parts.byKey.B.includes("执行字节码") && parts.byKey.A.includes("javac"), "按原字母拆解析");
  state.optionOrder = { bank1: { qexp: ["B", "A", "C", "D"] } };
  assert(remapAnswerLetters(parts.intro, explained).includes("答案：A"), "总述答案字母跟随显示");
  assert(explanationView(explained).byKey.B.includes("执行字节码"), "说明仍挂在原选项身份上");
  assert(displayLetter(explained, "B") === "A", "原 B 现在显示为 A");
  assert(explained.explanation.includes("答案：B"), "解析原文不被改写");
  assert(chatCompletionsUrl("https://api.deepseek.com") === "https://api.deepseek.com/v1/chat/completions", "补全 v1 路径");
  assert(chatCompletionsUrl("https://api.openai.com/v1") === "https://api.openai.com/v1/chat/completions", "已有 v1 只补 completions");
  assert(chatCompletionsUrl("http://127.0.0.1:11434/v1/chat/completions") === "http://127.0.0.1:11434/v1/chat/completions", "完整地址不重复拼接");
  assert(unwrapModelText("```md\n解析：第一句\n```") === "第一句", "去掉模型围栏和解析前缀");

  const examQs = [
    { id: "q1", answer: ["B"], options: [{ key: "A", text: "a" }, { key: "B", text: "b" }] },
    { id: "q2", answer: ["A", "C"], options: [{ key: "A", text: "a" }, { key: "B", text: "b" }, { key: "C", text: "c" }] },
    { id: "q3", answer: ["D"], options: [{ key: "D", text: "d" }] },
  ];
  const graded = gradeExam({ questions: examQs }, ["q1", "q2", "q3"], { q1: ["B"], q2: ["A"] });
  assert(graded.correct === 1 && graded.wrong === 1 && graded.blank === 1 && graded.total === 3, "考试计分");
  assert(graded.records.q1.correct && !graded.records.q2.correct && !graded.records.q3.correct, "考试逐题对错");
  assert(formatRemain(0) === "00:00" && formatRemain(65000) === "01:05", "剩余时间格式");
  assert(formatRemain(3723000).includes("1:02"), "超过一小时");
  state = fresh();
  assert(state.uiMode === "practice" && isPracticeMode() && !isExamMode(), "默认刷题模式");
  state.uiMode = "exam";
  assert(isExamMode() && !isPracticeMode(), "可切换考试模式");
  console.log("parser tests ok");
}

if (typeof process !== "undefined" && process.argv && process.argv.includes("--test")) {
  try {
    runTests();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
