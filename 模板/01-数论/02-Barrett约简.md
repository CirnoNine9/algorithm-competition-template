# Barrett 约简

> **用途：** 对运行时确定的正模数 $m$，快速计算 `i64` 整数 $a$ 的有符号余数 `a % m`；用一次高位乘法近似商，从而替代频繁的整数除法。
>
> **复杂度：** 构造与单次取模均为 $O(1)$，额外空间 $O(1)$。
>
> **使用条件：** `int`、`ull` 分别为 `i64`、`u64`，$1\le m\le 2^{63}-1$，并已定义 `i128`、`u128`。负数结果与 C++ 原生 `%` 一致；`-(i128)a` 用于避免 `a` 为 `i64` 最小值时取反溢出，`B*x` 使用 `u128`。

```cpp
struct Barrett {
    int m;
    u128 B;
    Barrett(int m = 2) : m(m), B((u128(1) << 64) / m) {}
    friend int operator%(int a, const Barrett &mod) {
        ull x = a < 0 ? -(i128)a : a;
        ull q = (ull)(mod.B*x >> 64);
        ull r = x-q*mod.m;
        if (r >= (ull)mod.m) r -= mod.m;
        int ans = (int)r;
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
