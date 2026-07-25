# HLPP 最高标号预流推进

> **用途：** 在稠密图或 Dinic 容易退化的网络中计算最大流；使用最高标号选择、Gap 优化与全局重标号。
>
> **复杂度：** 常用上界记作 $O(V^2\sqrt E)$，空间 $O(V+E)$。
>
> **编号：** 构造 `Flow(n)` 后，通常使用 `1..n` 的点编号，`0` 号位置作为备用；源点和汇点应不同。

```cpp
struct Flow {
    struct Edge {
        int to, c, rev;
        Edge(int to, int c, int rev) : to(to), c(c), rev(rev) {}
    };

    int n, s, t;
    int maxh, maxgaph, workcnt;
    vector<vector<Edge>> vec;
    vector<int> ov, h, cur;
    vector<int> ovList, ovNxt;
    vector<int> gap, gapPrv, gapNxt;

    Flow(int n)
        : n(n), maxh(0), maxgaph(0), workcnt(0), vec(n + 1),
          ov(n + 1), h(n + 1), cur(n + 1), ovList(n + 1, -1),
          ovNxt(n + 1, -1), gap(n + 1, -1), gapPrv(n + 1, -1),
          gapNxt(n + 1, -1) {}

    void addEdge(int u, int v, int c) {
        vec[u].push_back(Edge(v, c, vec[v].size()));
        vec[v].push_back(Edge(u, 0, vec[u].size() - 1));
    }

    int maxFlow(int s_, int t_) {
        s = s_, t = t_;
        globalRelabel();
        for (auto &e : vec[s]) {
            if (e.c) pushFlow(s, e, e.c);
        }
        for (; maxh >= 0; --maxh) {
            while (~ovList[maxh]) {
                int x = ovList[maxh];
                ovList[maxh] = ovNxt[x];
                ovNxt[x] = -1;

                discharge(x);

                if (workcnt > (n << 2)) globalRelabel();
            }
        }
        return ov[t];
    }

  private:
    void discharge(int x) {
        int nh = n, sz = vec[x].size();
        for (int i = cur[x]; i < sz; ++i) {
            auto &e = vec[x][i];
            if (e.c > 0) {
                if (h[x] == h[e.to] + 1) {
                    pushFlow(x, e, min(ov[x], e.c));
                    if (ov[x] == 0) {
                        cur[x] = i;
                        return;
                    }
                } else {
                    nh = min(nh, h[e.to] + 1);
                }
            }
        }
        for (int i = 0; i < cur[x]; ++i) {
            auto &e = vec[x][i];
            if (e.c > 0) nh = min(nh, h[e.to] + 1);
        }
        cur[x] = 0;
        ++workcnt;
        int oldh = h[x], head = gap[oldh];
        if (~gapNxt[head]) {
            setHeight(x, nh);
        } else {
            for (int i = oldh; i <= maxgaph; ++i) {
                for (int j = gap[i]; ~j; ) {
                    int nxt = gapNxt[j];
                    h[j] = n;
                    gapPrv[j] = gapNxt[j] = -1;
                    j = nxt;
                }
                gap[i] = -1;
            }
            maxgaph = oldh - 1;
        }
    }

    void globalRelabel() {
        workcnt = maxh = maxgaph = 0;
        fill(h.begin(), h.end(), n);
        h[t] = 0;
        fill(gapPrv.begin(), gapPrv.end(), -1);
        fill(gapNxt.begin(), gapNxt.end(), -1);
        fill(gap.begin(), gap.end(), -1);
        fill(ovList.begin(), ovList.end(), -1);
        fill(ovNxt.begin(), ovNxt.end(), -1);
        fill(cur.begin(), cur.end(), 0);

        queue<int> q;
        q.push(t);
        while (!q.empty()) {
            int x = q.front();
            q.pop();
            for (auto &e : vec[x]) {
                if (h[e.to] == n && e.to != s && vec[e.to][e.rev].c > 0) {
                    setHeight(e.to, h[x] + 1);
                    q.push(e.to);
                }
            }
        }
    }

    void setHeight(int x, int newh) {
        if (~gapPrv[x]) {
            if (gapPrv[x] == x) {
                gap[h[x]] = gapNxt[x];
                if (~gapNxt[x]) gapPrv[gapNxt[x]] = gapNxt[x];
            } else {
                gapNxt[gapPrv[x]] = gapNxt[x];
                if (~gapNxt[x]) gapPrv[gapNxt[x]] = gapPrv[x];
            }
            gapPrv[x] = gapNxt[x] = -1;
        }
        h[x] = newh;
        if (h[x] >= n) return;
        maxgaph = max(maxgaph, h[x]);
        if (ov[x] > 0) {
            maxh = max(maxh, h[x]);
            ovNxt[x] = ovList[h[x]];
            ovList[h[x]] = x;
        }
        gapNxt[x] = gap[h[x]];
        if (~gapNxt[x]) gapPrv[gapNxt[x]] = x;
        gap[h[x]] = gapPrv[x] = x;
    }

    void pushFlow(int from, Edge &e, int flow) {
        if (!ov[e.to] && e.to != t && h[e.to] < n) {
            maxh = max(maxh, h[e.to]);
            ovNxt[e.to] = ovList[h[e.to]];
            ovList[h[e.to]] = e.to;
        }
        e.c -= flow;
        vec[e.to][e.rev].c += flow;
        ov[from] -= flow;
        ov[e.to] += flow;
    }
};
```
