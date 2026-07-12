"use client";

import * as React from "react";
import Link from "next/link";
import { Text, makeStyles, tokens } from "@fluentui/react-components";
import { ChevronRightRegular } from "@fluentui/react-icons";
import PluginCardRounded from "@/app/components/Plugin/PluginCardRounded";

export type TagShowcaseSection = {
  tag: { id: string; name: string };
  plugins: Array<{
    id: string;
    name: string;
    description?: string;
    owner_id?: string;
    author?: string;
    rating_average?: number;
    rating_count?: number;
  }>;
  total: number;
};

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: "flex",
    alignItems: "center",
  },
  headingLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: "inherit",
    textDecorationLine: "none",
  },
  grid: {
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "146px",
    gap: tokens.spacingHorizontalM,
    overflowX: "auto",
    paddingBottom: tokens.spacingVerticalXS,
    scrollbarWidth: "thin",
    scrollbarColor: `${tokens.colorNeutralStrokeAccessible} transparent`,
    "::-webkit-scrollbar": {
      height: "6px",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      background: tokens.colorNeutralStrokeAccessible,
      borderRadius: "3px",
    },
    "::-webkit-scrollbar-thumb:hover": {
      background: tokens.colorNeutralStroke1Hover,
    },
  },
});

export default function TagShowcase({ sections, showRating = false }: { sections: TagShowcaseSection[]; showRating?: boolean }) {
  const styles = useStyles();

  if (sections.length === 0) return null;

  return (
    <section aria-label="分类精选" className={styles.root}>
      {sections.map(({ tag, plugins, total }) => (
        <div key={tag.id} className={styles.section}>
          <div className={styles.header}>
            <Link href={`/plugins?tag=${encodeURIComponent(tag.id)}`} className={styles.headingLink} aria-label={`浏览${tag.name}分类的 ${total} 个插件`}>
              <Text weight="semibold" size={500}>{tag.name}</Text>
              <ChevronRightRegular aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.grid}>
            {plugins.map((plugin) => (
              <PluginCardRounded key={plugin.id} plugin={plugin} showRating={showRating} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
