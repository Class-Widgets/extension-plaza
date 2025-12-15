"use client";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Text,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider,
  InteractionTag,
  InteractionTagPrimary,
} from "@fluentui/react-components";
import { FilterRegular } from "@fluentui/react-icons";
import PluginGrid from "@/app/components/Plugin/PluginGrid"; // Assuming this will be used for displaying results
import PluginCard from "@/app/components/Plugin/PluginCard"; // Assuming this will be used for displaying results

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [category, setCategory] = React.useState<"plugins" | "themes">(
    "plugins"
  );
  const [loading, setLoading] = React.useState(true);
  const [plugins, setPlugins] = React.useState<any[]>([]);

  React.useEffect(() => {
    setLoading(true);
    // Simulate API call
    fetch(`/api/plugins/search?q=${query}`)
      .then((r) => r.json())
      .then((json) => {
        setPlugins(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch(() => {
        setPlugins([]);
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Text as="h1" className="!text-3xl !font-semibold">
       “{query}” 的结果
      </Text>

      <div className="flex items-center gap-4 mt-3 mb-3">
        <InteractionTag
          appearance={category === "plugins" ? "brand" : "filled"}
          onClick={() => setCategory("plugins")}
        >
          <InteractionTagPrimary>插件</InteractionTagPrimary>
        </InteractionTag>
        <InteractionTag
          appearance={category === "themes" ? "brand" : "filled"}
          onClick={() => setCategory("themes")}
        >
          <InteractionTagPrimary>主题</InteractionTagPrimary>
        </InteractionTag>

        <div className="ml-auto">
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button icon={<FilterRegular />}>筛选器</Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem>选项 1</MenuItem>
                <MenuItem>选项 2</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </div>

      <Divider className="mb-6" />

      {category === "plugins" ? (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <PluginCard key={i} plugin={null} isLoading={true} />
              ))}
            </div>
          ) : plugins.length > 0 ? (
            <PluginGrid plugins={plugins} />
          ) : (
            <div className="text-center py-10">
              <Text as="p" className="text-xl text-gray-500">
                没有找到与 &quot;{query}&quot; 相关的插件。
              </Text>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <Text as="p" className="text-xl text-gray-500">
            主题功能正在建设中，敬请期待！
          </Text>
        </div>
      )}
    </div>
  );
}