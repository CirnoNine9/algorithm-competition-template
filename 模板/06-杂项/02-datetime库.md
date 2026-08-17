# Python `datetime` 库

> **用途：** 构造、读取、格式化和解析日期、时间与日期时间对象。
>
> **复杂度：** 固定字段的构造和属性读取可视为 $O(1)$；格式化、解析为 $O(L)$，其中 $L$ 是字符串长度。

### `date`：只表示年月日

```py
from datetime import date

today = date.today()
print(today)          # 例如：2026-03-12
print(today.year)     # 年
print(today.month)    # 月
print(today.day)      # 日

d = date(2026, 3, 12)
print(d)
print(d.strftime("%Y/%m/%d"))   # 2026/03/12

d2 = date.fromisoformat("2026-03-12")
print(d2)
```

### `time`：只表示时分秒

```py
from datetime import time

t = time(14, 30, 45)
print(t)             # 14:30:45
print(t.hour)        # 时
print(t.minute)      # 分
print(t.second)      # 秒

t = time(14, 30, 45, 123456)
print(t)
print(t.strftime("%H:%M:%S"))   # 14:30:45

t2 = time.fromisoformat("14:30:45")
print(t2)
```

### `datetime`：同时表示日期和时间

```py
from datetime import datetime

dt = datetime(2026, 3, 12, 14, 30, 45)
print(dt)    # 2026-03-12 14:30:45

now = datetime.now()
print(now)
print(dt.strftime("%Y-%m-%d %H:%M:%S"))   # 2026-03-12 14:30:45

dt2 = datetime.strptime("2026-03-12 14:30:45", "%Y-%m-%d %H:%M:%S")
print(dt2)

d = dt.date()   # 提取 date
t = dt.time()   # 提取 time
print(d, t)

dt3 = datetime.combine(d, t)  # 合并回 datetime
print(dt3)
```

> **提示：** `date` 只含日期，`time` 只含时间；需要同时处理两者时使用 `datetime`。
