# 算法竞赛模板

一套面向 ICPC、CCPC 与日常训练的中文算法竞赛模板。每个主题独立成文，集中记录用途、复杂度、使用条件和代码，既方便在线检索，也适合整理成 A4 打印版随身查阅。

[下载最新打印版 PDF](https://github.com/CirnoNine9/algorithm-competition-template/releases/latest) · [浏览完整目录](模板/README.md) · [查看通用 C++ 骨架](org.cpp)

## 模板内容

目前收录 58 份模板：

| 分类 | 数量 | 主要内容 |
| --- | ---: | --- |
| [数论](模板/01-数论/README.md) | 13 | 组合数、同余、离散对数、筛法、质数计数、因数分解、类欧几里得 |
| [计算几何](模板/02-计算几何/README.md) | 6 | 点与凸包、直线、多边形、圆、半平面交 |
| [数据结构](模板/03-数据结构/README.md) | 8 | 树状数组、线段树、Treap、`pb_ds` 平衡树与配对堆、树链剖分、Link–Cut Tree、后缀自动机 |
| [图论与网络流](模板/04-图论与网络流/README.md) | 2 | Dinic、HLPP |
| [多项式](模板/05-多项式/README.md) | 26 | FFT、NTT、FWT、形式幂级数、多点求值、线性递推等 |
| [Python](模板/06-Python/README.md) | 3 | `datetime`、`Fraction`、`math` 常用接口 |

## 使用方式

- **在线查阅：** 从[分类总目录](模板/README.md)进入对应主题；文件名前的编号也是推荐阅读和打印顺序。
- **离线使用：** 在 [GitHub Releases](https://github.com/CirnoNine9/algorithm-competition-template/releases/latest) 下载完整 A4 打印版 PDF。
- **离线网页：** 运行 `npx --yes tsx build_html.ts`，再用浏览器打开 `output/html/index.html`；网页支持搜索、明暗配色和代码一键复制。
- **赛前整理：** 复制所需代码前，先阅读模板开头的依赖、值域、复杂度和使用条件，再按题目修改常量、类型与接口。
- **C++ 约定：** 部分代码沿用 [org.cpp](org.cpp) 中的 `int`、`pii` 等定义，也可能依赖其他模板提供的函数或类型；具体要求以各页说明为准。

模板以短小、便于手抄为目标，不是开箱即用的算法库。使用前请结合题目约束自行验证，尤其注意整数溢出、模数条件、下标范围与编译器扩展。

## 仓库结构

```text
.
├── 模板/                 # 按分类拆分的模板正文与目录
│   ├── 01-数论/
│   ├── 02-计算几何/
│   ├── 03-数据结构/
│   ├── 04-图论与网络流/
│   ├── 05-多项式/
│   └── 06-Python/
├── org.cpp               # 通用 C++ 竞赛骨架
├── build_print_pdf.ts    # 打印版汇总脚本
├── build_html.ts         # 离线 HTML 站点生成脚本
├── 打印版.css             # A4 打印样式
├── 网页.css               # 离线站点样式
└── 网页.js                # 搜索、主题和复制交互
```

## 文档与打印版

模板正文采用“一种算法一份 Markdown”的结构。分类 README 负责汇总主题与复杂度，`build_print_pdf.ts` 再按编号合并正文，并配合 `打印版.css` 生成带目录和页码的打印版 PDF。`build_html.ts` 使用同一批 Markdown 生成可离线浏览的多页站点，代码块可以直接复制；多项式分类页还可以把常用实现按依赖顺序封装到 `Poly` 命名空间后复制。

维护内容时，应优先修改 `模板/` 下对应的独立文档；生成的 PDF 通过 GitHub Releases 发布，HTML 写入 `output/html/`，两者均不纳入仓库源码。

## 作者

CirnoNine

- [Codeforces](https://codeforces.com/profile/CirnoNine)
- [AtCoder](https://atcoder.jp/users/CirnoNine)
- [洛谷](https://www.luogu.com.cn/user/1434254)
- [牛客竞赛](https://ac.nowcoder.com/acm/contest/profile/115253116)
