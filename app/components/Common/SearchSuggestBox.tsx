"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  MenuItem,
  MenuList,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  SearchBox,
  Spinner,
  Tag,
} from "@fluentui/react-components";
import {
  Person16Regular,
  Search24Regular,
  Tag16Regular,
} from "@fluentui/react-icons";
import { useTabsterAttributes } from "@fluentui/react-tabster";

type SuggestionType = "plugin" | "tag" | "author";

type Suggestion = {
  type: SuggestionType;
  label: string;
  value: string;
  pluginId?: string;
};

type SearchSuggestBoxProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  maxSuggestions?: number;
};

const TYPE_LABEL: Record<SuggestionType, string> = {
  plugin: "插件",
  tag: "标签",
  author: "作者",
};

/**
 * 带搜索建议（Autofill）的搜索输入框。
 * 基于 Fluent SearchBox + Popover + MenuList 实现，
 * 输入时防抖请求 /api/plugins/suggest，展示推荐下拉列表并支持键盘导航。
 */
export default function SearchSuggestBox({
  value,
  onValueChange,
  onSubmit,
  placeholder,
  size = "medium",
  className,
  autoFocus,
  ariaLabel = "搜索",
  maxSuggestions = 8,
}: SearchSuggestBoxProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  // 用于判断失焦时焦点是否仍在弹层/搜索框内部（如 hover 菜单项时 MenuItem 会自动聚焦）
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const surfaceRef = React.useRef<HTMLDivElement | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<number | null>(null);
  const suggestionsRef = React.useRef<Suggestion[]>([]);

  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  // 让搜索框不参与 Toolbar 的方向键导航（Tabster Mover），否则 ArrowUp/ArrowDown 会被工具栏拦截
  const tabsterAttrs = useTabsterAttributes({
    focusable: { excludeFromMover: true },
  });


  const keyword = value.trim();

  React.useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  // 防抖请求搜索建议
  React.useEffect(() => {
    if (!keyword) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      const url = new URL("/api/plugins/suggest", window.location.origin);
      url.searchParams.set("q", keyword);
      url.searchParams.set("limit", String(maxSuggestions));

      fetch(url, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("suggest request failed"))))
        .then((json) => {
          if (controller.signal.aborted) return;
          const data = Array.isArray(json?.data) ? (json.data as Suggestion[]) : [];
          setSuggestions(data);
          setActiveIndex(0);
          if (data.length > 0 && inputRef.current && document.activeElement === inputRef.current) {
            setOpen(true);
          } else if (data.length === 0) {
            setOpen(false);
          }
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [keyword, maxSuggestions]);

  const closeAndReset = () => {
    setOpen(false);
    setActiveIndex(0);
  };

  const selectSuggestion = (item: Suggestion) => {
    closeAndReset();
    // 导航后主动移除焦点，避免弹层跟随焦点在新页面重新弹出
    inputRef.current?.blur();
    // 插件建议直接进入插件详情页
    if (item.type === "plugin" && item.pluginId) {
      router.push(`/plugins/${encodeURIComponent(item.pluginId)}`);
      return;
    }
    onValueChange(item.value);
    onSubmit(item.value);
  };

  const submitKeyword = (raw: string) => {
    const next = raw.trim();
    if (!next) return;
    closeAndReset();
    // 导航后主动移除焦点，避免弹层跟随焦点在新页面重新弹出
    inputRef.current?.blur();
    onSubmit(next);
  };

  // 下拉项总数 = 1（搜索当前关键词）+ 建议数
  const totalItems = suggestions.length + 1;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return;
      setActiveIndex((index) => (index + 1) % totalItems);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return;
      setActiveIndex((index) => (index - 1 + totalItems) % totalItems);
    } else if (event.key === "Enter") {
      if (open && suggestions.length > 0) {
        event.preventDefault();
        if (activeIndex === 0) {
          submitKeyword(keyword);
        } else {
          const item = suggestions[activeIndex - 1];
          if (item) selectSuggestion(item);
        }
      } else {
        submitKeyword(keyword);
      }
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        closeAndReset();
      }
    } else if (event.key === "Tab") {
      closeAndReset();
    }
  };

  // 弹层的显示/隐藏完全跟随输入框焦点（onFocus/onBlur）：
  // 忽略 Popover 自带的“点击外部/点击触发器”关闭请求，避免点击输入框时弹层被关掉、干扰鼠标框选文字
  const handleOpenChange = () => {
    // no-op：open 状态仅由焦点与建议数据驱动
  };

  // 失焦时若焦点仍在弹层或搜索框内部（例如 hover 菜单项时 MenuItem 自动聚焦），保持弹层打开
  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;
    if (
      related &&
      (surfaceRef.current?.contains(related) || wrapperRef.current?.contains(related))
    ) {
      return;
    }
    closeAndReset();
  };

  const renderTypeIcon = (item: Suggestion) => {
    if (item.type === "plugin" && item.pluginId) {
      return (
        <Avatar
          size={20}
          shape="square"
          image={{ src: `/api/plugins/${encodeURIComponent(item.pluginId)}/resources/icon` }}
        />
      );
    }
    if (item.type === "tag") {
      return <Tag16Regular />;
    }
    return <Person16Regular />;
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      positioning={{ matchTargetSize: "width", position: "below" }}
      withArrow={false}
      trapFocus={false}
      // 打开弹层时不把焦点抢到菜单项上，保持输入框可继续输入
      unstable_disableAutoFocus
    >
      <PopoverTrigger disableButtonEnhancement>
        {/* 外层 div 作为 Popover 的定位参考（matchTargetSize 绑定整个搜索框宽度），SearchBox 撑满 */}
        <div ref={wrapperRef} className={className} onBlur={handleBlur}>
          <SearchBox
            ref={inputRef}
            {...tabsterAttrs}
            value={value}
            onChange={(_, data) => onValueChange(data.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestionsRef.current.length > 0) setOpen(true);
            }}

            placeholder={placeholder}
            size={size}
            autoFocus={autoFocus}
            aria-label={ariaLabel}
            autoComplete="off"
            className="w-full"
          />
        </div>
      </PopoverTrigger>
      <PopoverSurface ref={surfaceRef} className="!p-0" onBlur={handleBlur}>
        <MenuList className="max-h-80 overflow-y-auto">
          {/* 搜索当前关键词 */}
          <MenuItem
            icon={<Search24Regular />}
            onMouseEnter={() => setActiveIndex(0)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => submitKeyword(keyword)}
            className={activeIndex === 0 ? "!bg-[var(--colorNeutralBackground1Hover)] shadow-[inset_0_0_0_2px_var(--colorStrokeFocus2)]" : ""}
          >
            <span className="truncate min-w-0" title={`搜索 “${keyword}”`}>
              搜索 “<span className="font-semibold">{keyword}</span>”
            </span>
          </MenuItem>

          {loading && (
            <MenuItem disabled>
              <Spinner size="tiny" />
              <span className="text-sm">加载建议中…</span>
            </MenuItem>
          )}

          {!loading &&
            suggestions.map((item, index) => {
              const itemIndex = index + 1;
              return (
                <MenuItem
                  key={`${item.type}-${item.value}-${index}`}
                  icon={renderTypeIcon(item)}
                  onMouseEnter={() => setActiveIndex(itemIndex)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(item)}
                  className={activeIndex === itemIndex ? "!bg-[var(--colorNeutralBackground1Hover)] shadow-[inset_0_0_0_2px_var(--colorStrokeFocus2)]" : ""}
                >
                  <span className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="truncate min-w-0" title={item.label}>{item.label}</span>
                    <Tag size="extra-small" appearance="outline" className="!shrink-0">
                      {TYPE_LABEL[item.type]}
                    </Tag>
                  </span>
                </MenuItem>
              );
            })}
        </MenuList>
      </PopoverSurface>
    </Popover>
  );
}
