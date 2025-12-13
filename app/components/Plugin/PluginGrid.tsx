"use client";
import PluginCard from "@/app/components/Plugin/PluginCard";

export default function PluginGrid({ plugins }: { plugins: any[] }) {
    // 响应式网格布局：小屏1列，中屏2列，大屏3列
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {plugins.map((plugin: any) => (
                <div key={plugin.id}>
                    <PluginCard plugin={plugin} />
                </div>
            ))}
        </div>
    );
}