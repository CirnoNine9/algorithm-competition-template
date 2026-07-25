# Link–Cut Tree

> **用途：** 维护动态森林的连边、删边、换根、连通性和路径异或值；`split(x,y)` 后，节点 `y` 的聚合值表示路径 $x\to y$。
>
> **复杂度：** 每次 `access`、`makeRoot`、`findRoot`、`link`、`cut`、路径暴露或点修改的均摊复杂度为 $O(\log n)$；空间 $O(n)$。
>
> **聚合：** 当前 `pushUp` 使用异或；更换维护信息时需要同步修改节点字段、合并和懒标记。

```cpp
struct Splay {
    #define ls(u) tr[u].s[0]
    #define rs(u) tr[u].s[1]
    #define fa(u) tr[u].p
    int n;
    struct Node {
        pii s;
        int p;
        int val, w;
        int lazy;
    };
    vector<Node> tr;

    void pushUp(int u) {
        if (!u) return;
        tr[u].val = tr[ls(u)].val^tr[rs(u)].val^tr[u].w;
    }

    void setTag(int u, int x) {
        if (u == 0) return;
        swap(ls(u), rs(u));
        tr[u].lazy ^= x;
    }

    void pushDown(int u) {
        if (tr[u].lazy == 0) return;
        setTag(ls(u), tr[u].lazy);
        setTag(rs(u), tr[u].lazy);
        tr[u].lazy = 0;
    }

    bool isRoot(int u) {
        return ls(fa(u)) != u && rs(fa(u)) != u; 
    }

    void pushAll(int u) {
        if (!isRoot(u)) pushAll(fa(u));
        pushDown(u);
    }

    void rotate(int x) {
        int y = fa(x), z = fa(y), k = rs(y) == x, w = tr[x].s[k^1];
        if (!isRoot(y)) tr[z].s[rs(z)==y] = x;
        tr[y].s[k] = w, tr[x].s[k^1] = y;
        fa(w) = y, fa(y) = x, fa(x) = z;
        pushUp(y), pushUp(x), pushUp(z);
    }

    void splay(int x) {
        pushAll(x);
        while (!isRoot(x)) {
            int y = fa(x), z = fa(y);
            if (!isRoot(y)) ((rs(z)==y)^(rs(y)==x)) ? rotate(x) : rotate(y);
            rotate(x);
        }
    }

    int access(int x) {
        int y = 0;
        while (x) {
            splay(x);
            rs(x) = y;
            pushUp(x);
            y = x, x = fa(x);
        }
        return y;
    }

    void makeRoot(int x) {
        access(x);
        splay(x);
        setTag(x,1);
    }

    int findRoot(int x) {
        access(x);
        splay(x);
        while (ls(x)) {
            pushDown(x);
            x = ls(x);
        }
        splay(x);
        return x; 
    }

    void split(int x, int y) {
        makeRoot(x);
        access(y);
        splay(y);
    }

    void link(int x, int y) {
        makeRoot(x);
        if (findRoot(y) == x) return;
        fa(x) = y;
    }
    
    void setValue(int x, int w) {
        splay(x);
        tr[x].w = w;
        pushUp(x);
    }

    void cut(int x, int y) {
        makeRoot(x);
        if (findRoot(y) == x && fa(y) == x && !ls(y)) {
            fa(y) = rs(x) = 0;
            pushUp(x);
        }
    }

    Splay(int n_) {
        n = n_;
        tr.resize(n+1);
    }
};
```
