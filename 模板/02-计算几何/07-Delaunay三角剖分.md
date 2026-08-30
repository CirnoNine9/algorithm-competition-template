# Delaunay 三角剖分

> **用途：** 用分治 Quad-Edge 算法求点集的 Delaunay 三角剖分，并维护其 Voronoi 对偶图。构造时按坐标排序并去重，`p` 保存点，`tri` 保存三角形，`edge` 保存 Delaunay 无向边；`g` 是以三角形为点、共边关系为边的对偶图，`vor` 保存三角形外心。
>
> **依赖：** `Point<int>`、`Point<double>`、`Line<double>`，以及“圆”中的 `inCircle()`、`circumcenter()`；其中 `int` 按仓库约定表示 `i64`，输入点坐标绝对值不超过 $10^9$。
>
> **退化情况：** 重复点只保留一个；少于 $3$ 个点或所有点共线时 `tri`、`vor`、`g`、`ray` 为空，`edge` 仍返回点集的一维剖分，`line` 保存相邻点的垂直平分线；四点共圆时返回其中一种合法剖分，此时 `vor` 可能有重合点，`g` 中相应的 Voronoi 边长度为 $0$。
>
| 操作/结构 | 含义 | 复杂度 | 备注 |
|---|---|---|---|
| `Delaunay(a)` | 传入点集 `a`，构造 Delaunay 三角剖分、对偶图与 Voronoi 图 | 时间 $O(n\log n)$，空间 $O(n)$ | 会排序并去重；分治合并使用 Quad-Edge |
| `build(a)` | 用新点集 `a` 重新构造，覆盖原结果 | 时间 $O(n\log n)$，空间 $O(n)$ | 条件同构造函数 |
| `p[i]` | 去重后按坐标升序排列的第 `i` 个点 | - | `tri`、`edge` 中的编号均指向这里 |
| `tri[i]` | 第 `i` 个三角形的三个顶点编号，按逆时针排列 | - | 三角形非退化；四点共圆时选取的对角线不固定 |
| `edge[i]` | 第 `i` 条 Delaunay 无向边的两个端点编号 | - | 端点满足 `u < v`，每条边只出现一次 |
| `g[i]` | 对偶图中与第 `i` 个三角形共边的三角形编号 | - | 不把外部面作为点；每条有限 Voronoi 边在 `g` 中出现两次 |
| `vor[i]` | `tri[i]` 的外心，即对应的 Voronoi 顶点 | - | `g` 中的相邻面 `i,j` 对应线段 `vor[i]vor[j]` |
| `ray[i]` | `{f,u,v,d}` 表示从 `vor[f]` 沿非零向量 `d` 延伸的 Voronoi 射线 | - | 对应凸包边 `(u,v)`；端点满足 `u < v` |
| `line[i]` | 全共线时的一条 Voronoi 边 | - | 是 `edge[i]` 两端点的垂直平分线；非全共线时为空 |

Voronoi 的有限部分由 `vor` 与 `g` 给出：`i,j` 在 `g` 中相邻时，存在边段 `vor[i]`--`vor[j]`；凸包边对应 `ray` 中的无界射线。全共线时没有有限 Voronoi 顶点，直接用 `line` 表示相邻点的垂直平分线。

这里的 `g` 是删除外部面的平面对偶图，一般含有环，不是树。

## 常用性质

- 空圆性质：每个 Delaunay 三角形的外接圆内部都不含其他输入点；反之，满足局部空圆条件的三角剖分就是 Delaunay 三角剖分。
- 对偶关系：Delaunay 三角形对应 Voronoi 顶点，两个三角形的公共边对应有限 Voronoi 边，凸包边对应无界 Voronoi 射线；Delaunay 点对应一个 Voronoi 区域。
- Delaunay 图是平面图，所有凸包边都在图中。若去重后有 $n$ 个点、凸包边界上有 $h$ 个点（包括边上的共线点）且不全共线，则边数为 $3n-h-3$，三角形数为 $2n-h-2$。
- 不存在四点共圆时，Delaunay 三角剖分唯一；存在共圆点时可能有多种合法剖分，合并重合外心并删除零长度边后都得到同一个几何 Voronoi 图。
- 在所有合法三角剖分中，Delaunay 三角剖分最大化最小角，因此通常能避免细长三角形。
- 最近点对的边、每个点到某个最近邻的边以及欧几里得最小生成树的所有边都属于 Delaunay 图，可把相应候选边从 $O(n^2)$ 降到 $O(n)$。

```cpp
struct Delaunay {
    struct Ray {
        int f, u, v;
        Point<double> d;
    };

    vector<Point<int>> p;
    vector<array<int, 3>> tri;
    vector<array<int, 2>> edge;
    vector<Point<double>> vor;
    vector<vector<int>> g;
    vector<Ray> ray;
    vector<Line<double>> line;

private:
    struct Quad {
        Quad *rot, *next;
        int p, vis;

        Quad *rev() const { return rot->rot; }
        Quad *prev() const { return rot->next->rot; }
        Quad *lNext() const { return rev()->prev(); }
    };

    deque<array<Quad, 4>> pool;
    Quad *free = nullptr;

    int side(int a, int b, int c) const {
        return (p[b]-p[a])*(p[c]-p[a]);
    }

    int org(Quad *e) const { return e->p; }
    int dst(Quad *e) const { return e->rev()->p; }

    Quad *make(int u, int v) {
        Quad *a;
        if (free) a = free, free = free->next;
        else {
            pool.push_back({}), a = pool.back().data();
            for (int i = 0; i < 4; i++) a[i].rot = &a[(i+1)%4];
        }
        Quad *q[4] = {a, a->rot, a->rot->rot, a->rot->rot->rot};
        for (int i = 0; i < 4; i++) q[i]->p = -1, q[i]->vis = 0;
        q[0]->next = q[0], q[1]->next = q[3];
        q[2]->next = q[2], q[3]->next = q[1];
        q[0]->p = u, q[2]->p = v;
        return q[0];
    }

    void splice(Quad *a, Quad *b) {
        swap(a->next->rot->next, b->next->rot->next);
        swap(a->next, b->next);
    }

    Quad *connect(Quad *a, Quad *b) {
        Quad *e = make(dst(a), org(b));
        splice(e, a->lNext()), splice(e->rev(), b);
        return e;
    }

    void erase(Quad *e) {
        splice(e, e->prev()), splice(e->rev(), e->rev()->prev());
        e->next = free, free = e;
    }

    int valid(Quad *e, Quad *bas) const {
        return side(dst(e), dst(bas), org(bas)) > 0;
    }

    pair<Quad *, Quad *> solve(int l, int r) {
        if (r-l <= 3) {
            Quad *a = make(l, l+1);
            if (r-l == 2) return {a, a->rev()};
            Quad *b = make(l+1, l+2);
            splice(a->rev(), b);
            int s = side(l, l+1, l+2);
            Quad *c = s ? connect(b, a) : nullptr;
            return {s < 0 ? c->rev() : a, s < 0 ? c : b->rev()};
        }

        int m = (l+r)/2;
        auto [ra, a] = solve(l, m);
        auto [b, rb] = solve(m, r);
        while (1) {
            if (side(org(b), dst(a), org(a)) < 0) a = a->lNext();
            else if (side(org(a), dst(b), org(b)) > 0) b = b->rev()->next;
            else break;
        }
        Quad *base = connect(b->rev(), a);
        if (org(a) == org(ra)) ra = base->rev();
        if (org(b) == org(rb)) rb = base;

        while (1) {
            Quad *lc = base->rev()->next;
            if (valid(lc, base)) {
                while (inCircle(p[dst(base)], p[org(base)], p[dst(lc)], p[dst(lc->next)]) > 0) {
                    Quad *t = lc->next;
                    erase(lc), lc = t;
                }
            }
            Quad *rc = base->prev();
            if (valid(rc, base)) {
                while (inCircle(p[dst(base)], p[org(base)], p[dst(rc)],
                                p[dst(rc->prev())]) > 0) {
                    Quad *t = rc->prev();
                    erase(rc), rc = t;
                }
            }
            int lv = valid(lc, base), rv = valid(rc, base);
            if (!lv && !rv) break;
            if (!lv || (rv && inCircle(p[org(rc)], p[dst(lc)], p[org(lc)], p[dst(rc)]) > 0))
                base = connect(rc, base->rev());
            else
                base = connect(base->rev(), lc->rev());
        }
        return {ra, rb};
    }

    void addFace(Quad *s, vector<Quad *> &que, int keep) {
        vector<int> f;
        Quad *e = s;
        do {
            e->vis = 1, f.push_back(org(e));
            que.push_back(e->rev());
            int u = org(e), v = dst(e);
            if (u < v) edge.push_back({u, v});
            e = e->lNext();
        } while (e != s);
        if (!keep || f.size() != 3) return;
        while (f[1] < f[0] || f[2] < f[0])
            rotate(f.begin(), f.begin()+1, f.end());
        if (side(f[0], f[1], f[2]) < 0) swap(f[1], f[2]);
        if (side(f[0], f[1], f[2])) tri.push_back({f[0], f[1], f[2]});
    }

    void extract(Quad *e) {
        while (side(dst(e->next), dst(e), org(e)) < 0) e = e->next;
        vector<Quad *> que;
        addFace(e, que, 0);
        for (int i = 0; i < (int)que.size(); i++) {
            e = que[i];
            if (!e->vis) addFace(e, que, 1);
        }
        sort(edge.begin(), edge.end());
        sort(tri.begin(), tri.end());
    }

    void buildDual() {
        for (auto t : tri)
            vor.push_back(circumcenter(p[t[0]], p[t[1]], p[t[2]]));
        g.resize(tri.size());

        map<array<int, 2>, int> f;
        for (int i = 0; i < (int)tri.size(); i++) {
            for (int j = 0; j < 3; j++) {
                int u = tri[i][j], v = tri[i][(j+1)%3];
                if (u > v) swap(u, v);
                auto [it, ok] = f.emplace(array<int, 2>{u, v}, i);
                if (!ok) {
                    int k = it->second;
                    g[i].push_back(k), g[k].push_back(i), f.erase(it);
                }
            }
        }

        if (tri.empty()) {
            for (auto [u, v] : edge) {
                Point<double> m((p[u].x+p[v].x)/2.0, (p[u].y+p[v].y)/2.0);
                Point<double> d(p[u].y-p[v].y, p[v].x-p[u].x);
                line.push_back({m-d, m+d});
            }
        } else for (auto &[uv, a] : f) {
            auto [u, v] = uv;
            int w = tri[a][0]+tri[a][1]+tri[a][2]-u-v;
            Point<double> d(p[v].y-p[u].y, p[u].x-p[v].x);
            if (side(u, v, w) < 0) d = d*-1.0;
            ray.push_back({a, u, v, d});
        }
        for (auto &a : g) sort(a.begin(), a.end());
    }

public:
    Delaunay(vector<Point<int>> a = {}) { build(move(a)); }

    void build(vector<Point<int>> a) {
        p = move(a);
        sort(p.begin(), p.end());
        p.erase(unique(p.begin(), p.end()), p.end());
        tri.clear(), edge.clear(), pool.clear(), free = nullptr;
        vor.clear(), g.clear(), ray.clear(), line.clear();
        int n = p.size();
        if (n <= 1) return;
        int collinear = 1;
        for (int i = 2; i < n; i++) collinear &= side(0, 1, i) == 0;
        if (collinear) {
            for (int i = 1; i < n; i++) edge.push_back({i-1, i});
            buildDual();
            return;
        }
        extract(solve(0, n).first);
        buildDual();
        pool.clear(), free = nullptr;
    }
};
```
