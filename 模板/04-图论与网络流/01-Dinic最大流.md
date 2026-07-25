# Dinic 最大流

> **用途：** 在有向容量网络中计算从源点 `S` 到汇点 `T` 的最大流。当前 `addEdge` 会用 `map` 合并相同有向端点的边。
>
> **复杂度：** 一般容量网络的经典上界为 $O(V^2E)$；单位容量等特殊网络通常更快。空间 $O(V+E)$，每次加边另有 `map` 的 $O(\log E)$ 开销。
>
> **编号：** 点可以从 `0` 开始；边数组的前两个位置作为哨兵，使正反边可用 `i^1` 互相定位。

```cpp
const int INF = 1e18;

struct Flow {
    int S, T;
    vector<array<int,3>> e;
    vector<int> h,d,cur;
    map<pii,int> mp;

    void addEdge(int u, int v, int cap) {
        if (mp.count({u,v})) {
            e[mp[{u,v}]][1] += cap;
            return;
        }
        int sz = max(u,v)+1;
        if ((int)h.size() < sz) h.resize(sz), d.resize(sz), cur.resize(sz);

        e.push_back({v,cap,h[u]});
        h[u] = e.size()-1;
        mp[{u,v}] = h[u];

        e.push_back({u,0,h[v]});
        h[v] = e.size()-1;
        mp[{v,u}] = h[v];
    }
    
    bool bfs() {
        fill(d.begin(),d.end(),0);
        queue<int> q;
        d[S] = 1;
        q.push(S);
        while (q.size()) {
            auto u = q.front();
            q.pop();
            for (int i = h[u]; i; i = e[i][2]) {
                int v = e[i][0];
                if (d[v] == 0 && e[i][1]) {
                    d[v] = d[u]+1;
                    q.push(v);
                    if (v == T) return 1;
                }
            }
        }
        return 0;
    }
    
    int dfs(int u, int mf) {
        if (u == T) return mf;
        int sum = 0;
        for (int &i = cur[u]; i; i = e[i][2]) {
            int v = e[i][0];
            if (d[v] != d[u]+1 || !e[i][1]) continue;
            int f = dfs(v,min(mf, e[i][1]));
            e[i][1] -= f, e[i^1][1] += f;
            sum += f, mf -= f;
            if (mf == 0) break;
        }
        if (sum == 0) d[u] = 0;
        return sum;
    }

    int maxFlow(int S_, int T_) {
        S = S_, T = T_;
        int flow = 0;
        while (bfs()) {
            cur = h;
            flow += dfs(S, INF);
        }
        return flow;
    }

    Flow() {
        e.resize(2), h.resize(1), d.resize(1), cur.resize(1);
    }
};
```
