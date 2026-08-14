# Treap

> **用途：** 实现支持重复元素的有序多重集合，包括插入、删除一个值、排名、第 $k$ 小、前驱和后继。
>
> **复杂度：** 随机优先级均匀时，各操作期望 $O(\log n)$，空间 $O(n)$；最坏时间和递归深度均可达 $O(n)$。

```cpp
struct Treap {
    int root = 0;

    struct Node {
        int l, r;
        int val, key;
        int size;
        Node(int v, int k = rand(), int sz = 1) {
            l = r = 0;
            val = v, key = k, size = sz;
        }
    };

    vector<Node> tr;
    Treap() {
        srand(time(0));
        tr.push_back(Node(0, 0, 0));
    }

    int newnode(int val) {
        tr.push_back(Node(val));
        return tr.size() - 1;
    }

    void update(int p) { 
        tr[p].size = tr[tr[p].l].size + tr[tr[p].r].size + 1; 
    }

    void split(int p, int val, int &x, int &y) {
        if (p == 0) x = y = 0;
        else {
            if (tr[p].val <= val) {
                x = p;
                split(tr[p].r, val, tr[p].r, y);
            } else {
                y = p;
                split(tr[p].l, val, x, tr[p].l);
            }
            update(p);
        }
    }

    int merge(int x, int y) {
        if (!x || !y) return x + y;
        if (tr[x].key > tr[y].key) {
            tr[x].r = merge(tr[x].r, y);
            update(x);
            return x;
        } else {
            tr[y].l = merge(x, tr[y].l);
            update(y);
            return y;
        }
    }

    void insert(int val) {
        int x, y;
        split(root, val, x, y);
        root = merge(merge(x, newnode(val)), y);
    }

    void extract(int val) {
        int x, y, z;
        split(root, val, x, z), split(x, val - 1, x, y);
        y = merge(tr[y].l, tr[y].r);
        root = merge(merge(x, y), z);
    }

    int getRank(int val) {
        int x, y;
        split(root, val - 1, x, y);
        int t = tr[x].size + 1;
        root = merge(x, y);
        return t;
    }

    int getValue(int rank) {
        int p = root;
        while (p) {
            if (tr[tr[p].l].size + 1 == rank)
                break;
            else if (tr[tr[p].l].size + 1 > rank)
                p = tr[p].l;
            else {
                rank -= tr[tr[p].l].size + 1;
                p = tr[p].r;
            }
        }
        return tr[p].val;
    }

    int getPre(int val) {
        int x, y;
        split(root, val - 1, x, y);
        int p = x;
        while (tr[p].r)
            p = tr[p].r;
        root = merge(x, y);
        return tr[p].val;
    }

    int getNxt(int val) {
        int x, y;
        split(root, val, x, y);
        int p = y;
        while (tr[p].l) p = tr[p].l;
        root = merge(x, y);
        return tr[p].val;
    }

    int size() { return tr[root].size; }

    void print(int p) { //传root
        if (p == 0)
            return;
        print(tr[p].l);
        cerr << tr[p].val << " ";
        print(tr[p].r);
    }
};
```
