import { FaBookOpen } from "react-icons/fa6";

export default function CheatsheetsPage() {
  return (
    <section className="article-content rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[24px] shadow-sm">
      <div className="flex items-start gap-[12px]">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#10B981]/10 text-[#10B981]">
          <FaBookOpen />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <h1 className="text-[26px] font-[700] text-[#111827]">Cheatsheets</h1>
          </div>
          <p className="text-[14px] text-[#6B7280] mt-[6px]">
            This article will be a collection of cheat sheets that you can use as you solve problems
            and prepare for interviews. You will find:
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Time complexity (Big O) cheat sheet</li>
            <li>General DS/A flowchart (when to use each DS/A)</li>
            <li>Stages of an interview cheat sheet</li>
          </ul>
        </div>
      </div>

      <div className="mt-[16px] space-y-[18px]">
        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">
            Time complexity (Big O) cheat sheet
          </h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="big O chart"
            src="/assets/images/big_o.png"
            className="mt-[12px] h-auto w-full rounded-[12px] border border-[#E5E7EB]"
          />
          <p className="mt-[12px] text-[14px] text-[#374151]">
            First, let&apos;s talk about the time complexity of common operations, split by data
            structure/algorithm. Then, we&apos;ll talk about reasonable complexities given input sizes.
          </p>
          <p className="mt-[12px] text-[14px] text-[#111827] font-[700]">
            Arrays (dynamic array/list)
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = arr.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Add or remove element at the end: <code>O(1)</code>{" "}
              <a
                href="https://stackoverflow.com/questions/33044883/why-is-the-time-complexity-of-pythons-list-append-method-o1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
              >
                amortized
              </a>
            </li>
            <li>Add or remove element from arbitrary index: <code>O(n)</code></li>
            <li>Access or modify element at arbitrary index: <code>O(1)</code></li>
            <li>Check if element exists: <code>O(n)</code></li>
            <li>
              Two pointers: <code>O(n * k)</code>, where <code>k</code> is the work done at each
              iteration, includes sliding window
            </li>
            <li>Building a prefix sum: <code>O(n)</code></li>
            <li>Finding the sum of a subarray given a prefix sum: <code>O(1)</code></li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Strings (immutable)</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = s.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Add or remove character: <code>O(n)</code></li>
            <li>Access element at arbitrary index: <code>O(1)</code></li>
            <li>
              Concatenation between two strings: <code>O(n + m)</code>, where <code>m</code> is the
              length of the other string
            </li>
            <li>
              Create substring: <code>O(m)</code>, where <code>m</code> is the length of the substring
            </li>
            <li>
              Two pointers: <code>O(n * k)</code>, where <code>k</code> is the work done at each
              iteration, includes sliding window
            </li>
            <li>
              Building a string from joining an array, stringbuilder, etc.: <code>O(n)</code>
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Linked Lists</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n</code> as the number of nodes in the linked list,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Add or remove element given pointer before add/removal location: <code>O(1)</code>
            </li>
            <li>
              Add or remove element given pointer at add/removal location: <code>O(1)</code> if doubly
              linked
            </li>
            <li>Add or remove element at arbitrary position without pointer: <code>O(n)</code></li>
            <li>Access element at arbitrary position without pointer: <code>O(n)</code></li>
            <li>Check if element exists: <code>O(n)</code></li>
            <li>
              Reverse between position <code>i</code> and <code>j</code>: <code>O(j - i)</code>
            </li>
            <li>
              Detect a cycle: <code>O(n)</code> using fast-slow pointers or hash map
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Hash table/dictionary</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = dic.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Add or remove key-value pair: <code>O(1)</code></li>
            <li>Check if key exists: <code>O(1)</code></li>
            <li>Check if value exists: <code>O(n)</code></li>
            <li>Access or modify value associated with key: <code>O(1)</code></li>
            <li>Iterate over all keys, values, or both: <code>O(n)</code></li>
          </ul>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            Note: the <code>O(1)</code> operations are constant relative to <code>n</code>. In
            reality, the hashing algorithm might be expensive. For example, if your keys are
            strings, then it will cost <code>O(m)</code> where <code>m</code> is the length of the
            string. The operations only take constant time relative to the size of the hash map.
          </blockquote>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Set</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = set.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Add or remove element: <code>O(1)</code></li>
            <li>Check if element exists: <code>O(1)</code></li>
          </ul>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            The above note applies here as well.
          </blockquote>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stack</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Stack operations are dependent on their implementation. A stack is only required to
            support pop and push. If implemented with a dynamic array:
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = stack.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Push element: <code>O(1)</code></li>
            <li>Pop element: <code>O(1)</code></li>
            <li>Peek (see element at top of stack): <code>O(1)</code></li>
            <li>Access or modify element at arbitrary index: <code>O(1)</code></li>
            <li>Check if element exists: <code>O(n)</code></li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Queue</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Queue operations are dependent on their implementation. A queue is only required to
            support dequeue and enqueue. If implemented with a doubly linked list:
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = queue.length</code>,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Enqueue element: <code>O(1)</code></li>
            <li>Dequeue element: <code>O(1)</code></li>
            <li>Peek (see element at front of queue): <code>O(1)</code></li>
            <li>Access or modify element at arbitrary index: <code>O(n)</code></li>
            <li>Check if element exists: <code>O(n)</code></li>
          </ul>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            Note: most programming languages implement queues in a more sophisticated manner than a
            simple doubly linked list. Depending on implementation, accessing elements by index may
            be faster than <code>O(n)</code>, or <code>O(n)</code> but with a significant constant
            divisor.
          </blockquote>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Binary tree problems (DFS/BFS)</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n</code> as the number of nodes in the tree,
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Most algorithms will run in <code>O(n * k)</code> time, where <code>k</code> is the work
            done at each node, usually <code>O(1)</code>. This is just a general rule and not always
            the case. We are assuming here that BFS is implemented with an efficient queue.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Binary search tree</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n</code> as the number of nodes in the tree,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Add or remove element: <code>O(n)</code> worst case, <code>O(log n)</code> average case
            </li>
            <li>
              Check if element exists: <code>O(n)</code> worst case, <code>O(log n)</code> average
              case
            </li>
          </ul>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            The average case is when the tree is well balanced - each depth is close to full. The
            worst case is when the tree is just a straight line.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Heap/Priority Queue</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Given <code>n = heap.length</code> and talking about min heaps,
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Add an element: <code>O(log n)</code></li>
            <li>Delete the minimum element: <code>O(log n)</code></li>
            <li>Find the minimum element: <code>O(1)</code></li>
            <li>Check if element exists: <code>O(n)</code></li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Binary search</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Binary search runs in <code>O(log n)</code> in the worst case, where <code>n</code> is the
            size of your initial search space.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Miscellaneous</p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Sorting: <code>O(n * log n)</code>, where <code>n</code> is the size of the data being
              sorted
            </li>
            <li>
              DFS and BFS on a graph: <code>O(n * k + e)</code>, where <code>n</code> is the number of
              nodes, <code>e</code> is the number of edges, and <code>k</code> is the work done at each
              node (excluding iterating over edges)
            </li>
            <li>
              DFS and BFS space complexity: typically <code>O(n)</code>, but if it&apos;s in a graph,
              might be <code>O(n + e)</code> to store the graph
            </li>
            <li>
              Dynamic programming time complexity: <code>O(n * k)</code>, where <code>n</code> is the
              number of states and <code>k</code> is the work done at each state
            </li>
            <li>
              Dynamic programming space complexity: <code>O(n)</code>, where <code>n</code> is the number
              of states
            </li>
          </ul>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">Input sizes vs time complexity</h3>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            The constraints of a problem can be considered as hints because they indicate an upper
            bound on what your solution&apos;s time complexity should be. Being able to figure out the
            expected time complexity of a solution given the input size is a valuable skill to have.
            In all LeetCode problems and most online assessments (OA), you will be given the
            problem&apos;s constraints. Unfortunately, you will usually not be explicitly told the
            constraints of a problem in an interview, but it&apos;s still good for practicing on
            LeetCode and completing OAs. Still, in an interview, it usually doesn&apos;t hurt to ask
            about the expected input sizes.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>n &lt;= 10</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            The expected time complexity likely has a factorial or an exponential with a base larger
            than <code>2</code> - <code>O(n^2 * n!)</code> or <code>O(4^n)</code> for example.
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            You should think about backtracking or any brute-force-esque recursive algorithm. <code>n
            &lt;= 10</code> is extremely small and usually <strong>any</strong> algorithm that
            correctly finds the answer will be fast enough.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>10 &lt; n &lt;= 20</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            The expected time complexity likely involves <code>O(2^n)</code>. Any higher base or a
            factorial will be too slow (<code>3^20</code> = ~3.5 billion, and <code>20!</code> is
            much larger). A <code>2^n</code> usually implies that given a collection of elements,
            you are considering all subsets/subsequences - for each element, there are two choices:
            take it or don&apos;t take it.
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Again, this bound is very small, so most algorithms that are correct will probably be
            fast enough. Consider backtracking and recursion.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>20 &lt; n &lt;= 100</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            At this point, exponentials will be too slow. The upper bound will likely involve
            <code>O(n^3)</code>.
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Problems marked as &quot;easy&quot; on LeetCode usually have this bound, which can be deceiving.
            There may be solutions that run in <code>O(n)</code>, but the small bound allows brute
            force solutions to pass (finding the linear time solution might not be considered as
            &quot;easy&quot;).
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Consider brute force solutions that involve nested loops. If you come up with a brute
            force solution, try analyzing the algorithm to find what steps are &quot;slow&quot;, and try to
            improve on those steps using tools like hash maps or heaps.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>100 &lt; n &lt;= 1,000</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            In this range, a quadratic time complexity <code>O(n^2)</code> should be sufficient, as
            long as the constant factor isn&apos;t too large.
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Similar to the previous range, you should consider nested loops. The difference between
            this range and the previous one is that <code>O(n^2)</code> is usually the
            expected/optimal time complexity in this range, and it might not be possible to improve.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>1,000 &lt; n &lt; 100,000</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            <code>n &lt;= 10^5</code> is the most common constraint you will see on LeetCode. In this
            range, the slowest acceptable <strong>common</strong> time complexity is
            <code>O(n * log n)</code>, although a linear time approach <code>O(n)</code> is commonly
            the goal.
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            In this range, ask yourself if sorting the input or using a heap can be helpful. If not,
            then aim for an <code>O(n)</code> algorithm. Nested loops that run in <code>O(n^2)</code> are unacceptable - you will probably need to make use of a technique learned in this
            course to simulate a nested loop&apos;s behavior in <code>O(1)</code> or <code>O(log n)</code>:
          </p>
          <ul className="mt-[8px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Hash map</li>
            <li>A two pointers implementation like sliding window</li>
            <li>Monotonic stack</li>
            <li>Binary search</li>
            <li>Heap</li>
            <li>A combination of any of the above</li>
          </ul>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            If you have an <code>O(n)</code> algorithm, the constant factor can be reasonably large
            (around 40). One common theme for string problems involves looping over the characters of
            the alphabet at each iteration resulting in a time complexity of <code>O(26n)</code>.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>100,000 &lt; n &lt; 1,000,000</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            <code>n &lt;= 10^6</code> is a rare constraint, and will likely require a time complexity
            of <code>O(n)</code>. In this range, <code>O(n * log n)</code> is usually safe as long as
            it has a small constant factor. You will very likely need to incorporate a hash map in
            some way.
          </p>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">
            <ins>1,000,000 &lt; n</ins>
          </p>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            With huge inputs, typically in the range of <code>10^9</code> or more, the most common
            acceptable time complexity will be logarithmic <code>O(log n)</code> or constant
            <code>O(1)</code>. In these problems, you must either significantly reduce your search
            space at each iteration (usually binary search) or use clever tricks to find information
            in constant time (like with math or a clever use of hash maps).
          </p>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            Other time complexities are possible like <code>O(sqrt(n))</code>, but this is very rare and
            will usually only be seen in very advanced problems.
          </blockquote>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">Sorting algorithms</h3>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            All major programming languages have a built-in method for sorting. It is usually
            correct to assume and say sorting costs <code>O(n * log n)</code>, where <code>n</code>
            is the number of elements being sorted. For completeness, here is a chart that lists
            many common sorting algorithms and their completeness. The algorithm implemented by a
            programming language varies; for example, Python uses Timsort but in C++, the specific
            algorithm is not mandated and varies.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="sorting algorithm complexities"
            src="/assets/images/sorting.png"
            className="mt-[12px] h-auto w-full rounded-[12px] border border-[#E5E7EB]"
          />
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            Definition of a stable sort from{" "}
            <a
              href="https://en.wikipedia.org/wiki/Category:Stable_sorts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              Wikipedia
            </a>
            : &quot;Stable sorting algorithms maintain the relative order of records with equal keys
            (i.e. values). That is, a sorting algorithm is stable if whenever there are two records R
            and S with the same key and with R appearing before S in the original list, R will appear
            before S in the sorted list.&quot;
          </blockquote>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">General DS/A flowchart</h3>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            Here&apos;s a flowchart that can help you figure out which data structure or algorithm should
            be used. Note that this flowchart is very general as it would be impossible to cover
            every single scenario.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="data structures and algorithm flowchart"
            src="/assets/images/flowchart.png"
            className="mt-[12px] h-auto w-full rounded-[12px] border border-[#E5E7EB]"
          />
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">Interview stages cheat sheet</h3>
          <p className="mt-[6px] text-[14px] text-[#374151]">
            The following will be a summary of the &quot;Stages of an interview&quot; article. If you have a
            remote interview, you can print this condensed version and keep it in front of you
            during the interview.
          </p>

          <p className="mt-[12px] text-[14px] text-[#111827] font-[700]">Stage 1: Introductions</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Have a rehearsed 30-60 second introduction regarding your education, work experience,
              and interests prepared.
            </li>
            <li>Smile and speak with confidence.</li>
            <li>
              Pay attention when the interviewer talks about themselves and incorporate their work
              into your questions later.
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 2: Problem statement</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Paraphrase the problem back to the interviewer after they have read it to you.</li>
            <li>
              Ask clarifying questions about the input such as the expected input size, edge cases,
              and invalid inputs.
            </li>
            <li>
              Quickly walk through an example test case to confirm you understand the problem.
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 3: Brainstorming DS&amp;A</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Always be thinking out loud.</li>
            <li>
              Break the problem down: figure out what you need to do, and think about what data
              structure or algorithm can accomplish it with a good time complexity.
            </li>
            <li>
              Be receptive to any comments or feedback from the interviewer, they are probably
              trying to hint you towards the correct solution.
            </li>
            <li>
              Once you have an idea, before coding, explain your idea to the interviewer and make
              sure they understand and agree that it is a reasonable approach.
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 4: Implementation</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Explain your decision-making as you implement. When you declare things like sets,
              explain what the purpose is.
            </li>
            <li>Write clean code that conforms to your programming language&apos;s conventions.</li>
            <li>
              Avoid writing duplicate code - use a helper function or for loop if you are writing
              similar code multiple times.
            </li>
            <li>If you are stuck, don&apos;t panic - communicate your concerns with your interviewer.</li>
            <li>
              Don&apos;t be scared to start with a brute force solution (while acknowledging that it is
              brute force), then improve it by optimizing the &quot;slow&quot; parts.
            </li>
            <li>
              Keep thinking out loud and talk with your interviewer. It makes it easier for them to
              give you hints.
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 5: Testing &amp; debugging</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              When walking through test cases, keep track of the variables by writing at the bottom
              of the file, and continuously update them. Condense trivial parts like creating a
              prefix sum to save time.
            </li>
            <li>
              If there are errors and the environment supports running code, put print statements in
              your algorithm and walk through a small test case, comparing the expected value of
              variables and the actual values.
            </li>
            <li>Be vocal and keep talking with your interviewer if you run into any problems.</li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 6: Explanations and follow-ups</p>
          <p className="mt-[6px] text-[14px] text-[#374151]">Questions you should be prepared to answer:</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Time and space complexity, average and worst case.</li>
            <li>Why did you choose this data structure, algorithm, or logic?</li>
            <li>
              Do you think the algorithm could be improved in terms of complexity? If they ask you
              this, then the answer is <em>usually</em> yes, especially if your algorithm is slower
              than <code>O(n)</code>.
            </li>
          </ul>

          <hr className="my-[16px] border-[#E5E7EB]" />

          <p className="text-[14px] text-[#111827] font-[700]">Stage 7: Outro</p>
          <ul className="mt-[6px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Have questions regarding the company prepared.</li>
            <li>Be interested, smile, and ask follow-up questions to your interviewer&apos;s responses.</li>
          </ul>
        </div>

        <hr className="border-[#E5E7EB]" />
      </div>
    </section>
  );
}
