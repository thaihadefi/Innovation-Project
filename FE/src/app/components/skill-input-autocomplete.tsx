"use client";
import { useState, useEffect, useRef } from "react";
import { normalizeSkillDisplay, normalizeSkillKey } from "@/utils/skill";

interface SkillInputAutocompleteProps {
  skills: string[];
  setSkills: (skills: string[]) => void;
  skillsError?: string;
  hint?: string; // Optional hint text shown next to the label
  // Called when a skill is successfully added (e.g. to clear parent error state)
  onSkillAdded?: () => void;
}

export const SkillInputAutocomplete = ({
  skills,
  setSkills,
  skillsError,
  hint,
  onSkillAdded,
}: SkillInputAutocompleteProps) => {
  const [skillInput, setSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch and normalize existing skills for autocomplete suggestions.
  // Silent fail — autocomplete is an enhancement; form still works without it.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/skills`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.skills)) {
          // Normalize to lowercase slugified names and deduplicate by key
          const seen = new Set<string>();
          const normalized = data.skills
            .map((s: string) => normalizeSkillDisplay(s))
            .filter((s: string) => {
              const key = normalizeSkillKey(s);
              if (!key || seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          setAllSkills(normalized);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const addSkill = (rawValue: string) => {
    const cleanInput = rawValue.replace(/,+$/, "").trim();
    const displaySkill = normalizeSkillDisplay(cleanInput);
    const skillKey = normalizeSkillKey(displaySkill);
    if (!displaySkill || !skillKey) return;
    const exists = skills.some((s) => normalizeSkillKey(s) === skillKey);
    if (!exists) {
      setSkills([...skills, displaySkill]);
      onSkillAdded?.();
    }
    setSkillInput("");
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  // Filter suggestions: match input substring, exclude already-added skills
  const suggestions =
    skillInput.trim().length > 0
      ? allSkills
          .filter(
            (s) =>
              s.toLowerCase().includes(skillInput.toLowerCase()) &&
              !skills.some(
                (added) => normalizeSkillKey(added) === normalizeSkillKey(s)
              )
          )
          .slice(0, 8)
      : [];

  return (
    <div className="sm:col-span-2">
      <label
        htmlFor="skills"
        className="block font-[500] text-[14px] text-black mb-[5px]"
      >
        Skills *{hint && <span className="text-[#999] text-[12px] ml-[6px]">{hint}</span>}
      </label>

      {/* Added skill tags */}
      <div className="flex flex-wrap gap-[8px] mb-[8px]">
        {skills.map((skill, index) => (
          <span
            key={skill}
            className="inline-flex items-center gap-[4px] bg-[#0088FF] text-white px-[12px] py-[6px] rounded-full text-[13px]"
          >
            {skill}
            <button
              type="button"
              onClick={() => setSkills(skills.filter((_, i) => i !== index))}
              className="hover:text-red-200"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input with autocomplete dropdown */}
      <div className="flex gap-[8px]">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            id="skills"
            type="text"
            placeholder="e.g., react, nodejs, mongodb..."
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) =>
                  Math.min(prev + 1, suggestions.length - 1)
                );
                setShowSuggestions(true);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, -1));
              } else if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkill(
                  activeIndex >= 0 && suggestions[activeIndex]
                    ? suggestions[activeIndex]
                    : skillInput
                );
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
                setActiveIndex(-1);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() =>
              setTimeout(() => {
                setShowSuggestions(false);
                setActiveIndex(-1);
              }, 150)
            }
            className="w-full h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-[2px] bg-white border border-[#DEDEDE] rounded-[8px] shadow-lg max-h-[200px] overflow-y-auto">
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => addSkill(s)}
                  className={`w-full text-left px-[16px] py-[8px] text-[14px] transition-colors ${
                    i === activeIndex
                      ? "bg-[#0088FF] text-white"
                      : "text-[#414042] hover:bg-[#F0F7FF] hover:text-[#0088FF]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => addSkill(skillInput)}
          className="px-[16px] h-[46px] bg-[#E0E0E0] rounded-[8px] font-[600] text-[14px] hover:bg-[#D0D0D0] cursor-pointer transition-colors duration-200"
        >
          Add
        </button>
      </div>

      <p className="text-[#999] text-[12px] mt-[5px]">
        Press Enter or comma to add skills
      </p>
      {skillsError && (
        <p className="text-red-500 text-[12px] mt-[4px]">{skillsError}</p>
      )}
    </div>
  );
};
