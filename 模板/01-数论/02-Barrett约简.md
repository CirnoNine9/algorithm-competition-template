# Barrett 约简

> **用途：** 对运行时确定的正模数 $m$，快速计算 `i64` 整数 $a$ 的有符号余数 `a % m`；用一次高位乘法近似商，从而替代频繁的整数除法。

**常数参考：** 对随机 `i64` 输入执行 $x=10^8$ 次、$mod=10^9+7$ 的运行时取模，原生 `a % mod` 约 $0.19\,\mathrm{s}$，当前 `Barrett` 约 $0.10\,\mathrm{s}$；提高到 $x=5\times10^8$ 次时，原生 `a % mod` 约 $0.99\,\mathrm{s}$，当前 `Barrett` 约 $0.52\,\mathrm{s}$。

| 操作/结构 | 含义 | 复杂度 | 已验证数据范围 | 备注 |
| --- | --- | --- | --- | --- |
| `a % mod`、`a %= mod` | 返回或写回 $a\bmod m$，余数符号与 `a` 一致 | $O(1)$ | $1\le m\le 2^{63}-1$，$-2^{63}\le a\le 2^{63}-1$ | `a %= mod` 修改 `a` |
| `a + mod` | 返回 $a+m$ | $O(1)$ | $-2^{63}\le a\le 2^{63}-1-m$ | 仅为加上模数，结果须能表示为 `i64` |
| `a - mod` | 返回 $a-m$ | $O(1)$ | $-2^{63}+m\le a\le 2^{63}-1$ | 仅为减去模数，结果须能表示为 `i64` |
| `mod - a` | 返回 $m-a$ | $O(1)$ | $m-2^{63}+1\le a\le 2^{63}-1$ | 结果须能表示为 `i64` |
| `mod / a`、`mod % a` | 返回 $m/a$ 或 $m\mathbin{%}a$ | $O(1)$ | $-2^{63}\le a\le 2^{63}-1$ 且 $a\ne0$ | `a=0` 时无定义 |

```cpp
struct Barrett {
    int m;
    u128 B;
    Barrett(int m = 2) : m(m), B((u128(1) << 64) / m) {}
    friend int operator%(int a, const Barrett &mod) {
        u64 x = a < 0 ? -(i128)a : a;
        u64 q = mod.B*x >> 64;
        u64 r = x-q*mod.m;
        if (r >= mod.m) r -= mod.m;
        int ans = r;
        return a < 0 ? -ans : ans;
    }
    friend int operator%=(int &a, const Barrett &mod) { return a = a%mod; }
    friend int operator+(const int a, const Barrett &mod) { return a + mod.m; }
    friend int operator-(const int a, const Barrett &mod) { return a - mod.m; }
    friend int operator-(const Barrett &mod, const int a) { return mod.m - a; }
    friend int operator/(const Barrett &mod, const int a) { return mod.m / a; }
    friend int operator%(const Barrett &mod, const int a) { return mod.m % a; }
} mod;
```
