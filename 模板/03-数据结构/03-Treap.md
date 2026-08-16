# Treap

> **用途：** 实现支持重复元素的有序多重集合，包括插入、删除一个值、排名、第 $k$ 小、前驱和后继。
>
> **复杂度：** 随机优先级均匀时，各操作期望 $O(\log n)$，空间 $O(n)$；最坏时间和递归深度均可达 $O(n)$。

以下 $n$ 表示 Treap 的结构节点数，即不同值的个数；`info.cnt` 和 `size()` 统计包含重数的元素总数。`unite` 中令 $n\ge m$ 分别为两棵树的结构节点数。

| 操作 | 作用 | 期望复杂度 | 备注 |
|---|---|---:|---|
| `split(p,val,equal)` | 按值将 `p` 拆成两棵 Treap | $O(\log n)$ | `equal=1` 时左段 `<=val`，否则左段 `<val` |
| `merge(x,y)` | 拼接两个值域严格有序的 Treap | $O(\log n)$ | 要求 `x` 中所有值严格小于 `y` 中所有值，否则使用 `unite` |
| `insert(val)` | 插入一个 `val`，返回对应节点指针 | $O(\log n)$ | 相同值只增加节点的 `cnt` |
| `extract(val)` | 删除一个已存在的 `val`，返回操作后的节点指针 | $O(\log n)$ | 要求 `val` 已存在；重数减至 $0$ 时返回 `nullptr` |
| `getRank(val)` | 查询 `val` 的排名，即严格小于它的元素数加一 | $O(\log n)$ | 排名从 $1$ 开始 |
| `getValue(rank)` | 查询第 `rank` 小的元素，返回对应节点指针 | $O(\log n)$ | 要求 $1\le rank\le size()$ |
| `getPre(val)`、`getNxt(val)` | 查询严格前驱、严格后继，返回对应节点指针 | $O(\log n)$ | 答案不存在时返回 `nullptr` |
| `size()` | 查询整棵树的元素总数 | $O(1)$ | 包含各节点的重数 `cnt` |
| `rangeAdd(l,r,x)` | 给值位于 `[l,r]` 的所有元素加 `x` | $O(\log n)$ | 修改后必须仍严格有序；后缀加可调用 `rangeAdd(val,INF,x)` |
| `rangeSum(l,r)` | 查询值域 `[l,r]` 内所有元素之和 | $O(\log n)$ | 若和可能超过 `i64`，将 `Info::sum` 及相关乘法改为 `i128` |
| `unite(x,y)` | 合并两棵值域可重叠的 Treap，并合并相同值的重数 | $O\left(m\log\left(\frac{n}{m}+1\right)\right)$，$m=0$ 时为 $O(1)$ | 会复用两棵树的节点，合并后原根不得再作为独立 Treap 使用 |

```cpp
mt19937_64 rng(time(0));

struct Treap {
    using u64 = unsigned long long;

    struct Info {
        int cnt = 0, sum = 0;

        Info() {}
        Info(int v, int c = 1) : cnt(c), sum(v*c) {}

        Info operator+(const Info &b) const {
            Info c;
            c.cnt = cnt+b.cnt, c.sum = sum+b.sum;
            return c;
        }
    };

    struct Node {
        array<Node*, 2> s{};
        int val, cnt = 1, add = 0;
        Info info;
        u64 key;

        Node(int v) : val(v), info(v), key(rng()) {}

        static Info getInfo(Node *p) {
            return p ? p->info : Info();
        }

        void pushUp() {
            info = getInfo(s[0])+Info(val, cnt)+getInfo(s[1]);
        }

        void addCnt(int x) {
            cnt += x, pushUp();
        }

        void setAdd(int x) {
            val += x, info.sum += x*info.cnt, add += x;
        }

        void pushDown() {
            if (!add) return;
            for (auto p : s) if (p) p->setAdd(add);
            add = 0;
        }
    };

    Node *root = nullptr;

    int size(Node *p) { return Node::getInfo(p).cnt; }
    int sum(Node *p) { return Node::getInfo(p).sum; }

    array<Node*, 2> split(Node *p, int val, bool equal = 1) {
        if (!p) return {};
        p->pushDown();
        if (p->val < val || (equal && p->val == val)) {
            auto a = split(p->s[1], val, equal);
            p->s[1] = a[0], p->pushUp();
            return {p, a[1]};
        }
        auto a = split(p->s[0], val, equal);
        p->s[0] = a[1], p->pushUp();
        return {a[0], p};
    }

    array<Node*, 3> splitRange(Node *p, int l, int r) {
        auto a = split(p, r);
        auto b = split(a[0], l, 0);
        return {b[0], b[1], a[1]};
    }

    Node *merge(Node *x, Node *y) {
        if (!x || !y) return x ? x : y;
        if (x->key > y->key) {
            x->pushDown();
            x->s[1] = merge(x->s[1], y), x->pushUp();
            return x;
        }
        y->pushDown();
        y->s[0] = merge(x, y->s[0]), y->pushUp();
        return y;
    }

    Node *unite(Node *x, Node *y) {
        if (!x || !y) return x ? x : y;
        if (x->key < y->key) swap(x, y);
        x->pushDown();
        auto a = splitRange(y, x->val, x->val);
        if (a[1]) x->cnt += a[1]->cnt, delete a[1];
        x->s[0] = unite(x->s[0], a[0]);
        x->s[1] = unite(x->s[1], a[2]);
        x->pushUp();
        return x;
    }

    Node *join(array<Node*, 3> a) {
        return merge(merge(a[0], a[1]), a[2]);
    }

    Node *insert(int val) {
        auto a = splitRange(root, val, val);
        if (a[1]) a[1]->addCnt(1);
        else a[1] = new Node(val);
        root = join(a);
        return a[1];
    }

    Node *extract(int val) {
        auto a = splitRange(root, val, val);
        if (a[1]->cnt > 1) a[1]->addCnt(-1);
        else delete a[1], a[1] = nullptr;
        root = join(a);
        return a[1];
    }

    void rangeAdd(int l, int r, int x) {
        auto a = splitRange(root, l, r);
        if (a[1]) a[1]->setAdd(x);
        root = join(a);
    }

    int rangeSum(int l, int r) {
        auto a = splitRange(root, l, r);
        int ans = sum(a[1]);
        root = join(a);
        return ans;
    }

    int getRank(int val) {
        int ans = 1;
        for (Node *p = root; p; ) {
            p->pushDown();
            if (p->val >= val) p = p->s[0];
            else ans += size(p->s[0])+p->cnt, p = p->s[1];
        }
        return ans;
    }

    Node *getValue(int rank) {
        Node *p = root;
        while (1) {
            p->pushDown();
            int lsz = size(p->s[0]);
            if (rank <= lsz) p = p->s[0];
            else if (rank <= lsz+p->cnt) return p;
            else rank -= lsz+p->cnt, p = p->s[1];
        }
    }

    Node *getPre(int val) {
        Node *p = root, *ans = nullptr;
        while (p) {
            p->pushDown();
            if (p->val < val) ans = p, p = p->s[1];
            else p = p->s[0];
        }
        return ans;
    }

    Node *getNxt(int val) {
        Node *p = root, *ans = nullptr;
        while (p) {
            p->pushDown();
            if (p->val > val) ans = p, p = p->s[0];
            else p = p->s[1];
        }
        return ans;
    }

    int size() { return size(root); }
};
```
