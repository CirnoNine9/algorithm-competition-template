# Python `math` 库常用函数

> **用途：** 提供取整、初等函数、三角函数、组合计数、距离和高精度浮点求和。
>
> **复杂度：** 普通浮点标量函数通常可视为常数时间；`factorial`、`comb`、`perm` 的开销随输入值和大整数位数增长；`fsum` 对 $n$ 个元素为 $O(n)$。

### 取整、幂与对数

```py
import math

print(math.ceil(3.2))    # 向上取整：4
print(math.floor(3.8))   # 向下取整：3
print(math.trunc(-3.9))  # 截断取整：-3
print(math.fabs(-2.5))   # 绝对值：2.5

print(math.sqrt(9))        # 平方根：3.0
print(math.pow(2, 3))      # 2^3：8.0
print(math.exp(1))         # e^1
print(math.log(8, 2))      # 以2为底的对数：3.0
print(math.log10(1000))    # 常用对数：3.0
```

### 三角函数与角度转换

```py
rad = math.radians(180)    # 角度 -> 弧度
deg = math.degrees(math.pi)  # 弧度 -> 角度
print(rad, deg)

print(math.sin(math.pi / 2))  # 1.0
print(math.cos(0))            # 1.0
print(math.tan(math.pi / 4))  # 1.0（近似）

print(math.pi)   # 圆周率
print(math.e)    # 自然常数 e
```

### 阶乘、最大公约数、组合数

```py
print(math.factorial(5))  # 120
print(math.gcd(12, 18))   # 6
print(math.comb(5, 2))    # 10（组合数）
print(math.perm(5, 2))    # 20（排列数）
```

### 距离与求和

```py
print(math.hypot(3, 4))        # 5.0，勾股计算
print(math.fsum([0.1, 0.1, 0.1]))  # 高精度浮点求和
```

> **提示：** 几何、对数和三角函数优先使用 `math`，高精度浮点累加使用 `math.fsum()`；金额计算应使用 `Decimal`，不要依赖二进制浮点。
