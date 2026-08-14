# FFT

> **用途：** 在复数域做离散傅里叶变换，进而实现整数或实数卷积。
>
> **复杂度：** 时间 $O(n\log n)$，额外空间 $O(n)$。
>
> **使用条件：** `n` 应为二的幂，`A.size()` 至少为 `n`；`op=1` 为正变换，`op=-1` 为逆变换。规模或系数较大时要评估浮点误差。

当 $n\le10^5$ 时，可以按系数范围考虑是否把 `double` 换为 `long double`。

```cpp
const double PI = acosl(-1);
using cd = complex<double>;
const cd I_(0, 1);
void fft(vector<cd> &A, int n, int op) {
    static vector<int> r;
    static vector<cd> wn;
    static int pre = 0;
    if ((int)r.size() != n) {
        r.resize(n);
        for (int i = 0; i < n; i++) r[i] = (r[i/2]/2) | ((i%2)?n/2:0);
        wn.resize(n+1);
        for (int i = 0; i <= n; i++) wn[i] = exp(I_ * (2 * PI * i / n * op));
        pre = op;
    }else if (pre != op) {
        reverse(wn.begin(), wn.end());
        pre = op;
    }
    for (int i = 0; i < n; i++) if (i < r[i]) swap(A[i], A[r[i]]);

    for (int i = 2; i <= n; i<<=1) {
        int tmp = n/i;
        for (int j = 0; j < n; j+=i) {
            for (int k = j; k < j+i/2; k++) {
                cd w = wn[(k - j) * tmp];
                cd x = A[k], y = w*A[k+i/2];
                A[k] = x+y;
                A[k+i/2] = x-y;
            }
        }
    }
    if (op == -1) for (auto &x : A) x /= n;
}
```
