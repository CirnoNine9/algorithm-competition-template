# Pollard–Rho 质因数分解

> **用途：** 对 64 位整数进行 Miller–Rabin 素性判定，并用 Pollard–Rho 随机算法分解质因数。
>
> **复杂度：** 固定底数的 Miller–Rabin 约为 $O(\log n)$ 次模乘；Pollard–Rho 分解的常用期望估计为 $O(n^{1/4})$，空间复杂度由递归深度与输出因子决定。
>
> **依赖：** `rng`、支持三参数的 `qpow(a,b,mod)`、`i128`。模乘必须使用足够宽的中间类型。

**已验证数据范围：** 正整数 $1\le n\le2^{63}-1$；当前 `i64` 与 `i128` 模乘实现可在此范围内正确判素并分解。

**常数参考（三组数据、三个随机种子，取各用例中位数的最大值）：** 分解 $100$ 个约 $10^{18}$、两个质因子均在 $[9\times10^8,10^9)$ 内的半素数，耗时约 $76.531\,\mathrm{ms}$。

```cpp
const int TEST[] = {2, 325, 9375, 28178, 450775, 9780504, 1795265022};
int lowbit(int x) {return x&-x;}
bool isPrime(int n) {
    if (n < 3 || n % 2 == 0) return n == 2;
    if (n % 3 == 0) return n == 3;
    int t = __lg(lowbit(n-1));
    int u = (n-1)/(1ll<<t);
    for (auto a : TEST) {
        if (a%n == 0) continue;
        a = qpow(a, u, n); // i128
        if (a == 1) continue;
        bool flag = 0;
        for (int i = 1; i <= t; i++, a = (i128)a*a%n) {
            if (a == n-1) {
                flag = 1;
                break;
            }
        }
        if (!flag) return 0;
    }
    return 1;
}

int pollardRho(int n) {
    if (n == 4) return 2;
    int c;
    auto f = [&](int x) {
        return ((i128)x*x+c)%n;
    };
    while (1) { 
        c = rng()%n;
        int i = f(0), j = f(f(0));
        for (int lim = 1; i != j; lim *= 2) {
            if (lim > 128) lim = 128;
            int g = 1;
            for (int k = 0; k < lim && i != j; k++) {
                g = (i128)g*abs(i-j)%n;
                i = f(i), j = f(f(j));  
            }
            g = gcd(g, n);
            if (g == n) break;
            if (g != 1) return g;
        }
    }
    return -1;
}

vector<int> A;
int pp(int n, int cnt = 1) {
    if (n == 1) return 1;
    if (isPrime(n)) {
        while (cnt--) A.push_back(n);
        return n;
    }
    int res = 0;
    int p = pollardRho(n);

    int c = 0;
    while (n%p == 0) n/=p, c++;

    pp(p, c*cnt), pp(n, cnt);

    return res;
}
```
