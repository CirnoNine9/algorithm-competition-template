# Power Projection：基础版

> **用途：** 对
> $h(i)=[x^N]f(x)g(x)^i$，
> 批量求出 $i=0,1,\ldots,n$ 的结果。
>
> **复杂度：** $O(n\log^2 n)$。
>
> **依赖：** 二元多项式卷积、多项式求逆、阶乘与逆阶乘。

**常数参考（ms，中位数，$N=n$）：**

| NTT | $n=3\times10^4$ | $n=5\times10^4$ | $n=10^5$ | $n=2\times10^5$ | $n=3\times10^5$ |
| --- | ---: | ---: | ---: | ---: | ---: |
| 普通 NTT | 328.086 | 813.936 | 1986.206 | 4683.283 | 10941.358 |
| 卡常 NTT | 282.594 | 546.379 | 1397.206 | 3021.494 | 6151.738 |

```cpp
vector<int> powerProjection(vector<int> f, vector<int> g, int n) {
    int C = g[0];
    g[0] = 0;

    f.resize(g.size());
    int N = g.size()-1;
    vector P(f.size(), vector<int>(2)), Q(g.size(), vector<int>(2));
    for (int i = 0; i < (int)f.size(); i++) P[i][0] = f[i];
    Q[0][0] = 1;
    for (int i = 1; i < (int)g.size(); i++) Q[i][1] = (mod-g[i])%mod;
    int i;
    for (; N; N /= 2) {
        auto H = Q;
        for (i = 1; i < (int)H.size(); i+=2) for (auto &x : H[i]) if (x) x = mod-x;
        P *= H, Q *= H;
        for (i = 0; i*4 < (int)P.size(); i++) P[i].swap(P[i*2+N%2]);
        P.resize(i);
        for (i = 0; i*4 < (int)Q.size(); i++) Q[i].swap(Q[i*2]);
        Q.resize(i);
    }

    Q[0].resize(n+1);
    P[0] *= inv(Q[0]);
    P[0].resize(n+1);

    vector<int> A(n+1);
    for (int i = 0, j = 1; i <= n; i++, j = j*C%mod) A[i] = j*ifac(i)%mod, P[0][i] = P[0][i]*ifac(i)%mod; 
    A *= P[0];
    A.resize(n+1);
    for (int i = 0; i <= n; i++) (A[i] *= fac(i)) %= mod;

    return A;
}
```
