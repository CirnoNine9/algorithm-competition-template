# `pb_ds` 平衡树

> **用途：** GNU 扩展的有序集合，额外支持按排名找元素和查询严格小于某键的元素个数。以 `pair<值,唯一编号>` 作为键时可模拟可重集合。
>
> **编译环境：** 依赖 GCC 的 `__gnu_pbds`，头文件要放在 `#define int long long` 之前。

| 操作 | 作用 | 复杂度 | 备注 |
|---|---|---:|---|
| `insert(x)` | 插入键 `x` | $O(\log n)$ | 返回 `pair<point_iterator,bool>`；键已存在时插入失败 |
| `erase(x)`、`erase(it)` | 按键或迭代器删除元素 | $O(\log n)$ | 前者返回是否删除成功，后者返回被删元素的后继迭代器 |
| `erase_if(pred)` | 删除所有满足谓词的元素 | $O(n\log n)$ | 返回删除个数 |
| `find(x)` | 查找键 `x` | $O(\log n)$ | 不存在时返回 `end()` |
| `order_of_key(x)` | 查询严格小于 `x` 的元素个数 | $O(\log n)$ | 即 `x` 从 $0$ 开始的排名 |
| `find_by_order(k)` | 查询排名为 `k` 的元素 | $O(\log n)$ | 排名从 $0$ 开始；越界时返回 `end()` |
| `lower_bound(x)` | 查询第一个不小于 `x` 的元素 | $O(\log n)$ | 若返回值不为 `begin()`，前移一次得到严格前驱 |
| `upper_bound(x)` | 查询第一个严格大于 `x` 的元素 | $O(\log n)$ | 即严格后继 |
| `begin()`、`end()` | 获取正向首、尾迭代器 | $O(1)$ | 迭代顺序按键递增 |
| `rbegin()`、`rend()` | 获取反向首、尾迭代器 | $O(1)$ | 仅节点型树提供，当前 `rb_tree_tag` 可用 |
| `join(x)` | 将树 `x` 并入当前树 | $O(\log(n+m))$ | 要求一棵树的所有键严格小于另一棵树；完成后 `x` 为空 |
| `split(x,b)` | 按键 `x` 拆分到树 `b` | 实现相关，常用稳定版最坏 $O(n)$ | 当前树保留 `<=x`，其余移入 `b`；调用前会先清空 `b` |
| `clear()` | 删除全部元素 | $O(n)$ | 删除后树为空 |
| `empty()`、`size()` | 查询是否为空、元素个数 | $O(1)$ | `size()` 统计键的数量 |
| `swap(x)` | 交换两棵树 | $O(1)$ | 同时交换比较器状态 |

```cpp
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp> 
// 放在 #define int long long 上面

__gnu_pbds::tree<pair<int, int>, __gnu_pbds::null_type, less<pair<int, int>>,
                 __gnu_pbds::rb_tree_tag,
                 __gnu_pbds::tree_order_statistics_node_update>
    trr;
```
