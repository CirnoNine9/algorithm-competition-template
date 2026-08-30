# Pohlig–Hellman

> **用途：** 在有限域乘法群的阶可以分解为小质因子幂时求离散对数；当前版本固定求解 $3^x\equiv a\pmod{998244353}$。
>
> **复杂度：** 当前每一位直接枚举 $0\le x<p$，约为 $O\!\left(\log(mod)\sum p_ie_i\right)$ 次字运算；空间 $O(\sum e_i)$。若最大质因子很大，通常需要把枚举替换为 BSGS。
>
> **依赖：** `qpow`、`excrt`，以及 `mod-1` 的完整质因数分解。

**已验证数据范围：** 固定 $mod=998244353$、$g=3$；对任意 $1\le a<998244353$，当前 `i64` 实现返回唯一的 $0\le x<998244352$，满足 $3^x\equiv a\pmod{998244353}$。

**常数参考：** 对 $10^5$ 个随机的 $1\le a<998244353$ 逐个调用 `ln(a)`，耗时约 $0.26\,\mathrm{s}$。

```cpp
const int mod = 998244353, phi = mod-1;
const int g = 3;
const pii factor[] = {{2, 23}, {7, 1}, {17, 1}};

int ln(int a) {
    vector<pii> vt;
    for (auto [p, e] : factor) {
        int s = 0, pw = 1;
        int B = qpow(g, phi / p);

        for (int i = 0; i < e; i++, pw *= p) {
            int A = qpow(a, phi / (p * pw));
            int C = qpow(g, s * phi / (p * pw));
            for (int x = 0; x < p; x++) {
                if (qpow(B, x) * C % mod == A) {
                    s += pw * x;
                    break;
                }
            }
        }
        vt.push_back({pw, s});
    }
    return excrt(vt);
}
```
