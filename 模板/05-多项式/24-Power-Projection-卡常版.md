# Power Projection：卡常版

> **用途：** 与基础版相同，计算
> $h(i)=[x^N]f(x)g(x)^i$，
> 但将核心消元与 NTT 排布融合，减少通用二元卷积的常数。
>
> **复杂度：** $O(n\log^2 n)$；空间 $O(n)$。
>
> **使用条件：** 强依赖卡常 NTT 中的根 `31`、`fac/ifac` 和模数 `998244353`；核心还会使用 $2\cdot len$ 次单位根，因此这里的 `len` 至多为 $2^{22}$。

**常数参考（ms，中位数，$N=n$）：**

| NTT | $n=3\times10^4$ | $n=5\times10^4$ | $n=10^5$ | $n=2\times10^5$ | $n=3\times10^5$ |
| --- | ---: | ---: | ---: | ---: | ---: |
| 卡常 NTT | 51.576 | 111.901 | 254.805 | 563.179 | 1287.942 |

```cpp
vector<int> powerProjection(vector<int> f, vector<int> g, int n) {
    auto pp0 = [&](vector<int> wt, vector<int> h, int m) -> vector<int> {
        int len = 1;
        while (len < (int)h.size()) len <<= 1;
        h.resize(len), wt.resize(len);
        for (auto &x : h) if (x) x = mod-x;
        reverse(wt.begin(), wt.end());

        vector<int> P = wt, Q = h;
        P.resize(4*len), Q.resize(4*len);

        vector<int> W(len);
        if (len > 1) {
            vector<int> rev(len);
            int lg = __lg(len);
            for (int i = 0; i < len; i++) rev[i] = (rev[i>>1]>>1)|((i&1)<<(lg-1));
            int dw = qpow(inv(31), (1<<23)/(2*len)), w = 1;
            for (auto &i : rev) W[i] = w, w = w*dw%mod;
        } else W[0] = 1;

        for (int k = 1, cur = len; cur > 1; cur >>= 1, k <<= 1) {
            vector<int> fy(k), hx(2*cur), F(2*cur), G(2*cur), f(cur), g(cur);

            auto dy = [&](vector<int> &A, int l, int r) {
                int z = inv(W[k>>1]);
                for (int i = l; i < r; i++) {
                    for (int j = 0; j < k; j++) fy[j] = A[2*cur*j+i];
                    ntt(fy, k, -1);
                    for (int j = 1, w = z; j < k; j++, w = w*z%mod) fy[j] = fy[j]*w%mod;
                    ntt(fy, k, 1);
                    for (int j = 0; j < k; j++) A[2*cur*(k+j)+i] = fy[j];
                }
            };

            auto fx = [&](vector<int> &A, int l, int r) {
                for (int j = l; j < r; j++) {
                    for (int i = 0; i < 2*cur; i++) hx[i] = A[2*cur*j+i];
                    ntt(hx, 2*cur, 1);
                    for (int i = 0; i < 2*cur; i++) A[2*cur*j+i] = hx[i];
                }
            };

            if (cur <= k) {
                dy(P, 0, cur), dy(Q, 1, cur);
                fx(P, 0, 2*k), fx(Q, 0, 2*k);
            } else {
                fx(P, 0, k), fx(Q, 0, k);
                dy(P, 0, 2*cur), dy(Q, 0, 2*cur);
            }

            for (int i = 0; i < 2*cur*k; i++) if (++Q[i] == mod) Q[i] = 0;
            for (int i = 2*cur*k; i < 4*cur*k; i++) if (--Q[i] < 0) Q[i] += mod;

            for (int j = 0; j < 2*k; j++) {
                for (int i = 0; i < 2*cur; i++) F[i] = P[2*cur*j+i], G[i] = Q[2*cur*j+i];
                for (int i = 0; i < cur; i++) {
                    f[i] = W[i]*((F[2*i]*G[2*i+1]-F[2*i+1]*G[2*i])%mod+mod)%mod;
                    g[i] = G[2*i]*G[2*i+1]%mod;
                }
                ntt(f, cur, -1), ntt(g, cur, -1);
                fill(f.begin()+cur/2, f.end(), 0), fill(g.begin()+cur/2, g.end(), 0);
                for (int i = 0; i < cur; i++) P[cur*j+i] = f[i], Q[cur*j+i] = g[i];
            }

            fill(P.begin()+2*cur*k, P.end(), 0), fill(Q.begin()+2*cur*k, Q.end(), 0);
            for (int j = 0; j < 4*k; j++) Q[cur*j] = 0;
        }

        int k = len;
        for (int i = 0; i < k; i++) P[i] = P[2*i];
        P.resize(k);

        int c = inv(k);
        for (auto &x : P) x = x*c%mod;
        ntt(P, k, -1);
        reverse(P.begin(), P.end());
        P.resize(m+1);
        return P;
    };

    f.resize(g.size());
    reverse(f.begin(), f.end());
    int c = g[0];
    g[0] = 0;
    vector<int> A;
    if (g.size() == 1) {
        A.resize(n+1);
        A[0] = f[0];
    } else A = pp0(f, g, n);

    if (c) {
        for (int i = 0; i <= n; i++) A[i] = A[i]*ifac(i)%mod;
        vector<int> B(n+1);
        for (int i = 0, pw = 1; i <= n; i++, pw = pw*c%mod) B[i] = pw*ifac(i)%mod;
        A *= B, A.resize(n+1);
        for (int i = 0; i <= n; i++) A[i] = A[i]*fac(i)%mod;
    }
    return A;
}
```
