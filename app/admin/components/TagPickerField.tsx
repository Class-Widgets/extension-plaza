"use client";

import * as React from "react";
import {
    InteractionTag,
    InteractionTagPrimary,
    InteractionTagSecondary,
    TagPicker,
    TagPickerControl,
    TagPickerGroup,
    TagPickerInput,
    TagPickerList,
    TagPickerOption,
} from "@fluentui/react-components";
import type { TagRow } from "../types";

type TagPickerFieldProps = {
    tags: TagRow[];
    selectedTagIds: string[];
    disabled?: boolean;
    onChange: (tagIds: string[]) => void;
};

export default function TagPickerField({ tags, selectedTagIds, disabled, onChange }: TagPickerFieldProps) {
    const selectedTags = React.useMemo(
        () => selectedTagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is TagRow => Boolean(tag)),
        [selectedTagIds, tags],
    );
    const options = React.useMemo(
        () => tags.filter((tag) => !selectedTagIds.includes(tag.id)),
        [selectedTagIds, tags],
    );

    return (
        <TagPicker selectedOptions={selectedTagIds} onOptionSelect={(_, data) => onChange(data.selectedOptions)} disabled={disabled} inline>
            <TagPickerControl>
                <TagPickerGroup aria-label="已选择标签">
                    {selectedTags.map((tag) => (
                        <InteractionTag key={tag.id} value={tag.id}>
                            <InteractionTagPrimary hasSecondaryAction>{tag.name}</InteractionTagPrimary>
                            <InteractionTagSecondary aria-label={`移除 ${tag.name}`} />
                        </InteractionTag>
                    ))}
                </TagPickerGroup>
                <TagPickerInput aria-label="选择标签" placeholder={tags.length === 0 ? "暂无可用标签" : "搜索并选择标签"} />
            </TagPickerControl>
            <TagPickerList>
                {options.map((tag) => (
                    <TagPickerOption key={tag.id} value={tag.id} text={tag.name}>
                        {tag.name}
                    </TagPickerOption>
                ))}
            </TagPickerList>
        </TagPicker>
    );
}
