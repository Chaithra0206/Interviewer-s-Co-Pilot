// components/SkillCloud.tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const skills = [
  { name: "React", level: 95, match: true },
  { name: "TypeScript", level: 90, match: true },
  { name: "Node.js", level: 85, match: true },
  { name: "GraphQL", level: 80, match: false },
  { name: "Webpack", level: 75, match: true },
  { name: "Jest", level: 70, match: false },
  { name: "Docker", level: 65, match: true },
  { name: "AWS", level: 60, match: false },
  { name: "Python", level: 55, match: true },
  { name: "MongoDB", level: 50, match: false },
];

export default function SkillCloud() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".skill-item", {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.03,
        ease: "back.out(1.2)",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <div
          key={i}
          className="skill-item group relative cursor-pointer"
          style={{
            fontSize: `${Math.max(0.7, skill.level / 100)}rem`,
          }}
        >
          <span
            className={`px-2 py-1 rounded-md transition-all duration-200 ${
              skill.match
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {skill.name}
          </span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700">
            {skill.level}% proficiency
          </div>
        </div>
      ))}
    </div>
  );
}