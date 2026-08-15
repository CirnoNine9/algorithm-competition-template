import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exportMarkdownToPdf } from '../../../../../projects/markdown2pdf/src/pdf';
import type { ExportConfig } from '../../../../../projects/markdown2pdf/src/config';

const workspaceRoot = path.resolve(process.argv[2] ?? process.cwd());
const outputPath = path.resolve(
  process.argv[3] ?? path.join(workspaceRoot, 'output', 'pdf', '算法竞赛模板-打印版.pdf')
);

const categories = [
  '01-数论',
  '02-计算几何',
  '03-数据结构',
  '04-图论与网络流',
  '05-多项式',
  '06-Python',
];

const printPageNumbers = {
  categories: {
    '01-数论': 4,
    '02-计算几何': 24,
    '03-数据结构': 30,
    '04-图论与网络流': 41,
    '05-多项式': 47,
    '06-Python': 83,
  } as Record<string, number>,
  documents: {
    '01-数论/01-组合数与O1逆元.md': 5,
    '01-数论/02-Barrett约简.md': 7,
    '01-数论/03-值域预处理GCD.md': 8,
    '01-数论/04-EXGCD与EXCRT.md': 10,
    '01-数论/05-Pohlig-Hellman.md': 11,
    '01-数论/06-二次剩余-Cipolla.md': 12,
    '01-数论/07-常用狄利克雷卷积等式.md': 13,
    '01-数论/08-杜教筛.md': 14,
    '01-数论/09-Meissel-Lehmer质数计数.md': 16,
    '01-数论/10-Pollard-Rho质因数分解.md': 18,
    '01-数论/11-Min25筛.md': 20,
    '01-数论/12-类欧几里得算法.md': 22,
    '01-数论/13-万能欧几里得算法.md': 23,
    '02-计算几何/01-点与凸包.md': 25,
    '02-计算几何/02-直线.md': 27,
    '02-计算几何/03-半平面交.md': 29,
    '03-数据结构/01-树状数组.md': 31,
    '03-数据结构/02-线段树-区间取min.md': 32,
    '03-数据结构/03-Treap.md': 34,
    '03-数据结构/04-pb_ds平衡树.md': 37,
    '03-数据结构/05-Link-Cut-Tree.md': 38,
    '04-图论与网络流/01-Dinic最大流.md': 42,
    '04-图论与网络流/02-HLPP最大流.md': 44,
    '05-多项式/01-拉格朗日插值.md': 48,
    '05-多项式/02-FFT.md': 49,
    '05-多项式/03-NTT-基础版.md': 50,
    '05-多项式/04-NTT-卡常版.md': 51,
    '05-多项式/05-MTT任意模卷积.md': 54,
    '05-多项式/06-二元NTT.md': 55,
    '05-多项式/07-二元多项式卷积.md': 56,
    '05-多项式/08-任意因子长度DFT.md': 57,
    '05-多项式/09-FWT.md': 59,
    '05-多项式/10-多项式乘法逆.md': 61,
    '05-多项式/11-稀疏多项式除法.md': 62,
    '05-多项式/12-多项式加法减法.md': 63,
    '05-多项式/13-多项式整除与取模.md': 64,
    '05-多项式/14-多项式对数与指数.md': 65,
    '05-多项式/15-多项式平方根.md': 67,
    '05-多项式/16-多项式快速幂.md': 68,
    '05-多项式/17-拉格朗日反演.md': 69,
    '05-多项式/18-单位根反演.md': 70,
    '05-多项式/19-分式第N项.md': 71,
    '05-多项式/20-多点求值.md': 72,
    '05-多项式/21-点值平移.md': 74,
    '05-多项式/22-快速阶乘.md': 75,
    '05-多项式/23-Power-Projection-基础版.md': 76,
    '05-多项式/24-Power-Projection-卡常版.md': 77,
    '05-多项式/25-最短递推式.md': 80,
    '05-多项式/26-常系数齐次线性递推.md': 82,
    '06-Python/01-datetime库.md': 84,
    '06-Python/02-Fraction库.md': 86,
    '06-Python/03-math库常用函数.md': 88,
  } as Record<string, number>,
};

function stripLocalLinks(markdown: string): string {
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

    parts[index] = line.replace(
      /\[([^\]]+)\]\((?!https?:\/\/|mailto:|#)[^)]+\)/g,
      '$1'
    );
  }

  return parts.join('');
}

function removeFirstHeading(markdown: string): string {
  return markdown.replace(/^#\s+[^\r\n]+\r?\n?/, '').trim();
}

function plainHeading(markdownHeading: string): string {
  return markdownHeading
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\\([_{}])/g, '$1')
    .trim();
}

function numericPrefix(value: string): string {
  return value.match(/^(\d+)/)?.[1] ?? value.replace(/[^a-zA-Z0-9]+/g, '-');
}

function categoryAnchor(category: string): string {
  return `toc-category-${numericPrefix(category)}`;
}

function documentAnchor(category: string, name: string): string {
  return `toc-document-${numericPrefix(category)}-${numericPrefix(name)}`;
}

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtmlText(value).replace(/"/g, '&quot;');
}

function renderHeadingInline(markdown: string): string {
  return markdown
    .split(/(`[^`]*`|\$[^$]*\$)/g)
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return `<code>${escapeHtmlText(part.slice(1, -1))}</code>`;
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return `<span class="math-inline" data-math-source="${escapeHtmlAttribute(math)}">\\(${escapeHtmlText(math)}\\)</span>`;
      }
      return escapeHtmlText(part);
    })
    .join('');
}

function formatLeafDocument(markdown: string, anchorId: string): string {
  let firstHeading = true;
  return markdown.replace(
    /^(#{1,5})\s+([^\r\n]+)$/gm,
    (_match, hashes: string, title: string) => {
      if (firstHeading) {
        firstHeading = false;
        return `<h2 id="${anchorId}">${renderHeadingInline(title)}</h2>`;
      }
      return `${'#'.repeat(Math.min(6, hashes.length + 2))} ${title}`;
    }
  );
}

async function readUtf8(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

async function buildPrintableMarkdown(): Promise<string> {
  const org = (await readUtf8(path.join(workspaceRoot, 'org.cpp'))).trimEnd();
  const categoryDocuments: Array<{
    directory: string;
    title: string;
    anchorId: string;
    indexMarkdown: string;
    page: number;
    leaves: Array<{
      name: string;
      title: string;
      anchorId: string;
      markdown: string;
      page: number;
    }>;
  }> = [];

  for (const category of categories) {
    const directory = path.join(workspaceRoot, '模板', category);
    const indexMarkdown = await readUtf8(path.join(directory, 'README.md'));
    const leafNames = (await fs.readdir(directory))
      .filter((name) => name.toLowerCase().endsWith('.md') && name !== 'README.md')
      .sort((left, right) => left.localeCompare(right, 'zh-CN', { numeric: true }));
    const leaves = await Promise.all(
      leafNames.map(async (name) => {
        const markdown = await readUtf8(path.join(directory, name));
        const rawTitle = markdown.match(/^#\s+([^\r\n]+)/)?.[1]?.trim() ?? path.parse(name).name;
        const title = plainHeading(rawTitle);
        return {
          name,
          title,
          anchorId: documentAnchor(category, name),
          markdown,
          page: printPageNumbers.documents[`${category}/${name}`],
        };
      })
    );
    categoryDocuments.push({
      directory,
      title: category.replace(/^\d+-/, ''),
      anchorId: categoryAnchor(category),
      indexMarkdown,
      leaves,
      page: printPageNumbers.categories[category],
    });
  }

  const tocRow = (title: string, page: number, anchorId: string): string =>
    [
      `<a class="print-manual-toc-entry" href="#${anchorId}">`,
      '<span class="print-manual-toc-entry-title">',
      title,
      '</span><span class="print-manual-toc-leader"></span>',
      `<span class="print-manual-toc-page">${page}</span>`,
      '</a>',
    ].join('');

  const renderTocColumn = (documents: typeof categoryDocuments): string => [
    '<div class="print-manual-toc-column">',
    ...documents.flatMap((category) => [
      `<div class="print-manual-toc-group"><p class="print-manual-toc-category">${tocRow(category.title, category.page, category.anchorId)}</p>`,
      '<ol>',
      ...category.leaves.map(
        (leaf) => `<li>${tocRow(leaf.title, leaf.page, leaf.anchorId)}</li>`
      ),
      '</ol></div>',
    ]),
    '</div>',
  ].join('\n');

  const parts: string[] = [
    [
      '<section class="print-cover">',
      '  <p class="print-cover-kicker">ACM / ICPC ALGORITHM NOTEBOOK</p>',
      '  <p class="print-cover-title">算法竞赛模板</p>',
      '  <p class="print-cover-author"><span>BY</span><a href="https://codeforces.com/profile/CirnoNine">CirnoNine</a></p>',
      '  <div class="print-cover-topics">',
      '    <div><span>01</span>数论</div>',
      '    <div><span>02</span>计算几何</div>',
      '    <div><span>03</span>数据结构</div>',
      '    <div><span>04</span>图论与网络流</div>',
      '    <div><span>05</span>多项式</div>',
      '    <div><span>06</span>Python</div>',
      '  </div>',
      '</section>',
      '',
      '<section class="print-manual-toc">',
      '  <p class="print-manual-toc-title">目录</p>',
      '  <div class="print-manual-toc-grid">',
      renderTocColumn(categoryDocuments.slice(0, 4)),
      renderTocColumn(categoryDocuments.slice(4)),
      '  </div>',
      '</section>',
      '',
      '# 比赛基础骨架',
      '',
      '> `org.cpp` 中的 `int` 实际为 `long long`；其他常用别名与辅助函数按比赛现场代码库补充。',
      '',
      '```cpp',
      org,
      '```',
    ].join('\n'),
  ];

  for (const category of categoryDocuments) {
    parts.push(
      `<h1 id="${category.anchorId}">${escapeHtmlText(category.title)}</h1>\n\n${stripLocalLinks(removeFirstHeading(category.indexMarkdown))}`
    );

    for (const leaf of category.leaves) {
      parts.push(stripLocalLinks(formatLeafDocument(leaf.markdown.trim(), leaf.anchorId)));
    }
  }

  return parts.join('\n\n');
}

async function main(): Promise<void> {
  const markdown = await buildPrintableMarkdown();
  const config: ExportConfig = {
    theme: 'academic',
    codeTheme: 'github-light',
    pageFormat: 'A4',
    margin: {
      top: '13mm',
      right: '12mm',
      bottom: '16mm',
      left: '12mm',
    },
    fontFamily:
      '"Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", Arial, sans-serif',
    beamerFooterText: '',
    customCssFile: path.join(workspaceRoot, '打印版.css'),
    chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  };

  await exportMarkdownToPdf({
    sourcePath: path.join(workspaceRoot, '算法竞赛模板-打印源.md'),
    markdown,
    outputPath,
    executablePath: config.chromePath!,
    config,
    includeToc: false,
    includePageNumbers: true,
  });

  const stat = await fs.stat(outputPath);
  process.stdout.write(
    JSON.stringify(
      {
        outputPath,
        bytes: stat.size,
        sourceDocuments: 52,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
