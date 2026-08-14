# 二次剩余：Cipolla

> **用途：** 对质数模数 `mod`，求解 $x^2\equiv n\pmod{mod}$。
>
> **复杂度：** 期望 $O(\log mod)$ 次模乘，额外空间 $O(1)$。
>
> **使用条件：** `int` 为 `i64`，$0\le n<mod$，且 `mod` 必须是质数；`mod=2` 由代码特判，合数模数不适用。
>
> **值域：** 当 $mod\le 2^{31}-1$ 时，当前 `i64` 乘加中间值安全。若允许更大的 `mod`，`qpow` 中的模乘、`a*a`、扩域乘法中的每个乘积及其加法都要先用 `i128` 计算再取模；扩域乘法的中间和可能接近 $2(mod-1)^2$。
>
> **返回：** 无解返回 `-1`；有解时返回两个互为相反数的根中较小的一个；`n=0` 返回 `0`。

```cpp
mt19937_64 rng(time(0));
int mod;
bool check(int n) {
    return qpow(n, (mod-1)/2) == 1;
}

int cipolla(int n) {
    if (mod == 2) return n;
    if (!n) return 0;
    if (!check(n)) return -1;
    int a = rng()%mod;
    while (check((a*a-n+mod)%mod)) a = rng()%mod;
    int t = (mod+1)/2;
    int i2 = (a*a-n+mod)%mod;
    pii ans = {1, 0}, b = {a, 1};
    while (t) {
        if (t%2) ans = {(ans[0]*b[0]+ans[1]*b[1]%mod*i2)%mod, (ans[0]*b[1]+ans[1]*b[0])%mod};
        b = {(b[0]*b[0]+b[1]*b[1]%mod*i2)%mod, (b[0]*b[1]+b[1]*b[0])%mod};
        t/=2;
    }
    if (mod-ans[0] < ans[0]) ans[0] = mod-ans[0];
    return ans[0];
}
```
