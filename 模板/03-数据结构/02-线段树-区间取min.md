# 线段树：区间取 `min`、区间最小值

> **用途：** 维护区间 `chmin` 标记，即把覆盖区间内的每个值更新为 `min(原值,x)`，并查询区间最小值。
>
> **复杂度：** 建树 $O(n)$、空间 $O(n)$；一次更新或查询 $O(\log n)$。
>
> **下标：** 使用 $1$ 到 $n$ 的一基下标；带初值构造时，输入数组也按一基下标访问。

```cpp
const int INF = 1e18;

struct SegTree {
    #define ls (2*u)
    #define rs (2*u+1)

    struct Node {
        signed l, r;
        int x;
        int lazy;

        inline int size() { return r-l+1;}

        Node() {
            x = lazy = INF;
        }
    };
    vector<Node> tr;

    void merge(Node &res, const Node &A, const Node &B, int u) {
        res.x = min(A.x, B.x);
    }

    inline void pushUp(int u) { merge(tr[u], tr[ls], tr[rs], u); }

    inline void setTag(int u, int x) {
        tr[u].lazy = min(tr[u].lazy, x);
        tr[u].x = min(tr[u].x, x);
    }

    inline void pushDown(int u) {
        setTag(ls, tr[u].lazy), setTag(rs, tr[u].lazy);
        tr[u].lazy = INF;
    }

    void update(int l, int r, int x, int u = 1) {
        if (l > r) return;
        int tL = tr[u].l, tR = tr[u].r;
        if (l <= tL && tR <= r) {
            setTag(u, x);
            return;
        }
        pushDown(u);
        int mid = (tL+tR)/2;
        if (l <= mid) update(l, r, x, ls);
        if (r > mid) update(l, r, x, rs);
        pushUp(u);
    }

    Node query(int l, int r, int u = 1) {
        if (l > r) return Node();
        int tL = tr[u].l, tR = tr[u].r;
        if (l <= tL && tR <= r) return tr[u];
        pushDown(u);
        int mid = (tL+tR)/2;
        Node ans;
        if (l <= mid && r > mid) {
            merge(ans, query(l, r, ls), query(l, r, rs), u);
            return ans;
        }
        if (l <= mid) return query(l, r, ls);
        if (r > mid) return query(l, r, rs);
        return Node();
    }

    void buildTree(int l, int r, vector<int> &a, int u) {
        tr[u].l = l, tr[u].r = r;
        if (l == r) {
            tr[u].x = a[l];
        }
        if (l >= r) return;
        int mid = (l+r)/2;
        buildTree(l, mid, a, ls), buildTree(mid+1, r, a, rs);
        pushUp(u);
    }

    SegTree(int n, vector<int> &a) {
        tr.resize(4*n+1);
        buildTree(1, n, a, 1);
    }

    void buildTree(int l, int r, int u) {
        tr[u].l = l, tr[u].r = r;
        if (l >= r) return;
        int mid = (l+r)/2;
        buildTree(l, mid, ls);
        buildTree(mid+1, r, rs);
        pushUp(u);
    }

    SegTree(int n) {
        tr.resize(4*n+1);
        buildTree(1, n, 1);
    }
    #undef ls
    #undef rs
};
```
