"use client";
import * as React from "react";
import PluginCard from "@/app/components/Plugin/PluginCard";

export default function PluginList({ plugins }: { plugins: any[] }) {
    return (
        <div className="flex flex-col gap-3">
            {plugins.map((plugin) => (
                <div key={plugin.id}>
                    <PluginCard plugin={plugin} />
                </div>
            ))}
        </div>
    );
}