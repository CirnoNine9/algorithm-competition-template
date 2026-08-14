# NTT：基础版

> **用途：** 在 NTT 友好模数下精确计算多项式卷积，避免 FFT 的浮点误差。
>
> **复杂度：** 单次变换 $O(n\log n)$，卷积 $O((n+m)\log(n+m))$，额外空间 $O(n+m)$。
>
> **使用条件：** 变换长度必须为二的幂且整除 `mod-1`；`G` 是原根，`Gi` 是其逆元。`operator*=` 覆盖左操作数，`operator*` 返回乘积。

```cpp
const int G = 3,Gi = qpow(G,mod-2);

void ntt(vector<int> &A,int n,int op) {
    static vector<int> r, g(1,1);
    if ((int)r.size() != n) {
        r.resize(n);
        for (int i = 0; i < n; i++) r[i] = (r[i/2]/2) | ((i%2)?n/2:0);
    }
    for (int i = 0; i < n; i++) if (i < r[i]) swap(A[i],A[r[i]]);
    if ((int)g.size() < n/2+1) g.resize(n/2+1);
    for (int i = 2; i <= n; i<<=1) {
        g[1] = qpow(op == 1 ? G : Gi,(mod-1)/i);
        for (int j = 2; j < i/2; j++) g[j] = g[j-1]*g[1]%mod;
        for (int j = 0; j < n; j+=i) {
            for (int k = j; k < j+i/2; k++) {
                int x = A[k], y = g[k-j]*A[k+i/2]%mod;
                A[k] = (x+y);
                if (A[k] >= mod) A[k] -= mod;
                A[k+i/2] = (x-y+mod);
                if (A[k+i/2] >= mod) A[k+i/2] -= mod;
            }
        }
    }
    if (op == -1) for (auto &x : A) x = x*inv(n)%mod;
}

void operator*=(vector<int> &A, vector<int> B) {
    int n = A.size(), m = B.size(), cnt = 1;
    if (!n || !m) return A.clear();
    while (cnt < n+m-1) cnt<<=1;
    A.resize(cnt),B.resize(cnt);
    ntt(A,cnt,1);ntt(B,cnt,1);
    for (int i = 0; i < cnt; i++) {
        (A[i] *= B[i]) %= mod;
    }
    ntt(A,cnt,-1);
    A.resize(n+m-1);
}

vector<int> operator*(vector<int> A, vector<int> B) {A *= B; return A;}
```
