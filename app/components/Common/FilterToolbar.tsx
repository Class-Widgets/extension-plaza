"use client";

import * as React from "react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tab,
  TabList,
  Toolbar,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { MoreHorizontalRegular, TextSortAscendingRegular } from "@fluentui/react-icons";
import { useTheme } from "@/app/providers";

export type FilterToolbarTag = { id: string; name: string };
export type FilterToolbarSortOption = { value: string; label: string };

type FilterToolbarProps = {
  ariaLabel: string;
  tags: FilterToolbarTag[];
  activeTag: string;
  onTagChange: (tagId: string) => void;
  sort: string;
  sortOptions: FilterToolbarSortOption[];
  onSortChange: (sort: string) => void;
  visibleTagCount?: number;
};

function estimateTabWidth(label: string) {
  return Math.max(56, label.length * 14 + 32);
}

const APP_LIGHT_BACKGROUND = "#f3f3f3";

const useStyles = makeStyles({
  toolbar: {
    width: "100%",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalM,
    position: "sticky",
    top: "5rem",
    zIndex: 40,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, 
  },
  primary: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    columnGap: tokens.spacingHorizontalXS,
  },
  secondary: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
  },
});

export default function FilterToolbar({
  ariaLabel,
  tags,
  activeTag,
  onTagChange,
  sort,
  sortOptions,
  onSortChange,
  visibleTagCount = 5,
}: FilterToolbarProps) {
  const styles = useStyles();
  const { isDarkMode } = useTheme();
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const [measuredVisibleCount, setMeasuredVisibleCount] = React.useState(visibleTagCount);

  React.useEffect(() => {
    const node = toolbarRef.current;
    if (!node) return;

    const calculateVisibleCount = () => {
      const width = node.getBoundingClientRect().width;
      const reservedWidth = 216;
      const availableWidth = Math.max(120, width - reservedWidth);
      let usedWidth = estimateTabWidth("全部");
      let nextCount = 0;

      for (const tag of tags) {
        const nextWidth = estimateTabWidth(tag.name);
        if (usedWidth + nextWidth > availableWidth) break;
        usedWidth += nextWidth;
        nextCount += 1;
      }

      setMeasuredVisibleCount(Math.max(1, nextCount));
    };

    calculateVisibleCount();
    const observer = new ResizeObserver(calculateVisibleCount);
    observer.observe(node);
    return () => observer.disconnect();
  }, [tags]);

  const baseVisibleTags = tags.slice(0, measuredVisibleCount);
  const activeHiddenTag = activeTag ? tags.find((tag) => tag.id === activeTag && !baseVisibleTags.some((visible) => visible.id === tag.id)) : undefined;
  const visibleTags = activeHiddenTag && baseVisibleTags.length > 0
    ? [...baseVisibleTags.slice(0, -1), activeHiddenTag]
    : baseVisibleTags;
  const hiddenTags = tags.filter((tag) => !visibleTags.some((visible) => visible.id === tag.id));
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? sortOptions[0]?.label ?? "排序";

  return (
    <Toolbar ref={toolbarRef} aria-label={ariaLabel} className={styles.toolbar} style={{ backgroundColor: isDarkMode ? undefined : APP_LIGHT_BACKGROUND }}>
      <div className={styles.primary}>
        <TabList selectedValue={activeTag || "all"} onTabSelect={(_, data) => onTagChange(data.value === "all" ? "" : String(data.value))}>
          <Tab value="all">全部</Tab>
          {visibleTags.map((tag) => (
            <Tab key={tag.id} value={tag.id}>{tag.name}</Tab>
          ))}
        </TabList>
        {hiddenTags.length > 0 ? (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <MenuButton appearance="transparent" icon={<MoreHorizontalRegular />} aria-label="更多分类" />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                {hiddenTags.map((tag) => (
                  <MenuItem key={tag.id} onClick={() => onTagChange(tag.id)}>{tag.name}</MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        ) : null}
      </div>
      <div className={styles.secondary}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton appearance="transparent" icon={<TextSortAscendingRegular />} aria-label="排序方式">{sortLabel}</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList checkedValues={{ sort: [sort] }} onCheckedValueChange={(_, data) => onSortChange(data.checkedItems[0] || sortOptions[0]?.value || sort)}>
              {sortOptions.map((option) => (
                <MenuItemRadio key={option.value} name="sort" value={option.value}>{option.label}</MenuItemRadio>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </Toolbar>
  );
}
