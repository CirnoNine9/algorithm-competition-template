# `pb_ds` 配对堆

> **用途：** GNU 扩展的可合并优先队列；除堆顶、插入和删除外，还能通过 `push` 返回的点迭代器修改或删除任意元素。配对堆实现简单，实践常数通常较好，但并非无条件快于所有堆；只需普通 `push/pop` 时，连续内存的 `std::priority_queue` 往往更合适。
>
> **复杂度：** `push`、`top`、`join` 为 $O(1)$，`pop`、`modify`、`erase` 均摊 $O(\log n)$，`split` 为 $O(n)$，空间 $O(n)$。
>
> **编译环境：** 依赖 GCC 的 `__gnu_pbds`，头文件要放在 `#define int long long` 之前。

| 操作 | 作用 | 复杂度 | 备注 |
|---|---|---:|---|
| `push(x)` | 插入元素 `x` | $O(1)$ | 返回指向该元素的点迭代器 `point_iterator`；允许重复元素 |
| `top()` | 查询堆顶 | $O(1)$ | `less<T>` 为大根堆，`greater<T>` 为小根堆 |
| `pop()` | 删除堆顶 | 均摊 $O(\log n)$ | 调用前堆必须非空 |
| `modify(it,x)` | 将点迭代器 `it` 对应的元素改为 `x` | 均摊 $O(\log n)$ | 新值可以变大或变小，迭代器仍指向该元素 |
| `erase(it)` | 删除点迭代器 `it` 对应的元素 | 均摊 $O(\log n)$ | 删除后该迭代器失效 |
| `join(x)` | 将堆 `x` 合并到当前堆 | $O(1)$ | 完成后 `x` 为空，两堆类型必须相同 |
| `split(pred,x)` | 将满足 `pred` 的元素移入堆 `x` | $O(n)$ | 调用前会先清空 `x` |
| `begin()`、`end()` | 遍历所有元素 | $O(n)$ | 遍历顺序不保证有序，也不是依次弹出的顺序 |
| `clear()` | 删除全部元素 | $O(n)$ | 所有指向原元素的点迭代器失效 |
| `empty()`、`size()` | 查询是否为空、元素个数 | $O(1)$ |  |

点迭代器 `point_iterator` 只在对应元素被 `pop`、`erase` 或 `clear` 删除时失效；其他元素的插入、修改、删除和堆合并不会使它失效。为避免与 `std::priority_queue` 冲突，不要直接 `using namespace __gnu_pbds`。

```cpp
#include <ext/pb_ds/priority_queue.hpp>
// 放在 #define int long long 上面

template<class T, class Cmp = less<T>>
using Heap = __gnu_pbds::priority_queue<T, Cmp,
                                        __gnu_pbds::pairing_heap_tag>;

Heap<int> q, r;                    // 大根堆
Heap<int, greater<int>> minq;      // 小根堆

auto it = q.push(3);               // 保存点迭代器
q.push(8);
q.modify(it, 10);                  // 现在堆顶为 10
r.push(7);
q.join(r);                         // r 变为空堆
q.erase(it);                       // 删除原来的 3（现为 10）
```
