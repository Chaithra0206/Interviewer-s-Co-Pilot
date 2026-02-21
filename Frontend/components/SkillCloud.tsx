/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, memo } from "react";
import { gsap } from "gsap";

interface Skill {
  name: string;
  level: number;
  match: boolean;
}

const SKILLS: Skill[] = [
  { name: "React", level: 95, match: true },
  { name: "TypeScript", level: 90, match: true },
  { name: "Node.js", level: 85, match: true },
  { name: "GraphQL", level: 80, match: false },
  { name: "Next.js", level: 92, match: true },
  { name: "Tailwind", level: 88, match: true },
  { name: "Docker", level: 65, match: true },
];

const SkillCloud = memo(function SkillCloud() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".skill-item", {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="flex flex-wrap gap-1.5"
      role="list"
      aria-label="Technical skills"
    >
      {SKILLS.map((skill, index) => (
        <SkillItem key={`${skill.name}-${index}`} skill={skill} />
      ))}
    </div>
  );
});

function SkillItem({ skill }: { skill: Skill, key?: React.Key }) {
  return (
    <div
      className="skill-item group relative"
      role="listitem"
    >
      <span
        className={`
          px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 inline-block border
          ${skill.match 
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500" 
            : "bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 border-zinc-100 dark:border-zinc-800 italic"
          }
        `}
      >
        {skill.name}
      </span>
      
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20"
      >
        {skill.level}% proficiency
      </div>
    </div>
  );
}

export default SkillCloud;
