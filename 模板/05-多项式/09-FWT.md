# FWT：OR、AND、XOR 卷积

> **用途：** 计算下标按按位 OR、AND 或 XOR 合并的卷积。
>
> **复杂度：** 每种变换与卷积均为 $O(n\log n)$，空间 $O(n)$；`n` 是补齐后的二次幂长度。
>
> **使用条件：** 两个卷积输入必须落在同一个下标全集中，重载会将二者补到相同长度；XOR 逆变换要求 `2` 在模数下可逆。

OR：

$$
\operatorname{FWT}(a)_i=\sum_{i\mid j=i}a_j.
$$

AND：

$$
\operatorname{FWT}(a)_i=\sum_{i\mathbin{\&}j=i}a_j.
$$

XOR：

$$
\operatorname{FWT}(a)_i
=\sum_{i\circ j=0}a_j-\sum_{i\circ j=1}a_j,
\qquad
a\circ b=\operatorname{popcount}(a\mathbin{\&}b)\mathbin{\&}1.
$$

```cpp
void Or(vector<int> &a, int type) {
    int m = a.size(), n = 1;
    while (n < m) n *= 2;
    a.resize(n);
    for (int x = 2; x <= n; x <<= 1) {
        int k = x >> 1;
        for (int i = 0; i < n; i += x) {
            for (int j = 0; j < k; j++) {
                (a[i+j+k] += a[i+j]*type+mod) %= mod;
            }
        }
    }
}

vector<int> operator|(vector<int> a, vector<int> b) {
    a.resize(max(a.size(), b.size())), b.resize(a.size());
    Or(a, 1), Or(b, 1);
    int n = a.size();
    for (int i = 0; i < n; i++) (a[i] *= b[i]) %= mod;
    Or(a, -1);
    return a;
}

void And(vector<int> &a, int type) {
    int m = a.size(), n = 1;
    while (n < m) n *= 2;
    a.resize(n);
    for (int x = 2; x <= n; x <<= 1) {
        int k = x >> 1;
        for (int i = 0; i < n; i += x) {
            for (int j = 0; j < k; j++) {
                (a[i+j] += a[i+j+k]*type+mod) %= mod;
            }
        }
    }
}

vector<int> operator&(vector<int> a, vector<int> b) {
    a.resize(max(a.size(), b.size())), b.resize(a.size());
    And(a, 1), And(b, 1);
    int n = a.size();
    for (int i = 0; i < n; i++) (a[i] *= b[i]) %= mod;
    And(a, -1);
    return a;
}

void Xor(vector<int> &a, int type) {
    int m = a.size(), n = 1;
    while (n < m) n *= 2;
    a.resize(n);
    for (int x = 2; x <= n; x <<= 1) {
        int k = x >> 1;
        for (int i = 0; i < n; i += x) {
            for (int j = 0; j < k; j++) {
                (a[i+j] += a[i+j+k]) %= mod, (a[i+j+k] = a[i+j]-a[i+j+k]*2+2*mod) %= mod;
                (a[i+j] *= type) %= mod, (a[i+j+k] *= type) %= mod;
            }
        }
    }
}

vector<int> operator^(vector<int> a, vector<int> b) {
    a.resize(max(a.size(), b.size())), b.resize(a.size());
    Xor(a, 1), Xor(b, 1);
    int n = a.size();
    for (int i = 0; i < n; i++) (a[i] *= b[i]) %= mod;
    Xor(a, inv(2));
    return a;
}
```
