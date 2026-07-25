# EXGCD 与 EXCRT

> **用途：** `exgcd` 求解 Bézout 系数；`excrt` 合并模数不要求互质的同余方程组。
>
> **复杂度：** `exgcd` 为 $O(\log\min(a,b))$；合并 $k$ 个同余式约为 $O\!\left(\sum_{i=2}^{k}\log\min(M_{i-1},m_i)\right)$，额外空间 $O(1)$。
>
> **接口：** 每个 `pii` 按 `{模数, 余数}` 存储。

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
    int preA = a[0][0], preB = a[0][1];
    for (int i = 1; i < n; i++) {
        int x, y;
        int g = exgcd(preA, a[i][0], x, y);
        x *= (a[i][1] - preB) / g; // 这边无法整除就是无解
        x = (x % (a[i][0] / g) + a[i][0] / g) % (a[i][0] / g);
        preB = preA * x + preB;
        preA = a[i][0] / g * preA;
    }
    return (preB % preA + preA) % preA;
}
```
