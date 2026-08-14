# 基于值域预处理的 GCD

> **用途：** 当大量询问中的一个参数位于固定值域 $[0,V]$ 时，预处理其三因子分解与小数 GCD 表，把单次欧几里得算法降为常数次查表。
>
> **复杂度：** 预处理时间 $O(V+B^2)$、空间 $O(V+B^2)$，其中 $B\approx\sqrt V$；单次查询 $O(1)$。
>
> **使用条件：** `x` 必须在预处理值域 $[0,N]$ 内；`y` 为不等于 $-2^{63}$ 的 `i64`。

```cpp
const int N = 1e6, B = 1e3; // B = sqrt(N)
vector<signed> prime;
vector<bool> isP(N+9, 1);
array<signed, 3> FAC[N+9]; // 分解成3个<=B或质数的因子
signed GCD[B+9][B+9];
void init() {
    for (int i = 0; i <= B; i++) {
        GCD[i][0] = GCD[0][i] = i;
    }
    for (int i = 1; i <= B; i++) {
        for (int j = i; j <= B; j++) {
            GCD[i][j] = GCD[j][i] = GCD[i][j%i];
        }
    }

    FAC[1] = {1, 1, 1};
    for (int i = 2; i <= N; i++) {
        if (isP[i]) {
            prime.push_back(i);
            FAC[i] = {1, 1, (signed)i};
        }
        for (auto p : prime) {
            if (i*p > N) break;
            isP[i*p] = 0;
            FAC[i*p] = FAC[i];
            *min_element(FAC[i*p].begin(), FAC[i*p].end()) *= p;
            if (i%p == 0) {
                break;
            }
        }
    }
}

template <typename T>
int gcd2(signed x, T y) {
    int tmp = y%x;
    if (isP[x]) return tmp ? 1 : x;
    return GCD[tmp][x];
}

template <typename T>
int gcd(T x, T y) {
    if (y < 0) y = -y;
    if (!x) return y;
    int a0 = gcd2(FAC[x][0], y);
    int a1 = gcd2(FAC[x][1], y/=a0);
    int a2 = gcd2(FAC[x][2], y/=a1);
    return a0*a1*a2;
}
```
