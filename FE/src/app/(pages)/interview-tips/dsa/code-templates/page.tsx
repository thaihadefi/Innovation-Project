"use client";

import { useState } from "react";
import { FaCode } from "react-icons/fa6";

const codeTabs = ["C++", "Python3"] as const;

type CodeTab = (typeof codeTabs)[number];

type TemplateBlock = {
  id: string;
  title: string;
  description?: React.ReactNode[];
  note?: string;
  code?: {
    cpp?: string;
    py?: string;
  };
  extra?: React.ReactNode;
};

const cppCodeById: Record<string, string> = {
  "two-pointers-opposite-ends": `int fn(vector<int>& arr) {\n    int left = 0;\n    int right = int(arr.size()) - 1;\n    int ans = 0;\n\n    while (left < right) {\n        // do some logic here with left and right\n        if (CONDITION) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n\n    return ans;\n}\n`,
  "two-pointers-two-inputs": `int fn(vector<int>& arr1, vector<int>& arr2) {\n    int i = 0, j = 0, ans = 0;\n\n    while (i < arr1.size() && j < arr2.size()) {\n        // do some logic here\n        if (CONDITION) {\n            i++;\n        } else {\n            j++;\n        }\n    }\n\n    while (i < arr1.size()) {\n        // do logic\n        i++;\n    }\n\n    while (j < arr2.size()) {\n        // do logic\n        j++;\n    }\n\n    return ans;\n}\n`,
  "sliding-window": `int fn(vector<int>& arr) {\n    int left = 0, ans = 0, curr = 0;\n\n    for (int right = 0; right < arr.size(); right++) {\n        // do logic here to add arr[right] to curr\n\n        while (WINDOW_CONDITION_BROKEN) {\n            // remove arr[left] from curr\n            left++;\n        }\n\n        // update ans\n    }\n\n    return ans;\n}\n`,
  "prefix-sum": `vector<int> fn(vector<int>& arr) {\n    vector<int> prefix(arr.size());\n    prefix[0] = arr[0];\n\n    for (int i = 1; i < arr.size(); i++) {\n        prefix[i] = prefix[i - 1] + arr[i];\n    }\n\n    return prefix;\n}\n`,
  "efficient-string-building": `string fn(vector<char>& arr) {\n    return string(arr.begin(), arr.end())\n}\n`,
  "linked-list-fast-slow": `int fn(ListNode* head) {\n    ListNode* slow = head;\n    ListNode* fast = head;\n    int ans = 0;\n\n    while (fast != nullptr && fast->next != nullptr) {\n        // do logic\n        slow = slow->next;\n        fast = fast->next->next;\n    }\n\n    return ans;\n}\n`,
  "reverse-linked-list": `ListNode* fn(ListNode* head) {\n    ListNode* curr = head;\n    ListNode* prev = nullptr;\n    while (curr != nullptr) {\n        ListNode* nextNode = curr->next;\n        curr->next = prev;\n        prev = curr;\n        curr = nextNode;\n    }\n\n    return prev;\n}\n`,
  "subarrays-exact-criteria": `int fn(vector<int>& arr, int k) {\n    unordered_map<int, int> counts;\n    counts[0] = 1;\n    int ans = 0, curr = 0;\n\n    for (int num: arr) {\n        // do logic to change curr\n        ans += counts[curr - k];\n        counts[curr]++;\n    }\n\n    return ans;\n}\n`,
  "monotonic-increasing-stack": `int fn(vector<int>& arr) {\n    stack<integer> stack;\n    int ans = 0;\n\n    for (int num: arr) {\n        // for monotonic decreasing, just flip the > to <\n        while (!stack.empty() && stack.top() > num) {\n            // do logic\n            stack.pop();\n        }\n\n        stack.push(num);\n    }\n}\n`,
  "binary-tree-dfs-recursive": `int dfs(TreeNode* root) {\n    if (root == nullptr) {\n        return 0;\n    }\n\n    int ans = 0;\n    // do logic\n    dfs(root.left);\n    dfs(root.right);\n    return ans;\n}\n`,
  "binary-tree-dfs-iterative": `int dfs(TreeNode* root) {\n    stack<TreeNode*> stack;\n    stack.push(root);\n    int ans = 0;\n\n    while (!stack.empty()) {\n        TreeNode* node = stack.top();\n        stack.pop();\n        // do logic\n        if (node->left != nullptr) {\n            stack.push(node->left);\n        }\n        if (node->right != nullptr) {\n            stack.push(node->right);\n        }\n    }\n\n    return ans;\n}\n`,
  "binary-tree-bfs": `int fn(TreeNode* root) {\n    queue<TreeNode*> queue;\n    queue.push(root);\n    int ans = 0;\n\n    while (!queue.empty()) {\n        int currentLength = queue.size();\n        // do logic for current level\n\n        for (int i = 0; i < currentLength; i++) {\n            TreeNode* node = queue.front();\n            queue.pop();\n            // do logic\n            if (node->left != nullptr) {\n                queue.push(node->left);\n            }\n            if (node->right != nullptr) {\n                queue.push(node->right);\n            }\n        }\n    }\n\n    return ans;\n}\n`,
  "graph-dfs-recursive": `unordered_set<int> seen;\n\nint fn(vector<vector<int>>& graph) {\n    seen.insert(START_NODE);\n    return dfs(START_NODE, graph);\n}\n\nint dfs(int node, vector<vector<int>>& graph) {\n    int ans = 0;\n    // do some logic\n    for (int neighbor: graph[node]) {\n        if (!seen.contains(neighbor)) {\n            seen.insert(neighbor);\n            ans += dfs(neighbor, graph);\n        }\n    }\n\n    return ans;\n}\n`,
  "graph-dfs-iterative": `int fn(vector<vector<int>>& graph) {\n    stack<int> stack;\n    unordered_set<int> seen;\n    stack.push(START_NODE);\n    seen.insert(START_NODE);\n    int ans = 0;\n\n    while (!stack.empty()) {\n        int node = stack.top();\n        stack.pop();\n        // do some logic\n        for (int neighbor: graph[node]) {\n            if (!seen.contains(neighbor)) {\n                seen.insert(neighbor);\n                stack.push(neighbor);\n            }\n        }\n    }\n}\n`,
  "graph-bfs": `int fn(vector<vector<int>>& graph) {\n    queue<int> queue;\n    unordered_set<int> seen;\n    queue.push(START_NODE);\n    seen.insert(START_NODE);\n    int ans = 0;\n\n    while (!queue.empty()) {\n        int node = queue.front();\n        queue.pop();\n        // do some logic\n        for (int neighbor: graph[node]) {\n            if (!seen.contains(neighbor)) {\n                seen.insert(neighbor);\n                queue.push(neighbor);\n            }\n        }\n    }\n}\n`,
  "top-k-heap": `vector<int> fn(vector<int>& arr, int k) {\n    priority_queue<int, CRITERIA> heap;\n    for (int num: arr) {\n        heap.push(num);\n        if (heap.size() > k) {\n            heap.pop();\n        }\n    }\n\n    vector<int> ans;\n    while (heap.size() > 0) {\n        ans.push_back(heap.top());\n        heap.pop();\n    }\n\n    return ans;\n}\n`,
  "binary-search": `int binarySearch(vector<int>& arr, int target) {\n        int left = 0;\n        int right = int(arr.size()) - 1;\n        while (left <= right) {\n            int mid = left + (right - left) / 2;\n            if (arr[mid] == target) {\n                // do something;\n                return mid;\n            }\n            if (arr[mid] > target) {\n                right = mid - 1;\n            } else {\n                left = mid + 1;\n            }\n        }\n        \n        // left is the insertion point\n        return left;\n    }\n`,
  "binary-search-left-most": `int binarySearch(vector<int>& arr, int target) {\n    int left = 0;\n    int right = arr.size();\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] >= target) {\n            right = mid;\n        } else {\n            left = mid + 1;\n        }\n    }\n    \n    return left;\n}\n`,
  "binary-search-right-most": `int binarySearch(vector<int>& arr, int target) {\n    int left = 0;\n    int right = arr.size();\n    while (left < right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] > target) {\n            right = mid;\n        } else {\n            left = mid + 1;\n        }\n    }\n    \n    return left;\n}\n`,
  "backtracking": `int backtrack(STATE curr, OTHER_ARGUMENTS...) {\n    if (BASE_CASE) {\n        // modify the answer\n        return 0;\n    }\n\n    int ans = 0;\n    for (ITERATE_OVER_INPUT) {\n        // modify the current state\n        ans += backtrack(curr, OTHER_ARGUMENTS...)\n        // undo the modification of the current state\n    }\n\n    return ans;\n}\n`,
  "dp-top-down": `unordered_map<STATE, int> memo;\n\nint fn(vector<int>& arr) {\n    return dp(STATE_FOR_WHOLE_INPUT, arr);\n}\n\nint dp(STATE, vector<int>& arr) {\n    if (BASE_CASE) {\n        return 0;\n    }\n\n    if (memo.contains(STATE)) {\n        return memo[STATE];\n    }\n\n    int ans = RECURRENCE_RELATION(STATE);\n    memo[STATE] = ans;\n    return ans;\n}\n`,
  "build-a-trie": `// note: using a class is only necessary if you want to store data at each node.\n// otherwise, you can implement a trie using only hash maps.\nstruct TrieNode {\n    int data;\n    unordered_map<char, TrieNode*> children;\n    TrieNode() : data(0), children(unordered_map<char, TrieNode*>()) {}\n};\n\nTrieNode* buildTrie(vector<string> words) {\n    TrieNode* root = new TrieNode();\n    for (string word: words) {\n        TrieNode* curr = root;\n        for (char c: word) {\n            if (!curr->children.contains(c)) {\n                curr->children[c] = new TrieNode();\n            }\n            curr = curr->children[c];\n        }\n        // at this point, you have a full word at curr\n        // you can perform more logic here to give curr an attribute if you want\n    }\n\n    return root;\n}\n`,
  "dijkstras": `vector<int> distances(n, INT_MAX);\n distances[source] = 0;\n\npriority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;\nheap.push({0, source});\n\nwhile (!heap.empty()) {\n    int currDist = heap.top().first;\n    int node = heap.top().second;\n    heap.pop();\n    \n    if (currDist > distances[node]) {\n        continue;\n    }\n    \n    for (pair<int, int> edge: graph[node]) {\n        int nei = edge.first;\n        int weight = edge.second;\n        int dist = currDist + weight;\n        \n        if (dist < distances[nei]) {\n            distances[nei] = dist;\n            heap.push({dist, nei});\n        }\n    }\n}\n`,
};

const pyCodeById: Record<string, string> = {
  "prefix-sum": `def fn(arr):\n    prefix = [arr[0]]\n    for i in range(1, len(arr)):\n        prefix.append(prefix[-1] + arr[i])\n    \n    return prefix\n`,
  "efficient-string-building": `# arr is a list of characters\ndef fn(arr):\n    ans = []\n    for c in arr:\n        ans.append(c)\n    \n    return \"\".join(ans)\n`,
  "linked-list-fast-slow": `def fn(head):\n    slow = head\n    fast = head\n    ans = 0\n\n    while fast and fast.next:\n        # do logic\n        slow = slow.next\n        fast = fast.next.next\n    \n    return ans\n`,
  "reverse-linked-list": `def fn(head):\n    curr = head\n    prev = None\n    while curr:\n        next_node = curr.next\n        curr.next = prev\n        prev = curr\n        curr = next_node \n        \n    return prev\n`,
  "subarrays-exact-criteria": `from collections import defaultdict\n\ndef fn(arr, k):\n    counts = defaultdict(int)\n    counts[0] = 1\n    ans = curr = 0\n\n    for num in arr:\n        # do logic to change curr\n        ans += counts[curr - k]\n        counts[curr] += 1\n    \n    return ans\n`,
  "monotonic-increasing-stack": `def fn(arr):\n    stack = []\n    ans = 0\n\n    for num in arr:\n        # for monotonic decreasing, just flip the > to <\n        while stack and stack[-1] > num:\n            # do logic\n            stack.pop()\n        stack.append(num)\n    \n    return ans\n`,
  "binary-tree-dfs-recursive": `def dfs(root):\n    if not root:\n        return\n    \n    ans = 0\n\n    # do logic\n    dfs(root.left)\n    dfs(root.right)\n    return ans\n`,
  "binary-tree-dfs-iterative": `def dfs(root):\n    stack = [root]\n    ans = 0\n\n    while stack:\n        node = stack.pop()\n        # do logic\n        if node.left:\n            stack.append(node.left)\n        if node.right:\n            stack.append(node.right)\n\n    return ans\n`,
  "binary-tree-bfs": `from collections import deque\n\ndef fn(root):\n    queue = deque([root])\n    ans = 0\n\n    while queue:\n        current_length = len(queue)\n        # do logic for current level\n\n        for _ in range(current_length):\n            node = queue.popleft()\n            # do logic\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n\n    return ans\n`,
  "graph-dfs-recursive": `def fn(graph):\n    def dfs(node):\n        ans = 0\n        # do some logic\n        for neighbor in graph[node]:\n            if neighbor not in seen:\n                seen.add(neighbor)\n                ans += dfs(neighbor)\n        \n        return ans\n\n    seen = {START_NODE}\n    return dfs(START_NODE)\n`,
  "graph-dfs-iterative": `def fn(graph):\n    stack = [START_NODE]\n    seen = {START_NODE}\n    ans = 0\n\n    while stack:\n        node = stack.pop()\n        # do some logic\n        for neighbor in graph[node]:\n            if neighbor not in seen:\n                seen.add(neighbor)\n                stack.append(neighbor)\n    \n    return ans\n`,
  "graph-bfs": `from collections import deque\n\ndef fn(graph):\n    queue = deque([START_NODE])\n    seen = {START_NODE}\n    ans = 0\n\n    while queue:\n        node = queue.popleft()\n        # do some logic\n        for neighbor in graph[node]:\n            if neighbor not in seen:\n                seen.add(neighbor)\n                queue.append(neighbor)\n    \n    return ans\n`,
  "top-k-heap": `import heapq\n\ndef fn(arr, k):\n    heap = []\n    for num in arr:\n        # do some logic to push onto heap according to problem's criteria\n        heapq.heappush(heap, (CRITERIA, num))\n        if len(heap) > k:\n            heapq.heappop(heap)\n    \n    return [num for num in heap]\n`,
  "binary-search": `def fn(arr, target):\n    left = 0\n    right = len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            # do something\n            return\n        if arr[mid] > target:\n            right = mid - 1\n        else:\n            left = mid + 1\n    \n    # left is the insertion point\n    return left\n`,
  "binary-search-left-most": `def fn(arr, target):\n    left = 0\n    right = len(arr)\n    while left < right:\n        mid = (left + right) // 2\n        if arr[mid] >= target:\n            right = mid\n        else:\n            left = mid + 1\n\n    return left\n`,
  "binary-search-right-most": `def fn(arr, target):\n    left = 0\n    right = len(arr)\n    while left < right:\n        mid = (left + right) // 2\n        if arr[mid] > target:\n            right = mid\n        else:\n            left = mid + 1\n\n    return left\n`,
  "binary-search-greedy-min": `def fn(arr):\n    def check(x):\n        # this function is implemented depending on the problem\n        return BOOLEAN\n\n    left = MINIMUM_POSSIBLE_ANSWER\n    right = MAXIMUM_POSSIBLE_ANSWER\n    while left <= right:\n        mid = (left + right) // 2\n        if check(mid):\n            right = mid - 1\n        else:\n            left = mid + 1\n    \n    return left\n`,
  "binary-search-greedy-max": `def fn(arr):\n    def check(x):\n        # this function is implemented depending on the problem\n        return BOOLEAN\n\n    left = MINIMUM_POSSIBLE_ANSWER\n    right = MAXIMUM_POSSIBLE_ANSWER\n    while left <= right:\n        mid = (left + right) // 2\n        if check(mid):\n            left = mid + 1\n        else:\n            right = mid - 1\n    \n    return right\n`,
  "backtracking": `def backtrack(curr, OTHER_ARGUMENTS...):\n    if (BASE_CASE):\n        # modify the answer\n        return\n    \n    ans = 0\n    for (ITERATE_OVER_INPUT):\n        # modify the current state\n        ans += backtrack(curr, OTHER_ARGUMENTS...)\n        # undo the modification of the current state\n    \n    return ans\n`,
  "dp-top-down": `def fn(arr):\n    def dp(STATE):\n        if BASE_CASE:\n            return 0\n        \n        if STATE in memo:\n            return memo[STATE]\n        \n        ans = RECURRENCE_RELATION(STATE)\n        memo[STATE] = ans\n        return ans\n\n    memo = {}\n    return dp(STATE_FOR_WHOLE_INPUT)\n`,
  "build-a-trie": `# note: using a class is only necessary if you want to store data at each node.\n# otherwise, you can implement a trie using only hash maps.\nclass TrieNode:\n    def __init__(self):\n        # you can store data at nodes if you wish\n        self.data = None\n        self.children = {}\n\ndef fn(words):\n    root = TrieNode()\n    for word in words:\n        curr = root\n        for c in word:\n            if c not in curr.children:\n                curr.children[c] = TrieNode()\n            curr = curr.children[c]\n        # at this point, you have a full word at curr\n        # you can perform more logic here to give curr an attribute if you want\n    \n    return root\n`,
  "dijkstras": `from math import inf\nfrom heapq import *\n\ndistances = [inf] * n\ndistances[source] = 0\nheap = [(0, source)]\n\nwhile heap:\n    curr_dist, node = heappop(heap)\n    if curr_dist > distances[node]:\n        continue\n    \n    for nei, weight in graph[node]:\n        dist = curr_dist + weight\n        if dist < distances[nei]:\n            distances[nei] = dist\n            heappush(heap, (dist, nei))\n`,
};

const greedyMinCpp = `int fn(vector<int>& arr) {\n    int left = MINIMUM_POSSIBLE_ANSWER;\n    int right = MAXIMUM_POSSIBLE_ANSWER;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (check(mid)) {\n            right = mid - 1;\n        } else {\n            left = mid + 1;\n        }\n    }\n\n    return left;\n}\n\nbool check(int x) {\n    // this function is implemented depending on the problem\n    return BOOLEAN;\n}\n`;

const greedyMaxCpp = `int fn(vector<int>& arr) {\n    int left = MINIMUM_POSSIBLE_ANSWER;\n    int right = MAXIMUM_POSSIBLE_ANSWER;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (check(mid)) {\n            left = mid + 1;\n        } else {\n            right = mid - 1;\n        }\n    }\n\n    return right;\n}\n\nbool check(int x) {\n    // this function is implemented depending on the problem\n    return BOOLEAN;\n}\n`;

const templates: TemplateBlock[] = [
  {
    id: "two-pointers-opposite-ends",
    title: "Two pointers: one input, opposite ends",
    code: {
      cpp: `int fn(vector<int>& arr) {\n    int left = 0;\n    int right = int(arr.size()) - 1;\n    int ans = 0;\n\n    while (left < right) {\n        // do some logic here with left and right\n        if (CONDITION) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n\n    return ans;\n}\n`,
      py: `def fn(arr):\n    left = ans = 0\n    right = len(arr) - 1\n\n    while left < right:\n        # do some logic here with left and right\n        if CONDITION:\n            left += 1\n        else:\n            right -= 1\n    \n    return ans\n`,
    },
  },
  {
    id: "two-pointers-two-inputs",
    title: "Two pointers: two inputs, exhaust both",
    code: {
      cpp: `int fn(vector<int>& arr1, vector<int>& arr2) {\n    int i = 0, j = 0, ans = 0;\n\n    while (i < arr1.size() && j < arr2.size()) {\n        // do some logic here\n        if (CONDITION) {\n            i++;\n        } else {\n            j++;\n        }\n    }\n\n    while (i < arr1.size()) {\n        // do logic\n        i++;\n    }\n\n    while (j < arr2.size()) {\n        // do logic\n        j++;\n    }\n\n    return ans;\n}\n`,
      py: `def fn(arr1, arr2):\n    i = j = ans = 0\n\n    while i < len(arr1) and j < len(arr2):\n        # do some logic here\n        if CONDITION:\n            i += 1\n        else:\n            j += 1\n    \n    while i < len(arr1):\n        # do logic\n        i += 1\n    \n    while j < len(arr2):\n        # do logic\n        j += 1\n    \n    return ans\n`,
    },
  },
  {
    id: "sliding-window",
    title: "Sliding window",
    code: {
      cpp: `int fn(vector<int>& arr) {\n    int left = 0, ans = 0, curr = 0;\n\n    for (int right = 0; right < arr.size(); right++) {\n        // do logic here to add arr[right] to curr\n\n        while (WINDOW_CONDITION_BROKEN) {\n            // remove arr[left] from curr\n            left++;\n        }\n\n        // update ans\n    }\n\n    return ans;\n}\n`,
      py: `def fn(arr):\n    left = ans = curr = 0\n\n    for right in range(len(arr)):\n        # do logic here to add arr[right] to curr\n\n        while WINDOW_CONDITION_BROKEN:\n            # remove arr[left] from curr\n            left += 1\n\n        # update ans\n    \n    return ans\n`,
    },
  },
  {
    id: "prefix-sum",
    title: "Build a prefix sum",
  },
  {
    id: "efficient-string-building",
    title: "Efficient string building",
  },
  {
    id: "linked-list-fast-slow",
    title: "Linked list: fast and slow pointer",
  },
  {
    id: "reverse-linked-list",
    title: "Reversing a linked list",
  },
  {
    id: "subarrays-exact-criteria",
    title: "Find number of subarrays that fit an exact criteria",
  },
  {
    id: "monotonic-increasing-stack",
    title: "Monotonic increasing stack",
    description: [<>The same logic can be applied to maintain a monotonic queue.</>],
  },
  {
    id: "binary-tree-dfs-recursive",
    title: "Binary tree: DFS (recursive)",
  },
  {
    id: "binary-tree-dfs-iterative",
    title: "Binary tree: DFS (iterative)",
  },
  {
    id: "binary-tree-bfs",
    title: "Binary tree: BFS",
  },
  {
    id: "graph-dfs-recursive",
    title: "Graph: DFS (recursive)",
    description: [
      <>
        For the graph templates, assume the nodes are numbered from <code>0</code> to{" "}
        <code>n - 1</code> and the graph is given as an adjacency list.
      </>,
      <>
        Depending on the problem, you may need to convert the input into an equivalent adjacency
        list before using the templates.
      </>,
    ],
  },
  {
    id: "graph-dfs-iterative",
    title: "Graph: DFS (iterative)",
  },
  {
    id: "graph-bfs",
    title: "Graph: BFS",
  },
  {
    id: "top-k-heap",
    title: "Find top k elements with heap",
  },
  {
    id: "binary-search",
    title: "Binary search",
  },
  {
    id: "binary-search-left-most",
    title: "Binary search: duplicate elements, left-most insertion point",
  },
  {
    id: "binary-search-right-most",
    title: "Binary search: duplicate elements, right-most insertion point",
  },
  {
    id: "binary-search-greedy",
    title: "Binary search: for greedy problems",
  },
  {
    id: "backtracking",
    title: "Backtracking",
  },
  {
    id: "dp-top-down",
    title: "Dynamic programming: top-down memoization",
    extra: (
      <div className="mt-[12px] space-y-[12px]">
        <p className="text-[14px] text-[#374151]">To convert a top-down solution to a bottom-up one:</p>
        <ol className="list-decimal pl-[18px] text-[14px] text-[#374151] space-y-[8px]">
          <li>
            Initialize an array <code>dp</code> that is sized according to the state variables. For
            example, let&apos;s say the input to the problem was an array <code>nums</code> and an
            integer <code>k</code> that represents the maximum number of actions allowed. Your array <code>dp</code> would be 2D with one dimension of length <code>nums.length</code> and the
            other of length <code>k</code>. In the top-down approach, we had a function <code>dp</code>.
            We want these two to be equivalent. For example, the value of <code>dp(4, 6)</code> can
            now be found in <code>dp[4][6]</code>.
          </li>
          <li>
            Set your base cases, same as the ones you are using in your top-down function. In the
            example we just looked at, we had <code>dp(0) = dp(1) = 0</code>. We can initialize our <code>dp</code> array values to <code>0</code> to implicitly set this base case. As
            you&apos;ll see soon, other problems will have more complicated base cases.
          </li>
          <li>
            Write a for-loop(s) that iterate over your state variables. If you have multiple state
            variables, you will need nested for-loops. These loops should <strong>start iterating
            from the base cases and end at the answer state</strong>.
          </li>
          <li>
            Now, each iteration of the inner-most loop represents a given state, and is equivalent
            to a function call to the same state in top-down. Copy-paste the logic from your function
            into the for-loop and change the function calls to accessing your array. All <code>dp(...)</code> changes into <code>dp[...]</code>.
          </li>
          <li>
            We&apos;re done! <code>dp</code> is now an array populated with the answer to the original
            problem for all possible states. Return the answer to the original problem, by changing <code>return dp(...)</code> to <code>return dp[...]</code>.
          </li>
        </ol>
      </div>
    ),
  },
  {
    id: "build-a-trie",
    title: "Build a trie",
  },
  {
    id: "dijkstras",
    title: "Dijkstra's algorithm",
  },
];







function TabbedCodeBlock({
  labelPrefix,
  code,
  activeTab,
  onTabChange,
}: {
  labelPrefix?: string;
  code?: { cpp?: string; py?: string };
  activeTab: CodeTab;
  onTabChange: (tab: CodeTab) => void;
}) {
  const titlePrefix = labelPrefix ? `${labelPrefix} ` : "";

  const codePlaceholders: Record<CodeTab, string> = {
    "C++": code?.cpp ?? `// ${titlePrefix}Template (C++)\n// TODO: add code template here\n`,
    Python3:
      code?.py ?? `# ${titlePrefix}Template (Python3)\n# TODO: add code template here\n`,
  };

  const countLines = (value: string) => {
    const split = value.split("\n");
    return split.filter((line, idx, arr) => {
      if (idx === arr.length - 1 && line.trim() === "") return false;
      return true;
    }).length;
  };

  const codeContent = codePlaceholders[activeTab];
  const lines = codeContent.split("\n").filter((line, idx, arr) => {
    if (idx === arr.length - 1 && line.trim() === "") return false;
    return true;
  });
  const maxLines = Math.max(
    countLines(codePlaceholders["C++"]),
    countLines(codePlaceholders.Python3)
  );
  const lineHeightPx = 22;
  const verticalPaddingPx = 28;
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="mt-[10px] code-snippet">
      <div className="snippet-header">
        {codeTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`tab-btn ${
              activeTab === tab
                ? "tab-btn-active"
                : "tab-btn-idle"
            }`}
          >
            {tab}
          </button>
        ))}
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="code-pre"
        style={{
          minHeight:
            maxLines > 0
              ? `${maxLines * lineHeightPx + verticalPaddingPx}px`
              : undefined,
        }}
      >
        {lines.map((line, index) => (
          <div key={index} className="code-line">
            <span className="line-no">{index + 1}</span>
            <span className="line-text">{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function CodeTemplatesPage() {
  const [activeTab, setActiveTab] = useState<CodeTab>("C++");
  return (
    <section className="article-content rounded-[16px] border border-[#E5E7EB] bg-white p-[24px] shadow-sm">
      <div className="flex items-start gap-[12px]">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <FaCode />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <h1 className="text-[26px] font-[700] text-[#111827]">Code templates</h1>
          </div>
          <p className="text-[14px] text-[#6B7280] mt-[6px]">
            Here are code templates for common patterns in coding interviews.
          </p>
        </div>
      </div>

      <div className="mt-[16px] space-y-[18px]">
        <hr className="border-[#E5E7EB]" />

        {templates.map((item) => (
          <div key={item.id}>
            <p className="text-[14px] font-[700] text-[#111827]">{item.title}</p>
            {item.description?.map((line, idx) => (
              <p key={idx} className="mt-[6px] text-[14px] text-[#374151]">
                {line}
              </p>
            ))}
            {item.note && (
              <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
                {item.note}
              </blockquote>
            )}
            {item.id === "binary-search-greedy" ? (
              <div className="mt-[8px] space-y-[12px]">
                <p className="text-[14px] text-[#374151]">If looking for a minimum:</p>
                <TabbedCodeBlock
                  labelPrefix="Minimum"
                  code={{ cpp: greedyMinCpp, py: pyCodeById["binary-search-greedy-min"] }}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                <p className="text-[14px] text-[#374151]">If looking for a maximum:</p>
                <TabbedCodeBlock
                  labelPrefix="Maximum"
                  code={{ cpp: greedyMaxCpp, py: pyCodeById["binary-search-greedy-max"] }}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            ) : (
              <TabbedCodeBlock
                code={{
                  cpp: item.code?.cpp ?? cppCodeById[item.id],
                  py: item.code?.py ?? pyCodeById[item.id],
                }}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
            {item.extra && <div className="mt-[12px]">{item.extra}</div>}
            <hr className="my-[16px] border-[#E5E7EB]" />
          </div>
        ))}
      </div>
    </section>
  );
}
