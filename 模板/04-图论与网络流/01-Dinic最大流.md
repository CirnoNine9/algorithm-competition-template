# Dinic 最大流

> **用途：** 在有向容量网络中计算从源点 `S` 到汇点 `T` 的最大流；平行边与反向同端点边分别保留。
>
> **编号：** 点可以从 `0` 开始并自动扩展；`addEdge` 返回正向残量边编号，正反边可用 `i^1` 互相定位。要求 `S != T`。

| 操作 | 含义 | 复杂度 | 备注 |
|---|---|---|---|
| 构造 | `Flow(n)` 构造含 `n` 个点的空网络 | 时间、空间 $O(n)$ | 也可默认构造，之后由 `addEdge` 自动扩点 |
| 加边 | `addEdge(u,v,cap)` 添加容量为 `cap` 的有向边，返回正向残量边编号 | 摊还 $O(1)$ | 自动扩点的总开销为 $O(V)$；平行边分别保留 |
| 增广 | `maxFlow(S,T,limit)` 从当前残量网络继续增广，至多增加 `limit` 单位流量 | 一般时间 $O(V^2E)$，额外空间 $O(V)$ | 要求 `S != T`；省略 `limit` 时求最大流 |
| 查询边 | `getEdge(i)` 返回编号为 `i` 的边的起点、终点、原容量与当前流量 | $O(1)$ | `i` 为 `addEdge` 的返回值 |
| 修改边 | `changeEdge(i,c,f)` 将编号为 `i` 的边改为容量 `c`、流量 `f` | $O(1)$ | 要求 $0\le f\le c$ |

```cpp
const int INF = 1e18;

struct Flow {
    int S, T;
    vector<array<int, 3>> e;
    vector<int> h, d, cur;

    Flow(int n = 0) : h(n), d(n), cur(n) {
        e.resize(2);
    }

    void resize(int n) {
        h.resize(n), d.resize(n), cur.resize(n);
    }

    int addEdge(int u, int v, int cap) {
        int n = max(u, v)+1;
        if ((int)h.size() < n) resize(n);
        int id = e.size();
        e.push_back({v, cap, h[u]}), h[u] = id;
        e.push_back({u, 0, h[v]}), h[v] = id^1;
        return id;
    }

    struct Edge {
        int from, to, cap, flow;
    };

    Edge getEdge(int i) {
        return {e[i^1][0], e[i][0], e[i][1]+e[i^1][1], e[i^1][1]};
    }

    void changeEdge(int i, int cap, int flow) {
        e[i][1] = cap-flow, e[i^1][1] = flow;
    }

    bool bfs() {
        fill(d.begin(), d.end(), -1);
        queue<int> q;
        d[S] = 0, q.push(S);
        while (q.size()) {
            int u = q.front();
            q.pop();
            for (int i = h[u]; i; i = e[i][2]) {
                int v = e[i][0];
                if (e[i][1] && d[v] == -1) d[v] = d[u]+1, q.push(v);
            }
        }
        return d[T] != -1;
    }

    int dfs(int u, int mf) {
        if (u == T || mf == 0) return mf;
        int sum = 0;
        for (int &i = cur[u]; i; i = e[i][2]) {
            int v = e[i][0];
            if (!e[i][1] || d[v] != d[u]+1) continue;
            int f = dfs(v, min(mf, e[i][1]));
            e[i][1] -= f, e[i^1][1] += f;
            sum += f, mf -= f;
            if (mf == 0) break;
        }
        if (sum == 0) d[u] = -1;
        return sum;
    }

    int maxFlow(int S_, int T_, int limit = INF) {
        S = S_, T = T_;
        int n = max(S, T)+1;
        if ((int)h.size() < n) resize(n);
        int flow = 0;
        while (flow < limit && bfs()) {
            cur = h;
            flow += dfs(S, limit-flow);
        }
        return flow;
    }
};
```
