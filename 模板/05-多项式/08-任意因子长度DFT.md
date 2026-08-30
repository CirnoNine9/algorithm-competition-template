# 任意因子长度 DFT

> **用途：** 在 `998244353` 下处理长度不必为二次幂、但整除 `mod-1` 的循环卷积；按因子 $2$、$7$、$17$ 递归分解变换长度。
>
> **复杂度：** 对当前平滑长度为 $O(n\log n)$；小规模分支使用 $O(n^2)$ 朴素 DFT。额外空间 $O(n)$，递归中会产生临时向量。
>
> **使用条件：** 必须满足 `n | (mod-1)`；`G`、`Gi` 和基础 NTT 与当前模数匹配。

```cpp
void dftNaive(vector<int> &A, int op) {
    int n = A.size();
    if (n <= 1) return;

    int wn = qpow(op == 1 ? G : Gi, (mod-1)/n);
    vector<int> B(n);

    for (int i = 0; i < n; i++) {
        int wi = qpow(wn, i), pw = 1;
        for (int j = 0; j < n; j++) {
            B[i] = (B[i]+A[j]*pw)%mod;
            pw = pw*wi%mod;
        }
    }

    if (op == -1) {
        int ivn = inv(n);
        for (auto &x : B) x = x*ivn%mod;
    }
    A.swap(B);
}

void dft(vector<int> &A, int op = 1) {
    int n = A.size();
    if (!n) return;
    assert((mod-1)%n == 0), assert(op == 1 || op == -1);

    auto dfs = [&](auto &&self, vector<int> &A, int op) -> void {
        int n = A.size();
        if (n <= 1) return;
        if ((n&-n) == n) {
            ntt(A, n, op);
            return;
        }
        if (n <= 64) {
            dftNaive(A, op);
            return;
        }

        int r = n%17 == 0 ? 17 : 7;

        int m = n/r;
        vector<int> B(n), t(max(r, m));

        for (int x = 0; x < m; x++) {
            t.resize(r);
            for (int y = 0; y < r; y++) t[y] = A[x+m*y];
            self(self, t, op);
            for (int s = 0; s < r; s++) B[s*m+x] = t[s];
        }

        int wn = qpow(op == 1 ? G : Gi, (mod-1)/n);
        for (int s = 0; s < r; s++) {
            int step = qpow(wn, s), pw = 1;
            t.resize(m);

            for (int x = 0; x < m; x++) {
                t[x] = B[s*m+x]*pw%mod;
                pw = pw*step%mod;
            }

            self(self, t, op);

            for (int x = 0; x < m; x++) A[s+r*x] = t[x];
        }
    };

    dfs(dfs, A, op);
}
```
