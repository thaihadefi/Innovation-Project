import { FaListCheck } from "react-icons/fa6";

export default function StagesOfInterviewPage() {
  return (
    <section className="article-content rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[24px] shadow-sm">
      <div className="flex items-start gap-[12px]">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#F97316]/10 text-[#F97316]">
          <FaListCheck />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <h1 className="text-[26px] font-[700] text-[#111827]">Stages of an interview</h1>
          </div>
          <p className="text-[14px] text-[#6B7280] mt-[6px]">
            Most algorithmic interview rounds are between 45 - 60 minutes. The interviews can be
            broken down into stages, and at each stage, there are multiple things you should do to
            maximize your chances of success. Let's break it down.
          </p>
        </div>
      </div>

      <div className="mt-[16px] space-y-[18px]">
        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">1. Introductions</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            At the start of the interview, most of the time your interviewer will briefly introduce
            themselves and their role at the company, then ask you to introduce yourself.
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Prepare and rehearse a brief introduction of yourself. It should summarize your
              education, work experience, and interests in 30-60 seconds.
            </li>
            <li>Smile and speak with a confident voice.</li>
            <li>
              When the interviewer is talking about their work at the company, pay attention - it
              will help to ask questions about it later.
            </li>
            <li>
              If the interviewer mentioned anything that you are also interested in, whether it be
              their work or a hobby, mention it.
            </li>
          </ul>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">2. Problem statement</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            After introductions, your interviewer will give you a problem statement. If you're
            working in a shared text editor, they will most likely paste the problem description
            along with a test case into the editor, and then read the question to you.
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Make sure you fully understand the problem. After the interviewer has read the
              problem over, confirm what the problem is asking by paraphrasing it back to them.
            </li>
            <li>Ask clarifying questions regarding the input, for example:</li>
          </ul>
          <ul className="mt-[8px] list-disc pl-[34px] text-[14px] text-[#374151] space-y-[6px]">
            <li>Will the input only have integers, or could there be other types?</li>
            <li>Will the input be sorted or unsorted?</li>
            <li>Is the input guaranteed to have elements or could it be empty?</li>
            <li>What should I do if an invalid input is given?</li>
          </ul>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              Ask about the expected input size. Sometimes, the interviewer will be vague, but if
              they do give you a range, it can be a clue. For example, if <code>n</code> is very
              small, it is likely backtracking. If <code>n</code> is around <code>100 - 1000</code>,
              an <code>O(n^2)</code> solution might be optimal. If <code>n</code> is very large, then
              you might need to do better than <code>O(n)</code>.
            </li>
            <li>
              The interviewer will likely give you one or two example test cases. Quickly walk
              through one to confirm that you understand the problem.
            </li>
          </ul>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            Asking clarifying questions not only helps you better understand the problem but also
            shows attention to detail and being considerate of things like edge cases.
          </blockquote>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">3. Brainstorming DS&amp;A</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            Try to figure out what data structure or algorithm is applicable. Break the problem
            down and try to find common patterns that you've learned. Figure out what the problem
            needs you to do, and think about what data structure or algorithm can accomplish it with
            a good time complexity.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            Think out loud. It will show your interviewer that you are good at considering tradeoffs.
            If the problem involves looking at subarrays, then be vocal about considering a sliding
            window because every window represents a subarray. Even if you're wrong, the interviewer
            will still appreciate your thought process.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            The best way to train this skill is to practice LeetCode problems.
          </p>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            By thinking out loud, you also open the door for the interviewer to give you hints and
            point you in the right direction.
          </blockquote>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Once you have decided on what data structures/algorithms to use, you now need to
            construct your actual algorithm. Before coding, you should think of the rough steps of
            the algorithm, explain them to the interviewer, and make sure they understand and agree
            that it is a reasonable approach. Usually, if you are on the wrong path, they will
            subtly hint at it.
          </p>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            It is <strong>extremely</strong> important that you are receptive to what the interviewer
            says at this stage. Remember: they know the optimal solution. If they are giving you a
            hint, it is because they want you to succeed. Don&apos;t be stubborn and be ready to
            explore the ideas they give you.
          </blockquote>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">4. Implementation</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            Once you have come up with an algorithm and gotten the interviewer on board, it is time
            to start writing code.
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              If you intend on using a library or module like Python&apos;s collections for example,
              make sure the interviewer is ok with it before importing it.
            </li>
            <li>
              As you implement, explain your decision-making. For example, if you are solving a
              graph problem, when you declare a set <code>seen</code>, explain that it is to prevent
              visiting the same node more than once, thus also preventing cycles.
            </li>
            <li>
              Write clean code. Every major programming language has a convention for how code
              should be written. Make sure you know the basics of the language that you plan to be
              using. Google provides <a
                href="https://google.github.io/styleguide/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:text-[#1D4ED8]"
              >
                a summary
              </a>{" "}
              for all major languages. The most important sections are case conventions,
              indentations, spacing, and global variables.
            </li>
            <li>
              Avoid duplicated code. For example, if you are doing a DFS on a matrix, loop over a
              directions array <code>[(0, 1), (1, 0), (0, -1), (-1, 0)]</code> instead of writing the
              same logic 4 times for each direction. If you find yourself writing similar code in
              multiple places, consider creating a function or simplifying it with a loop.
            </li>
            <li>
              Don&apos;t be scared of using helper functions. They make your code more modular, which is
              very important in real software engineering. It might also make potential follow-ups
              easier.
            </li>
          </ul>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Don&apos;t panic if you get stuck or realize that your original plan might not work.
            Communicate your concerns with your interviewer. It makes their life a lot harder if
            you are struggling in silence.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            One strategy is to first implement a brute force solution <strong>while acknowledging</strong>
            {" "}
            that it is a suboptimal solution. Once it is completed, analyze each part of the
            algorithm, figure out what steps are &quot;slow&quot;, and try to think about how it can be sped
            up. Engage your interviewer and include them in the discussion - they want to help.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">5. Testing &amp; debugging</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            Once you have finished coding, your interviewer will likely want to test your code.
            Depending on the company, there are a few different environments your interview might be
            taking place in:
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[8px]">
            <li>
              <p className="font-[600]">Built-in test cases, code is run</p>
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  These platforms are similar to LeetCode. There will be a wide variety of test
                  cases - small inputs, huge inputs, inputs that test edge cases.
                </li>
                <li>
                  This environment puts the most stress on your code because a non-perfect solution
                  will be exposed.
                </li>
                <li>
                  However, it also puts the least stress on creating your own tests, since they are
                  already built-in.
                </li>
              </ul>
            </li>
            <li>
              <p className="font-[600]">Write your own test cases, code is run</p>
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  These platforms are usually shared text editors that support running code. The
                  interviewer will want you to write your own test cases.
                </li>
                <li>
                  To actually test the code, you should write in the outermost scope of the code,
                  wherever the code will get run first. Assuming you solved the problem in a
                  function (like on LeetCode), you can call your function with the test cases you
                  wrote and print the results to the console.
                </li>
                <li>
                  When writing your own tests, make sure to try a variety. Include edge cases,
                  intuitive inputs, and possibly invalid inputs (if the interviewer wants you to
                  handle that case).
                </li>
              </ul>
            </li>
            <li>
              <p className="font-[600]">Write your own test cases, code is not run</p>
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  These platforms will just be shared text editors that do not support running code.
                  The interviewer will want you to write your own test cases and walk through them
                  manually.
                </li>
                <li>
                  To &quot;test&quot; the code, you will have to go through the algorithm manually with each
                  test case. Try to condense trivial parts - for example, if you're creating a
                  prefix sum, don&apos;t <em>literally</em> walk through the for loop with every element.
                  Say something along the lines of &quot;after this for loop, we will have a prefix sum
                  which will look like ...&quot;.
                </li>
                <li>
                  As you are walking through the code, write (in the editor, outside your function
                  somewhere) the variables used in the function and continuously update them.
                </li>
              </ul>
            </li>
          </ul>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Regardless of the scenario, if it turns out your code has an error, don&apos;t panic! If the
            environment supports running code, put print statements in relevant locations to try to
            identify the issue. Walk through a test case manually (as you would if you have an
            environment without runtime support) with a small test case. As you do it, talk about
            what the expected values of the variables should be and compare them with what they
            actually are. Again, the more vocal you are, the easier it is for the interviewer to
            help you.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">6. Explanations and follow-ups</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            After coding the algorithm and running through test cases, be prepared to answer
            questions regarding your algorithm. Questions you should always expect and be ready for
            include:
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>
              What is the time and space complexity of the algorithm?
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  You should speak in terms of the worst-case scenario. However, if the worst case
                  is rare and the average case has a significantly faster runtime, you should also
                  mention this.
                </li>
              </ul>
            </li>
            <li>
              Why did you choose to do ...?
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  This could be your choice of data structure, choice of algorithm, choice of for
                  loop configurations, etc. Be prepared to explain your thought process.
                </li>
              </ul>
            </li>
            <li>
              Do you think that the algorithm could be improved in terms of time or space
              complexity?
              <ul className="mt-[6px] list-disc pl-[18px] space-y-[6px]">
                <li>
                  If the problem needs to look at every element in the input (let&apos;s say the input
                  isn&apos;t sorted and you needed to find the max element), then you probably can&apos;t do
                  better than <code>O(n)</code>. Otherwise, you probably can&apos;t do better than <code>O(log n)</code>.
                </li>
                <li>
                  If the interviewer asks this, the answer is <em>usually</em> yes. Be careful about
                  asserting that your algorithm is optimal - it&apos;s ok to be wrong, but it&apos;s not ok to
                  be confidently wrong.
                </li>
              </ul>
            </li>
          </ul>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            If there is time remaining in the interview, you may be asked an entirely new question.
            In that case, restart from step 2 (Problem statement). However, you may also be asked
            follow-ups to the question you already solved. The interviewer might introduce new
            constraints, ask for an improved space complexity, or any other number of things.
          </p>
          <blockquote className="mt-[12px] border-l-[3px] border-[#E5E7EB] bg-[#F9FAFB] px-[12px] py-[10px] text-[14px] text-[#374151]">
            This section is why it is important to actually understand solutions and not just
            memorize them.
          </blockquote>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">7. Outro</h3>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            The interviewer will usually reserve a few minutes at the end of the interview to allow
            you to ask questions about them or the company. You will rarely be able to improve the
            outcome of the interview at this point, but you can certainly make it worse.
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Interviews are a two-way street. You should use this time as an opportunity to also get
            to know the company and see if you would like to work there. You should prepare some
            questions before the interview, such as:
          </p>
          <ul className="mt-[10px] list-disc pl-[18px] text-[14px] text-[#374151] space-y-[6px]">
            <li>What does an average day look like?</li>
            <li>Why did you decide to join this company instead of another one?</li>
            <li>What is your favorite and least favorite thing about the job?</li>
            <li>What kind of work can I expect to work on?</li>
          </ul>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            All big companies will have their own tech blog. A great way to demonstrate your
            interest in the company is to read some blog posts and compile a list of questions
            regarding why the company makes the decisions they do.
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Be interested, keep smiling, listen to the interviewer&apos;s responses, and ask follow-up
            questions to show that you understand their answers.
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            If you don&apos;t have quality questions or appear bored/uninterested, it could give a bad
            signal to the interviewer. It doesn&apos;t matter how well you did on the technical portion
            if the interviewer doesn&apos;t like you in the end.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />
      </div>
    </section>
  );
}
