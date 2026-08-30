# EXGCD 与 EXCRT

> **用途：** `exgcd(a,b,x,y)` 求方程 $ax+by=\gcd(a,b)$ 的一组特解。若得到特解 $(x_0,y_0)$，记 $g=\gcd(a,b)$，则通解为
>
> $$
> x=x_0+k\frac b g,\qquad y=y_0-k\frac a g,\qquad k\in\mathbb Z.
> $$
>
> `excrt(a)` 求同余方程组
>
> $$
> x\equiv a_{i,1}\pmod {a_{i,0}},\qquad 0\le i<n
> $$
>
> 的最小非负解，无解返回 `-1`，空方程组返回 `0`。
>
> **复杂度：** `exgcd` 为 $O(\log\min(a,b))$；合并 $k$ 个同余式约为 $O\!\left(\sum_{i=2}^{k}\log\min(M_{i-1},m_i)\right)$，额外空间 $O(1)$。
>
> **接口：** 每个 `pii` 按 `{模数, 余数}` 存储，要求模数为正且余数在 `[0, 模数)` 内。
>
> **使用条件：** 合并过程中的最小公倍数需要在 `i64` 范围内；`x*(d/g)` 可能超过 `i64`，这一步需要用 `i128` 计算。

```cpp
int exgcd(int a, int b, int &x, int &y) {
    int x1 = 1, x2 = 0, x3 = 0, x4 = 1;
    while (b) {
        int c = a / b;
        tie(x1, x2, x3, x4, a, b) = make_tuple(x3, x4, x1 - x3 * c, x2 - x4 * c, b, a - b * c);
    }
    x = x1, y = x2;
    return a;
}

// x % a[i][0] = a[i][1]
int excrt(vector<pii> &a) {
    int n = a.size();
    if (!n) return 0;
    int preA = a[0][0], preB = a[0][1];
    for (int i = 1; i < n; i++) {
        int x, y;
        int g = exgcd(preA, a[i][0], x, y);
        int d = a[i][1] - preB;
        if (d % g) return -1;
        int m = a[i][0] / g;
        x = (i128)x * (d / g) % m;
        if (x < 0) x += m;
        preB = preA * x + preB;
        preA = m * preA;
    }
    return preB;
}
```
