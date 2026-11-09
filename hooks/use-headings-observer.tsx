import { useRef, useState, useEffect } from "react";

/**
 * 只返回屏幕上真正可见的章节标题：
 * 排除 PDF 导出用的 #print-report（它离屏渲染，标题不可见也点不到），
 * 并丢掉没有 id 的标题（没有 id 就没有可跳转的锚点）。
 */
export function getVisibleReportHeadings(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("h2")).filter(
    (element) => element.id !== "" && element.closest("#print-report") === null
  );
}

export default function useHeadingsObserver() {
  const observer = useRef<IntersectionObserver>();
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const handleObserver: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry?.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: "-20% 0% -35% 0px",
    });

    const elements = getVisibleReportHeadings();

    elements.forEach((element) => observer.current?.observe(element));

    return () => observer.current?.disconnect();
  }, []);

  return {
    activeId,
    setActiveId,
  };
}
