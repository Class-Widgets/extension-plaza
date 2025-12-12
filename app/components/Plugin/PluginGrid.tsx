"use client";
import PluginCard from "@/app/components/Plugin/PluginCard";

export default function PluginGrid({ plugins }: { plugins: any[] }) {
    // 标准表格布局（如图5）：使用表格语义包裹卡片，保证对齐
    return (
        <table className="w-full border-separate [border-spacing:16px]">
            <tbody>
            {Array.from({ length: Math.ceil(plugins.length / 3) }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                    {plugins.slice(rowIdx * 3, rowIdx * 3 + 3).map((plugin: any) => (
                        <td key={plugin.id} className="align-top">
                            <PluginCard plugin={plugin} />
                        </td>
                    ))}
                </tr>
            ))}
            </tbody>
        </table>
    );
}