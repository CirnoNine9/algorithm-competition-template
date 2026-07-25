# Barrett 约简

> **用途：** 当模数在运行时确定时，用一次高位乘法近似商，从而替代频繁的整数除法取模。
>
> **复杂度：** 构造 $O(1)$，单次取模期望 $O(1)$，额外空间 $O(1)$。
>
> **使用条件：** 被取模数的接口类型是 `ull`；模数必须为正，并注意当前重载对负数不提供数学意义上的规范剩余。

```cpp
struct Barrett {
    typedef unsigned __int128 LL;
    LL m, B;
    Barrett(const LL &m = 2) : m(m), B((LL(1) << 64) / m) {}
    friend ull operator%(ull a, const Barrett &mod) {
        LL q = (mod.B * a) >> 64;
        LL r = a - q * mod.m;
        while (r >= mod.m)
            r -= mod.m;
        return r;
    }
    friend ull operator%=(int &a, const Barrett &mod) { return a = a%mod;}
    friend int operator+(const int a, const Barrett &mod) { return a + mod.m; }
    friend int operator-(const int a, const Barrett &mod) { return a - mod.m; }
    friend int operator-(const Barrett &mod, const int a) { return mod.m - a; }
    friend int operator/(const Barrett &mod, const int a) { return mod.m / a; }
    friend int operator%(const Barrett &mod, const int a) { return mod.m % a; }
} mod;
```
