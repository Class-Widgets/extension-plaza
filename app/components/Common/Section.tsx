"use client";
import { Text } from "@fluentui/react-components";
import NextLink from "next/link";

export default function Section({ title, moreHref, children }: { title: string; moreHref?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Text weight="semibold" size={400}>{title}</Text>
        {moreHref ? (
          <NextLink href={moreHref} className="text-sm text-blue-600 hover:underline">查看更多</NextLink>
        ) : null}
      </div>
      {children}
    </section>
  );
}