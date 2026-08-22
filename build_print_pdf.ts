import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { exportMarkdownToPdf } from '../../../../../projects/markdown2pdf/src/pdf';
import type { ExportConfig } from '../../../../../projects/markdown2pdf/src/config';

const workspaceRoot = path.resolve(process.argv[2] ?? process.cwd());
const templateRoot = path.join(workspaceRoot, '模板');
const markdown2pdfRoot = path.resolve(
  workspaceRoot,
  '../../../../../projects/markdown2pdf'
);
const outputPath = path.resolve(
  process.argv[3] ??
    path.join(workspaceRoot, 'output', 'pdf', '算法竞赛模板-打印版.pdf')
);

type PageNumbers = Record<string, number>;
interface PrintSection {
  title: string;
  anchorId: string;
}
interface PrintDocument {
  name: string;
  title: string;
  anchorId: string;
  markdown: string;
  sections: PrintSection[];
}
interface PrintCategory {
  directory: string;
  title: string;
  anchorId: string;
  indexMarkdown: string;
  leaves: PrintDocument[];
}
interface PrintableBuild {
  markdown: string;
  anchors: string[];
  sourceDocuments: number;
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
}

async function discoverCategories(): Promise<string[]> {
  const entries = await fs.readdir(templateRoot, { withFileTypes: true });
  const categories = entries
    .filter((entry) => entry.isDirectory() && /^\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort(naturalCompare);
  if (categories.length === 0)
    throw new Error(
      'No numbered category directories found in ' + templateRoot
    );
  return categories;
}

function stripLocalLinks(markdown: string): string {
  const parts = markdown.split(/(\r?\n)/);
  let fence: { marker: string; length: number } | undefined;
  for (let index = 0; index < parts.length; index += 2) {
    const line = parts[index];
    const fenceMatch = line.match(/^ {0,3}([\x60]{3,}|~{3,})(.*)$/);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.marker &&
        fenceMatch[1].length >= fence.length &&
        fenceMatch[2].trim() === ''
      )
        fence = undefined;
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
    .replace(/[\x60*_~]/g, '')
    .replace(/\\([_{}])/g, '$1')
    .trim();
}

function extractHeading(markdown: string, fallback: string): string {
  return plainHeading(
    markdown.match(/^#\s+([^\r\n]+)/)?.[1]?.trim() ?? fallback
  );
}

function numericPrefix(value: string): string {
  return value.match(/^(\d+)/)?.[1] ?? value.replace(/[^a-zA-Z0-9]+/g, '-');
}
function categoryAnchor(category: string): string {
  return 'toc-category-' + numericPrefix(category);
}
function documentAnchor(category: string, name: string): string {
  return 'toc-document-' + numericPrefix(category) + '-' + numericPrefix(name);
}
function sectionAnchor(category: string, name: string, index: number): string {
  return documentAnchor(category, name) + '-section-' + (index + 1);
}

function extractSecondLevelHeadings(markdown: string): string[] {
  const headings: string[] = [];
  let fence: { marker: string; length: number } | undefined;
  for (const line of markdown.split(/\r?\n/)) {
    const fenceMatch = line.match(/^ {0,3}([\x60]{3,}|~{3,})(.*)$/);
    if (fence) {
      if (
        fenceMatch &&
        fenceMatch[1][0] === fence.marker &&
        fenceMatch[1].length >= fence.length &&
        fenceMatch[2].trim() === ''
      )
        fence = undefined;
      continue;
    }
    if (fenceMatch) {
      fence = { marker: fenceMatch[1][0], length: fenceMatch[1].length };
      continue;
    }
    const heading = line.match(/^##\s+(.+)$/)?.[1]?.trim();
    if (heading) headings.push(heading);
  }
  return headings;
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
  const tick = String.fromCharCode(96);
  return markdown
    .split(
      new RegExp('(' + tick + '[^' + tick + ']*' + tick + '|\\$[^$]*\\$)', 'g')
    )
    .map((part) => {
      if (part.startsWith(tick) && part.endsWith(tick))
        return '<code>' + escapeHtmlText(part.slice(1, -1)) + '</code>';
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        return (
          '<span class="math-inline" data-math-source="' +
          escapeHtmlAttribute(math) +
          '">\\(' +
          escapeHtmlText(math) +
          '\\)</span>'
        );
      }
      return escapeHtmlText(part);
    })
    .join('');
}

function formatLeafDocument(
  markdown: string,
  anchorId: string,
  sectionAnchorIds: string[]
): string {
  let firstHeading = true;
  let sectionIndex = 0;
  let fence: { marker: string; length: number } | undefined;
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const fenceMatch = line.match(/^ {0,3}([\x60]{3,}|~{3,})(.*)$/);
      if (fence) {
        if (
          fenceMatch &&
          fenceMatch[1][0] === fence.marker &&
          fenceMatch[1].length >= fence.length &&
          fenceMatch[2].trim() === ''
        ) {
          fence = undefined;
        }
        return line;
      }
      if (fenceMatch) {
        fence = { marker: fenceMatch[1][0], length: fenceMatch[1].length };
        return line;
      }
      const heading = line.match(/^(#{1,5})\s+([^\r\n]+)$/);
      if (!heading) return line;
      const hashes = heading[1];
      const title = heading[2];
      if (firstHeading) {
        firstHeading = false;
        return (
          '<h2 id="' + anchorId + '">' + renderHeadingInline(title) + '</h2>'
        );
      }
      if (hashes.length === 2) {
        const sectionAnchorId = sectionAnchorIds[sectionIndex++];
        if (!sectionAnchorId)
          throw new Error('Missing print section anchor for ' + title);
        return (
          '<h4 id="' +
          sectionAnchorId +
          '">' +
          renderHeadingInline(title) +
          '</h4>'
        );
      }
      return '#'.repeat(Math.min(6, hashes.length + 2)) + ' ' + title;
    })
    .join('\n');
}

async function readUtf8(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf8');
}

async function collectPrintCategories(): Promise<PrintCategory[]> {
  const categories = await discoverCategories();
  return Promise.all(
    categories.map(async (category) => {
      const directory = path.join(templateRoot, category);
      const indexMarkdown = await readUtf8(path.join(directory, 'README.md'));
      const leafNames = (await fs.readdir(directory))
        .filter(
          (name) => name.toLowerCase().endsWith('.md') && name !== 'README.md'
        )
        .sort(naturalCompare);
      const leaves = await Promise.all(
        leafNames.map(async (name) => {
          const markdown = await readUtf8(path.join(directory, name));
          return {
            name,
            title: extractHeading(markdown, path.parse(name).name),
            anchorId: documentAnchor(category, name),
            markdown,
            sections: extractSecondLevelHeadings(markdown).map(
              (rawTitle, index) => ({
                title: plainHeading(rawTitle),
                anchorId: sectionAnchor(category, name, index),
              })
            ),
          };
        })
      );
      return {
        directory: category,
        title: extractHeading(indexMarkdown, category.replace(/^\d+-/, '')),
        anchorId: categoryAnchor(category),
        indexMarkdown,
        leaves,
      };
    })
  );
}

function pageNumberFor(
  pageNumbers: PageNumbers | undefined,
  anchorId: string,
  label: string
): string {
  if (!pageNumbers) return '';
  const page = pageNumbers[anchorId];
  if (page === undefined)
    throw new Error(
      'Unable to resolve print page number for ' + label + ' (' + anchorId + ')'
    );
  return String(page);
}

async function buildPrintableMarkdown(
  pageNumbers?: PageNumbers
): Promise<PrintableBuild> {
  const org = (await readUtf8(path.join(workspaceRoot, 'org.cpp'))).trimEnd();
  const categoryDocuments = await collectPrintCategories();
  const anchors = categoryDocuments.flatMap((category) => [
    category.anchorId,
    ...category.leaves.flatMap((leaf) => [
      leaf.anchorId,
      ...leaf.sections.map((section) => section.anchorId),
    ]),
  ]);
  const tocRow = (
    title: string,
    anchorId: string,
    label: string,
    extraClass = ''
  ): string =>
    [
      '<a class="print-manual-toc-entry' +
        (extraClass ? ' ' + extraClass : '') +
        '" href="#' +
        anchorId +
        '">',
      '<span class="print-manual-toc-entry-title">',
      escapeHtmlText(title),
      '</span><span class="print-manual-toc-leader"></span>',
      '<span class="print-manual-toc-page markdown2pdf-toc-page-number">' +
        pageNumberFor(pageNumbers, anchorId, label) +
        '</span>',
      '</a>',
    ].join('');
  const renderTocColumn = (items: PrintCategory[]): string =>
    [
      '<div class="print-manual-toc-column">',
      ...items.flatMap((category) => [
        '<div class="print-manual-toc-group"><p class="print-manual-toc-category">' +
          tocRow(
            category.title,
            category.anchorId,
            'category ' + category.directory
          ) +
          '</p>',
        '<ol class="print-manual-toc-documents">',
        ...category.leaves.map((leaf) =>
          [
            '<li class="print-manual-toc-document">',
            tocRow(
              leaf.title,
              leaf.anchorId,
              category.directory + '/' + leaf.name
            ),
            ...(leaf.sections.length
              ? [
                  '<ol class="print-manual-toc-sections">',
                  ...leaf.sections.map(
                    (section) =>
                      '<li>' +
                      tocRow(
                        section.title,
                        section.anchorId,
                        category.directory +
                          '/' +
                          leaf.name +
                          ' ' +
                          section.title,
                        'print-manual-toc-section-entry'
                      ) +
                      '</li>'
                  ),
                  '</ol>',
                ]
              : []),
            '</li>',
          ].join('\n')
        ),
        '</ol></div>',
      ]),
      '</div>',
    ].join('\n');
  const splitIndex = Math.ceil(categoryDocuments.length / 2);
  const coverTopics = categoryDocuments.map(
    (category) =>
      '    <div><span>' +
      escapeHtmlText(numericPrefix(category.directory).padStart(2, '0')) +
      '</span>' +
      escapeHtmlText(category.title) +
      '</div>'
  );
  const tick = String.fromCharCode(96);
  const fence = tick.repeat(3);
  const parts: string[] = [
    [
      '<section class="print-cover">',
      '  <p class="print-cover-kicker">ACM / ICPC ALGORITHM NOTEBOOK</p>',
      '  <p class="print-cover-title">算法竞赛模板</p>',
      '  <p class="print-cover-author"><span>BY</span><a href="https://codeforces.com/profile/CirnoNine">CirnoNine</a></p>',
      '  <div class="print-cover-topics">',
      ...coverTopics,
      '  </div>',
      '</section>',
      '',
      '<section class="print-manual-toc">',
      '  <p class="print-manual-toc-title">目录</p>',
      '  <div class="print-manual-toc-grid">',
      renderTocColumn(categoryDocuments.slice(0, splitIndex)),
      renderTocColumn(categoryDocuments.slice(splitIndex)),
      '  </div>',
      '</section>',
      '',
      '# 比赛基础骨架',
      '',
      '> ' +
        tick +
        'org.cpp' +
        tick +
        ' 中的 ' +
        tick +
        'int' +
        tick +
        ' 实际为 long long；其他常用别名与辅助函数按比赛现场代码库补充。',
      '',
      fence + 'cpp',
      org,
      fence,
    ].join('\n'),
  ];
  for (const category of categoryDocuments) {
    parts.push(
      '<h1 id="' +
        category.anchorId +
        '">' +
        escapeHtmlText(category.title) +
        '</h1>\n\n' +
        stripLocalLinks(removeFirstHeading(category.indexMarkdown))
    );
    for (const leaf of category.leaves)
      parts.push(
        stripLocalLinks(
          formatLeafDocument(
            leaf.markdown.trim(),
            leaf.anchorId,
            leaf.sections.map((section) => section.anchorId)
          )
        )
      );
  }
  return {
    markdown: parts.join('\n\n'),
    anchors,
    sourceDocuments: categoryDocuments.reduce(
      (total, category) => total + category.leaves.length,
      0
    ),
  };
}

async function readPdfDestinationPages(
  pdfData: Uint8Array,
  anchors: string[]
): Promise<PageNumbers> {
  const pdfjs = await import(
    pathToFileURL(
      path.join(
        markdown2pdfRoot,
        'node_modules/pdfjs-dist/legacy/build/pdf.mjs'
      )
    ).href
  );
  const document = await pdfjs.getDocument({ data: pdfData }).promise;
  try {
    const entries = await Promise.all(
      anchors.map(async (anchor): Promise<[string, number]> => {
        const destination =
          (await document.getDestination(anchor)) ??
          (await document.getDestination(safeDecodeURIComponent(anchor)));
        if (!destination)
          throw new Error('Unable to resolve print destination: ' + anchor);
        return [anchor, (await document.getPageIndex(destination[0])) + 1];
      })
    );
    return Object.fromEntries(entries);
  } finally {
    await document.destroy();
  }
}

async function readPdfPageCount(pdfData: Uint8Array): Promise<number> {
  const pdfjs = await import(
    pathToFileURL(
      path.join(
        markdown2pdfRoot,
        'node_modules/pdfjs-dist/legacy/build/pdf.mjs'
      )
    ).href
  );
  const document = await pdfjs.getDocument({ data: pdfData }).promise;
  try {
    return document.numPages;
  } finally {
    await document.destroy();
  }
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function pageNumbersEqual(
  left: PageNumbers,
  right: PageNumbers,
  anchors: string[]
): boolean {
  return anchors.every((anchor) => left[anchor] === right[anchor]);
}

async function exportPrintPdf(
  markdown: string,
  targetPath: string,
  config: ExportConfig
): Promise<void> {
  await exportMarkdownToPdf({
    sourcePath: path.join(workspaceRoot, '算法竞赛模板-打印源.md'),
    markdown,
    outputPath: targetPath,
    executablePath: config.chromePath!,
    config,
    includeToc: false,
    includePageNumbers: true,
  });
}

async function main(): Promise<void> {
  const config: ExportConfig = {
    theme: 'academic',
    codeTheme: 'github-light',
    pageFormat: 'A4',
    margin: { top: '13mm', right: '12mm', bottom: '16mm', left: '12mm' },
    fontFamily:
      '"Microsoft YaHei", "Noto Sans CJK SC", "Segoe UI", Arial, sans-serif',
    beamerFooterText: '',
    customCssFile: path.join(workspaceRoot, '打印版.css'),
    chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  };
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'algorithm-competition-print-')
  );
  try {
    const preliminaryBuild = await buildPrintableMarkdown();
    const preliminaryPath = path.join(temporaryDirectory, 'preliminary.pdf');
    await exportPrintPdf(preliminaryBuild.markdown, preliminaryPath, config);
    let pageNumbers = await readPdfDestinationPages(
      new Uint8Array(await fs.readFile(preliminaryPath)),
      preliminaryBuild.anchors
    );
    let finalBuild: PrintableBuild | undefined;
    let finalPdfPath = path.join(temporaryDirectory, 'final.pdf');
    let stable = false;
    for (let iteration = 0; iteration < 3; iteration += 1) {
      finalBuild = await buildPrintableMarkdown(pageNumbers);
      await exportPrintPdf(finalBuild.markdown, finalPdfPath, config);
      const actualPageNumbers = await readPdfDestinationPages(
        new Uint8Array(await fs.readFile(finalPdfPath)),
        finalBuild.anchors
      );
      if (
        pageNumbersEqual(pageNumbers, actualPageNumbers, finalBuild.anchors)
      ) {
        stable = true;
        break;
      }
      pageNumbers = actualPageNumbers;
      finalPdfPath = path.join(
        temporaryDirectory,
        'final-' + (iteration + 2) + '.pdf'
      );
    }
    if (!stable || !finalBuild)
      throw new Error(
        'Print TOC page numbers did not stabilize after three PDF passes.'
      );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.copyFile(finalPdfPath, outputPath);
    const finalPdf = new Uint8Array(await fs.readFile(outputPath));
    const stat = await fs.stat(outputPath);
    process.stdout.write(
      JSON.stringify(
        {
          outputPath,
          bytes: stat.size,
          pages: await readPdfPageCount(finalPdf),
          sourceDocuments: finalBuild.sourceDocuments,
          tocEntries: finalBuild.anchors.length,
        },
        null,
        2
      )
    );
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(
    (error instanceof Error ? (error.stack ?? error.message) : String(error)) +
      '\n'
  );
  process.exitCode = 1;
});
