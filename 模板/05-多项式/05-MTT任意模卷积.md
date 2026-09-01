# MTT 任意模卷积

> **用途：** 分别在三个 NTT 友好素数下计算卷积，再用 Garner 算法合并到运行时模数 $mod$。

| 操作/结构 | 含义 | 复杂度 | 备注 |
| --- | --- | --- | --- |
| `operator*=` | 将左操作数覆盖为任意模卷积 | $O((n+m)\log(n+m))$ | 空输入得到空结果 |
| `operator*` | 返回任意模卷积 | $O((n+m)\log(n+m))$ | 输入系数应规范到 $[0,mod)$ |

依赖的 `qpow`、`ntt` 与单模 `operator*` 不在下方重复展开，只需在原函数定义前添加 `template<int mod>`，并通过 `qpow<mod>`、`ntt<mod>`、`operator*<mod>` 调用。

现有卡常版 NTT 不能直接填入：其中的 `31`、`23` 与根表绑定 $998244353$，而 `p0`、`p1`、`p2` 的最高二次单位根层数分别为 $21$、$23$、$22$；必须将根初始化改为按模数配置后才能使用。

**已验证数据范围：** $2\le mod\le10^9+7$，$n,m\le10^6$，补齐后的变换长度不超过 $2^{21}$；此时整数卷积系数小于三个素数之积，结果严格正确。

**常数参考（ms，中位数，$n=m$，$mod=10^9+7$）：** 单模卷积使用基础版 NTT，逆元表按各模数分别初始化。

| 实现 | $10^5$ | $2\times10^5$ | $5\times10^5$ | $10^6$ |
| --- | ---: | ---: | ---: | ---: |
| 三模 NTT + Garner | 45.027 | 109.749 | 252.664 | 571.363 |

```cpp
int mod;

template<int mod>
int qpow(int a, int n);

template<int mod>
void ntt(vector<int> &A, int n, int op);

template<int mod>
vector<int> operator*(vector<int> A, vector<int> B);

void operator*=(vector<int> &A, vector<int> B) {
    const int p0 = 1004535809, p1 = 998244353, p2 = 985661441;
    int n = A.size(), m = B.size();
    if (!n || !m) return A.clear();
    auto c0 = operator*<p0>(A, B), c1 = operator*<p1>(A, B), c2 = operator*<p2>(A, B);
    static const int iv01 = qpow<p1>(p0, p1-2);
    static const int iv02 = qpow<p2>(p0, p2-2);
    static const int iv12 = qpow<p2>(p1, p2-2);
    int w1 = p0%mod, w2 = w1*(p1%mod)%mod;
    A.resize(n+m-1);
    for (int i = 0; i < n+m-1; i++) {
        int x1 = (c1[i]-c0[i])%p1;
        if (x1 < 0) x1 += p1;
        x1 = x1*iv01%p1;
        int x2 = (c2[i]-c0[i])%p2;
        if (x2 < 0) x2 += p2;
        x2 = x2*iv02%p2;
        x2 = (x2-x1)%p2;
        if (x2 < 0) x2 += p2;
        x2 = x2*iv12%p2;
        A[i] = (c0[i]%mod+x1*w1%mod+x2*w2%mod)%mod;
    }
}

vector<int> operator*(vector<int> A, vector<int> B) {A *= B; return A;}
```
