# Pohlig–Hellman

> **用途：** 在有限域乘法群的阶可以分解为小质因子幂时求离散对数；当前版本固定求解 $3^x\equiv a\pmod{998244353}$。
>
> **复杂度：** 当前每一位直接枚举 $0\le x<p$，约为 $O\!\left(\log(mod)\sum p_ie_i\right)$ 次字运算；空间 $O(\sum e_i)$。若最大质因子很大，通常需要把枚举替换为 BSGS。
>
> **依赖：** `qpow`、`excrt`，以及 `mod-1` 的完整质因数分解。

```cpp
const int mod = 998244353, phi = mod-1;
const int g = 3;
const pii factor[] = {{2, 23}, {7, 1}, {17, 1}};

int ln(int a) {
    vector<pii> vt;
    for (auto [p, e] : factor) {
        int pe = qpow(p, e);
        int s = 0;
        int B = qpow(g, phi / p);

        for (int i = 0, pw = 1; i < e; i++, pw *= p) {
            int A = qpow(a, phi / (p * pw));
            int C = qpow(g, s * phi / (p * pw));
            for (int x = 0; x < p; x++) {
                if (qpow(B, x) * C % mod == A) {
                    s += pw * x;
                    break;
                }
            }
        }
        vt.push_back({pe, s});
    }
    return excrt(vt);
}
```
