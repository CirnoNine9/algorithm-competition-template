# 二次剩余：Cipolla

> **用途：** 对奇质数模数 `mod`，求解 $x^2\equiv n\pmod{mod}$。
>
> **复杂度：** 期望 $O(\log mod)$ 次模乘，额外空间 $O(1)$。
>
> **返回：** 无解返回 `-1`；有解时返回两个互为相反数的根中较小的一个；`n=0` 返回 `0`。

```cpp
mt19937_64 rng(time(0));
int mod;
bool check(int n) {
    return qpow(n,(mod-1)/2) == 1;
}

int cipolla(int n) {
    if (!n) return 0;
    if (!check(n)) return -1;
    int a = rng()%mod;
    while (check((a*a-n+mod)%mod)) a = rng()%mod;
    int t = (mod+1)/2;
    int i2 = (a*a-n+mod)%mod;
    pii ans = {1,0};
    pii b = {a,1};
    while (t) {
        if (t%2) ans = {(ans[0]*b[0]+ans[1]*b[1]%mod*i2)%mod,(ans[0]*b[1]+ans[1]*b[0])%mod};
        b = {(b[0]*b[0]+b[1]*b[1]%mod*i2)%mod,(b[0]*b[1]+b[1]*b[0])%mod};
        t/=2;
    }
    if (mod-ans[0] < ans[0]) ans[0] = mod-ans[0];
    return ans[0];
}
```
