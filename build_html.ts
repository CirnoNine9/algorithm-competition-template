import { promises as fs } from 'node:fs';
import path from 'node:path';
import { renderMarkdownDocument } from '../../../../../projects/markdown2pdf/src/html';
import type { ExportConfig } from '../../../../../projects/markdown2pdf/src/config';

const workspaceRoot = path.resolve(process.argv[2] ?? process.cwd());
const outputRoot = path.resolve(
  process.argv[3] ?? path.join(workspaceRoot, 'output', 'html')
);
const templateRoot = path.join(workspaceRoot, '模板');
const markdown2pdfRoot = path.resolve(
  workspaceRoot,
  '../../../../../projects/markdown2pdf'
);

const categoryDirectories = [
  '01-数论',
  '02-计算几何',
  '03-数据结构',
  '04-图论与网络流',
  '05-多项式',
  '06-Python',
] as const;

const categoryDescriptions: Record<string, string> = {
  '01-数论': '组合数、同余、离散对数、筛法与质因数分解',
  '02-计算几何': '点、直线、多边形、凸包、闵可夫斯基和与半平面交',
  '03-数据结构': '树状数组、平衡树与动态树',
  '04-图论与网络流': 'Dinic、HLPP 与网络流实现',
  '05-多项式': '变换、形式幂级数、求值与线性递推',
  '06-Python': '比赛常用标准库接口速查',
};

type PageKind = 'template-index' | 'category' | 'document';

interface CodeFence {
  language: string;
  code: string;
}

interface TemplateDocument {
  sourceRelative: string;
  outputRelative: string;
  title: string;
  categoryDirectory?: string;
  categoryTitle?: string;
  markdown: string;
  kind: PageKind;
  purpose: string;
  complexity: string;
}

interface CategoryRecord {
  directory: string;
  title: string;
  index: TemplateDocument;
  documents: TemplateDocument[];
}

const renderConfig: ExportConfig = {
  theme: 'academic',
  codeTheme: 'github-dark-dimmed',
  pageFormat: 'A4',
  margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
  fontFamily: '"Microsoft YaHei", "Segoe UI", Arial, sans-serif',
  beamerFooterText: '',
};

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '&#10;');
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\\([_{}])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(markdown: string, fallback: string): string {
  const title = markdown.match(/^#\s+([^\r\n]+)/m)?.[1];
  return stripInlineMarkdown(title ?? fallback);
}

function extractCallout(markdown: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(new RegExp(`^>\\s*\\*\\*${escaped}：\\*\\*\\s*([^\\r\\n]+)`, 'm'));
  return stripInlineMarkdown(match?.[1] ?? '');
}

function extractCodeFences(markdown: string): CodeFence[] {
  return [...markdown.matchAll(/^```([^\r\n]*)\r?\n([\s\S]*?)^```\s*$/gm)].map(
    (match) => ({
      language: match[1].trim().split(/\s+/)[0] || 'text',
      code: match[2].replace(/\r\n/g, '\n'),
    })
  );
}

function sourceToOutput(sourceRelative: string): string {
  const normalized = toPosix(sourceRelative);
  if (normalized === 'README.md') return 'index.html';
  if (normalized.endsWith('/README.md')) {
    return normalized.replace(/\/README\.md$/i, '/index.html');
  }
  if (normalized.toLowerCase().endsWith('.md')) {
    return normalized.replace(/\.md$/i, '.html');
  }
  throw new Error(`Unsupported source path: ${sourceRelative}`);
}

function relativeHref(fromOutput: string, toOutput: string): string {
  const fromDirectory = path.dirname(fromOutput.replace(/\//g, path.sep));
  let result = toPosix(path.relative(fromDirectory, toOutput.replace(/\//g, path.sep)));
  if (!result) result = path.basename(toOutput);
  if (!result.startsWith('.')) result = `./${result}`;
  return result;
}

function outputRootHref(fromOutput: string): string {
  const fromDirectory = path.dirname(fromOutput.replace(/\//g, path.sep));
  let result = toPosix(path.relative(fromDirectory, '.'));
  if (!result) return './';
  if (!result.endsWith('/')) result += '/';
  return result;
}

function normalizeResolvedSource(fromSource: string, target: string): string {
  const fromDirectory = path.posix.dirname(toPosix(fromSource));
  return path.posix.normalize(path.posix.join(fromDirectory, target));
}

function rewriteMarkdownLinks(
  markdown: string,
  sourceRelative: string,
  outputRelative: string,
  sourceOutputMap: Map<string, string>
): string {
  const parts = markdown.split(/(\r?\n)/);
  let fence: { marker: string; length: number } | undefined;

  for (let index = 0; index < parts.length; index += 2) {
    const line = parts[index];
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);

    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.marker &&
        fenceMatch[1].length >= fence.length &&
        fenceMatch[2].trim() === ''
      ) {
        fence = undefined;
      }
      continue;
    }

    if (fenceMatch) {
      fence = { marker: fenceMatch[1][0], length: fenceMatch[1].length };
      continue;
    }

    parts[index] = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label: string, rawTarget: string) => {
      const target = rawTarget.trim();
      if (/^(https?:|mailto:|#)/i.test(target)) return match;

      const [filePart, fragment] = target.split('#', 2);
      const decodedFile = decodeURIComponent(filePart);
      const resolvedSource = normalizeResolvedSource(sourceRelative, decodedFile);
      const mappedOutput = sourceOutputMap.get(resolvedSource);

      if (!mappedOutput) return label;

      const href = `${relativeHref(outputRelative, mappedOutput)}${fragment ? `#${fragment}` : ''}`;
      return `[${label}](${href})`;
    });
  }

  return parts.join('');
}

function extractRenderedCodeBlocks(html: string): string[] {
  return [...html.matchAll(/<pre\b[^>]*class="[^"]*shiki[^"]*"[^>]*>[\s\S]*?<\/pre>/gi)]
    .map((match) => match[0]);
}

function markCodeTheme(pre: string, theme: 'light' | 'dark'): string {
  return pre.replace('<pre', `<pre data-code-theme="${theme}"`);
}

function wrapRenderedCodeBlocks(html: string, lightHtml: string, fences: CodeFence[]): string {
  const lightBlocks = extractRenderedCodeBlocks(lightHtml);
  if (lightBlocks.length !== fences.length) {
    throw new Error(`Rendered ${lightBlocks.length} light code blocks, but the Markdown source contains ${fences.length}.`);
  }
  let index = 0;
  const wrapped = html.replace(/<pre\b[^>]*class="[^"]*shiki[^"]*"[^>]*>[\s\S]*?<\/pre>/gi, (pre) => {
    const fence = fences[index];
    if (!fence) throw new Error('Rendered more code blocks than the Markdown source contains.');
    const lightPre = lightBlocks[index++];
    const label = fence.language === 'cpp' ? 'C++' : fence.language === 'py' ? 'Python' : fence.language;
    return [
      '<div class="code-block">',
      '  <div class="code-toolbar">',
      `    <span class="code-language">${escapeHtml(label)}</span>`,
      '    <button class="copy-code-button" type="button">复制代码</button>',
      '  </div>',
      markCodeTheme(lightPre, 'light'),
      markCodeTheme(pre, 'dark'),
      `  <textarea class="code-source" tabindex="-1" aria-hidden="true">${escapeHtml(fence.code)}</textarea>`,
      '</div>',
    ].join('\n');
  });

  if (index !== fences.length) {
    throw new Error(`Rendered ${index} code blocks, but the Markdown source contains ${fences.length}.`);
  }
  return wrapped;
}

async function renderMarkdownBody(
  document: TemplateDocument,
  sourceOutputMap: Map<string, string>
): Promise<string> {
  const rewritten = rewriteMarkdownLinks(
    document.markdown,
    document.sourceRelative,
    document.outputRelative,
    sourceOutputMap
  );
  const rendered = await renderMarkdownDocument({
    sourcePath: path.join(workspaceRoot, document.sourceRelative.replace(/\//g, path.sep)),
    content: rewritten,
    config: renderConfig,
    includeToc: false,
    autoTypesetMath: false,
    mathJaxScriptSource: 'mathjax-placeholder.js',
  });
  const body = rendered.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (body === undefined) throw new Error(`Unable to extract rendered body for ${document.sourceRelative}`);
  const fences = extractCodeFences(rewritten);
  if (!fences.length) return body.trim();

  const lightRendered = await renderMarkdownDocument({
    sourcePath: path.join(workspaceRoot, document.sourceRelative.replace(/\//g, path.sep)),
    content: rewritten,
    config: { ...renderConfig, codeTheme: 'github-light' },
    includeToc: false,
    autoTypesetMath: false,
    mathJaxScriptSource: 'mathjax-placeholder.js',
  });
  const lightBody = lightRendered.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  if (lightBody === undefined) throw new Error(`Unable to extract light rendered body for ${document.sourceRelative}`);
  return wrapRenderedCodeBlocks(body.trim(), lightBody.trim(), fences);
}

async function loadDocuments(): Promise<{
  templateIndex: TemplateDocument;
  categories: CategoryRecord[];
  documents: TemplateDocument[];
}> {
  const templateIndexMarkdown = await fs.readFile(path.join(templateRoot, 'README.md'), 'utf8');
  const templateIndex: TemplateDocument = {
    sourceRelative: '模板/README.md',
    outputRelative: '模板/index.html',
    title: extractTitle(templateIndexMarkdown, '算法竞赛模板总目录'),
    markdown: templateIndexMarkdown,
    kind: 'template-index',
    purpose: '按分类浏览全部算法竞赛模板',
    complexity: '',
  };

  const categories: CategoryRecord[] = [];
  const documents: TemplateDocument[] = [];

  for (const directory of categoryDirectories) {
    const absoluteDirectory = path.join(templateRoot, directory);
    const indexMarkdown = await fs.readFile(path.join(absoluteDirectory, 'README.md'), 'utf8');
    const title = extractTitle(indexMarkdown, directory.replace(/^\d+-/, ''));
    const index: TemplateDocument = {
      sourceRelative: `模板/${directory}/README.md`,
      outputRelative: `模板/${directory}/index.html`,
      title,
      categoryDirectory: directory,
      categoryTitle: title,
      markdown: indexMarkdown,
      kind: 'category',
      purpose: categoryDescriptions[directory],
      complexity: '',
    };
    const names = (await fs.readdir(absoluteDirectory))
      .filter((name) => name.toLowerCase().endsWith('.md') && name !== 'README.md')
      .sort((left, right) => left.localeCompare(right, 'zh-CN', { numeric: true }));
    const categoryDocuments: TemplateDocument[] = [];

    for (const name of names) {
      const markdown = await fs.readFile(path.join(absoluteDirectory, name), 'utf8');
      const document: TemplateDocument = {
        sourceRelative: `模板/${directory}/${name}`,
        outputRelative: `模板/${directory}/${name.replace(/\.md$/i, '.html')}`,
        title: extractTitle(markdown, path.parse(name).name),
        categoryDirectory: directory,
        categoryTitle: title,
        markdown,
        kind: 'document',
        purpose: extractCallout(markdown, '用途'),
        complexity: extractCallout(markdown, '复杂度'),
      };
      categoryDocuments.push(document);
      documents.push(document);
    }
    categories.push({ directory, title, index, documents: categoryDocuments });
  }

  return { templateIndex, categories, documents };
}

function indentCode(code: string, spaces = 4): string {
  const prefix = ' '.repeat(spaces);
  return code
    .trim()
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : ''))
    .join('\n');
}

function requireFence(markdownBySource: Map<string, string>, source: string, index = 0): string {
  const markdown = markdownBySource.get(source);
  if (!markdown) throw new Error(`Poly bundle source is missing: ${source}`);
  const fences = extractCodeFences(markdown);
  const fence = fences[index];
  if (!fence) throw new Error(`Poly bundle code block ${index + 1} is missing: ${source}`);
  return fence.code.trim();
}

function requireReplacement(code: string, search: string | RegExp, replacement: string, label: string): string {
  const updated = code.replace(search, replacement);
  if (updated === code) throw new Error(`Poly bundle transform did not match: ${label}`);
  return updated;
}

function buildPolyBundle(allDocuments: TemplateDocument[]): string {
  const markdownBySource = new Map(allDocuments.map((document) => [document.sourceRelative, document.markdown]));
  const combinationSource = '模板/01-数论/01-组合数与O1逆元.md';
  const cipollaSource = '模板/01-数论/06-二次剩余-Cipolla.md';

  let combination = requireFence(markdownBySource, combinationSource);
  combination = requireReplacement(
    combination,
    /^const int mod = 998244353, N = 1e6;\s*/,
    '',
    'remove duplicate mod and N'
  );

  let cipolla = requireFence(markdownBySource, cipollaSource);
  cipolla = requireReplacement(cipolla, /^mt19937_64 rng\(time\(0\)\);\s*/, '', 'remove duplicate rng');
  cipolla = requireReplacement(cipolla, /^int mod;\s*/m, '', 'remove duplicate mod declaration');

  const densePowerSource = '模板/05-多项式/16-多项式快速幂.md';
  const densePower = requireFence(markdownBySource, densePowerSource, 0);
  const sparseCore = requireFence(markdownBySource, densePowerSource, 1);
  let sparsePower = requireReplacement(
    densePower,
    'vector<int> qpow(vector<int> f, const string &k)',
    'vector<int> qpow2(vector<int> f, const string &k)',
    'rename sparse polynomial power'
  );
  sparsePower = requireReplacement(
    sparsePower,
    /    f = ln\(f\);\s*for \(auto &x : f\) x = x\*km%mod;\s*f = exp\(f\);/,
    sparseCore.split('\n').map((line) => `    ${line}`).join('\n'),
    'replace dense ln/exp with sparse recurrence'
  );

  const sources: Array<[string, number?]> = [
    ['模板/05-多项式/04-NTT-卡常版.md'],
    ['模板/05-多项式/08-任意因子长度DFT.md'],
    ['模板/05-多项式/12-多项式加法减法.md'],
    ['模板/05-多项式/10-多项式乘法逆.md'],
    ['模板/05-多项式/11-稀疏多项式除法.md'],
    ['模板/05-多项式/13-多项式整除与取模.md'],
    ['模板/05-多项式/19-分式第N项.md'],
    ['模板/05-多项式/14-多项式对数与指数.md'],
  ];
  const laterSources: Array<[string, number?]> = [
    ['模板/05-多项式/15-多项式平方根.md'],
    ['模板/05-多项式/21-点值平移.md'],
    ['模板/05-多项式/06-二元NTT.md'],
    ['模板/05-多项式/07-二元多项式卷积.md'],
    ['模板/05-多项式/24-Power-Projection-卡常版.md'],
    ['模板/05-多项式/25-最短递推式.md', 0],
    ['模板/05-多项式/25-最短递推式.md', 1],
  ];

  const parts = [
    combination,
    'const int G = 3, Gi = inv(G);',
    ...sources.map(([source, index]) => requireFence(markdownBySource, source, index ?? 0)),
    cipolla,
    requireFence(markdownBySource, '模板/05-多项式/15-多项式平方根.md'),
    densePower,
    sparsePower,
    ...laterSources.slice(1).map(([source, index]) => requireFence(markdownBySource, source, index ?? 0)),
  ];

  const bundle = [
    'mt19937_64 rng(time(0));',
    'const int mod = 998244353, N = 1e6;',
    '',
    'namespace Poly {',
    parts.map((part) => indentCode(part)).join('\n\n'),
    '}',
    'using namespace Poly;',
    '',
  ].join('\n');

  const requiredSymbols = [
    'namespace Poly',
    'void ntt(',
    'void dft(',
    'vector<int> inv(',
    'vector<int> qpow2(',
    'int divAt(',
    'vector<int> powerProjection(',
    'vector<int> berlekampMassey(',
    'vector<int> berlekampMasseyFast(',
    'using namespace Poly;',
  ];
  for (const symbol of requiredSymbols) {
    if (!bundle.includes(symbol)) throw new Error(`Poly bundle is missing required symbol: ${symbol}`);
  }
  if (/\bvoid solve\s*\(/.test(bundle) || /#include\b/.test(bundle) || /\bmain\s*\(/.test(bundle)) {
    throw new Error('Poly bundle unexpectedly contains include, solve, or main.');
  }
  return bundle;
}

function renderHeader(outputRelative: string): string {
  const home = relativeHref(outputRelative, 'index.html');
  const templateIndex = relativeHref(outputRelative, '模板/index.html');
  return [
    '<header class="site-header">',
    '  <div class="site-header-inner">',
    `    <a class="site-brand" href="${escapeAttribute(home)}"><span>ACM / ICPC</span><strong>算法模板</strong></a>`,
    '    <nav class="header-nav" aria-label="主导航">',
    `      <a href="${escapeAttribute(templateIndex)}">完整目录</a>`,
    '    </nav>',
    '    <div class="header-actions">',
    '      <button class="header-button search-open" type="button" aria-haspopup="dialog">搜索 <kbd>/</kbd></button>',
    '      <button class="header-button theme-toggle" type="button" aria-label="切换配色模式">亮色</button>',
    '      <button class="header-button nav-toggle" type="button" aria-expanded="false">目录</button>',
    '    </div>',
    '  </div>',
    '</header>',
  ].join('\n');
}

function renderSidebar(
  outputRelative: string,
  categories: CategoryRecord[],
  activeOutput?: string
): string {
  const groups = categories.map((category, index) => {
    const isCurrent = activeOutput?.includes(`/模板/${category.directory}/`) || activeOutput?.startsWith(`模板/${category.directory}/`);
    const listId = `sidebar-category-${index + 1}`;
    const items = category.documents.map((document) => {
      const active = document.outputRelative === activeOutput ? ' aria-current="page" class="active"' : '';
      return `<li><a${active} href="${escapeAttribute(relativeHref(outputRelative, document.outputRelative))}">${escapeHtml(document.title)}</a></li>`;
    }).join('\n');
    return [
      '<section class="sidebar-group">',
      '  <div class="sidebar-group-header">',
      `    <a class="sidebar-category-link" href="${escapeAttribute(relativeHref(outputRelative, category.index.outputRelative))}"${category.index.outputRelative === activeOutput ? ' aria-current="page"' : ''}><span>${escapeHtml(category.title)}</span><small>${category.documents.length}</small></a>`,
      `    <button class="sidebar-group-toggle" type="button" aria-expanded="${isCurrent ? 'true' : 'false'}" aria-controls="${listId}">${isCurrent ? '收起' : '展开'}</button>`,
      '  </div>',
      `  <ol id="${listId}"${isCurrent ? '' : ' hidden'}>${items}</ol>`,
      '</section>',
    ].join('\n');
  }).join('\n');

  return [
    '<aside class="site-sidebar" id="site-sidebar" aria-label="模板目录">',
    '  <div class="sidebar-scroll">',
    `    <a class="sidebar-index" href="${escapeAttribute(relativeHref(outputRelative, '模板/index.html'))}">全部分类</a>`,
    groups,
    '  </div>',
    '</aside>',
    '<button class="sidebar-backdrop" type="button" aria-label="关闭目录"></button>',
  ].join('\n');
}

function renderSearchDialog(): string {
  return [
    '<dialog class="search-dialog">',
    '  <form method="dialog" class="search-panel">',
    '    <div class="search-field">',
    '      <label for="site-search">搜索模板</label>',
    '      <button class="search-close" value="close" aria-label="关闭搜索" type="submit">关闭</button>',
    '      <input id="site-search" type="search" autocomplete="off" placeholder="输入算法名称、用途或复杂度">',
    '    </div>',
    '    <div class="search-results" aria-live="polite">',
    '      <p class="search-empty">输入关键词开始搜索。</p>',
    '    </div>',
    '  </form>',
    '</dialog>',
  ].join('\n');
}

function renderBreadcrumbs(document: TemplateDocument): string {
  const items = [
    `<a href="${escapeAttribute(relativeHref(document.outputRelative, 'index.html'))}">主页</a>`,
    `<a href="${escapeAttribute(relativeHref(document.outputRelative, '模板/index.html'))}">模板</a>`,
  ];
  if (document.categoryDirectory && document.kind === 'document') {
    items.push(
      `<a href="${escapeAttribute(relativeHref(document.outputRelative, `模板/${document.categoryDirectory}/index.html`))}">${escapeHtml(document.categoryTitle ?? '')}</a>`
    );
  }
  items.push(`<span aria-current="page">${escapeHtml(document.title)}</span>`);
  return `<nav class="breadcrumbs" aria-label="面包屑">${items.join('<span aria-hidden="true">/</span>')}</nav>`;
}

function renderPager(document: TemplateDocument, orderedDocuments: TemplateDocument[]): string {
  if (document.kind !== 'document') return '';
  const index = orderedDocuments.findIndex((item) => item.outputRelative === document.outputRelative);
  if (index < 0) return '';
  const previous = orderedDocuments[index - 1];
  const next = orderedDocuments[index + 1];
  return [
    '<nav class="document-pager" aria-label="相邻模板">',
    previous
      ? `<a class="pager-previous" href="${escapeAttribute(relativeHref(document.outputRelative, previous.outputRelative))}"><span>上一篇</span><strong>${escapeHtml(previous.title)}</strong></a>`
      : '<span></span>',
    next
      ? `<a class="pager-next" href="${escapeAttribute(relativeHref(document.outputRelative, next.outputRelative))}"><span>下一篇</span><strong>${escapeHtml(next.title)}</strong></a>`
      : '<span></span>',
    '</nav>',
  ].join('\n');
}

function renderPolyBundlePanel(bundle: string): string {
  const lineCount = bundle.trimEnd().split('\n').length;
  return [
    '<section class="poly-bundle-panel" aria-labelledby="poly-bundle-title">',
    '  <div>',
    '    <h2 id="poly-bundle-title">Poly 一键封装</h2>',
    `    <p>按依赖顺序组合当前模板中的可复用实现，共 ${lineCount} 行。适合直接粘贴到比赛骨架之后。</p>`,
    '    <p class="poly-bundle-status" aria-live="polite">使用卡常 NTT 与当前已修订实现。</p>',
    '  </div>',
    '  <button class="primary-button copy-poly-button" type="button">复制 Poly 封装</button>',
    `  <textarea class="poly-bundle-source" tabindex="-1" aria-hidden="true">${escapeHtml(bundle)}</textarea>`,
    '</section>',
  ].join('\n');
}

function renderSiteShell(input: {
  title: string;
  outputRelative: string;
  content: string;
  categories: CategoryRecord[];
  activeOutput?: string;
  description: string;
  home?: boolean;
}): string {
  const rootHref = outputRootHref(input.outputRelative);
  const asset = (name: string) => `${rootHref}assets/${name}`;
  const layout = input.home
    ? `<main class="home-main">${input.content}</main>`
    : [
        '<div class="site-layout">',
        renderSidebar(input.outputRelative, input.categories, input.activeOutput),
        '  <main class="content-main">',
        input.content,
        '    <footer class="site-footer"><span>CirnoNine</span><span>面向 ICPC、CCPC 与日常训练</span></footer>',
        '  </main>',
        '</div>',
      ].join('\n');

  const html = [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <meta name="color-scheme" content="light dark">',
    `  <meta name="description" content="${escapeAttribute(input.description)}">`,
    `  <title>${escapeHtml(input.title)} | 算法竞赛模板</title>`,
    '  <script>(()=>{let t;try{t=localStorage.getItem("algorithm-template-theme")}catch{}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t})();</script>',
    `  <link rel="stylesheet" href="${escapeAttribute(asset('site.css'))}">`,
    '  <script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]],displayMath:[["\\\\[","\\\\]"]],processEscapes:true,packages:{"[+]":["ams","mathtools"]}},svg:{fontCache:"none"},startup:{typeset:true}};</script>',
    `  <script defer src="${escapeAttribute(asset('mathjax.js'))}"></script>`,
    `  <script defer src="${escapeAttribute(asset('search-index.js'))}"></script>`,
    `  <script defer src="${escapeAttribute(asset('site.js'))}"></script>`,
    '</head>',
    `<body data-root="${escapeAttribute(rootHref)}"${input.home ? ' class="home-page"' : ''}>`,
    renderHeader(input.outputRelative),
    layout,
    renderSearchDialog(),
    '</body>',
    '</html>',
  ].join('\n');

  return html.replace(/[—–]/g, '-');
}

function renderHomepage(
  categories: CategoryRecord[],
  codePreview: string,
  outputRelative = 'index.html'
): string {
  const categoryLinks = categories.map((category, index) => [
    `<a class="home-category home-category-${index + 1}" href="${escapeAttribute(relativeHref(outputRelative, category.index.outputRelative))}">`,
    `  <span>${String(index + 1).padStart(2, '0')}</span>`,
    `  <strong>${escapeHtml(category.title)}</strong>`,
    `  <p>${escapeHtml(categoryDescriptions[category.directory])}</p>`,
    `  <small>${category.documents.length} 份模板</small>`,
    '</a>',
  ].join('\n')).join('\n');
  const pdfHref = '../pdf/算法竞赛模板-打印版.pdf';

  return [
    '<section class="home-hero">',
    '  <div class="home-hero-copy">',
    '    <h1><span>比赛模板，</span><span>随查随抄。</span></h1>',
    '    <p>54 份模板，离线检索、公式速查、代码一键复制。</p>',
    '    <div class="hero-actions">',
    `      <a class="primary-button" href="${escapeAttribute(relativeHref(outputRelative, '模板/index.html'))}">浏览完整目录</a>`,
    `      <a class="secondary-button" href="${escapeAttribute(pdfHref)}">打开打印版</a>`,
    '    </div>',
    '  </div>',
    '  <div class="home-code-preview" aria-label="org.cpp 比赛骨架代码预览">',
    codePreview,
    '  </div>',
    '</section>',
    '<section class="home-stats" aria-label="模板统计">',
    '  <div><strong>54</strong><span>独立模板</span></div>',
    '  <div><strong>6</strong><span>主题分类</span></div>',
    '  <div><strong>2</strong><span>离线产物</span></div>',
    '  <p>HTML 负责查找与复制，PDF 负责打印与赛场翻阅。</p>',
    '</section>',
    '<section class="home-categories">',
    '  <div class="home-section-heading">',
    '    <h2>从问题类型进入</h2>',
    '    <p>文件编号同时表示推荐阅读与打印顺序。</p>',
    '  </div>',
    `  <div class="home-category-grid">${categoryLinks}</div>`,
    '</section>',
    '<section class="home-quick-links">',
    '  <h2>常用入口</h2>',
    `  <a href="${escapeAttribute(relativeHref(outputRelative, '模板/05-多项式/index.html'))}"><strong>Poly 一键封装</strong><span>在多项式目录直接复制完整命名空间</span></a>`,
    `  <a href="${escapeAttribute(pdfHref)}"><strong>A4 打印版</strong><span>带目录、页码和适合纸张阅读的排版</span></a>`,
    '</section>',
    '<footer class="home-footer"><span>CirnoNine</span><span>Algorithm Competition Notebook</span></footer>',
  ].join('\n');
}

async function writeFile(relativePath: string, content: string | Buffer): Promise<void> {
  const target = path.join(outputRoot, relativePath.replace(/\//g, path.sep));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

async function main(): Promise<void> {
  const resolvedOutput = path.resolve(outputRoot);
  const resolvedWorkspace = path.resolve(workspaceRoot);
  if (!resolvedOutput.startsWith(`${resolvedWorkspace}${path.sep}`)) {
    throw new Error(`HTML output must stay inside the workspace: ${resolvedOutput}`);
  }

  const { templateIndex, categories, documents } = await loadDocuments();
  if (documents.length !== 54) throw new Error(`Expected 54 template documents, found ${documents.length}.`);
  const allRenderable = [templateIndex, ...categories.map((category) => category.index), ...documents];
  const sourceOutputMap = new Map(allRenderable.map((document) => [document.sourceRelative, document.outputRelative]));
  const polyBundle = buildPolyBundle(allRenderable);

  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(path.join(outputRoot, 'assets'), { recursive: true });
  await fs.copyFile(path.join(workspaceRoot, '网页.css'), path.join(outputRoot, 'assets', 'site.css'));
  await fs.copyFile(path.join(workspaceRoot, '网页.js'), path.join(outputRoot, 'assets', 'site.js'));
  await fs.copyFile(
    path.join(markdown2pdfRoot, 'node_modules', 'mathjax-full', 'es5', 'tex-svg-full.js'),
    path.join(outputRoot, 'assets', 'mathjax.js')
  );
  await writeFile('assets/poly-bundle.cpp', polyBundle);

  const searchIndex = documents.map((document) => ({
    title: document.title,
    category: document.categoryTitle,
    purpose: document.purpose,
    complexity: document.complexity,
    path: document.outputRelative,
  }));
  await writeFile(
    'assets/search-index.js',
    `window.SEARCH_INDEX=${JSON.stringify(searchIndex)
      .replace(/[—–]/g, '-')
      .replace(/</g, '\\u003c')};\n`
  );

  for (const document of allRenderable) {
    let renderedBody = await renderMarkdownBody(document, sourceOutputMap);
    if (document.kind === 'category' && document.categoryDirectory === '05-多项式') {
      renderedBody = `${renderPolyBundlePanel(polyBundle)}\n${renderedBody}`;
    }
    const pageContent = [
      renderBreadcrumbs(document),
      `<article class="markdown-body">${renderedBody}</article>`,
      renderPager(document, documents),
    ].join('\n');
    const page = renderSiteShell({
      title: document.title,
      outputRelative: document.outputRelative,
      content: pageContent,
      categories,
      activeOutput: document.outputRelative,
      description: document.purpose || `${document.title}算法竞赛模板`,
    });
    await writeFile(document.outputRelative, page);
  }

  const org = (await fs.readFile(path.join(workspaceRoot, 'org.cpp'), 'utf8')).trimEnd();
  const previewDocument: TemplateDocument = {
    sourceRelative: 'org.cpp',
    outputRelative: 'index.html',
    title: 'org.cpp',
    markdown: `\`\`\`cpp\n${org}\n\`\`\``,
    kind: 'document',
    purpose: '比赛基础骨架',
    complexity: '',
  };
  const preview = await renderMarkdownBody(previewDocument, sourceOutputMap);
  const homepage = renderSiteShell({
    title: '主页',
    outputRelative: 'index.html',
    content: renderHomepage(categories, preview),
    categories,
    description: '面向 ICPC、CCPC 与日常训练的中文算法竞赛模板，支持离线检索与代码复制。',
    home: true,
  });
  await writeFile('index.html', homepage);

  const htmlFiles = (await fs.readdir(outputRoot, { recursive: true }))
    .filter((name) => typeof name === 'string' && name.toLowerCase().endsWith('.html'));
  if (htmlFiles.length !== 62) {
    throw new Error(`Expected 62 HTML pages, generated ${htmlFiles.length}.`);
  }

  process.stdout.write(JSON.stringify({
    outputRoot,
    pages: htmlFiles.length,
    sourceDocuments: documents.length,
    polyBundleLines: polyBundle.trimEnd().split('\n').length,
  }, null, 2));
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
