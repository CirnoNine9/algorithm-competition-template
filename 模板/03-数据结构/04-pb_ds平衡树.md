# `pb_ds` 平衡树

> **用途：** GNU 扩展的有序集合，额外支持按排名找元素和查询严格小于某键的元素个数。以 `pair<值,唯一编号>` 作为键时可模拟可重集合。
>
> **复杂度：** `insert`、`erase`、`order_of_key`、`find_by_order`、前驱后继查询通常为 $O(\log n)$；空间 $O(n)$。
>
> **编译环境：** 依赖 GCC 的 `__gnu_pbds`，头文件要放在 `#define int long long` 之前。

`insert(x)`：向树中插入一个元素 `x`，返回 `std::pair<point_iterator, bool>`，其中第一个元素代表插入位置的迭代器，第二个元素代表是否插入成功。

`erase(x)`：从树中删除一个元素或迭代器 `x`。

`order_of_key(x)`：返回严格小于 `x` 的元素个数，即从 $0$ 开始的排名。

`find_by_order(x)`：返回排名为 `x` 的元素的迭代器。

`lower_bound(x)`：返回第一个不小于 `x` 的元素的迭代器。

`upper_bound(x)`：返回第一个严格大于 `x` 的元素的迭代器。

`join(x)`：将 `x` 树并入当前树，`x` 树被清空。

`split(x,b)`：小于等于 `x` 的元素保留在当前树，其余元素移入 `b`。

`empty()`：返回是否为空。

`size()`：返回元素个数。

```cpp
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp> 
// 放在 #define int long long 上面

__gnu_pbds::tree<pair<int, int>, __gnu_pbds::null_type, less<pair<int, int>>,
                 __gnu_pbds::rb_tree_tag,
                 __gnu_pbds::tree_order_statistics_node_update>
    trr;
```
