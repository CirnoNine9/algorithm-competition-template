# Python `Fraction` 库

> **用途：** 精确表示和运算有理数，适合比例计算、配方换算以及需要避免浮点误差的场景。
>
> **复杂度：** 取决于分子、分母的大整数位数；构造和四则运算通常还包含 GCD 约分，不能简单视为固定 $O(1)$。

### 创建、约分与属性

```py
from fractions import Fraction

a = Fraction(3, 4)        # 3/4
b = Fraction("2/5")       # 2/5
c = Fraction("0.125")     # 1/8（推荐用字符串）
print(a, b, c)

f = Fraction(6, 8)
print(f)  # 3/4
print(f.numerator)    # 分子
print(f.denominator)  # 分母
```

### 常见运算

```py
x = Fraction(1, 3)
y = Fraction(1, 6)

print(x + y)   # 1/2
print(x - y)   # 1/6
print(x * y)   # 1/18
print(x / y)   # 2
```

### `limit_denominator()`

`Fraction.limit_denominator(max_denominator=1000000)` 返回最接近当前值且分母不超过正整数上限 `max_denominator` 的新分数；上限越小，结果通常越简洁，但误差可能增加。

```py
pi_like = Fraction("3.14159")
print(pi_like.limit_denominator(100))   # 311/99
print(pi_like.limit_denominator(1000))  # 355/113
```

### 与 `float`、`Decimal` 互转

```py
from decimal import Decimal

f1 = Fraction.from_float(0.5)                 # 1/2
f2 = Fraction.from_decimal(Decimal("1.25"))   # 5/4

print(float(Fraction(3, 8)))  # 0.375
print(f1, f2)
```

> **提示：** 需要精确分数时优先使用 `Fraction`，尽量用整数或字符串构造；展示时可用 `limit_denominator()` 得到更直观的近似分数。
