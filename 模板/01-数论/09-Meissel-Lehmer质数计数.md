# Meissel–Lehmer 质数计数

> **用途：** 计算 $\pi(n)$，即不超过 $n$ 的质数个数，适合 $n$ 远大于普通筛法上限的场景。
>
> **复杂度：** 当前实现粗略按 $O(n^{2/3})$ 估计，预处理空间主要是 `phi[10^6][60]`；参数配置可处理约 $10^{12}$ 的输入。
>
> **使用条件：** 需要先调用 `init()`，且质数表必须覆盖查询过程中需要的平方根范围。

$$
\pi(x) = \phi(x,a)+a-1-\sum\limits_{i=a+1}^{b}\left(\pi\left(\frac{x}{p_i}\right) - \pi(p_i)+1\right)
$$

$$
\phi(x,a) =
\begin{cases}
x, & a=0,\\
\phi(x,a-1)-\phi\left(\left\lfloor x/p_a\right\rfloor,a-1\right), & a\ne0.
\end{cases}
$$

```cpp
const int N = 4e6; //根号值域上限
const double eps = 1e-6;
vector<bool> isP(N+9,1);
vector<int> prime,pi(N+9);
signed phi[1000000][60]; //预处理
void init() {
    isP[0] = isP[1] = 0;
    for (int i = 2; i <= N; i++) {
        if (isP[i]) {
            prime.push_back(i);
        }
        for (auto p : prime) {
            if (i*p > N) break;
            isP[i*p] = 0;
            if (i%p == 0) {
                break;
            }
        }
        pi[i] = pi[i-1]+isP[i];
    }
    for (int i = 1; i < (int)1e6; i++) {
        phi[i][0] = i;
        for (int j = 1; j < 60; j++) {
            phi[i][j] = phi[i][j-1]-phi[i/prime[j-1]][j-1];
        }
    }
}
int calPhi(int n, int a) {
    if (a == 0) return n;
    if (n < (int)1e6 && a < 60) return phi[n][a];
    if (n <= N && prime[a-1] * prime[a-1] >= n) return max(0ll, pi[n]-a+1);
    return calPhi(n,a-1)-calPhi(n/prime[a-1],a-1);
}
int calPi(int n) {
    if (n <= N) return pi[n];
    int a = calPi(powl(n,1./3)+eps);
    int res = a-1+calPhi(n,a);
    for (int i = a+1; ; i++) {
        int p = prime[i-1];
        if (p*p > n) break;
        res -= calPi(n/p)-calPi(p)+1;
    }
    return res;
}
```
