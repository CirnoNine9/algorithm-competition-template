# Python `datetime` 库

> **用途：** 构造、读取、格式化和解析日期、时间与日期时间对象。
>
> **复杂度：** 固定字段的构造和属性读取可视为 $O(1)$；格式化、解析为 $O(L)$，其中 $L$ 是字符串长度。

## 导入

```py
from datetime import date, time
```

## `date`：只表示年月日

创建和获取今天日期：

```py
today = date.today()
print(today)          # 例如：2026-03-12
print(today.year)     # 年
print(today.month)    # 月
print(today.day)      # 日
```

自定义日期：

```py
d = date(2026, 3, 12)
print(d)
```

字符串格式化与解析：

```py
d = date(2026, 3, 12)
print(d.strftime("%Y/%m/%d"))   # 2026/03/12

d2 = date.fromisoformat("2026-03-12")
print(d2)
```

## `time`：只表示时分秒

创建时间对象：

```py
t = time(14, 30, 45)
print(t)             # 14:30:45
print(t.hour)        # 时
print(t.minute)      # 分
print(t.second)      # 秒
```

带微秒的时间：

```py
t = time(14, 30, 45, 123456)
print(t)
```

字符串格式化与解析：

```py
t = time(14, 30, 45)
print(t.strftime("%H:%M:%S"))   # 14:30:45

t2 = time.fromisoformat("14:30:45")
print(t2)
```

## `datetime`：同时表示日期和时间

导入与创建：

```py
from datetime import datetime

dt = datetime(2026, 3, 12, 14, 30, 45)
print(dt)    # 2026-03-12 14:30:45
```

获取当前日期时间：

```py
now = datetime.now()
print(now)
```

格式化与解析：

```py
dt = datetime(2026, 3, 12, 14, 30, 45)
print(dt.strftime("%Y-%m-%d %H:%M:%S"))   # 2026-03-12 14:30:45

dt2 = datetime.strptime("2026-03-12 14:30:45", "%Y-%m-%d %H:%M:%S")
print(dt2)
```

与 `date`、`time` 互转：

```py
d = dt.date()   # 提取 date
t = dt.time()   # 提取 time
print(d, t)

dt3 = datetime.combine(d, t)  # 合并回 datetime
print(dt3)
```

## 使用提示

1. `date` 只处理日期，不包含时分秒。
2. `time` 只处理时间，不包含年月日。
3. 如果需要同时处理日期和时间，使用 `datetime` 类。
