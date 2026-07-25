# 二元 NTT

> **用途：** 对系数矩阵表示的二元多项式 $f(x,y)$ 先按行、再按列做 NTT。
>
> **复杂度：** 时间 $O(nm(\log n+\log m))$，额外空间 $O(n)$；矩阵本身占用 $O(nm)$。
>
> **使用条件：** 行列数 `n`、`m` 都必须满足所用 NTT 的长度条件，矩阵必须是完整的 `n×m` 矩形。

```cpp
void ntt2D(vector<vector<int>> &A, int n, int m, int op) {
    for (int i = 0; i < n; i++) ntt(A[i], m, op);
    vector<int> t1(n);
    for (int j = 0; j < m; j++) {
        for (int i = 0; i < n; i++) t1[i] = A[i][j];
        ntt(t1, n, op);
        for (int i = 0; i < n; i++) A[i][j] = t1[i];
    }
}
```
