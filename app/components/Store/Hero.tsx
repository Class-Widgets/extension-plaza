"use client";
import * as React from "react";
import { Text } from "@fluentui/react-components";

export default function Hero() {
  return (
    <section aria-label="站点头部" className="fluent-acrylic rounded-2xl p-6">
      <div className="flex items-center gap-6">
        <div className="flex-1 min-w-0">
          <Text weight="semibold" size={500}>探索你喜爱的扩展</Text>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">精选扩展与主题，提升你的浏览体验。</p>
        </div>
      </div>
    </section>
  );
}