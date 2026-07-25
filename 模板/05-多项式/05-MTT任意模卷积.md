# MTT 任意模卷积

> **用途：** 把系数拆成高低位后用复数 FFT 做卷积，从而支持任意运行时模数。
>
> **复杂度：** 时间 $O((n+m)\log(n+m))$，额外空间 $O(n+m)$。
>
> **使用条件：** 依赖 FFT；输入系数应先规范到 `[0,mod)`。结果正确性还受系数规模、卷积长度与浮点精度影响。

当 $n\le10^5$ 时，可以按误差范围考虑是否把 `double` 换为 `long double`。

```cpp
int mod;
const int M = 1ll << 15;
void operator*=(vector<int> &AA, vector<int> BB) {
    int n = AA.size();
    int m = BB.size();
    int cnt = 1;
    while (cnt < n+m-1) cnt *= 2;
    AA.resize(cnt), BB.resize(cnt);

    vector<cd> A(cnt),B(cnt),C(cnt),D(cnt);
    for (int i = 0; i < cnt; i++) {
        A[i] = cd(AA[i]/M,AA[i]%M);
        C[i] = cd(BB[i]/M,BB[i]%M);
    }
    fft(A,cnt,1);fft(C,cnt,1);

    for (int i = 1; i < cnt; i++) B[i] = conj(A[cnt-i]);
    B[0] = conj(A[0]);
    for (int i = 1; i < cnt; i++) D[i] = conj(C[cnt-i]);
    D[0] = conj(C[0]);
    for (int i = 0; i < cnt; i++) {
        cd aa = (A[i]+B[i])*cd(0.5,0), bb = (A[i]-B[i])*cd(0,-0.5);
        cd cc = (C[i]+D[i])*cd(0.5,0), dd = (C[i]-D[i])*cd(0,-0.5);
        A[i] = aa*cc+cd(0,1)*(aa*dd+bb*cc), B[i] = bb*dd;
    }

    fft(A,cnt,-1);fft(B,cnt,-1);
    AA.resize(n+m-1);
    for (int i = 0; i < n+m-1; i++) {
        int aa = (int)(A[i].real()+0.5)%mod;
        int bb = (int)(A[i].imag()+0.5)%mod;
        int cc = (int)(B[i].real()+0.5)%mod;
        AA[i]=((aa*M*M+bb*M+cc)%mod+mod)%mod;
    }
}
```
