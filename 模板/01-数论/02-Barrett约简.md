# Barrett 约简

> **用途：** 当模数在运行时确定时，用一次高位乘法近似商，从而替代频繁的整数除法取模。
>
> **复杂度：** 构造 $O(1)$，单次取模期望 $O(1)$，额外空间 $O(1)$。
>
> **使用条件：** 模数 $m$ 满足 $1\le m<2^{64}$；`ull % mod` 处理无符号数。`int %= mod` 与 C++ 有符号余数同号，且要求 $m\le 2^{63}-1$；其中仅 `-(i128)a` 需要 `i128`，用于避免 `a` 为 `i64` 最小值时取反溢出。

```cpp
struct Barrett {
    u128 m, B;
    Barrett(const u128 &m = 2) : m(m), B((u128(1) << 64) / m) {}
    friend ull operator%(ull a, const Barrett &mod) {
        u128 q = (mod.B * a) >> 64;
        u128 r = a - q * mod.m;
        while (r >= mod.m)
            r -= mod.m;
        return r;
    }
    friend int operator%=(int &a, const Barrett &mod) {
        if (a >= 0) return a = (ull)a%mod;
        return a = -(int)((ull)(-(i128)a)%mod);
    }
    friend int operator+(const int a, const Barrett &mod) { return a + mod.m; }
    friend int operator-(const int a, const Barrett &mod) { return a - mod.m; }
    friend int operator-(const Barrett &mod, const int a) { return mod.m - a; }
    friend int operator/(const Barrett &mod, const int a) { return mod.m / a; }
    friend int operator%(const Barrett &mod, const int a) { return mod.m % a; }
} mod;
```
