# NTT：卡常版

> **用途：** 针对模数 `998244353` 的高性能多项式卷积，使用 radix-4 蝶形、预处理旋转因子、小规模朴素乘法和长度削减优化。
>
> **复杂度：** 单次变换 $O(n\log n)$，卷积 $O((n+m)\log(n+m))$，额外空间 $O(n+m)$。
>
> **使用条件：** 常量 `31`、`23` 与根表均绑定 `998244353`；输入系数应先规范到 `[0,mod)`。

```cpp
void ntt(vector<int> &A, int n, int op) {
    static array<int, 30> root, iroot, rate2, irate2, rate3, irate3;
    static bool ok = 0;
    if (!ok) {
        ok = 1;
        root[23] = 31, iroot[23] = inv(root[23]);
        for (int i = 22; i >= 0; i--) root[i] = root[i+1]*root[i+1]%mod, iroot[i] = iroot[i+1]*iroot[i+1]%mod;

        int prod = 1, iprod = 1;
        for (int i = 0; i <= 21; i++) {
            rate2[i] = root[i+2]*prod%mod, irate2[i] = iroot[i+2]*iprod%mod;
            prod = prod*iroot[i+2]%mod, iprod = iprod*root[i+2]%mod;
        }

        prod = 1, iprod = 1;
        for (int i = 0; i <= 20; i++) {
            rate3[i] = root[i+3]*prod%mod, irate3[i] = iroot[i+3]*iprod%mod;
            prod = prod*iroot[i+3]%mod, iprod = iprod*root[i+3]%mod;
        }
    }

    int h = __lg(n);
    if (op == 1) {
        int len = 0;
        while (len < h) {
            if (h-len == 1) {
                int p = 1<<(h-len-1), rot = 1;
                for (int s = 0; s < (1<<len); s++) {
                    int offset = s<<(h-len);
                    for (int i = 0; i < p; i++) {
                        int l = A[i+offset], r = A[i+offset+p]*rot%mod;
                        A[i+offset] = l+r < mod ? l+r : l+r-mod;
                        A[i+offset+p] = l-r >= 0 ? l-r : l-r+mod;
                    }
                    rot = rot*rate2[__lg((~s)&(-~s))]%mod;
                }
                len++;
            } else {
                int p = 1<<(h-len-2), rot = 1, imag = root[2];
                for (int s = 0; s < (1<<len); s++) {
                    int rot2 = rot*rot%mod, rot3 = rot2*rot%mod;
                    int offset = s<<(h-len);
                    for (int i = 0; i < p; i++) {
                        int mod2 = mod*mod;
                        int a0 = A[i+offset];
                        int a1 = A[i+offset+p]*rot%mod;
                        int a2 = A[i+offset+2*p]*rot2%mod;
                        int a3 = A[i+offset+3*p]*rot3%mod;
                        int a1na3imag = (a1+mod2-a3)%mod*imag%mod, na2 = mod2-a2;
                        A[i+offset] = (a0+a2+a1+a3)%mod;
                        A[i+offset+p] = (a0+a2+(2*mod2-(a1+a3)))%mod;
                        A[i+offset+2*p] = (a0+na2+a1na3imag)%mod;
                        A[i+offset+3*p] = (a0+na2+(mod2-a1na3imag))%mod;
                    }
                    rot = rot*rate3[__lg((~s)&(-~s))]%mod;
                }
                len += 2;
            }
        }
    } else {
        int ivn = inv(n);
        for (auto &x : A) x = x*ivn%mod;

        int len = h;
        while (len) {
            if (len == 1) {
                int p = 1<<(h-len), irot = 1;
                for (int s = 0; s < (1<<(len-1)); s++) {
                    int offset = s<<(h-len+1);
                    for (int i = 0; i < p; i++) {
                        int l = A[i+offset], r = A[i+offset+p];
                        A[i+offset] = l+r < mod ? l+r : l+r-mod;
                        A[i+offset+p] = (l-r+mod)*irot%mod;
                    }
                    irot = irot*irate2[__lg((~s)&(-~s))]%mod;
                }
                len--;
            } else {
                int p = 1<<(h-len), irot = 1, iimag = iroot[2];
                for (int s = 0; s < (1<<(len-2)); s++) {
                    int irot2 = irot*irot%mod, irot3 = irot2*irot%mod;
                    int offset = s<<(h-len+2);
                    for (int i = 0; i < p; i++) {
                        int a0 = A[i+offset], a1 = A[i+offset+p], a2 = A[i+offset+2*p], a3 = A[i+offset+3*p];
                        int x = (mod+a2-a3)%mod*iimag%mod;
                        A[i+offset] = (a0+a1+a2+a3)%mod;
                        A[i+offset+p] = (a0+mod-a1+x)%mod*irot%mod;
                        A[i+offset+2*p] = (a0+a1+2*mod-a2-a3)%mod*irot2%mod;
                        A[i+offset+3*p] = (a0+2*mod-a1-x)%mod*irot3%mod;
                    }
                    irot = irot*irate3[__lg((~s)&(-~s))]%mod;
                }
                len -= 2;
            }
        }
    }
}

void operator*=(vector<int> &A, vector<int> B) {
    int n = A.size(), m = B.size();
    if (!n || !m) {
        A.clear();
        return;
    }
    if (min(n, m) <= 64) {
        vector<int> C(n+m-1);
        for (int i = 0; i < n; i++) for (int j = 0; j < m; j++) C[i+j] = (C[i+j]+A[i]*B[j])%mod;
        A.swap(C);
        return;
    }

    int cnt = 1;
    while (cnt < n+m-1) cnt <<= 1;

    if (n+m-3 <= cnt/2) {
        int al = A.back(), bl = B.back();
        A.pop_back(), B.pop_back();
        vector<int> a = A, b = B;
        A *= B;
        A.resize(n+m-1), A[n+m-2] = al*bl%mod;
        for (int i = 0; i < n-1; i++) A[i+m-1] = (A[i+m-1]+a[i]*bl)%mod;
        for (int i = 0; i < m-1; i++) A[i+n-1] = (A[i+n-1]+b[i]*al)%mod;
        return;
    }

    A.resize(cnt), B.resize(cnt);
    bool same = A == B;
    ntt(A, cnt, 1);
    if (same) B = A;
    else ntt(B, cnt, 1);

    for (int i = 0; i < cnt; i++) A[i] = A[i]*B[i]%mod;
    ntt(A, cnt, -1);
    A.resize(n+m-1);
}
```
